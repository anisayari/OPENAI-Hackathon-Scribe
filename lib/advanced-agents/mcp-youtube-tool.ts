import { Tool } from '@openai/agents';
import { createYouTubeCaptionsClient } from '../mcp/youtube-captions-client';

export function youtubeTool(): Tool {
  const client = createYouTubeCaptionsClient();
  
  return {
    name: 'youtube_search',
    description: 'Search YouTube videos and get their transcripts for research purposes',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query for YouTube videos'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of videos to search (default: 3)',
          default: 3
        }
      },
      required: ['query']
    },
    execute: async (args: { query: string; maxResults?: number }) => {
      try {
        console.log('[YouTube Tool] Searching for:', args.query);
        
        // Search for videos
        const videos = await client.searchVideos(args.query, args.maxResults || 3);
        
        if (videos.length === 0) {
          return {
            success: false,
            message: 'No YouTube videos found for this query'
          };
        }
        
        // Get transcripts for found videos
        const results = [];
        for (const video of videos) {
          try {
            const captionsData = await client.getVideoWithCaptions(video.id);
            results.push({
              title: video.title,
              url: `https://youtube.com/watch?v=${video.id}`,
              channel: video.channelTitle,
              publishedAt: video.publishedAt,
              transcript: captionsData.fullTranscript.substring(0, 2000) + '...' // Limit transcript length
            });
          } catch (error) {
            console.warn(`Failed to get captions for video ${video.id}:`, error);
          }
        }
        
        return {
          success: true,
          videos: results
        };
      } catch (error) {
        console.error('[YouTube Tool] Error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  };
}