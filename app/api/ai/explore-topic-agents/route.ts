import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { mockScripts } from '@/lib/mock-data';
import { sendAgentEvent } from '../agent-stream/route';
import { adminDb } from '@/lib/firebase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simulated agent thoughts for demonstration
const simulateAgentThinking = async (sessionId: string, prompt: string, duration: number) => {
  // Send initial progress
  sendAgentEvent(sessionId, 'progress', { percentage: 0 });
  
  // Coordinator Agent starts
  sendAgentEvent(sessionId, 'thought', {
    agentName: 'Coordinator Agent',
    thought: `Analyzing user request: "${prompt.substring(0, 100)}..."`,
    timestamp: Date.now(),
    type: 'reasoning'
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
  sendAgentEvent(sessionId, 'progress', { percentage: 10 });

  sendAgentEvent(sessionId, 'thought', {
    agentName: 'Coordinator Agent',
    thought: `Identified video type and duration: ${duration}s. Delegating to Research Agent...`,
    timestamp: Date.now(),
    type: 'decision'
  });

  // Research Agent
  await new Promise(resolve => setTimeout(resolve, 500));
  
  sendAgentEvent(sessionId, 'agent-change', { agentName: 'Research Agent' });
  sendAgentEvent(sessionId, 'progress', { percentage: 20 });
  
  sendAgentEvent(sessionId, 'thought', {
    agentName: 'Research Agent',
    thought: 'Starting comprehensive research on the topic...',
    timestamp: Date.now(),
    type: 'action'
  });

  await new Promise(resolve => setTimeout(resolve, 1500));
  sendAgentEvent(sessionId, 'progress', { percentage: 35 });

  sendAgentEvent(sessionId, 'thought', {
    agentName: 'Research Agent',
    thought: 'Found relevant information from YouTube, academic sources, and recent news.',
    timestamp: Date.now(),
    type: 'observation'
  });

  // Structure Agent
  await new Promise(resolve => setTimeout(resolve, 500));
  
  sendAgentEvent(sessionId, 'agent-change', { agentName: 'Structure Agent' });
  sendAgentEvent(sessionId, 'progress', { percentage: 50 });
  
  sendAgentEvent(sessionId, 'thought', {
    agentName: 'Structure Agent',
    thought: `Creating optimal structure for ${duration}s video with engaging hook and story arc...`,
    timestamp: Date.now(),
    type: 'reasoning'
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
  sendAgentEvent(sessionId, 'progress', { percentage: 65 });

  sendAgentEvent(sessionId, 'thought', {
    agentName: 'Structure Agent',
    thought: 'Structure complete: Hook (10%), Act 1 (25%), Act 2 (35%), Act 3 (25%), Outro (5%)',
    timestamp: Date.now(),
    type: 'decision'
  });

  // Writing Agent
  await new Promise(resolve => setTimeout(resolve, 500));
  
  sendAgentEvent(sessionId, 'agent-change', { agentName: 'Writing Agent' });
  sendAgentEvent(sessionId, 'progress', { percentage: 75 });
  
  sendAgentEvent(sessionId, 'thought', {
    agentName: 'Writing Agent',
    thought: 'Beginning script writing with engaging conversational style...',
    timestamp: Date.now(),
    type: 'action'
  });

  await new Promise(resolve => setTimeout(resolve, 2000));
  sendAgentEvent(sessionId, 'progress', { percentage: 90 });

  sendAgentEvent(sessionId, 'thought', {
    agentName: 'Writing Agent',
    thought: 'Script draft complete. Optimizing for retention and engagement...',
    timestamp: Date.now(),
    type: 'observation'
  });

  // Back to Coordinator
  await new Promise(resolve => setTimeout(resolve, 500));
  
  sendAgentEvent(sessionId, 'agent-change', { agentName: 'Coordinator Agent' });
  sendAgentEvent(sessionId, 'progress', { percentage: 95 });
  
  sendAgentEvent(sessionId, 'thought', {
    agentName: 'Coordinator Agent',
    thought: 'Finalizing script with all agent inputs. Quality check complete.',
    timestamp: Date.now(),
    type: 'decision'
  });
  
  // Final progress
  await new Promise(resolve => setTimeout(resolve, 500));
  sendAgentEvent(sessionId, 'progress', { percentage: 100 });
};

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const { prompt, mcpServer, youtubeKey, targetDuration, searchEnabled, testMode, sessionId } = await request.json();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start agent thinking simulation if sessionId provided
          if (sessionId) {
            simulateAgentThinking(sessionId, prompt, targetDuration).catch(console.error);
          }

          // Simulate initial MCP server results
          if (mcpServer === 'youtube' && youtubeKey) {
            const mockYoutubeResults = [
              {
                type: 'youtube',
                title: `Advanced Guide: ${prompt.substring(0, 30)}`,
                description: 'Comprehensive tutorial with expert insights...',
                thumbnail: 'https://via.placeholder.com/320x180',
                subtitles: true
              },
              {
                type: 'youtube',
                title: `${prompt.substring(0, 20)} Explained`,
                description: 'Deep dive into the topic...',
                thumbnail: 'https://via.placeholder.com/320x180',
                subtitles: true
              }
            ];

            for (const result of mockYoutubeResults) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
              await new Promise(resolve => setTimeout(resolve, 800));
            }
          }

          // Generate script with agents
          if (searchEnabled) {
            // Use mock data in test mode
            if (testMode) {
              await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate agent processing
              
              let scriptType = 'humanoid';
              if (prompt.toLowerCase().includes('marie') || prompt.toLowerCase().includes('curie')) {
                scriptType = 'mariecurie';
              } else if (prompt.toLowerCase().includes('carbonara') || prompt.toLowerCase().includes('cooking')) {
                scriptType = 'cooking';
              }
              
              const mockScript = mockScripts[scriptType as keyof typeof mockScripts];
              
              const scriptData = {
                script: mockScript,
                title: prompt.split('.')[0].substring(0, 50),
                storyline: {
                  sections: [
                    { name: "Hook", duration: 15, content: "Engaging opening" },
                    { name: "Act 1", duration: Math.floor(targetDuration * 0.3), content: "Setup and context" },
                    { name: "Act 2", duration: Math.floor(targetDuration * 0.4), content: "Main content" },
                    { name: "Act 3", duration: Math.floor(targetDuration * 0.25), content: "Resolution" },
                    { name: "Outro", duration: Math.floor(targetDuration * 0.05), content: "Call to action" }
                  ]
                },
                prompt,
                targetDuration,
                mcpServer,
                searchEnabled,
                createdAt: new Date().toISOString(),
                sessionId,
                _testMode: true,
                _agentGenerated: true
              };

              // Save to Firestore
              try {
                const docRef = await adminDb.collection('scripts').add(scriptData);
                console.log('Script saved to Firestore with ID:', docRef.id);
                
                const mockResult = {
                  type: 'final',
                  content: {
                    ...scriptData,
                    scriptId: docRef.id
                  }
                };
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(mockResult)}\n\n`));
              } catch (error) {
                console.error('Error saving to Firestore:', error);
                // Still send the result even if save fails
                const mockResult = {
                  type: 'final',
                  content: scriptData
                };
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(mockResult)}\n\n`));
              }
            } else {
              // Real OpenAI API call
              const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                  {
                    role: "system",
                    content: "You are an expert video script writer with deep knowledge of audience retention and storytelling."
                  },
                  {
                    role: "user",
                    content: `Create a video script based on: ${prompt}\nTarget duration: ${targetDuration} seconds\n\nReturn JSON with script, title, and storyline structure.`
                  }
                ],
                temperature: 0.7,
              });

              const parsedContent = JSON.parse(completion.choices[0].message.content || '{}');
              
              const scriptData = {
                ...parsedContent,
                prompt,
                targetDuration,
                mcpServer,
                searchEnabled,
                createdAt: new Date().toISOString(),
                sessionId,
                _agentGenerated: true
              };

              // Save to Firestore
              try {
                const docRef = await adminDb.collection('scripts').add(scriptData);
                console.log('Script saved to Firestore with ID:', docRef.id);
                
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
                // Still send the result even if save fails
                const result = {
                  type: 'final',
                  content: scriptData
                };
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
              }
            }
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
    console.error('Error in explore-topic-agents:', error);
    return NextResponse.json({ error: 'Failed to explore topic' }, { status: 500 });
  }
}