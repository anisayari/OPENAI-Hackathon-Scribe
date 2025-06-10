import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ProductionPlan, VideoScaffoldSchema } from './types';
import { ResearchResult } from './research';

type ReasoningInput = {
  topic: string;
  angle: string;
  webSearchResults?: ResearchResult;
  exampleScriptText?: string;
};

const methodology = {
  "version": "1.0",
  "titre": "Méthodologie de création – Vidéo biographique YouTube",
  "feedback_loop_permanent": true,
  "etapes": [
    // ... (Your methodology JSON would be included here)
  ]
};

// This is the main function that will be called by our API route
export function performReasoningAndScaffolding(input: ReasoningInput) {
  const reasoningAgent = new Agent({
    name: 'ShowrunnerAgent',
    model: 'gpt-4o',
    instructions: `You are a world-class YouTube show-runner. Your mission is to create a complete and detailed production plan for a biographical video.
- **Adherence to Methodology:** You must strictly follow the creative methodology provided.
- **Synthesize Research:** Your primary job is to weave the specific facts, names, dates, and insights from the research results into every part of the production plan.
- **Concrete & Actionable:** All fields must be filled with concrete, actionable ideas. For 'contenu', write a descriptive sentence. For 'visuals', suggest specific shots.
- **Output JSON Only:** The final output must be ONLY a valid JSON object that strictly adheres to the ProductionPlanSchema.

### CREATIVE METHODOLOGY ###
${JSON.stringify(methodology, null, 2)}

### PRODUCTION PLAN SCHEMA ###
${JSON.stringify(zodToJsonSchema(VideoScaffoldSchema), null, 2)}
###############`,
    outputType: VideoScaffoldSchema,
    tools: [], 
  });

  const structuredPrompt = `
    Please generate a complete production plan based on the following information:

    ---
    **TOPIC:**
    ${input.topic}

    ---
    **ANGLE:**
    ${input.angle}

    ---
    **RESEARCH RESULTS (Web & File):**
    ${input.webSearchResults?.webSummary || 'No web research available'}
    ${input.webSearchResults?.fileSummary || 'No file research available'}
    Citations: ${input.webSearchResults?.citations?.map((c: { title: string; url: string; }) => `- ${c.title}: ${c.url}`)?.join('\n') || 'N/A'}
    
    ---
    **EXAMPLE SCRIPT STYLE REFERENCE:**
    ${input.exampleScriptText || 'No example script was provided.'}
    ---

    Now, generate the final JSON output based on your instructions.
  `;

  return run(reasoningAgent, structuredPrompt);
}