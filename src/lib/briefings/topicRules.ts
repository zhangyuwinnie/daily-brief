const TOPIC_RULES: Array<{ topic: string; keywords: string[] }> = [
  { topic: "Coding Agents", keywords: ["coding agent", "claude code", "codex", "cursor", "编程代理", "编码代理"] },
  { topic: "Agents", keywords: ["agent", "agents", "agentic", "代理", "智能体"] },
  { topic: "Evals", keywords: ["eval", "evaluation", "benchmark", "judge", "faithfulness", "评测", "评估", "基准"] },
  { topic: "RAG", keywords: ["rag", "graph rag", "检索增强"] },
  { topic: "Retrieval", keywords: ["retrieval", "retriever", "search", "检索", "知识图谱"] },
  { topic: "Security", keywords: ["security", "misalignment", "governance", "privacy", "漏洞", "安全", "隐私", "治理"] },
  { topic: "Tooling", keywords: ["tool", "tools", "cli", "sdk", "framework", "platform", "workflow", "browser", "工具", "平台", "框架", "工作流"] },
  { topic: "Learning Resource", keywords: ["course", "guide", "tutorial", "academy", "课程", "指南", "教程", "cheat sheet", "认证"] }
];

export function deriveTopics(textParts: Array<string | undefined>) {
  const haystack = textParts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return TOPIC_RULES.filter((rule) => rule.keywords.some((keyword) => haystack.includes(keyword)))
    .map((rule) => rule.topic);
}
