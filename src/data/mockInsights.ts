import type { Insight } from "../types/models";

export const MOCK_INSIGHTS: Insight[] = [
  {
    id: "1",
    briefingId: "x-2026-03-15",
    date: "2026-03-15",
    sourceType: "x",
    sourceLabel: "X Briefing",
    sourceName: "Anthropic",
    sourceUrl: "https://x.com/AnthropicAI",
    title: "Claude 3.5 Opus 推出原生 MCP (Model Context Protocol) 支持",
    summary:
      "Anthropic 正式将 MCP 集成到核心 API 中，使得模型可以直接与本地文件系统、数据库和第三方服务进行结构化交互，无需中间层编排。",
    take:
      "MCP 正在成为 Agent 工具调用的行业标准。过去需要 LangChain/LlamaIndex 几百行代码的工具链，现在可能只需要一个简单的 MCP Server 配置。",
    buildIdea:
      "用 TypeScript 写一个极简的 SQLite MCP Server，让 Claude 能直接 query 你的个人记账数据库。",
    entities: ["Claude", "MCP", "SQLite"],
    effortEstimate: "2h",
    topics: ["Agents", "Tooling"],
    isTopSignal: true
  },
  {
    id: "2",
    briefingId: "rss-2026-03-15",
    date: "2026-03-15",
    sourceType: "rss",
    sourceLabel: "RSS Briefing",
    sourceName: "Industry Research",
    sourceUrl: "https://example.com/rag-faithfulness",
    title: "RAG 评估的新范式：从单纯的准确率到“忠诚度” (Faithfulness)",
    summary:
      "最新的论文指出，工业界 RAG 系统的主要瓶颈不再是检索不到，而是生成模型对检索内容的“幻觉”扩展。新的评测集重点关注生成内容对 Context 的忠诚度。",
    take:
      "如果你在做 RAG，立刻停止只看“回答是否正确”，开始引入 Faithfulness 指标，哪怕只是用另一个小模型做 LLM-as-a-judge。",
    buildIdea:
      "搭建一个 30 行代码的评测脚本，使用 GPT-4o-mini 来给已有 RAG 系统的输出打 Faithfulness 分数。",
    entities: ["RAG", "Faithfulness", "GPT-4o-mini"],
    effortEstimate: "30m",
    topics: ["RAG", "Evals"],
    isTopSignal: true
  },
  {
    id: "3",
    briefingId: "x-2026-03-14",
    date: "2026-03-14",
    sourceType: "x",
    sourceLabel: "X Briefing",
    sourceName: "OpenAI",
    sourceUrl: "https://x.com/OpenAI",
    title: "OpenAI 泄露的 \"Operator\" 早期演示：全自动浏览器控制",
    summary:
      "一段视频显示 OpenAI 的新 Agent 能够接管浏览器，自动完成复杂的多步骤电商退货流程，包括处理图形验证码和动态表单。",
    take:
      "Web Agent 的 UI 时代已经到来。DOM 解析不再是重点，多模态视觉理解+精确坐标点击是接下来的主流解法。",
    buildIdea:
      "使用 Playwright + 视觉模型，做一个能自动帮你给 GitHub Repo 点 Star 的小脚本，体验一下纯视觉驱动的自动化。",
    entities: ["OpenAI", "Operator", "Playwright"],
    effortEstimate: "weekend",
    topics: ["Agents", "Coding Agents"],
    isTopSignal: false
  }
];

export const FOCUS_TOPICS = [
  "Agents",
  "Coding Agents",
  "Evals",
  "RAG",
  "Retrieval",
  "Security",
  "Tooling",
  "Learning Resource"
];

export const RECENT_BRIEFS = [
  "Today, Mar 15",
  "Yesterday, Mar 14",
  "Wed, Mar 13",
  "Tue, Mar 12"
];
