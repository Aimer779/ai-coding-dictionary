/** Chinese names backed by a national standard or a vendor's own Chinese documentation. */
export const officialName: Record<string, { zh: string; source: string }> = {
  ai: { zh: "人工智能", source: "GB/T 41867-2022" },
  model: { zh: "模型", source: "GB/T 46346-2025" },
  parameters: { zh: "参数", source: "《计算机科学技术名词》" },
  training: { zh: "训练", source: "GB/T 46346-2025" },
  inference: { zh: "推理", source: "GB/T 46346-2025" },
  "input-tokens": { zh: "输入 Token", source: "OpenAI 帮助中心简体中文" },
  "output-tokens": { zh: "输出 Token", source: "OpenAI 帮助中心简体中文" },
  "context-window": { zh: "上下文窗口", source: "Claude 官方中文文档" },
  agent: { zh: "智能体", source: "OpenAI 中文官网" },
  environment: { zh: "环境", source: "《计算机科学技术名词》" },
  filesystem: { zh: "文件系统", source: "《计算机科学技术名词》" },
  tool: { zh: "工具", source: "《计算机科学技术名词》" },
  mcp: { zh: "模型上下文协议", source: "火山方舟官方文档" },
  sandbox: { zh: "沙箱", source: "《计算机科学技术名词》" },
};

export function officialZh(slug: string): string | undefined {
  return officialName[slug]?.zh;
}
