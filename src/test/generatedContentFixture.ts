import audioIndexJson from "../../public/generated/audio-index.json";
import briefingsByDateJson from "../../public/generated/briefings-by-date.json";
import briefingsIndexJson from "../../public/generated/briefings-index.json";
import type {
  GeneratedAudioIndex,
  GeneratedBriefingsByDate,
  GeneratedBriefingsIndex
} from "../lib/briefings/generatedArtifacts";

export const generatedContentFixture = {
  briefingsIndex: briefingsIndexJson as GeneratedBriefingsIndex,
  briefingsByDate: briefingsByDateJson as GeneratedBriefingsByDate,
  audioIndex: audioIndexJson as GeneratedAudioIndex
};
