/**
 * 本地解析器 (Local Parser)
 * 用于从 AI 的回复中提取并验证符合 JSON Schema 的数据，将其转换为本地组件可渲染的状态。
 */

import { StoryNode } from '../types';

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rawJson?: string;
}

/**
 * 从 Markdown 文本中提取 ```json ... ``` 块
 */
export function extractJSONFromMarkdown(markdown: string): string | null {
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = markdown.match(jsonRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  // 如果没有 code block，尝试直接解析 {} 包裹的内容
  const rawJsonRegex = /({[\s\S]*})/;
  const rawMatch = markdown.match(rawJsonRegex);
  if (rawMatch && rawMatch[1]) {
    return rawMatch[1].trim();
  }
  return null;
}

/**
 * 大纲节点解析器示例
 * 对应的 JSON Schema 期望是一个包含节点数组的对象
 */
export function parseStoryNodes(response: string): ParseResult<StoryNode[]> {
  const jsonStr = extractJSONFromMarkdown(response);
  if (!jsonStr) {
    return { success: false, error: '未找到有效的 JSON 数据块。' };
  }

  try {
    const data = JSON.parse(jsonStr);
    
    // 简单的类型校验
    if (!data || !Array.isArray(data.nodes)) {
      return { success: false, error: 'JSON 数据格式不符合大纲设定 (缺少 nodes 数组)。', rawJson: jsonStr };
    }

    const nodes: StoryNode[] = data.nodes.map((n: any, index: number) => ({
      id: n.id || `gen_node_${Date.now()}_${index}`,
      title: n.title || '未命名节点',
      summary: n.summary || '',
      content: n.content || '',
      parentId: n.parentId || null
    }));

    return { success: true, data: nodes, rawJson: jsonStr };
  } catch (err: any) {
    return { success: false, error: `JSON 解析失败: ${err.message}`, rawJson: jsonStr };
  }
}
