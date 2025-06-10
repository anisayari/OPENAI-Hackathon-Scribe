import { Agent } from '@openai/agents';
import { mockScripts } from '../mock-data';
import { createYouTubeCaptionsClient, YouTubeCaptionsClient } from '../mcp/youtube-captions-client';

// Type definitions for agent events
export interface AgentThought {
  agentName: string;
  thought: string;
  timestamp: number;
  type: 'reasoning' | 'action' | 'observation' | 'decision';
}

export interface AgentAction {
  agentName: string;
  action: string;
  parameters: any;
  timestamp: number;
}

// Event emitter for real-time updates
export class AgentEventEmitter {
  private handlers: Map<string, ((data: any) => void)[]> = new Map();

  on(event: string, handler: (data: any) => void) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  emit(event: string, data: any) {
    const eventHandlers = this.handlers.get(event) || [];
    eventHandlers.forEach(handler => handler(data));
  }

  off(event: string, handler: (data: any) => void) {
    const eventHandlers = this.handlers.get(event) || [];
    const index = eventHandlers.indexOf(handler);
    if (index > -1) {
      eventHandlers.splice(index, 1);
    }
  }
}

// Script Research Agent
export const createResearchAgent = (emitter: AgentEventEmitter, youtubeClient?: YouTubeCaptionsClient) => {
  const ytClient = youtubeClient || createYouTubeCaptionsClient();
  const agent = new Agent({
    name: "Research Agent",
    instructions: `You are a research specialist for video script creation. Your role is to:
    1. Analyze the user's video topic and requirements
    2. Search for relevant information from various sources
    3. Identify key facts, statistics, and interesting angles
    4. Provide comprehensive research that will inform the script
    
    Always think step-by-step and explain your reasoning process.`,
    tools: [
      {
        name: "search_youtube",
        description: "Search YouTube for relevant videos and content",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query for YouTube" },
            max_results: { type: "number", description: "Maximum number of results" }
          },
          required: ["query"]
        },
        handler: async ({ query, max_results = 5 }) => {
          emitter.emit('thought', {
            agentName: 'Research Agent',
            thought: `Searching YouTube for "${query}" to find relevant video content...`,
            timestamp: Date.now(),
            type: 'action'
          });

          try {
            const videos = await ytClient.searchVideos(query, max_results);
            
            emitter.emit('thought', {
              agentName: 'Research Agent',
              thought: `Found ${videos.length} relevant YouTube videos. Analyzing content patterns...`,
              timestamp: Date.now(),
              type: 'observation'
            });

            return videos.map(video => ({
              id: video.id,
              title: video.title,
              views: video.viewCount || 'N/A',
              channel: video.channelTitle,
              description: video.description,
              thumbnailUrl: video.thumbnailUrl,
              publishedAt: video.publishedAt,
              duration: video.duration
            }));
          } catch (error) {
            emitter.emit('thought', {
              agentName: 'Research Agent',
              thought: `YouTube search failed: ${error.message}. Using fallback data...`,
              timestamp: Date.now(),
              type: 'observation'
            });

            // Fallback to mock data
            const mockResults = [
              { title: `Introduction to ${query}`, views: '1.2M', channel: 'TechExplained' },
              { title: `${query}: Complete Guide`, views: '800K', channel: 'LearnHub' },
              { title: `The Future of ${query}`, views: '500K', channel: 'FutureTech' }
            ];

            return mockResults;
          }
        }
      },
      {
        name: "get_youtube_captions",
        description: "Get captions and transcript from a YouTube video",
        parameters: {
          type: "object",
          properties: {
            video_id: { type: "string", description: "YouTube video ID" },
            analyze: { type: "boolean", description: "Whether to analyze the content" }
          },
          required: ["video_id"]
        },
        handler: async ({ video_id, analyze = false }) => {
          emitter.emit('thought', {
            agentName: 'Research Agent',
            thought: `Fetching captions for YouTube video: ${video_id}...`,
            timestamp: Date.now(),
            type: 'action'
          });

          try {
            const captionsData = await ytClient.getVideoWithCaptions(video_id);
            
            emitter.emit('thought', {
              agentName: 'Research Agent',
              thought: `Retrieved ${captionsData.captions.length} caption segments (${captionsData.fullTranscript.length} characters)`,
              timestamp: Date.now(),
              type: 'observation'
            });

            let analysis = null;
            if (analyze) {
              emitter.emit('thought', {
                agentName: 'Research Agent',
                thought: 'Analyzing video content for key insights...',
                timestamp: Date.now(),
                type: 'action'
              });

              const analysisPrompt = `Analyze this YouTube video transcript and extract key insights for script creation:
Title: ${captionsData.video.title}
Channel: ${captionsData.video.channelTitle}

Transcript: ${captionsData.fullTranscript}

Provide:
1. Main topics and themes
2. Interesting facts or statistics mentioned
3. Engaging hooks or storytelling elements
4. Key quotes or memorable moments
5. Content structure and pacing insights`;

              analysis = await ytClient.generateResponse(analysisPrompt);
              
              emitter.emit('thought', {
                agentName: 'Research Agent',
                thought: 'Content analysis completed. Extracted key insights for script development.',
                timestamp: Date.now(),
                type: 'observation'
              });
            }

            return {
              video: captionsData.video,
              transcript: captionsData.fullTranscript,
              captions: captionsData.captions,
              analysis: analysis,
              wordCount: captionsData.fullTranscript.split(' ').length,
              duration: captionsData.captions.length > 0 ? 
                Math.max(...captionsData.captions.map(c => c.start + c.duration)) : 0
            };
          } catch (error) {
            emitter.emit('thought', {
              agentName: 'Research Agent',
              thought: `Failed to fetch captions: ${error.message}`,
              timestamp: Date.now(),
              type: 'observation'
            });

            return {
              error: error.message,
              video_id: video_id
            };
          }
        }
      },
      {
        name: "search_web",
        description: "Search the web for information",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            source_type: { type: "string", enum: ["general", "academic", "news"], description: "Type of sources to search" }
          },
          required: ["query"]
        },
        handler: async ({ query, source_type = "general" }) => {
          emitter.emit('thought', {
            agentName: 'Research Agent',
            thought: `Searching ${source_type} sources for "${query}"...`,
            timestamp: Date.now(),
            type: 'action'
          });

          await new Promise(resolve => setTimeout(resolve, 800));

          const mockWebResults = {
            general: [
              { title: `${query} - Wikipedia`, snippet: 'Comprehensive overview and history...' },
              { title: `Understanding ${query}`, snippet: 'Expert analysis and insights...' }
            ],
            academic: [
              { title: `Research Paper: ${query} Impact Study`, snippet: 'Peer-reviewed analysis...' },
              { title: `${query}: A Systematic Review`, snippet: 'Academic perspective...' }
            ],
            news: [
              { title: `Latest Developments in ${query}`, snippet: 'Breaking news and updates...' },
              { title: `${query} Market Report 2024`, snippet: 'Industry analysis...' }
            ]
          };

          return mockWebResults[source_type] || mockWebResults.general;
        }
      },
      {
        name: "search_images",
        description: "Search for relevant images for the video script",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query for images" },
            count: { type: "number", description: "Number of images to find" },
            style: { type: "string", description: "Image style preference" }
          },
          required: ["query"]
        },
        handler: async ({ query, count = 5, style = "cinematic" }) => {
          emitter.emit('thought', {
            agentName: 'Research Agent',
            thought: `Searching for ${count} ${style} images related to "${query}"...`,
            timestamp: Date.now(),
            type: 'action'
          });

          // Call the image search API
          try {
            const response = await fetch('/api/ai/search-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query,
                count,
                budget: 'mixed',
                style,
                generateIfNeeded: true
              })
            });

            if (!response.ok) throw new Error('Image search failed');

            const data = await response.json();
            
            emitter.emit('thought', {
              agentName: 'Research Agent',
              thought: `Found ${data.images.length} relevant images. Analyzing visual content...`,
              timestamp: Date.now(),
              type: 'observation'
            });

            return data.images;
          } catch (error) {
            emitter.emit('thought', {
              agentName: 'Research Agent',
              thought: `Image search encountered an error. Using fallback approach...`,
              timestamp: Date.now(),
              type: 'observation'
            });
            
            // Return mock data as fallback
            return [
              { url: 'https://via.placeholder.com/1920x1080', title: `${query} visual 1`, source: 'placeholder' },
              { url: 'https://via.placeholder.com/1920x1080', title: `${query} visual 2`, source: 'placeholder' }
            ];
          }
        }
      }
    ]
  });

  return agent;
};

