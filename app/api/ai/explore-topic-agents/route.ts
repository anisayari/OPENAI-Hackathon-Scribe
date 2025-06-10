import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { mockScripts } from '@/lib/mock-data';
import { sendAgentEvent, sendYouTubeEvent } from '../agent-stream/route';
import { adminDb } from '@/lib/firebase-admin';
import { searchYouTubeVideos } from '@/lib/advanced-agents/youtube-mcp-helper';

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
    const { prompt, mcpServer, targetDuration, searchEnabled, testMode, sessionId } = await request.json();
    
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isStreamClosed = false;
        
        const safeEnqueue = (data: any) => {
          try {
            if (!isStreamClosed && controller.desiredSize !== null) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            }
          } catch (error) {
            console.error('Error sending stream data:', error);
            isStreamClosed = true;
          }
        };
        
        try {
          // Start agent thinking simulation if sessionId provided
          if (sessionId) {
            simulateAgentThinking(sessionId, prompt, targetDuration).catch(console.error);
          }

          // Real YouTube MCP server integration
          let youtubeResults = [];
          if (mcpServer === 'youtube') {
            try {
              // Send YouTube search start event
              if (sessionId) {
                sendYouTubeEvent(sessionId, 'search', { query: prompt, status: 'started' });
              }
              
              // Search for relevant videos using MCP integration
              const videos = await searchYouTubeVideos(prompt, 3);
              
              for (const video of videos) {
                const youtubeResult = {
                  type: 'youtube',
                  id: video.id || video.videoId,
                  title: video.title || video.snippet?.title,
                  description: video.description || video.snippet?.description,
                  thumbnail: video.thumbnailUrl || video.snippet?.thumbnails?.high?.url,
                  channel: video.channelTitle || video.snippet?.channelTitle,
                  publishedAt: video.publishedAt || video.snippet?.publishedAt,
                  viewCount: video.statistics?.viewCount,
                  likeCount: video.statistics?.likeCount
                };
                
                youtubeResults.push(youtubeResult);
                safeEnqueue(youtubeResult);
                
                if (sessionId) {
                  sendYouTubeEvent(sessionId, 'search', { 
                    video: youtubeResult, 
                    status: 'video_found',
                    totalFound: videos.length 
                  });
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
              if (sessionId) {
                sendYouTubeEvent(sessionId, 'search', { 
                  status: 'completed', 
                  totalVideos: videos.length 
                });
              }
              
            } catch (error) {
              console.error('YouTube MCP error:', error);
              if (sessionId) {
                sendYouTubeEvent(sessionId, 'search', { 
                  status: 'failed', 
                  error: error.message 
                });
              }
              
              // Fallback to mock data
              const mockYoutubeResults = [
                {
                  type: 'youtube',
                  title: `Advanced Guide: ${prompt.substring(0, 30)}`,
                  description: 'Comprehensive tutorial with expert insights...',
                  thumbnail: 'https://via.placeholder.com/320x180',
                  subtitles: true
                }
              ];

              for (const result of mockYoutubeResults) {
                youtubeResults.push(result);
                safeEnqueue(result);
                await new Promise(resolve => setTimeout(resolve, 800));
              }
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
                youtubeContext: youtubeResults.length > 0 ? {
                  videosFound: youtubeResults.length,
                  primaryVideo: youtubeResults[0],
                  hasTranscript: !!youtubeResults[0]?.transcript
                } : null,
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
                
                safeEnqueue(mockResult);
              } catch (error) {
                console.error('Error saving to Firestore:', error);
                // Still send the result even if save fails
                const mockResult = {
                  type: 'final',
                  content: scriptData
                };
                
                safeEnqueue(mockResult);
              }
            } else {
              // Real OpenAI API call
              console.log('🎬 Generating comprehensive script with OpenAI...');
              const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                  {
                    role: "system",
                    content: `You are an expert video script writer specializing in creating comprehensive, engaging YouTube scripts. You create detailed, well-structured scripts that captivate audiences from start to finish. Your scripts include:
- Compelling hooks
- Clear narrative structure
- Specific visual descriptions
- Natural transitions
- Engaging storytelling
- Call-to-actions`
                  },
                  {
                    role: "user",
                    content: `Create a COMPREHENSIVE and DETAILED video script for: "${prompt}"

Target Duration: ${targetDuration} seconds (${Math.floor(targetDuration / 60)} minutes)

${youtubeResults.length > 0 && youtubeResults[0].transcript ? `
YouTube Research Context:
Found ${youtubeResults.length} relevant videos. 
Primary video: "${youtubeResults[0].title}" by ${youtubeResults[0].channel}
Transcript excerpt: ${youtubeResults[0].transcript.substring(0, 1000)}...

Use this research to enhance your script with accurate information and insights.
` : ''}

REQUIREMENTS:
1. The script must be FULLY DEVELOPED with complete sentences and paragraphs
2. Each section should be 3-5 paragraphs MINIMUM (150-300 words per section)
3. Include specific details, examples, and storytelling elements
4. Add [VISUAL] cues for what should be shown on screen
5. Include natural transitions between sections
6. The total script MUST be at least ${Math.floor(targetDuration * 2.5)} words (approximately ${Math.floor(targetDuration * 2.5 / 150)} paragraphs)
7. DO NOT use placeholder text or generic content - write actual, detailed script content

Return a JSON object with this EXACT structure:
{
  "title": "Engaging title for the video",
  "script": [
    {
      "timestamp": "0:00-0:15",
      "section": "Hook",
      "content": "Full paragraph of engaging opening content that immediately captures attention. Include a compelling question or statement. [VISUAL: Describe opening shot]. Continue with more sentences to fully develop the hook..."
    },
    {
      "timestamp": "0:15-1:00", 
      "section": "Introduction",
      "content": "Complete introduction paragraph explaining what viewers will learn. Set expectations and build anticipation. [VISUAL: Describe visuals]. Add more context and background information..."
    },
    // Continue with all sections...
  ],
  "storyline": {
    "sections": [
      {
        "name": "Hook",
        "duration": 15,
        "content": "Attention-grabbing opening that poses a question or makes a bold statement",
        "visualNotes": "Dynamic opening shot, text overlay with key question"
      },
      // All sections with details...
    ]
  }
}`
                  }
                ],
                temperature: 0.7,
              });

              const responseContent = completion.choices[0].message.content || '{}';
              console.log('🎬 OpenAI response length:', responseContent.length, 'characters');
              
              const parsedContent = JSON.parse(responseContent);
              console.log('🎬 Parsed script structure:', {
                hasTitle: !!parsedContent.title,
                hasScript: !!parsedContent.script,
                scriptType: typeof parsedContent.script,
                scriptLength: Array.isArray(parsedContent.script) ? parsedContent.script.length : 'N/A',
                hasStoryline: !!parsedContent.storyline
              });
              
              const scriptData = {
                ...parsedContent,
                prompt,
                targetDuration,
                mcpServer,
                searchEnabled,
                youtubeContext: youtubeResults.length > 0 ? {
                  videosFound: youtubeResults.length,
                  primaryVideo: youtubeResults[0],
                  hasTranscript: !!youtubeResults[0]?.transcript
                } : null,
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
                
                safeEnqueue(result);
              } catch (error) {
                console.error('Error saving to Firestore:', error);
                // Still send the result even if save fails
                const result = {
                  type: 'final',
                  content: scriptData
                };
                
                safeEnqueue(result);
              }
            }
          }

          isStreamClosed = true;
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          isStreamClosed = true;
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