import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readWorkflowFile() {
  const workflowPath = path.resolve(import.meta.dirname, "../../.github/workflows/daily-brief.yml");
  return readFile(workflowPath, "utf8");
}

describe("daily brief workflow", () => {
  it("declares the required triggers, schedule, permissions, and debug artifacts", async () => {
    const workflow = await readWorkflowFile();

    expect(workflow).toContain("name: Daily Brief");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("- cron: '0 13 * * *'");
    expect(workflow).toContain("permissions:");
    expect(workflow).toContain("contents: write");
    expect(workflow).toContain("actions/upload-artifact@");
    expect(workflow).toContain("path: |");
    expect(workflow).toContain("briefings/");
    expect(workflow).toContain("logs/");
  });

  it("runs the expected automation pipeline and only commits when generated output changed", async () => {
    const workflow = await readWorkflowFile();

    expect(workflow).toContain("actions/setup-node@");
    expect(workflow).toContain("node-version: '22'");
    expect(workflow).toContain("actions/setup-python@");
    expect(workflow).toContain("python-version: '3.10'");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("pip install notebooklm-py");
    expect(workflow).toContain("npm run daily");
    expect(workflow).toContain("npm run daily:follow-builders");
    expect(workflow).toContain("npm run daily:audio");
    expect(workflow).toContain("npm run sync:generated");
    expect(workflow).toContain("npm run publish:audio");
    expect(workflow).toContain("git diff --cached --quiet");
    expect(workflow).toContain("git commit -m");
    expect(workflow).toContain("git pull --rebase origin");
    expect(workflow).toContain("git push");
  });
});
