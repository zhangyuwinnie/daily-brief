import { describe, expect, it } from "vitest";
import cursorBlogFixture from "./fixtures/cursor-blog.html?raw";
import { parseCursorBlogHtml } from "../../../scripts/daily-briefing.js";

describe("parseCursorBlogHtml", () => {
  it("extracts cursor blog article cards without relying on a catastrophic whole-page regex", () => {
    const items = parseCursorBlogHtml(cursorBlogFixture, {
      name: "Cursor Blog",
      url: "https://cursor.com/blog"
    });

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      title: "The third era of AI software development",
      link: "https://cursor.com/blog/third-era",
      source: "Cursor Blog",
      isoDate: "2026-02-26T19:35:24.000Z"
    });
    expect(items[0].contentSnippet).toContain("autonomous cloud agents");

    expect(items[1]).toMatchObject({
      title: "Meet the new Cursor",
      link: "https://cursor.com/blog/cursor-3",
      isoDate: "2026-03-16T12:00:00.000Z"
    });
    expect(items[1].contentSnippet).toContain("updated agent workflows");

    expect(items[2]).toMatchObject({
      title: "Salesforce accelerates velocity by over 30% and ships higher-quality code with Cursor",
      link: "https://cursor.com/blog/salesforce",
      isoDate: "2026-01-21T12:00:00.000Z"
    });
    expect(items[2].contentSnippet).toBe("");
  });
});
