import { YouTubeMCPClient } from './mcp-youtube-http';

const MCP_SERVER_URL = 'https://youtube-mcp-server.anis-ayari-perso.workers.dev';

let mcpClient: YouTubeMCPClient | null = null;

async function getMCPClient(): Promise<YouTubeMCPClient> {
  if (!mcpClient) {
    console.log('[YouTube MCP Helper] Initializing MCP client...');
    const client = new YouTubeMCPClient();
    await client.initialize();
    mcpClient = client;
  }
  return mcpClient;
}

export async function searchYouTubeVideos(query: string, maxResults: number = 5): Promise<any[]> {
  try {
    const client = await getMCPClient();
    const result = await client.callTool('search_youtube_videos', {
      query,
      maxResults
    });
    
    // Handle different response formats
    if (result?.videos) {
      return result.videos;
    } else if (result?.items) {
      return result.items;
    } else if (Array.isArray(result)) {
      return result;
    }
    
    return [];
  } catch (error) {
    console.error('[YouTube MCP Helper] Search error:', error);
    return [];
  }
}

export async function analyzeVideoLandscape(query: string): Promise<any> {
  try {
    const client = await getMCPClient();
    return await client.callTool('analyze_video_landscape', {
      query,
      maxVideos: 10
    });
  } catch (error) {
    console.error('[YouTube MCP Helper] Analyze landscape error:', error);
    return null;
  }
}

// Export the class for direct use if needed
export { YouTubeMCPClient };

// Also create the class definition here to avoid import issues
class YouTubeMCPClient {
  private tools: any[] = [];

  async initialize(): Promise<void> {
    try {
      console.log('[MCP YouTube] Fetching tools from:', `${MCP_SERVER_URL}/mcp`);
      const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'tools/list' })
      });

      console.log('[MCP YouTube] Response status:', response.status);
      const data = await response.json();
      
      // Handle both response formats
      this.tools = data.result?.tools || data.tools || [];
      console.log(`[MCP YouTube] Loaded ${this.tools.length} tools from server`);
    } catch (error) {
      console.error('[MCP YouTube] Failed to initialize:', error);
      throw error;
    }
  }

  async callTool(toolName: string, args: any): Promise<any> {
    try {
      const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`MCP Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      return data.result;
    } catch (error) {
      console.error(`[MCP YouTube] Error calling tool ${toolName}:`, error);
      throw error;
    }
  }

  getTools(): any[] {
    return this.tools;
  }
}