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
            researchResult = await performResearch(prompt, prompt, null, sessionId, mcpServer);
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
            const reasoningResult = await performReasoningAndScaffolding(
              prompt,
              prompt,
              researchResult,
              undefined // No example script for now
            );
            
            // Extract the production plan from the agent's response
            if (reasoningResult && reasoningResult.finalOutput) {
              try {
                // Try to parse the final output as JSON
                productionPlan = typeof reasoningResult.finalOutput === 'string' 
                  ? JSON.parse(reasoningResult.finalOutput)
                  : reasoningResult.finalOutput;
              } catch (parseError) {
                console.error('Failed to parse production plan:', parseError);
                // Create a fallback production plan
                productionPlan = {
                  sections: [
                    {
                      name: 'Introduction',
                      duration: 30,
                      sequences: [{
                        objective: 'Introduce the topic',
                        visualDescription: 'Opening visuals',
                        payoff: 'Set the stage for the story'
                      }]
                    },
                    {
                      name: 'Main Content',
                      duration: targetDuration - 60,
                      sequences: [{
                        objective: 'Explore the main narrative',
                        visualDescription: 'Core content visuals',
                        payoff: 'Deliver the main message'
                      }]
                    },
                    {
                      name: 'Conclusion',
                      duration: 30,
                      sequences: [{
                        objective: 'Wrap up the story',
                        visualDescription: 'Closing visuals',
                        payoff: 'Leave a lasting impression'
                      }]
                    }
                  ]
                };
              }
            } else {
              throw new Error('No production plan generated');
            }
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
            title: productionPlan.title || 'Untitled',
            storyline: {
              sections: productionPlan.sections.map(section => ({
                nom: section.name || section.nom || 'Unnamed Section',
                duree_sec: calculateSectionDuration(section, targetDuration),
                objectifs: section.sequences ? section.sequences.map(seq => seq.objective || seq.objectif || '').filter(Boolean) : [],
                contenu: section.description || section.contenu || ''
              }))
            },
            productionPlan,
            researchResult,
            prompt,
            targetDuration,
            mcpServer: mcpServer || null,
            searchEnabled: searchEnabled || false,
            createdAt: new Date().toISOString(),
            sessionId: sessionId || null,
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

function convertProductionPlanToScript(plan: any, targetDuration: number): string {
  let script = '';
  let currentTime = 0;

  // Ensure plan exists
  if (!plan) {
    console.error('No production plan provided');
    return 'Error: No production plan provided';
  }

  // Handle the VideoScaffold structure (with named sections)
  if (plan.sections && Array.isArray(plan.sections)) {
    plan.sections.forEach((section: any) => {
      if (section.nom === 'Hook & Introduction') {
        const duration = section.duree_max_sec || 30;
        const endTime = currentTime + duration;
        script += `${currentTime}-${endTime} seconds: (Hook & Introduction)\n`;
        script += `[Opening shot - Dynamic visual hook with text overlay]\n\n`;
        
        script += `OPENING HOOK:\n${plan.hook || 'Engaging opening'}\n\n`;
        
        // Add objectives as introduction points
        if (section.objectifs && section.objectifs.length > 0) {
          script += `KEY POINTS TO COVER:\n`;
          section.objectifs.forEach((obj: string) => {
            script += `• ${obj}\n`;
          });
          script += `\n`;
        }
        
        script += `---\n\n`;
        currentTime = endTime;
      } else if (section.nom === 'Body' && section.sequences) {
        section.sequences.forEach((sequence: any, idx: number) => {
          const duration = Math.floor(targetDuration / section.sequences.length);
          const endTime = currentTime + duration;
          
          // Extract a title from the objective or create a meaningful one
          let sequenceTitle = '';
          if (sequence.objectif) {
            // Take first few words from objective as title
            const words = sequence.objectif.split(' ').slice(0, 5).join(' ');
            sequenceTitle = words.charAt(0).toUpperCase() + words.slice(1);
            if (sequence.objectif.split(' ').length > 5) {
              sequenceTitle += '...';
            }
          } else if (sequence.type) {
            sequenceTitle = `${sequence.type.charAt(0).toUpperCase() + sequence.type.slice(1)} Sequence`;
          } else {
            sequenceTitle = `Main Content ${idx + 1}`;
          }
          
          script += `${currentTime}-${endTime} seconds: (${sequenceTitle})\n`;
          script += `[${sequence.visuals || 'Visual description'}]\n\n`;
          
          // Add detailed objective as the main narration
          script += `NARRATION:\n${sequence.objectif || 'Sequence objective'}\n\n`;
          
          // Add stakes as additional context
          if (sequence.stake) {
            script += `CONTEXT & STAKES:\n${sequence.stake}\n\n`;
          }
          
          // Add payoff as the conclusion
          if (sequence.payoff) {
            script += `OUTCOME & IMPACT:\n${sequence.payoff}\n\n`;
          }
          
          // Add any additional content from the sequence
          if (sequence.contenu) {
            script += `DETAILED CONTENT:\n${sequence.contenu}\n\n`;
          }
          
          script += '---\n\n';
          currentTime = endTime;
        });
      } else if (section.nom === 'Outro & CTA') {
        const duration = section.duree_moyenne_sec || 30;
        const endTime = currentTime + duration;
        script += `${currentTime}-${endTime} seconds: (Outro & CTA)\n`;
        script += `[Closing visuals - Branded end screen with subscribe button and related video thumbnails]\n\n`;
        
        script += `CONCLUSION & CALL TO ACTION:\n`;
        if (section.contenu && Array.isArray(section.contenu)) {
          section.contenu.forEach((content: string) => {
            script += `${content}\n\n`;
          });
        }
        
        script += `ENGAGEMENT PROMPTS:\n`;
        script += `• Like this video if you found it valuable\n`;
        script += `• Subscribe for more content on this topic\n`;
        script += `• Comment below with your thoughts and questions\n`;
        script += `• Check out our related videos in the description\n\n`;
        
        script += `---\n\n`;
        currentTime = endTime;
      }
    });
  } else {
    // Fallback for unexpected structure
    script = `0-${targetDuration} seconds: (Full Video)\n`;
    script += `Title: ${plan.title || 'Untitled'}\n`;
    script += `Angle: ${plan.angle || 'General perspective'}\n`;
    script += `Hook: ${plan.hook || 'Opening hook'}\n\n`;
    script += `[Main content based on the topic]\n`;
    script += `Please develop this script further based on your research.\n`;
  }

  return script || 'Error: Unable to generate script from production plan';
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