// Script Structure Agent
export const createStructureAgent = (emitter: AgentEventEmitter) => {
  const agent = new Agent({
    name: "Structure Agent",
    instructions: `You are a video script structure specialist. Your role is to:
    1. Analyze research findings and user requirements
    2. Create an optimal script structure (Hook, Acts, Outro)
    3. Allocate time to each section based on the target duration
    4. Ensure proper pacing and audience retention strategies
    
    Focus on creating engaging narratives with strong hooks and clear story arcs.`,
    tools: [
      {
        name: "create_structure",
        description: "Create a video script structure",
        parameters: {
          type: "object",
          properties: {
            topic: { type: "string", description: "Main topic of the video" },
            duration: { type: "number", description: "Target duration in seconds" },
            style: { type: "string", description: "Video style (educational, entertainment, etc.)" }
          },
          required: ["topic", "duration"]
        },
        handler: async ({ topic, duration, style = "educational" }) => {
          emitter.emit('thought', {
            agentName: 'Structure Agent',
            thought: `Creating a ${style} script structure for "${topic}" with ${duration}s duration...`,
            timestamp: Date.now(),
            type: 'reasoning'
          });

          await new Promise(resolve => setTimeout(resolve, 1000));

          const structure = {
            hook: { duration: Math.floor(duration * 0.1), content: "Attention-grabbing opening" },
            act1: { duration: Math.floor(duration * 0.25), content: "Setup and context" },
            act2: { duration: Math.floor(duration * 0.35), content: "Main content and development" },
            act3: { duration: Math.floor(duration * 0.25), content: "Climax and resolution" },
            outro: { duration: Math.floor(duration * 0.05), content: "Call to action and closing" }
          };

          emitter.emit('thought', {
            agentName: 'Structure Agent',
            thought: `Structure created with Hook (${structure.hook.duration}s), 3 Acts, and Outro (${structure.outro.duration}s)`,
            timestamp: Date.now(),
            type: 'decision'
          });

          return structure;
        }
      }
    ]
  });

  return agent;
};

