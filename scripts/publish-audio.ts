import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ENV_LOCAL_PATH = join(import.meta.dirname, "../.env.local");

if (existsSync(ENV_LOCAL_PATH)) {
  for (const line of readFileSync(ENV_LOCAL_PATH, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const AUDIO_DIR = join(import.meta.dirname, "../public/generated/audio");

const MIME_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav"
};

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("Missing required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey }
});

const files = readdirSync(AUDIO_DIR).filter((f) => Object.keys(MIME_TYPES).some((ext) => f.endsWith(ext)));

if (files.length === 0) {
  console.log("No audio files found in", AUDIO_DIR);
  process.exit(0);
}

let uploaded = 0;
let skipped = 0;

for (const file of files) {
  const ext = "." + file.split(".").pop()!;
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
  const body = readFileSync(join(AUDIO_DIR, file));
  const key = `audio/${file}`;

  // Check if file already exists in R2 with the same size
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    if (head.ContentLength === body.length) {
      skipped++;
      console.log(`Skipped ${file} (already uploaded, ${(body.length / 1024 / 1024).toFixed(1)} MB)`);
      continue;
    }
  } catch {
    // Object doesn't exist — proceed with upload
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );

  uploaded++;
  console.log(`Uploaded ${file} (${(body.length / 1024 / 1024).toFixed(1)} MB)`);
}

console.log(`Done. ${uploaded} uploaded, ${skipped} skipped (already in R2 bucket "${bucket}").`);
