import { z } from 'zod';

/* ----------  A. NARRATIVE SCAFFOLD (Original) ------------------- */
// This remains for potential future use or alternative modes.
export const NarrativeScaffoldSchema = z.object({
  title: z.string().describe("The final generated title for the video."),
  angle: z.string().describe("The specific angle or perspective for the video."),
  hook: z.string().describe("A compelling hook to capture the audience's attention in the first few seconds."),
  sequences: z.array(z.object({
    objectif: z.string().describe("The main goal or objective of this sequence."),
    stake: z.string().describe("What is at stake? Why should the viewer care?"),
    payoff: z.string().describe("The resolution or payoff for the viewer within this sequence."),
    type: z.enum(["education", "action", "entertainment", "intro", "outro"]).describe("The type of the sequence."),
    visuals: z.string().describe("A brief description of the suggested visuals for this sequence (e.g., 'Archival footage', 'Animated graphic')."),
    open_loop_to_next: z.boolean().describe("Whether this sequence creates an open loop leading to the next one."),
  })).min(1, { message: "At least one sequence is required" }).describe("An array of sequences that form the narrative structure of the video."),
});
export type NarrativeScaffold = z.infer<typeof NarrativeScaffoldSchema>;


/* ----------  B. PRODUCTION PLAN (New Master Schema) ------------------- */

const HookIntroSchema = z.object({
  nom: z.literal('Hook & Introduction'),
  duree_max_sec: z.number(),
  objectifs: z.array(z.string()),
});

const AdSchema = z.object({
  nom: z.literal('Ad (optionnel)'),
  fenetre_insertion_sec: z.array(z.number()).length(2, 'Must be exactly [startSec, endSec]'),
  roles: z.array(z.string()),
  suggestion: z.string(),
});

const BodySchema = z.object({
  nom: z.literal('Body'),
  duree_moyenne_sec: z.number(),
  acts: z.array(
    z.object({
      acte: z.string(),
      duree_sec: z.number(),
      contenu: z.string(),
    }),
  ).length(3),
  sequences: z.array(
    z.object({
      objectif: z.string(),
      stake: z.string(),
      payoff: z.string(),
      type: z.enum(['action', 'education']),
      open_loop_to_next: z.boolean(),
      visuals: z.string(),
    }),
  ).min(1),
  principe_open_loop: z.string(),
});

const OutroSchema = z.object({
  nom: z.literal('Outro & CTA'),
  duree_moyenne_sec: z.number(),
  contenu: z.array(z.string()),
});

export const VideoScaffoldSchema = z.object({
  title: z.string(),
  angle: z.string(),
  hook: z.string(),
  sections: z.array(
    z.discriminatedUnion('nom', [
      HookIntroSchema,
      AdSchema,
      BodySchema,
      OutroSchema,
    ])
  ).min(4),
});


export type ProductionPlan = z.infer<typeof VideoScaffoldSchema>;


/* ----------  C. SHARED STREAMING TYPES ------------------- */

export type AgentStreamEvent = {
  type: 'tool_call';
  tool_name: string;
  tool_input: string;
} | {
  type: 'tool_result';
  tool_name: string;
  tool_output: any;
} | {
  type: 'status';
  message: string;
} | {
  type: 'final_output';
  output: ProductionPlan; // Note: The final output is now a ProductionPlan
} | {
  type: 'error';
  error: string;
};