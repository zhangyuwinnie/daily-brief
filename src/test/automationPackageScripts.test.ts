import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readPackageJson() {
  const packageJsonPath = path.resolve(import.meta.dirname, "../../package.json");
  const contents = await readFile(packageJsonPath, "utf8");
  return JSON.parse(contents) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}

function getDeclaredVersion(
  packageJson: Awaited<ReturnType<typeof readPackageJson>>,
  packageName: string
) {
  return packageJson.dependencies?.[packageName] ?? packageJson.devDependencies?.[packageName];
}

describe("automation package wiring", () => {
  it("declares the local daily automation scripts", async () => {
    const packageJson = await readPackageJson();

    expect(packageJson.scripts).toMatchObject({
      daily: "node --import dotenv/config scripts/daily-briefing.js --no-dedup",
      "daily:follow-builders":
        "node --import dotenv/config scripts/prepare-follow-builders.js | node --import dotenv/config scripts/remix-follow-builders.js",
      "daily:audio": "bash scripts/generate-audio.sh",
      "daily:all":
        "npm run daily && npm run daily:follow-builders && npm run daily:audio && npm run sync:generated"
    });
  });

  it("declares the automation dependencies required by the repo-local pipeline", async () => {
    const packageJson = await readPackageJson();

    expect(getDeclaredVersion(packageJson, "@google/generative-ai")).toBeTruthy();
    expect(getDeclaredVersion(packageJson, "dotenv")).toBeTruthy();
    expect(getDeclaredVersion(packageJson, "rss-parser")).toBeTruthy();
  });
});
