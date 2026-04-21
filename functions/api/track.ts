import { handleTrackRequest } from "../../src/lib/trackEndpoint";

interface Env {
  ANALYTICS?: AnalyticsEngineDataset;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => handleTrackRequest(request, env);
