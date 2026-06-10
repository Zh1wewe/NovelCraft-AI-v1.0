import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("您既没有配置本地模型通道参数，也缺失系统兜底的 GEMINI_API_KEY。请在界面左侧【系统统一参数】中配置模型信息后再试！");
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

const CONFIG_FILE_PATH = process.env.NC_CONFIG_PATH || path.join(process.cwd(), "workspace_config.json");

function getUploadsBase(): string {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"));
      if (config.baseDir) {
        return path.resolve(config.baseDir.trim());
      }
    }
  } catch (err) {
    console.error("Failed to read workspace_config.json, returning default:", err);
  }
  return process.env.NC_UPLOADS_DIR || path.join(process.cwd(), "uploads");
}

let UPLOADS_BASE = getUploadsBase();
const DIARY_FILE_PATH = process.env.NC_DIARY_PATH || path.join(process.cwd(), "diary_history.json");

// Ensure folder structure and standard files exist
function ensureDirsAndFiles() {
  const folders = ["未分组", "小说草稿", "核心设定集", "参考资料库", "公共资料库", "公共资料库/参考资料库"];
  if (!fs.existsSync(UPLOADS_BASE)) {
    fs.mkdirSync(UPLOADS_BASE, { recursive: true });
  }
  for (const f of folders) {
    const fPath = path.join(UPLOADS_BASE, f);
    if (!fs.existsSync(fPath)) {
      fs.mkdirSync(fPath, { recursive: true });
    }
  }

  // Pre-populate physical workspace directories for the default novel is also important
  const defaultNovelName = "新建项目 1";
  const defaultNovelDir = path.join(UPLOADS_BASE, defaultNovelName);
  if (!fs.existsSync(defaultNovelDir)) {
    fs.mkdirSync(defaultNovelDir, { recursive: true });
  }
  const defaultSubdirs = [
    "正文",
    "大纲",
    "思维导图",
    "灵感小记",
    "人物设定",
    "世界观",
    "世界构建",
    "概念设计图",
    "参考资料"
  ];
  for (const sub of defaultSubdirs) {
    const subDirP = path.join(defaultNovelDir, sub);
    if (!fs.existsSync(subDirP)) {
      fs.mkdirSync(subDirP, { recursive: true });
    }
  }

  // Ensure diary file exists
  if (!fs.existsSync(DIARY_FILE_PATH)) {
    fs.writeFileSync(DIARY_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}
ensureDirsAndFiles();

interface FileNode {
  name: string;
  relativePath: string;
  type: "file" | "directory";
  children?: FileNode[];
}

function scanDir(dirPath: string, rootPath = UPLOADS_BASE): FileNode[] {
  const items: FileNode[] = [];
  try {
    if (!fs.existsSync(dirPath)) return [];
    const files = fs.readdirSync(dirPath);
    for (const f of files) {
      if (f.startsWith('.')) continue;
      const fullPath = path.join(dirPath, f);
      const stat = fs.statSync(fullPath);
      const rel = path.relative(rootPath, fullPath);
      if (stat.isDirectory()) {
        items.push({
          name: f,
          relativePath: rel,
          type: "directory",
          children: scanDir(fullPath, rootPath)
        });
      } else {
        items.push({
          name: f,
          relativePath: rel,
          type: "file"
        });
      }
    }
  } catch (err) {
    console.error("Scanning dir failed:", err);
  }
  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function syncAndGetConcepts(novelName: string): any[] {
  const novelDir = path.join(UPLOADS_BASE, novelName);
  const conceptsRoot = path.join(novelDir, "概念设计图");
  
  // Make sure root folder exists
  if (!fs.existsSync(conceptsRoot)) {
    fs.mkdirSync(conceptsRoot, { recursive: true });
  }

  // Define original preset categories
  const presetConcepts = [
    { name: "人物设定图", description: "用于存放所有角色的统一风格设定图" },
    { name: "地理环境概念", description: "主要城邦与废墟遗迹" },
    { name: "特殊物品概念图", description: "源星符文与旧世界遗物等" }
  ];

  // Pre-create presets physically if they don't exist
  for (const preset of presetConcepts) {
    const pDir = path.join(conceptsRoot, preset.name);
    if (!fs.existsSync(pDir)) {
      fs.mkdirSync(pDir, { recursive: true });
    }
    const infoP = path.join(pDir, "info.md");
    if (!fs.existsSync(infoP)) {
      fs.writeFileSync(
        infoP,
        `# 概念子类：${preset.name}\n\n${preset.description}\n`,
        "utf-8"
      );
    }
  }

  // Load existing database JSON if any
  const conceptsJsonP = path.join(conceptsRoot, "concepts_data.json");
  let jsonConcepts: any[] = [];
  if (fs.existsSync(conceptsJsonP)) {
    try {
      const content = fs.readFileSync(conceptsJsonP, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        jsonConcepts = parsed;
      }
    } catch (e) {
      console.error("Failed loading concepts json in syncAndGetConcepts:", e);
    }
  }

  const physicalConcepts: any[] = [];
  try {
    const catDirs = fs.readdirSync(conceptsRoot);
    for (const catName of catDirs) {
      if (catName === "concepts_data.json" || catName.startsWith('.')) continue;
      const fullCatPath = path.join(conceptsRoot, catName);
      if (fs.statSync(fullCatPath).isDirectory()) {
         // This is a physical category! Find if there is a match in jsonConcepts by name
         const matchedJsonCat = jsonConcepts.find(c => c.name === catName);
         
         let desc = "";
         const infoP = path.join(fullCatPath, "info.md");
         if (fs.existsSync(infoP)) {
           try {
             desc = fs.readFileSync(infoP, "utf-8").replace(/^# 概念子类：.*\n/, "").trim();
           } catch(e) {}
         }
         // If we don't have desc from info.md but we have it in JSON, use it
         if (!desc && matchedJsonCat?.description) {
           desc = matchedJsonCat.description;
           try {
             fs.writeFileSync(infoP, `# 概念子类：${catName}\n\n${desc}\n`, "utf-8");
           } catch(e) {}
         }

         // Scan image files physically inside this folder
         const imgFiles = fs.readdirSync(fullCatPath);
         const categoryImages: any[] = [];
         
         // Keep external or base64 images that are registered in the JSON for this category
         if (matchedJsonCat && Array.isArray(matchedJsonCat.images)) {
           for (const img of matchedJsonCat.images) {
             const isExternal = img.url && (img.url.startsWith("http") || img.url.startsWith("data:"));
             if (isExternal) {
               categoryImages.push(img);
             }
           }
         }

         for (const imgF of imgFiles) {
           if (imgF === "info.md" || imgF.startsWith('.')) continue;
           const fullImgPath = path.join(fullCatPath, imgF);
           if (fs.statSync(fullImgPath).isFile()) {
             // See if this physical file matches any image in the JSON category
             let matchedImgMeta = null;
             if (matchedJsonCat && Array.isArray(matchedJsonCat.images)) {
               matchedImgMeta = matchedJsonCat.images.find((img: any) => {
                 const idString = String(img.id);
                 return imgF.includes(idString) || (img.url && img.url.endsWith(imgF));
               });
             }

             const relativeUrlPath = path.join(novelName, "概念设计图", catName, imgF);
             const normalizedUrl = `/uploads/${relativeUrlPath.replace(/\\/g, '/')}`;

             if (matchedImgMeta) {
               categoryImages.push({
                 id: matchedImgMeta.id,
                 url: normalizedUrl, // Ensure local URLs are always up to date
                 prompt: matchedImgMeta.prompt || "本地物理插画",
                 createdAt: matchedImgMeta.createdAt || new Date().toISOString(),
                 name: matchedImgMeta.name || imgF.split('.')[0],
                 description: matchedImgMeta.description || ""
               });
             } else {
               // New physical file that is not registered in metadata! Register it!
               let deducedId = `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
               const baseName = imgF.split('.')[0];
               if (baseName.startsWith("img_")) {
                 deducedId = baseName.replace(/^img_/, "");
               }
               categoryImages.push({
                 id: deducedId,
                 url: normalizedUrl,
                 prompt: "本地物理插画",
                 createdAt: new Date().toISOString(),
                 name: baseName || "物理插画",
                 description: "物理文件入库"
               });
             }
           }
         }

         physicalConcepts.push({
           id: matchedJsonCat?.id || `cat-${catName}`,
           name: catName,
           description: desc || matchedJsonCat?.description || "",
           images: categoryImages
         });
      }
    }
  } catch (err) {
    console.error("Error scanning physical concepts in syncAndGetConcepts:", err);
  }

  // Ensure concepts array is synced back to JSON database
  try {
    fs.writeFileSync(conceptsJsonP, JSON.stringify(physicalConcepts, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write updated concepts to concepts_data.json:", e);
  }

  return physicalConcepts;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static(UPLOADS_BASE));

  // Configuration APIs (Req 1, 5)
  app.get("/api/config", (req, res) => {
    try {
      const initialized = fs.existsSync(CONFIG_FILE_PATH);
      res.json({
        success: true,
        baseDir: UPLOADS_BASE,
        initialized
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/config", (req, res) => {
    try {
      const { baseDir } = req.body;
      if (!baseDir) return res.status(400).json({ success: false, error: "缺少保存路径" });
      
      const targetPath = path.resolve(baseDir.trim());
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify({ baseDir: targetPath, initialized: true }, null, 2), "utf-8");
      
      UPLOADS_BASE = targetPath;
      ensureDirsAndFiles();
      
      res.json({ success: true, baseDir: UPLOADS_BASE });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create novel folders (Req 3)
  app.post("/api/documents/init-novel", (req, res) => {
    try {
      const { novelName } = req.body;
      if (!novelName) return res.status(400).json({ success: false, error: "缺少小说名称" });
      
      const novelDir = path.join(UPLOADS_BASE, novelName);
      if (!fs.existsSync(novelDir)) {
        fs.mkdirSync(novelDir, { recursive: true });
      }

      const subdirs = [
        "正文",
        "大纲",
        "思维导图",
        "灵感小记",
        "人物设定",
        "世界观",
        "世界构建",
        "概念设计图",
        "参考资料"
      ];

      for (const sub of subdirs) {
        const subDirP = path.join(novelDir, sub);
        if (!fs.existsSync(subDirP)) {
          fs.mkdirSync(subDirP, { recursive: true });
        }
      }

      fs.writeFileSync(path.join(novelDir, "灵感小记", "灵感卡片集锦.md"), "# 灵感卡片集锦\n\n在此记录您的创作灵魂碎片：\n", "utf-8");
      fs.writeFileSync(path.join(novelDir, "世界构建", "世界基础法理规则.md"), "# 核心法则约束设定\n\n可以在软件“世界构建”中编写，系统会自动写回此处。\n", "utf-8");

      // Auto-populate concept subdirectories and seed files
      syncAndGetConcepts(novelName);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Lossless physical project saving / sync (Req 6, 8, 9)
  app.post("/api/project/sync", (req, res) => {
    try {
      const { project } = req.body;
      if (!project || !project.name) {
        return res.status(404).json({ success: false, error: "未接收到完整小说数据结构" });
      }

      const novelName = project.name;
      const novelDir = path.join(UPLOADS_BASE, novelName);

      // Ensure base subdirectories exist
      const subdirs = [
        "正文",
        "大纲",
        "思维导图",
        "灵感小记",
        "人物设定",
        "世界观",
        "世界构建",
        "概念设计图",
        "参考资料"
      ];
      for (const sub of subdirs) {
        const subDirP = path.join(novelDir, sub);
        if (!fs.existsSync(subDirP)) {
          fs.mkdirSync(subDirP, { recursive: true });
        }
      }

      // 1. Chapters sync
      if (project.chapters && Array.isArray(project.chapters)) {
        for (const ch of project.chapters) {
          const cleanTitle = (ch.title || "未命名章节").replace(/[\\/:*?"<>|]/g, "_");
          const filepath = path.join(novelDir, "正文", `${cleanTitle}.md`);
          fs.writeFileSync(filepath, ch.content || "", "utf-8");
        }
      }

      // 2. Outline sync
      if (project.storyNodes) {
        let outlineMarkdown = "# 戏剧性冲突大纲与层级结构\n\n## 节点时间线大图景\n\n";
        project.storyNodes.forEach((node: any, idx: number) => {
          outlineMarkdown += `${idx + 1}. **${node.title || '层级卡片'}** - "${node.summary || ''}"\n`;
        });

        outlineMarkdown += "\n## 卡片细节深度走向\n\n";
        project.storyNodes.forEach((node: any) => {
          outlineMarkdown += `### 节点ID: ${node.id} -- 【${node.title || ''}】\n`;
          outlineMarkdown += `**父级ID**: ${node.parentId || '无/主线根点'}\n`;
          outlineMarkdown += `**剧情一句话摘要**: ${node.summary || '无'}\n\n`;
          outlineMarkdown += `**起承转合详细开发段落**:\n${node.content || '无'}\n\n---\n\n`;
        });

        fs.writeFileSync(path.join(novelDir, "大纲", "大纲内容与层级结构.md"), outlineMarkdown, "utf-8");
        fs.writeFileSync(path.join(novelDir, "大纲", "outline_data.json"), JSON.stringify(project.storyNodes, null, 2), "utf-8");
      }

      // 3. Mindmap sync
      if (project.storyNodes) {
        let mindmapMarkdown = "# 思维脉络脑图展现\n\n";
        const buildTreeMarkdown = (parentId: string | null, depth: number) => {
          const children = project.storyNodes.filter((n: any) => n.parentId === parentId);
          children.forEach((c: any) => {
            mindmapMarkdown += `${"  ".repeat(depth)}- **[${c.title}]**: ${c.summary}\n`;
            buildTreeMarkdown(c.id, depth + 1);
          });
        };
        buildTreeMarkdown(null, 0);

        fs.writeFileSync(path.join(novelDir, "思维导图", "思维脑图预览.md"), mindmapMarkdown, "utf-8");
        fs.writeFileSync(path.join(novelDir, "思维导图", "思维脑图树_v1.json"), JSON.stringify(project.storyNodes, null, 2), "utf-8");
      }

      // 4. Inspiration Notes sync (Req 9)
      if (project.notes && Array.isArray(project.notes)) {
        let notesMarkdown = "# 灵感大记事本 (碎皮化合并记录)\n\n直接修改此卡片段，可以在启动时同步还原。\n\n";
        project.notes.forEach((note: any) => {
          notesMarkdown += `<!-- NOTE_CARD_START id="${note.id}" color="${note.color || 'bg-blue-50'}" createdAt="${note.createdAt || ''}" -->\n`;
          notesMarkdown += `${note.content || ""}\n`;
          notesMarkdown += `<!-- NOTE_CARD_END -->\n\n`;
        });
        fs.writeFileSync(path.join(novelDir, "灵感小记", "灵感卡片集锦.md"), notesMarkdown, "utf-8");
      }

      // 5. Characters sync
      if (project.characters && Array.isArray(project.characters)) {
        for (const char of project.characters) {
          const cleanName = (char.name || "无名氏").replace(/[\\/:*?"<>|]/g, "_");
          let charMd = `---\nrole: ${char.role || ''}\ntraits: [${(char.traits || []).join(', ')}]\n---\n\n`;
          charMd += `# 角色形象档案：${char.name}\n\n`;
          charMd += `**作品归属角色定位**: ${char.role || '无'}\n`;
          charMd += `**标签特质**: ${(char.traits || []).join('、') || '暂无'}\n\n`;
          charMd += `## 角色身世及性格特征全貌\n\n${char.description || ''}\n`;
          
          fs.writeFileSync(path.join(novelDir, "人物设定", `${cleanName}_设定详情.md`), charMd, "utf-8");
        }
        fs.writeFileSync(path.join(novelDir, "人物设定", "角色信息列表.json"), JSON.stringify(project.characters, null, 2), "utf-8");
      }

      // 6. World Building sync
      if (project.background) {
        fs.writeFileSync(path.join(novelDir, "世界构建", "世界基础法理规则.md"), `# 核心法则约束设定\n\n${project.background.worldRules || '暂无世界核心法则'}`, "utf-8");
        fs.writeFileSync(path.join(novelDir, "世界构建", "地理环境与分布.md"), `# 地理时空与城邦分布\n\n${project.background.geography || '暂无地理环境和生态分布设定'}`, "utf-8");
        
        let timelineMd = "# 重大大事纪年表\n\n| 年份/纪元 | 历史核心事件 |\n| --- | --- |\n";
        (project.background.timeline || []).forEach((t: any) => {
          timelineMd += `| ${t.year} | ${t.event} |\n`;
        });
        fs.writeFileSync(path.join(novelDir, "世界构建", "重大大事纪年表.md"), timelineMd, "utf-8");

        fs.writeFileSync(path.join(novelDir, "世界构建", "世界构建属性.json"), JSON.stringify(project.background, null, 2), "utf-8");
      }

      // 7. Concept images sync and physical folders replication
      if (project.concepts && Array.isArray(project.concepts)) {
        const conceptsRoot = path.join(novelDir, "概念设计图");
        if (!fs.existsSync(conceptsRoot)) {
          fs.mkdirSync(conceptsRoot, { recursive: true });
        }
        
        fs.writeFileSync(path.join(conceptsRoot, "concepts_data.json"), JSON.stringify(project.concepts, null, 2), "utf-8");

        for (const cat of project.concepts) {
          const cleanCatName = (cat.name || "未命名分类").replace(/[\\/:*?"<>|]/g, "_");
          const catP = path.join(conceptsRoot, cleanCatName);
          if (!fs.existsSync(catP)) {
            fs.mkdirSync(catP, { recursive: true });
          }
          
          const infoContent = `# 概念子类：${cat.name}\n\n${cat.description || "暂无分类说明描述"}\n`;
          fs.writeFileSync(path.join(catP, "info.md"), infoContent, "utf-8");

          // Optional: physically write image files inside category folder
          if (cat.images && Array.isArray(cat.images)) {
            cat.images.forEach((img: any) => {
              if (img.url && img.url.startsWith("data:image")) {
                try {
                  const match = img.url.match(/^data:image\/(\w+);base64,(.+)$/);
                  if (match) {
                    const ext = match[1];
                    const base64Data = match[2];
                    const imgFilename = `img_${img.id}.${ext}`;
                    fs.writeFileSync(path.join(catP, imgFilename), base64Data, 'base64');
                  }
                } catch(err) {
                  console.error("Failed to decode and write base64 image file on sync:", err);
                }
              }
            });
          }

          // Clean up untracked or deleted image files physically on disk
          if (fs.existsSync(catP)) {
            try {
              const diskFiles = fs.readdirSync(catP);
              const activeImgIds = (cat.images || []).map((img: any) => img.id.toString());
              for (const f of diskFiles) {
                if (f === "info.md" || f.startsWith('.')) continue;
                const fullFPath = path.join(catP, f);
                if (fs.statSync(fullFPath).isFile()) {
                  // If filename does not contain any of the active image IDs, delete it
                  const isImageActive = activeImgIds.some((id: string) => f.includes(id));
                  if (!isImageActive) {
                    fs.unlinkSync(fullFPath);
                    console.log(`Physically pruned deleted concept image on sync: ${f}`);
                  }
                }
              }
            } catch (e) {
              console.error("Failed to prune stale files in category folder:", e);
            }
          }
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Sync project failed:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Re-scan and reload projects from absolute workspace directories
  app.get("/api/project/reload-all", (req, res) => {
    try {
      if (!fs.existsSync(UPLOADS_BASE)) {
        return res.json({ success: true, projects: [] });
      }

      const folders = fs.readdirSync(UPLOADS_BASE);
      const loadedProjects: any[] = [];

      for (const folder of folders) {
        if (folder === "未分组" || folder === "参考资料库" || folder === "公共资料库" || folder === "核心设定集" || folder === "小说草稿" || folder.startsWith(".")) {
          continue;
        }

        const projectDir = path.join(UPLOADS_BASE, folder);
        if (!fs.statSync(projectDir).isDirectory()) continue;

        const projName = folder;
        const projId = `loaded-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        let chapters: any[] = [];
        let storyNodes: any[] = [];
        let notes: any[] = [];
        let characters: any[] = [];
        let background = { worldRules: "", geography: "", timeline: [] as any[] };

        // 1. Chapters
        const chDir = path.join(projectDir, "正文");
        if (fs.existsSync(chDir)) {
          const files = fs.readdirSync(chDir);
          let index = 1;
          for (const f of files) {
            if (f.endsWith(".md") || f.endsWith(".txt")) {
              const content = fs.readFileSync(path.join(chDir, f), "utf-8");
              chapters.push({
                id: `ch-${projId}-${index++}`,
                title: f.replace(/\.(md|txt)$/, ""),
                isActive: index === 2,
                content
              });
            }
          }
        }
        if (chapters.length === 0) {
          chapters.push({ id: "1", title: "第一章", isActive: true, content: "" });
        }

        // 2. Outline and Mindmap
        const outlineJsonP = path.join(projectDir, "大纲", "outline_data.json");
        const mindmapJsonP = path.join(projectDir, "思维导图", "思维脑图树_v1.json");
        if (fs.existsSync(outlineJsonP)) {
          try {
            storyNodes = JSON.parse(fs.readFileSync(outlineJsonP, "utf-8"));
          } catch (e) {
            console.error("Failed loading outline JSON:", e);
          }
        } else if (fs.existsSync(mindmapJsonP)) {
          try {
            storyNodes = JSON.parse(fs.readFileSync(mindmapJsonP, "utf-8"));
          } catch(e) {}
        }

        // 3. Inspiration Notes
        const notesFileP = path.join(projectDir, "灵感小记", "灵感卡片集锦.md");
        if (fs.existsSync(notesFileP)) {
          const dataText = fs.readFileSync(notesFileP, "utf-8");
          const regex = /<!-- NOTE_CARD_START id="([^"]+)" color="([^"]+)" createdAt="([^"]*)" -->\n([\s\S]*?)\n<!-- NOTE_CARD_END -->/g;
          let match;
          while ((match = regex.exec(dataText)) !== null) {
            notes.push({
              id: match[1],
              color: match[2],
              createdAt: match[3],
              content: match[4]?.trim()
            });
          }
        }

        // 4. Characters
        const charJsonP = path.join(projectDir, "人物设定", "角色信息列表.json");
        if (fs.existsSync(charJsonP)) {
          try {
            characters = JSON.parse(fs.readFileSync(charJsonP, "utf-8"));
          } catch (e) {}
        }

        // 5. Background / World building
        const bgJsonP = path.join(projectDir, "世界构建", "世界构建属性.json");
        if (fs.existsSync(bgJsonP)) {
          try {
            background = JSON.parse(fs.readFileSync(bgJsonP, "utf-8"));
          } catch (e) {}
        } else {
          const rP = path.join(projectDir, "世界构建", "世界基础法理规则.md");
          const gP = path.join(projectDir, "世界构建", "地理环境与分布.md");
          let worldRules = "";
          let geography = "";
          if (fs.existsSync(rP)) {
            worldRules = fs.readFileSync(rP, "utf-8").replace(/^# 核心法则约束设定\n\n/, "");
          }
          if (fs.existsSync(gP)) {
            geography = fs.readFileSync(gP, "utf-8").replace(/^# 地理时空与城邦分布\n\n/, "");
          }
          background = {
            worldRules,
            geography,
            timeline: []
          };
        }

        // 6. Loading concept categories and images
        const concepts = syncAndGetConcepts(folder);

        loadedProjects.push({
          id: projId,
          name: projName,
          chapters,
          messages: [{ id: `msg-${Date.now()}`, role: 'assistant', content: `📖 物理项目《${projName}》已重新从本地物理资源库加载。各模块文件数据已成功在本地就位，欢迎开始创作探讨！`, type: 'text', tabContext: 'editor' }],
          characters,
          notes,
          storyNodes,
          background,
          schemas: [],
          concepts: concepts
        });
      }

      res.json({ success: true, projects: loadedProjects });
    } catch (err: any) {
      console.error("Reloading projects failed:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Unique load-concepts API endpoint for manual sync
  app.get("/api/project/load-concepts", (req, res) => {
    try {
      const novelName = req.query.novelName as string;
      if (!novelName) {
        return res.status(400).json({ success: false, error: "缺少小说名称参数" });
      }

      const concepts = syncAndGetConcepts(novelName);
      res.json({ success: true, concepts });
    } catch (err: any) {
      console.error("Failed to load concepts for novel:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1. 获取本地文档树形结构
  app.get("/api/documents", (req, res) => {
    try {
      const tree = scanDir(UPLOADS_BASE);
      res.json({ success: true, tree });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. 读取特定本地文档内容
  app.get("/api/documents/read", (req, res) => {
    try {
      const relPath = req.query.path as string;
      if (!relPath) return res.status(400).json({ success: false, error: "缺少文件路径" });
      const fullPath = path.join(UPLOADS_BASE, relPath);
      
      if (!fullPath.startsWith(UPLOADS_BASE)) {
        return res.status(403).json({ success: false, error: "无权访问此路径" });
      }

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ success: false, error: "文件不存在" });
      }

      const content = fs.readFileSync(fullPath, "utf-8");
      res.json({ success: true, content });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. 保存/更新本地文档
  app.post("/api/documents/save", (req, res) => {
    try {
      const { relativePath, content } = req.body;
      if (!relativePath) return res.status(400).json({ success: false, error: "缺少文件路径" });
      const fullPath = path.join(UPLOADS_BASE, relativePath);

      if (!fullPath.startsWith(UPLOADS_BASE)) {
        return res.status(403).json({ success: false, error: "无权访问此路径" });
      }

      fs.writeFileSync(fullPath, content || "", "utf-8");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. 创建新空白文档
  app.post("/api/documents/create", (req, res) => {
    try {
      const { folder, fileName } = req.body;
      const targetFolder = folder || "未分组";
      const cleanFileName = fileName || `新建文档_${Date.now()}.txt`;
      const fullPath = path.join(UPLOADS_BASE, targetFolder, cleanFileName);

      if (!fullPath.startsWith(UPLOADS_BASE)) {
        return res.status(403).json({ success: false, error: "无权访问此路径" });
      }

      fs.writeFileSync(fullPath, "", "utf-8");
      res.json({ success: true, relativePath: path.relative(UPLOADS_BASE, fullPath) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5.5 新建文件夹
  app.post("/api/documents/create-directory", (req, res) => {
    try {
      const { folderPath } = req.body;
      if (!folderPath) return res.status(400).json({ success: false, error: "缺少文件夹名称" });
      const fullPath = path.join(UPLOADS_BASE, folderPath);
      if (!fullPath.startsWith(UPLOADS_BASE)) {
        return res.status(403).json({ success: false, error: "无权访问此路径" });
      }
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      } else {
        return res.status(400).json({ success: false, error: "文件夹已存在" });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5.6 重命名文件或文件夹
  app.post("/api/documents/rename", (req, res) => {
    try {
      const { oldPath, newPath } = req.body;
      if (!oldPath || !newPath) return res.status(400).json({ success: false, error: "缺少重命名路径参数" });
      const fullOldPath = path.join(UPLOADS_BASE, oldPath);
      const fullNewPath = path.join(UPLOADS_BASE, newPath);

      if (!fullOldPath.startsWith(UPLOADS_BASE) || !fullNewPath.startsWith(UPLOADS_BASE)) {
        return res.status(403).json({ success: false, error: "无权访问此路径" });
      }

      if (!fs.existsSync(fullOldPath)) {
        return res.status(404).json({ success: false, error: "源路径不存在" });
      }
      if (fs.existsSync(fullNewPath)) {
        return res.status(400).json({ success: false, error: "目标路径已存在" });
      }

      fs.renameSync(fullOldPath, fullNewPath);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. 物理删除文档
  app.post("/api/documents/delete", (req, res) => {
    try {
      const { relativePath } = req.body;
      if (!relativePath) return res.status(400).json({ success: false, error: "缺少文件路径" });
      const fullPath = path.join(UPLOADS_BASE, relativePath);

      if (!fullPath.startsWith(UPLOADS_BASE)) {
        return res.status(403).json({ success: false, error: "无权访问此路径" });
      }

      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          fs.rmdirSync(fullPath, { recursive: true });
        } else {
          fs.unlinkSync(fullPath);
        }
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. 上传数据/导入本地文档
  app.post("/api/documents/upload", (req, res) => {
    try {
      const { fileName, content, folder } = req.body;
      if (!fileName || content === undefined) {
        return res.status(400).json({ success: false, error: "上传失败：缺少文件名或内容" });
      }
      const targetFolder = folder || "参考资料库";
      const fullDir = path.join(UPLOADS_BASE, targetFolder);
      if (!fs.existsSync(fullDir)) {
        fs.mkdirSync(fullDir, { recursive: true });
      }
      const fullPath = path.join(fullDir, fileName);

      if (!fullPath.startsWith(UPLOADS_BASE)) {
        return res.status(403).json({ success: false, error: "无权访问此路径" });
      }

      fs.writeFileSync(fullPath, content, "utf-8");
      res.json({ success: true, relativePath: path.relative(UPLOADS_BASE, fullPath) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. 读取物理日记历史备份
  app.get("/api/diary", (req, res) => {
    try {
      if (!fs.existsSync(DIARY_FILE_PATH)) {
        fs.writeFileSync(DIARY_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
      }
      const data = fs.readFileSync(DIARY_FILE_PATH, "utf-8");
      res.json({ success: true, logs: JSON.parse(data) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. 写入日志至物理日记备份
  app.post("/api/diary/log", (req, res) => {
    try {
      const { logEntry } = req.body;
      if (!logEntry) return res.status(400).json({ success: false, error: "缺少日志内容" });

      if (!fs.existsSync(DIARY_FILE_PATH)) {
        fs.writeFileSync(DIARY_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
      }
      const data = fs.readFileSync(DIARY_FILE_PATH, "utf-8");
      const logs = JSON.parse(data);
      logs.unshift(logEntry);
      fs.writeFileSync(DIARY_FILE_PATH, JSON.stringify(logs, null, 2), "utf-8");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. 撤回最后一项物理日志记录
  app.post("/api/diary/undo", (req, res) => {
    try {
      if (!fs.existsSync(DIARY_FILE_PATH)) {
        return res.json({ success: true, undoLog: null });
      }
      const data = fs.readFileSync(DIARY_FILE_PATH, "utf-8");
      const logs = JSON.parse(data);
      if (logs.length === 0) {
        return res.json({ success: true, undoLog: null });
      }

      const poppedLog = logs.shift();
      fs.writeFileSync(DIARY_FILE_PATH, JSON.stringify(logs, null, 2), "utf-8");
      res.json({ success: true, undoLog: poppedLog });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route for Model Connection Check
  app.post("/api/check-connection", async (req, res) => {
    try {
      const { apiUrl, apiKey, model } = req.body;
      if (!apiUrl || !apiKey || !model) {
        return res.status(400).json({ success: false, error: "缺少服务终结点(apiUrl)、密钥(apiKey)或模型名称" });
      }

      // 剔除 URL 末尾的 / 以防止双斜杠
      const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

      // 进行一次真实的、只有极小消耗的 API ping，以检查 key 和通信
      const authHeader = `Bearer ${apiKey}`;
      const apiRes = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1
        })
      });

      if (!apiRes.ok) {
        let errorMsg = `HTTP Error ${apiRes.status} ${apiRes.statusText}`;
        try {
          const errData = await apiRes.json();
          if (errData.error && errData.error.message) {
            errorMsg = errData.error.message;
          }
        } catch(e) {}
        return res.status(apiRes.status < 500 ? 400 : 500).json({ success: false, error: "通信测试失败: " + errorMsg });
      }

      res.json({ success: true, message: "通信测试成功，模型响应正常！" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "请求遭遇网络异常" });
    }
  });

  // API Route for AI Chat with dynamic parameters or fallback
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, context, background, storyNodes, chapters, apiUrl, apiKey, model, systemPrompt, novelName } = req.body;
      
      // 1. Scan and read all local physical materials recursively from uploads for AI context learning
      let learnedTextsContext = "";
      try {
        const subfolders = [
          "参考资料库",
          "小说草稿",
          "核心设定集",
          "未分组",
          "公共资料库",
          "公共资料库/参考资料库"
        ];
        if (novelName) {
          subfolders.push(
            `${novelName}/参考资料`,
            `${novelName}/正文`, 
            `${novelName}/大纲`, 
            `${novelName}/灵感小记`,
            `${novelName}/人物设定`,
            `${novelName}/世界构建`
          );
        }
        for (const f of subfolders) {
          const dir = path.join(UPLOADS_BASE, f);
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
              const fullP = path.join(dir, file);
              const stat = fs.statSync(fullP);
              if (stat.isFile() && (file.endsWith(".txt") || file.endsWith(".md"))) {
                const textVal = fs.readFileSync(fullP, "utf-8");
                learnedTextsContext += `\n【参考及已学习本地文档：${f}/${file}】:\n${textVal.substring(0, 4000)}\n`;
              }
            }
          }
        }
      } catch (err) {
        console.error("Error building learning context in API Chat:", err);
      }

      const worldRulesText = background?.worldRules || "无核心法则设定";
      const geographyText = background?.geography || "无地理设定";
      const timelineText = background?.timeline?.map((t: any) => `[${t.year}]: ${t.event}`).join("\n") || "无纪事历史设定";

      // Read dynamic tools spec from /src/lib/ai-tools.json
      let toolsSpecText = "";
      try {
        const toolsPath = path.join(process.cwd(), "src", "lib", "ai-tools.json");
        if (fs.existsSync(toolsPath)) {
          toolsSpecText = fs.readFileSync(toolsPath, "utf-8");
        }
      } catch (err) {
        console.error("Failed to read ai-tools.json:", err);
      }

      // Format storyNodes and chapters lists
      const storyNodesText = storyNodes && storyNodes.length > 0 
        ? storyNodes.map((n: any) => `- [节点ID: ${n.id}] 【${n.title || '层级卡片'}】 (父级ID: ${n.parentId || '无/主线根点'}): 一句话摘要: "${n.summary}". 开发大纲梗概: ${n.content || '无详细内容'}`).join("\n")
        : "当前故事大纲节点树为空（无任何卡片，建议调用 create_story_node 进行核心大纲与初始章回的构思铺设）。";
      
      const chaptersText = chapters && chapters.length > 0
        ? chapters.map((c: any) => `- [章回ID/主键: ${c.id}] ${c.title}`).join("\n")
        : "当前暂无草稿章节。";

      // 2. Prepare final system instructions with injected learned context
      const defaultSystemPrompt = `你是一位顶尖的多功能小说创作世界构建与大纲卡片编排辅助 AI。
当前小说的真实数据状态如下：
【世界基本法理和规则约束】：
${worldRulesText}

【时空地理与城邦分布】：
${geographyText}

【历史纪事编年表】：
${timelineText}

【当前小说戏剧冲突大纲与思维脑图节点列表】：
${storyNodesText}

【当前小说章节草稿目录】：
${chaptersText}

日常沟通中，当用户对世界背景、基本法理、编年表、地理、章节正文修改，或者关于【大纲以及思维导图的情节节点更新、删除、新建】有倾向或请求时，请务必调用对应的外部工具指令。

================================================
【AI可以调用的高精度本地编辑器/大纲/思维脑图工具规范与约束】
为了对大纲与思维导图节点（storyNodes）、章节正文精修、以及设定时间轴/规则等进行精密修改，你必须在回答末尾以单个 <args>[JSON指令]</args> 包裹格式输出。
你输出的 <args> 格式与属性参数必须【绝对严格地】符合下面定义的 JSON Schema 规范：
${toolsSpecText || "无法读取工具JSON约束"}
================================================

【绝对死线铁律】：对于任何涉及大纲卡片增删改（create_story_node/update_story_node/delete_story_node）、章节重写精修、或设定数据的操作，你必须在生成的文本回复的【最末尾】强制输出一模对应的格式完整的 <args>...</args> 指令包裹！例如，用户说“我想在大纲主线后加一个第四章，写他们遭遇暗物质风暴”，你必须计算出或提供该新增节点的 parentId 并输出 <args>{"action": "create_story_node", "parentId": "parent-id-if-any", "title": "第四章：暗物质风暴", "summary": "遭遇风暴并进行极限迫降，主角团内部分歧加剧", "content": "..."}</args>。绝对不能只进行文字陈述而不给出指令，因为没有指令用户无法一键一键应用！每条指令的 JSON 结构和属性必绝对精准。`;

      const promptTemplateToUse = systemPrompt || defaultSystemPrompt;
      const finalSystemPrompt = `${promptTemplateToUse}

================================================
【AI已经收录并直接学习的本地参考资料及小说草稿文本】
当用户提到“学习小说”、“参考资料”、“续写刚才在本地编辑的文件”时，请深刻且严密、符合语法与风格地结合下列真实的本地文件内容来进行剧情推衍、改写、评注及探讨：
${learnedTextsContext || "（当前本地素材库为空，待用户通过资产包上传或创建）"}
================================================`;

      // If client provides custom API Base URL and API Key, proxy it directly for the selected provider with streaming!
      if (apiUrl && apiKey) {
        const cleanUrl = apiUrl.endsWith("/chat/completions") ? apiUrl : `${apiUrl.replace(/\/$/, '')}/chat/completions`;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        };

        const formattedMessages = [];
        formattedMessages.push({ role: "system", content: finalSystemPrompt });

        // Add user/assistant messages
        formattedMessages.push(...(messages || []).map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.text || m.content || ""
        })));

        console.log(`Proxying streaming chat request to: ${cleanUrl} [Model: ${model || 'default'}]`);
        const apiResponse = await fetch(cleanUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: model || "deepseek-chat",
            messages: formattedMessages,
            temperature: 0.7,
            stream: true
          })
        });

        if (!apiResponse.ok) {
          const errText = await apiResponse.text();
          throw new Error(`模型商返回了错误 (代码: ${apiResponse.status}): ${errText}`);
        }

        // Set headers for Streaming Server Sent Events (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = apiResponse.body;
        if (!reader) {
          throw new Error("模型提供商未返回有效的可读流");
        }

        const webReader = reader.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let isDone = false;

        try {
          while (!isDone) {
            const { value, done } = await webReader.read();
            if (done) {
              isDone = true;
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            
            let boundary = buffer.indexOf("\n");
            while (boundary !== -1) {
              const line = buffer.substring(0, boundary).trim();
              buffer = buffer.substring(boundary + 1);
              boundary = buffer.indexOf("\n");

              if (!line) continue;
              if (line.startsWith("data:")) {
                const dataVal = line.slice(5).trim();
                // [DONE] marker indicates stream finish from provider
                if (dataVal === "[DONE]") {
                  continue;
                }
                
                try {
                  const parsed = JSON.parse(dataVal);
                  
                  // Check if the stream actually returned an error inside SSE payload
                  if (parsed.error) {
                     const errorText = parsed.error.message || JSON.stringify(parsed.error);
                     res.write(`data: ${JSON.stringify({ text: `\n\n【模型API调用失败】: ${errorText}` })}\n\n`);
                     continue;
                  }

                  const text = parsed.choices?.[0]?.delta?.content || "";
                  if (text) {
                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                  }
                } catch (err) {
                  // Ignore parsing errors for incomplete SSE packets
                }
              }
            }
          }
        } finally {
          webReader.releaseLock();
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      // FALLBACK: Built-in Gemini API if not custom configured
      const ai = getAI();
      const formattedContents = (messages || []).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text || m.content || "" }]
      }));

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.5-flash", 
        contents: formattedContents,
        config: {
          systemInstruction: finalSystemPrompt,
        }
      });
      
      // Set headers for SSE streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });
  
  // API Route for Image Generation (Concept Art)
  app.post("/api/generate-image", async (req, res) => {
    try {
      const ai = getAI();
      const { prompt } = req.body;
      
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9'
        }
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64Image = response.generatedImages[0].image.imageBytes;
        res.json({ image: `data:image/jpeg;base64,${base64Image}` });
      } else {
        throw new Error("No image generated");
      }
    } catch (error: any) {
      console.error("Image Gen Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, __dirname is usually the dist directory if bundled there
    const distPath = process.env.NODE_ENV_DIST || path.join(__dirname);
    // Since index.html is also in dist, we just use path.join(distPath, 'index.html')
    // Wait, if it is running as dist/server.cjs, __dirname is dist.
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
