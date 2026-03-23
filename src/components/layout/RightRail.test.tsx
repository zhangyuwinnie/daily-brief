import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { getAvailableBriefingDates } from "../../lib/briefings/generatedContentLoader";
import { RightRail } from "./RightRail";

const noop = () => {};

describe("RightRail", () => {
  it("renders recent generated dates as /today query-param links instead of mock labels", () => {
    const availableDates = getAvailableBriefingDates().slice(0, 4);

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={[`/today?date=${availableDates[1]}`]}>
        <RightRail
          selectedInsight={null}
          topicFilter={null}
          topics={[]}
          onAddToBuild={noop}
          onInsightShare={noop}
          onTopicFilterChange={noop}
        />
      </MemoryRouter>
    );

    expect(availableDates).toHaveLength(4);
    expect(html).toContain(`href="/today?date=${availableDates[0]}"`);
    expect(html).toContain(`href="/today?date=${availableDates[1]}"`);
    expect(html).toContain(availableDates[0]);
    expect(html).not.toContain("Today, Mar 15");
  });
});