// Script Writing Agent
export const createWritingAgent = (emitter: AgentEventEmitter) => {
  const agent = new Agent({
    name: "Writing Agent",
    instructions: `You are a professional video script writer. Your role is to:
    1. Transform research and structure into compelling script content
    2. Write engaging, conversational dialogue
    3. Include visual cues and transitions
    4. Optimize for viewer retention and engagement
    
    Write in a style that's appropriate for the target audience and platform.`,
    tools: [
      {
        name: "write_section",
        description: "Write a specific section of the script",
        parameters: {
          type: "object",
          properties: {
            section: { type: "string", description: "Section name (hook, act1, etc.)" },
            content_brief: { type: "string", description: "Brief about what to include" },
            duration: { type: "number", description: "Duration for this section" }
          },
          required: ["section", "content_brief", "duration"]
        },
        handler: async ({ section, content_brief, duration }) => {
          emitter.emit('thought', {
            agentName: 'Writing Agent',
            thought: `Writing ${section} section (${duration}s): ${content_brief}`,
            timestamp: Date.now(),
            type: 'action'
          });

          await new Promise(resolve => setTimeout(resolve, 1200));

          // Generate mock script content
          const scriptContent = {
            text: `[${section.toUpperCase()}] Sample script content for ${content_brief}...`,
            visualCues: ['Show relevant visuals', 'Transition effect'],
            duration: duration
          };

          emitter.emit('thought', {
            agentName: 'Writing Agent',
            thought: `Completed ${section} section with ${Math.floor(duration * 2.5)} words`,
            timestamp: Date.now(),
            type: 'observation'
          });

          return scriptContent;
        }
      },
      {
        name: "suggest_visuals",
        description: "Suggest visual elements and images for script sections",
        parameters: {
          type: "object",
          properties: {
            section: { type: "string", description: "Section of the script" },
            content: { type: "string", description: "Script content for the section" },
            imageUrls: { type: "array", items: { type: "string" }, description: "Available image URLs" }
          },
          required: ["section", "content"]
        },
        handler: async ({ section, content, imageUrls = [] }) => {
          emitter.emit('thought', {
            agentName: 'Writing Agent',
            thought: `Suggesting visual elements for ${section} section...`,
            timestamp: Date.now(),
            type: 'reasoning'
          });

          await new Promise(resolve => setTimeout(resolve, 500));

          const visualSuggestions = {
            section,
            suggestions: [
              {
                timestamp: "0:00-0:05",
                visual: imageUrls[0] || "Opening shot",
                description: "Establishing visual to grab attention"
              },
              {
                timestamp: "0:05-0:15",
                visual: imageUrls[1] || "Main subject",
                description: "Introduce main visual element"
              }
            ],
            transitionEffects: ["Fade in", "Cross dissolve"],
            imageCount: imageUrls.length
          };

          emitter.emit('thought', {
            agentName: 'Writing Agent',
            thought: `Created ${visualSuggestions.suggestions.length} visual suggestions with ${imageUrls.length} available images`,
            timestamp: Date.now(),
            type: 'observation'
          });

          return visualSuggestions;
        }
      }
    ]
  });

  return agent;
};

