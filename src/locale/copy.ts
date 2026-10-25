export type Lang = "en" | "zh";

export interface PanelCopy {
  full: string;
  more: string;
  less: string;
  heard: string;
  avoid: string;
  connects: string;
  prev: string;
  next: string;
  share: string;
  markdown: string;
  entry: string;
  close: string;
  langTip: string;
  langLabel: string;
}

const en: PanelCopy = {
  full: "Full definition",
  more: "Read more",
  less: "Show less",
  heard: "Heard in the wild",
  avoid: "Avoid",
  connects: "Connects to",
  prev: "Prev",
  next: "Next",
  share: "Share",
  markdown: "Copy markdown",
  entry: "Read full entry",
  close: "Close",
  langTip: "中文",
  langLabel: "切换到中文",
};

const zh: PanelCopy = {
  full: "完全定义",
  more: "展开",
  less: "收起",
  heard: "常见说法",
  avoid: "避免",
  connects: "相连",
  prev: "上一则",
  next: "下一则",
  share: "分享",
  markdown: "复制 Markdown",
  entry: "阅读完整条目",
  close: "关闭",
  langTip: "English",
  langLabel: "Switch to English",
};

export const sectionZh: Record<string, string> = {
  "The Model": "模型",
  "Sessions, Context Windows & Turns": "会话、上下文窗口与回合",
  "Tools & Environment": "工具与环境",
  "Failure Modes": "失败模式",
  Handoffs: "移交",
  "Memory and Steering": "记忆与引导",
  "Patterns of Work": "工作方式",
};

export function panelCopy(lang: Lang): PanelCopy {
  return lang === "zh" ? zh : en;
}
