import { NextRequest, NextResponse } from 'next/server';
import { performReasoningAndScaffolding } from '@/lib/advanced-agents/reasoning';
import {
  AgentStreamEvent,
  ProductionPlan,
  VideoScaffoldSchema,
} from '@/lib/advanced-agents/types';
import { performResearch, prepareVectorStoreForFiles } from '@/lib/advanced-agents/research';

// The Edge runtime is causing issues with the @openai/agents library.
// We are removing it to use the more stable default Node.js runtime.
// export const runtime = 'edge';
// This is required to enable streaming file uploads in Next.js Edge runtime.
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

async function* runAgentProcess(requestBody: FormData): AsyncGenerator<string, void, unknown> {
  const topic = requestBody.get('topic') as string;
  const angle = requestBody.get('angle') as string;
  const exampleScriptText = requestBody.get('exampleScriptsText') as string | undefined;
  const files = requestBody.getAll('files') as File[];
  
  console.log('Research process started with:', { topic, angle, exampleScriptText, fileCount: files.length });

  try {
    yield `data: ${JSON.stringify({ type: 'status', message: 'Starting research phase...' })}\n\n`;

    let vectorStoreId: string | null = null;
    if (files.length > 0 && files[0].size > 0) {
        yield `data: ${JSON.stringify({ type: 'status', message: 'File processing agent initiated. Uploading to vector store...' })}\n\n`;
        vectorStoreId = await prepareVectorStoreForFiles(files);
        yield `data: ${JSON.stringify({ type: 'status', message: `Vector store ${vectorStoreId} created. Starting consolidated research.` })}\n\n`;
    }

    const researchResult = await performResearch(topic, angle, vectorStoreId);
    
    // Stream intermediate research results back to the client
    if (researchResult.webSummary) {
        yield `data: ${JSON.stringify({ type: 'status', message: `## Web Research\n${researchResult.webSummary}` })}\n\n`;
    }
    if (researchResult.fileSummary) {
        yield `data: ${JSON.stringify({ type: 'status', message: `## File Research\n${researchResult.fileSummary}` })}\n\n`;
    }
     if (researchResult.citations && researchResult.citations.length > 0) {
        const citationText = researchResult.citations.map(c => `- [${c.title}](${c.url})`).join('\n');
        yield `data: ${JSON.stringify({ type: 'status', message: `### Citations\n${citationText}` })}\n\n`;
    }

    // Consolidate summaries for the reasoning agent
    const consolidatedSummary = `
      Web Research Summary:
      ${researchResult.webSummary || 'Not available.'}

      File Research Summary:
      ${researchResult.fileSummary || 'Not available.'}
    `;

    // Ensure webSearchResults is not null before passing to the reasoning agent
    const webSearchResults = { summary: consolidatedSummary, citations: researchResult.citations };

    yield `data: ${JSON.stringify({ type: 'status', message: 'All research agents completed. Starting reasoning phase...' })}\n\n`;
    
    // --- Reasoning Phase ---
    const reasoningResult = await performReasoningAndScaffolding({
      topic,
      angle,
      webSearchResults: researchResult,
      exampleScriptText,
    });

    try {
      // The SDK now validates the output against the Zod schema internally.
      const validatedPlan = reasoningResult.finalOutput;

      if (!validatedPlan) {
        throw new Error("Reasoning agent returned an empty output.");
      }
      
      const finalOutput: AgentStreamEvent = {
        type: 'final_output',
        output: validatedPlan,
      };
      console.log('Reasoning complete, sending final output.');
      yield `data: ${JSON.stringify(finalOutput)}\n\n`;
    } catch(e) {
      console.error("Failed to parse or validate final output:", e);
      const errorEvent: AgentStreamEvent = { type: 'error', error: (e as any).message || "The reasoning agent failed to produce valid JSON matching the schema." };
      yield `data: ${JSON.stringify(errorEvent)}\n\n`;
    }
     
    yield `data: ${JSON.stringify({ type: 'status', message: 'Process complete.' })}\n\n`;

  } catch (error) {
    console.error("Error in research pipeline:", error);
    const errorEvent: AgentStreamEvent = { type: 'error', error: (error as Error).message };
    yield `data: ${JSON.stringify(errorEvent)}\n\n`;
  }
}

export async function POST(req: NextRequest) {
  console.log('Received POST request to /api/ai/advanced-research');
  const requestBody = await req.formData();
  
  const iterator = runAgentProcess(requestBody);
  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(new TextEncoder().encode(value));
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}