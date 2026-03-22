import { describe, expect, it } from "vitest";
import xEdge from "./fixtures/x-edge.md?raw";
import xNormal from "./fixtures/x-normal.md?raw";
import { parseXBriefing } from "./parseXBriefing";

describe("parseXBriefing", () => {
  it("extracts X curated bullets, source links, topics, and day scores", () => {
    const parsed = parseXBriefing(xNormal);

    expect(parsed.date).toBe("2026-03-14");
    expect(parsed.toplines).toHaveLength(3);
    expect(parsed.items).toHaveLength(4);
    expect(parsed.items[0].title).toBe("多代理评测平台开始把 benchmark");
    expect(parsed.items[0].summary).toContain("回归检查");
    expect(parsed.items[0].take).toBe(parsed.items[0].summary);
    expect(parsed.items[0].topics).toEqual(expect.arrayContaining(["Agents", "Evals"]));
    expect(parsed.items[0].sourceUrl).toBe("https://x.com/builderdaily/status/1000000000000000001");
    expect(parsed.scores).toMatchObject({
      heat: 8,
      value: 9
    });
    expect(parsed.warnings).toHaveLength(0);
  });

  it("supports linked handles, multiple source links, missing optional sections, and optional source index", () => {
    const parsed = parseXBriefing(xEdge);

    expect(parsed.date).toBe("2026-03-20");
    expect(parsed.items).toHaveLength(4);
    expect(parsed.items[1].sourceName).toBe("@Workflow Ops");
    expect(parsed.items[1].sourceUrl).toBe("https://x.com/workflowops/status/2000000000000000002");
    expect(parsed.items[2].sourceUrls).toEqual([
      "https://x.com/browserforge/status/2000000000000000003",
      "https://x.com/agentbench/status/2000000000000000004",
      "https://x.com/opsguide/status/2000000000000000005"
    ]);
    expect(parsed.items[2].topics).toEqual(expect.arrayContaining(["Agents", "Tooling", "Evals"]));
    expect(parsed.sourceIndex).toHaveLength(0);
    expect(parsed.scores.heat).toBe(9);
  });
});
