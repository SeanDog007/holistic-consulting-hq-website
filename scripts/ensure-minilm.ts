import { readVectorIndexFile } from "../src/lib/vector-index";
import { MINILM_PROVIDER } from "../src/lib/embed";
import { ensureMiniLMModel } from "../src/lib/embed-minilm";

async function main() {
  let provider = process.env.BRAIN_EMBED_PROVIDER;
  try {
    provider = readVectorIndexFile().provider;
  } catch {
    // index may not exist yet during a fresh clone before embed
  }
  if (provider && provider !== MINILM_PROVIDER && process.env.BRAIN_ENSURE_MINILM !== "1") {
    console.log(`Skipping MiniLM download (index provider=${provider}).`);
    return;
  }
  const dir = await ensureMiniLMModel();
  console.log(`MiniLM model ready at ${dir}`);
}

main().catch((error) => {
  console.warn(`MiniLM ensure failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 0;
});
