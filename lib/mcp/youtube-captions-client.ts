import { EventEmitter } from 'events';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelTitle: string;
  duration?: string;
  viewCount?: string;
}

export interface YouTubeCaption {
  text: string;
  start: number;
  duration: number;
}

export interface YouTubeCaptionsResponse {
  video: YouTubeVideo;
  captions: YouTubeCaption[];
  fullTranscript: string;
}

export interface MCPServerConfig {
  baseUrl: string;
  apiKey?: string;
}

export class YouTubeCaptionsClient extends EventEmitter {
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    super();
    this.config = config;
  }

  async searchVideos(query: string, maxResults: number = 5): Promise<YouTubeVideo[]> {
    try {
      this.emit('search:start', { query, maxResults });
      
      console.warn('[YouTubeCaptionsClient] This client is deprecated. Use MCP integration instead.');
      
      const response = await fetch(`${this.config.baseUrl}/youtube_captions?query=${encodeURIComponent(query)}&max_results=${maxResults}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      });

      if (!response.ok) {
        console.warn(`YouTube MCP server not available (${response.status}), skipping YouTube search`);
        this.emit('search:warning', { status: response.status, message: 'YouTube MCP server unavailable' });
        return []; // Return empty array instead of throwing
      }

      const data = await response.json();
      this.emit('search:complete', { videos: data.videos });
      
      return data.videos || [];
    } catch (error) {
      console.warn('YouTube search failed, continuing without YouTube data:', error);
      this.emit('search:warning', { error });
      return []; // Return empty array instead of throwing
    }
  }

  async getVideoWithCaptions(videoId: string): Promise<YouTubeCaptionsResponse> {
    try {
      this.emit('captions:start', { videoId });
      
      const response = await fetch(`${this.config.baseUrl}/youtube_captions/${videoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch captions: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process captions into full transcript
      const fullTranscript = data.captions
        .map((caption: YouTubeCaption) => caption.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const result = {
        video: data.video,
        captions: data.captions,
        fullTranscript
      };

      this.emit('captions:complete', result);
      return result;
    } catch (error) {
      this.emit('captions:error', { error, videoId });
      throw error;
    }
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    try {
      this.emit('generate:start', { prompt });
      
      const requestBody = {
        prompt,
        ...(context && { context })
      };

      const response = await fetch(`${this.config.baseUrl}/openai_response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`OpenAI response generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.emit('generate:complete', { response: data.response });
      
      return data.response;
    } catch (error) {
      this.emit('generate:error', { error });
      throw error;
    }
  }

  async searchAndAnalyzeVideo(query: string): Promise<{
    video: YouTubeVideo;
    transcript: string;
    analysis: string;
  }> {
    try {
      // Search for videos
      const videos = await this.searchVideos(query, 1);
      
      if (videos.length === 0) {
        throw new Error('No videos found for the given query');
      }

      const video = videos[0];
      
      // Get captions
      const captionsData = await this.getVideoWithCaptions(video.id);
      
      // Generate analysis
      const analysisPrompt = `Analyze this YouTube video transcript and provide key insights:
Title: ${video.title}
Channel: ${video.channelTitle}

Transcript: ${captionsData.fullTranscript}

Please provide:
1. Main topics covered
2. Key takeaways
3. Interesting quotes or moments
4. Overall summary`;

      const analysis = await this.generateResponse(analysisPrompt);

      return {
        video,
        transcript: captionsData.fullTranscript,
        analysis
      };
    } catch (error) {
      this.emit('analyze:error', { error });
      throw error;
    }
  }
}

// Factory function to create client with environment variables
export function createYouTubeCaptionsClient(baseUrl?: string): YouTubeCaptionsClient {
  const config: MCPServerConfig = {
    baseUrl: baseUrl || process.env.YOUTUBE_MCP_SERVER_URL || 'https://youtube-mcp-server.anis-ayari-perso.workers.dev',
    apiKey: process.env.YOUTUBE_MCP_API_KEY
  };

  return new YouTubeCaptionsClient(config);
}