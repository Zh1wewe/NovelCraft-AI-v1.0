# NovelCraft AI 🖋️

**NovelCraft AI** (全球首创的沉浸式小说开发与物理档案管理系统) 是一款专为创作者设计的 AI 辅助长篇小说构建工具。我们从底层逻辑改变了小说创作的模式：从单纯的“写字”，转向“构建世界”。借助节点化的时间大纲、拓扑逻辑导图、全局 AI 托管与物理级档案归类，让你的每一个灵感都能稳定落库。

## ✨ 核心特性 / Features

- **🌐 宏大的世界观设定库 (World Building)**:
  - 核心物理档案级管理（全局设定、风土人情、战力体系、概念资产）。
  - 支持“全局 AI 档案管家”独立驻场，随时调取、分析和比对你的复杂设定世界，杜绝吃书。
  - **概念图鉴 (Concept Art)**：为你的地理、大事件、关键设定生成插图并归档。

- **🗺️ 双轨大纲引擎 (Dual-Track Outline)**:
  - **大纲时间线 (Outline View)**：采用类似 Git 分支的管理模式，智能区分 `主线阶段 (Main)` 与 `分支情节 (Branch)`，使多线叙事清晰明了。
  - **拓扑逻辑导图 (Mindmap View)**：自动基于主副节点关系生成树状/网状思维导图。包含直观的无极缩放、拖拽定位、快速生发次级节点的能力。

- **👥 角色图谱 (Character Profile)**:
  - 专属人物关系面板。管理你的主角、配角甚至龙套档案，并记录他们的生平轨迹、核心矛盾与视觉特征。

- **💬 沉浸式全局 AI 协同 (Immersive AI Co-Pilot)**:
  - 每个模块支持独立 AI 召唤（大纲脑暴、情节细化、台词模拟）。
  - **多模型自由切换**：支持跨模型方案（Gemini, OpenAI, Anthropic 等多提供商接入），让不同特点的 AI 处理不同质感的情节。
  - **对话智能跟随**：输出长文本时智能锁定最新消息，当用户主动向上滑动时自动关闭跟随。

- **本地优先策略 (Local-First Architecture)**:
  - 默认使用客户端本地缓存，确保内容不丢失，无需复杂配网。所有数据均安全留存在你的浏览器中，支持物理 JSON 导出。

## 🛠️ 技术栈 / Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Visual Nodes**: [@xyflow/react](https://reactflow.dev/) (配合 `dagre` 自动布局排版)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Langchain/AI Runtime**: 自研灵活的模型 Provider 接口体系

## 🚀 快速开始 / Getting Started

### 1. 克隆项目
```bash
git clone https://github.com/your-username/novelcraft-ai.git
cd novelcraft-ai
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制根目录下的 `.env.example` 为 `.env`（如有需要），填入你需要的 AI 对应 API Keys。

### 4. 运行开发服务器
```bash
npm run dev
```
启动后，在浏览器访问控制台输出的地址 (通常是 `http://localhost:3000`)。

## 🤝 贡献说明 / Contributing

欢迎各位创作者与开发者提交 Issue 和 Pull Request，我们非常乐意吸收更多对文学构建有极度狂热的开发者的建议！

1. Fork 本仓库。
2. 创建属于你的 Feature 分支: `git checkout -b feature/AmazingFeature`
3. 提交你的更改: `git commit -m 'Add some AmazingFeature'`
4. 推送分支: `git push origin feature/AmazingFeature`
5. 开启一个 Pull Request。

## 📄 协议 / License

本项目采用 [MIT License](LICENSE) 开源协议。
