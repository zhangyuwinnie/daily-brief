import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("keeps the Brief2Build brand while using the updated product thesis copy", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(html).toContain("Brief2Build");
    expect(html).toContain("A daily briefing room for AI builders turning signal into shipped work.");
    expect(html).not.toContain("builder-operators");
  });
});