// Coordinator Agent (Main orchestrator)
export const createCoordinatorAgent = (emitter: AgentEventEmitter, youtubeClient?: YouTubeCaptionsClient) => {
  const researchAgent = createResearchAgent(emitter, youtubeClient);
  const structureAgent = createStructureAgent(emitter);
  const writingAgent = createWritingAgent(emitter);

  const agent = new Agent({
    name: "Coordinator Agent",
    instructions: `You are the lead coordinator for video script creation. Your role is to:
    1. Understand the user's requirements
    2. Delegate tasks to specialized agents (Research, Structure, Writing)
    3. Coordinate the workflow between agents
    4. Ensure quality and coherence in the final script
    
    Think step-by-step and explain your coordination decisions.`,
    tools: [
      {
        name: "analyze_requirements",
        description: "Analyze user requirements for script creation",
        parameters: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "User's video idea/prompt" },
            duration: { type: "number", description: "Target duration" }
          },
          required: ["prompt"]
        },
        handler: async ({ prompt, duration = 180 }) => {
          emitter.emit('thought', {
            agentName: 'Coordinator Agent',
            thought: `Analyzing requirements: "${prompt}" for ${duration}s video`,
            timestamp: Date.now(),
            type: 'reasoning'
          });

          // Extract key information
          const analysis = {
            topic: prompt.split('.')[0],
            keyPoints: prompt.match(/[^.!?]+[.!?]+/g) || [prompt],
            estimatedSections: 5,
            suggestedStyle: prompt.toLowerCase().includes('tutorial') ? 'tutorial' : 'educational'
          };

          emitter.emit('thought', {
            agentName: 'Coordinator Agent',
            thought: `Identified topic: "${analysis.topic}", style: ${analysis.suggestedStyle}`,
            timestamp: Date.now(),
            type: 'decision'
          });

          return analysis;
        }
      }
    ],
    handoffs: [
      {
        name: "delegate_to_research",
        description: "Hand off to Research Agent for information gathering",
        target: researchAgent,
        handler: async (context) => {
          emitter.emit('thought', {
            agentName: 'Coordinator Agent',
            thought: 'Delegating to Research Agent for comprehensive information gathering...',
            timestamp: Date.now(),
            type: 'action'
          });
          return context;
        }
      },
      {
        name: "delegate_to_structure",
        description: "Hand off to Structure Agent for script organization",
        target: structureAgent,
        handler: async (context) => {
          emitter.emit('thought', {
            agentName: 'Coordinator Agent',
            thought: 'Delegating to Structure Agent for optimal script organization...',
            timestamp: Date.now(),
            type: 'action'
          });
          return context;
        }
      },
      {
        name: "delegate_to_writing",
        description: "Hand off to Writing Agent for content creation",
        target: writingAgent,
        handler: async (context) => {
          emitter.emit('thought', {
            agentName: 'Coordinator Agent',
            thought: 'Delegating to Writing Agent for script content creation...',
            timestamp: Date.now(),
            type: 'action'
          });
          return context;
        }
      }
    ]
  });

  return agent;
};