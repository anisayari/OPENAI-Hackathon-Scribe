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
export async function performReasoningAndScaffolding(
  topic: string,
  angle: string,
  webSearchResults?: ResearchResult,
  exampleScriptText?: string
) {
  const input: ReasoningInput = {
    topic,
    angle,
    webSearchResults,
    exampleScriptText
  };
  
  const reasoningAgent = new Agent({
    name: 'ShowrunnerAgent',
    model: 'gpt-4o',
    instructions: `You are a world-class YouTube show-runner. Your mission is to create a complete and detailed production plan for a biographical video.
- **Adherence to Methodology:** You must strictly follow the creative methodology provided.
- **Synthesize Research:** Your primary job is to weave the specific facts, names, dates, and insights from the research results into every part of the production plan.
- **Concrete & Actionable:** All fields must be filled with concrete, actionable ideas. 
- **DETAILED CONTENT:** For 'contenu', write FULL PARAGRAPHS (150-200 words minimum) with complete sentences, not just short descriptions.
- **COMPREHENSIVE SEQUENCES:** Each sequence must include:
  - A detailed 'objectif' (50+ words) that thoroughly explains what this part accomplishes
  - Substantial 'stake' descriptions (30+ words) explaining why viewers should care
  - Rich 'payoff' descriptions (30+ words) detailing what viewers gain
  - Detailed 'visuals' (50+ words) with specific shot descriptions, transitions, and effects
- **Descriptive Objectives:** Each sequence's 'objectif' should be a clear, descriptive phrase that explains what this part of the video accomplishes (e.g., "Explore the early life and education of Marie Curie" instead of just "Background").
- **LENGTH REQUIREMENTS:** The total production plan should be comprehensive and detailed, with each section containing substantial content.
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