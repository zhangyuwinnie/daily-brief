import { afterEach, beforeEach, vi } from "vitest";
import {
  primeGeneratedContentSources,
  resetGeneratedContentSources
} from "../lib/briefings/generatedContentLoader";
import { generatedContentFixture } from "./generatedContentFixture";

beforeEach(() => {
  primeGeneratedContentSources(generatedContentFixture);
});

afterEach(() => {
  resetGeneratedContentSources();
  vi.restoreAllMocks();
});
