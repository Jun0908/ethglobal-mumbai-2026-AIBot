import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path)); else result.push(path);
  }
  return result;
}
const key = process.env.OPENAI_API_KEY?.trim();
const staticFiles = await files(resolve(".next/static"));
if (key) for (const path of staticFiles) assert(!(await readFile(path)).includes(Buffer.from(key)), "Credential literal found in client output");
const serverFiles = await files(resolve(".next/server"));
for (const path of serverFiles.filter(path => path.endsWith(".nft.json"))) {
  const trace = JSON.parse(await readFile(path, "utf8"));
  assert(!trace.files.some(file => /(?:^|[\\/])\.env(?:[.\\/]|$)|(?:^|[\\/])\.data[\\/]/.test(file)), "Private runtime file included in trace");
}
console.log("PASS: no configured API key literal in client assets; no .env or .data files in deployment traces");
