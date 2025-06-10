/* lib/advanced-agents/research.ts
   ---------------------------------------------------------------
   Consolidated research helper:
   – (optional) uploads user files & builds a vector store
   – runs a ResearchAgent with web_search + file_search
   – returns { summary, citations[] } in JSON
----------------------------------------------------------------*/

import {
  Agent,
  run,
  webSearchTool,
  fileSearchTool,
} from '@openai/agents';
import { openai } from './openai-client';

/* ---------- vector-store helper -------------------------------------- */

export async function prepareVectorStoreForFiles(files: File[]): Promise<string> {
  if (!files.length) throw new Error('No upload files given');

  const uploaded = await Promise.all(
    files.map((f) => openai.files.create({ file: f, purpose: 'assistants' }))
  );
  const fileIds = uploaded.map((f) => f.id);

  // 2️⃣  Create & index into a new vector store
  // @ts-ignore – beta namespace isn't typed (yet)
  const store = await openai.beta.vectorStores.create({
    name: `Hackathon-VS ${Date.now()}`,
    file_ids: fileIds,
  });

  /* 🟡 NEW — poll until ready (max 30 s) */
  for (let i = 0; i < 30; i++) {
    // @ts-ignore beta typing
    const status = (await openai.beta.vectorStores.retrieve(store.id)).status;
    if (status === 'completed') return store.id;
    if (status === 'failed') throw new Error('Vector-store indexing failed');
    await new Promise((r) => setTimeout(r, 1_000));  // wait 1 s
  }
  throw new Error('Vector store still indexing after 30 s');
}

/* ----------  B.  CONSOLIDATED RESEARCH AGENT  ---------------- */

export interface ResearchResult {
  webSummary: string | null;
  fileSummary: string | null;
  citations: { title: string; url: string }[];
}

export async function performResearch(
  topic: string,
  angle: string,
  vectorStoreId: string | null,
): Promise<ResearchResult> {
  const tools: any[] = [];

  /* Use env flags to isolate problems */
  if (process.env.USE_WEB_TOOL !== 'false') tools.push(webSearchTool());
  if (vectorStoreId && process.env.USE_FILE_TOOL !== 'false') {
    tools.push(fileSearchTool([vectorStoreId], { maxNumResults: 5 }));
  }

  const agent = new Agent({
    name: 'ResearchAgent',
    instructions: `
      You are a world-class research assistant.
      • Use web_search and file_search whenever helpful.
      • Return ONLY valid JSON:
        { "webSummary": string | null,
          "fileSummary": string | null,
          "citations": [ { "title": string, "url": string } ] }
      • If a tool was not used, its corresponding summary field should be null.
      • Do NOT include any extra keys, no markdown, no commentary.`,
    tools,
  });

  const prompt = `Topic: ${topic}\nAngle: ${angle}\nProduce the JSON now.`;
  const { finalOutput } = await run(agent, prompt);

  try {
    return JSON.parse(finalOutput as string) as ResearchResult;
  } catch (err) {
    console.error('ResearchAgent returned non-JSON:', finalOutput);
    return {
      webSummary:
        '⚠️ The research agent did not return valid JSON. Raw output:\n' +
        String(finalOutput),
      fileSummary: null,
      citations: [],
    };
  }
}