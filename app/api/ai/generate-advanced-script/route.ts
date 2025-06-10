import { NextRequest, NextResponse } from 'next/server';
import { performResearch } from '@/lib/advanced-agents/research';
import { performReasoningAndScaffolding } from '@/lib/advanced-agents/reasoning';
import { sendAgentEvent } from '../agent-stream/route';
import { adminDb } from '@/lib/firebase-admin';
import { AgentStreamEvent, ProductionPlan } from '@/lib/advanced-agents/types';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const { prompt, targetDuration, mcpServer, searchEnabled, sessionId } = await request.json();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial progress
          if (sessionId) {
            sendAgentEvent(sessionId, 'progress', { percentage: 0 });
            sendAgentEvent(sessionId, 'thought', {
              agentName: 'Advanced Research Agent',
              thought: `Starting comprehensive research on: "${prompt}"`,
              timestamp: Date.now(),
              type: 'reasoning'
            });
          }

          // Phase 1: Research
          console.log('Starting research phase...');
          let researchResult;
          try {
            researchResult = await performResearch(prompt, prompt);
          } catch (error) {
            console.warn('Research failed, continuing with empty results:', error);
            researchResult = {
              webSummary: 'Research unavailable',
              fileSummary: 'No files processed',
              citations: []
            };
          }
          
          if (sessionId) {
            sendAgentEvent(sessionId, 'progress', { percentage: 40 });
            sendAgentEvent(sessionId, 'thought', {
              agentName: 'Advanced Research Agent',
              thought: `Research completed. Found ${researchResult?.citations?.length || 0} relevant sources.`,
              timestamp: Date.now(),
              type: 'observation'
            });
          }

          // Send research results
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'research_complete',
            research: researchResult
          })}\n\n`));

          // Phase 2: Production Planning
          if (sessionId) {
            sendAgentEvent(sessionId, 'agent-change', { agentName: 'Showrunner Agent' });
            sendAgentEvent(sessionId, 'thought', {
              agentName: 'Showrunner Agent',
              thought: 'Creating detailed production plan based on research...',
              timestamp: Date.now(),
              type: 'action'
            });
          }

          console.log('Starting production planning phase...');
          let productionPlan;
          try {
            productionPlan = await performReasoningAndScaffolding(
              prompt,
              prompt,
              researchResult,
              undefined // No example script for now
            );
          } catch (error) {
            console.error('Production planning failed:', error);
            throw error; // Re-throw to be caught by outer try-catch
          }

          if (sessionId) {
            sendAgentEvent(sessionId, 'progress', { percentage: 80 });
            sendAgentEvent(sessionId, 'thought', {
              agentName: 'Showrunner Agent',
              thought: 'Production plan completed. Converting to script format...',
              timestamp: Date.now(),
              type: 'decision'
            });
          }

          // Convert production plan to script format
          const script = convertProductionPlanToScript(productionPlan, targetDuration);
          
          // Save to Firestore
          const scriptData = {
            script,
            title: productionPlan.title,
            storyline: {
              sections: productionPlan.sections.map(section => ({
                nom: section.name,
                duree_sec: calculateSectionDuration(section, targetDuration),
                objectifs: section.sequences ? section.sequences.map(seq => seq.objective) : [],
                contenu: section.description || ''
              }))
            },
            productionPlan,
            researchResult,
            prompt,
            targetDuration,
            mcpServer,
            searchEnabled,
            createdAt: new Date().toISOString(),
            sessionId,
            _advancedGeneration: true
          };

          try {
            const docRef = await adminDb.collection('scripts').add(scriptData);
            console.log('Advanced script saved to Firestore with ID:', docRef.id);
            
            if (sessionId) {
              sendAgentEvent(sessionId, 'progress', { percentage: 100 });
              sendAgentEvent(sessionId, 'thought', {
                agentName: 'Showrunner Agent',
                thought: 'Script generation complete!',
                timestamp: Date.now(),
                type: 'decision'
              });
            }

            const result = {
              type: 'final',
              content: {
                ...scriptData,
                scriptId: docRef.id
              }
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
          } catch (error) {
            console.error('Error saving to Firestore:', error);
            const result = {
              type: 'final',
              content: scriptData
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in generate-advanced-script:', error);
    return NextResponse.json({ error: 'Failed to generate advanced script' }, { status: 500 });
  }
}

function convertProductionPlanToScript(plan: ProductionPlan, targetDuration: number): string {
  let script = '';
  let currentTime = 0;

  plan.sections.forEach((section, index) => {
    const sectionDuration = calculateSectionDuration(section, targetDuration);
    const endTime = currentTime + sectionDuration;
    
    // Section header
    script += `${currentTime}-${endTime} seconds: (${section.name})\n`;
    
    // Add section content
    if (section.sequences) {
      section.sequences.forEach(sequence => {
        script += `[${sequence.visualDescription}]\n`;
        script += `${sequence.objective}\n`;
        if (sequence.payoff) {
          script += `${sequence.payoff}\n`;
        }
        script += '\n';
      });
    } else if (section.description) {
      script += `${section.description}\n\n`;
    }
    
    currentTime = endTime;
  });

  return script.trim();
}

function calculateSectionDuration(section: any, totalDuration: number): number {
  // Estimate durations based on section type
  const durationMap: { [key: string]: number } = {
    'Hook & Introduction': 0.1,  // 10%
    'Ad Placement': 0.05,        // 5%
    'Body (3 Acts)': 0.75,       // 75%
    'Outro & CTA': 0.1          // 10%
  };
  
  const percentage = durationMap[section.name] || 0.25;
  return Math.floor(totalDuration * percentage);
}