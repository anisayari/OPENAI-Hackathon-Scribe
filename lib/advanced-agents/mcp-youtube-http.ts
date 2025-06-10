import { Tool } from '@openai/agents';
import { createSimpleMCPTool } from './simple-mcp-tool';

const MCP_SERVER_URL = 'https://youtube-mcp-server.anis-ayari-perso.workers.dev';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface MCPResponse {
  result?: any;
  error?: any;
}

class YouTubeMCPClient {
  private tools: MCPTool[] = [];

  async initialize(): Promise<void> {
    try {
      console.log('[MCP YouTube] Fetching tools from:', `${MCP_SERVER_URL}/mcp`);
      const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'tools/list' })
      });

      console.log('[MCP YouTube] Response status:', response.status);
      const data = await response.json() as MCPResponse;
      console.log('[MCP YouTube] Response data:', JSON.stringify(data).substring(0, 200));
      
      if (data.error) {
        throw new Error(`MCP Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      // Handle both response formats
      this.tools = data.result?.tools || data.tools || [];
      console.log(`[MCP YouTube] Loaded ${this.tools.length} tools from server`);
      if (this.tools.length > 0) {
        console.log('[MCP YouTube] Tool names:', this.tools.map(t => t.name));
      }
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

      const data = await response.json() as MCPResponse;
      
      if (data.error) {
        throw new Error(`MCP Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      return data.result;
    } catch (error) {
      console.error(`[MCP YouTube] Error calling tool ${toolName}:`, error);
      throw error;
    }
  }

  getTools(): MCPTool[] {
    return this.tools;
  }
}

// Create YouTube-specific tools for the research agent
export async function createYouTubeMCPTools(): Promise<Tool[]> {
  try {
    console.log('[MCP YouTube] Initializing YouTube MCP client...');
    const client = new YouTubeMCPClient();
    await client.initialize();
    
    const mcpTools = client.getTools();
    console.log('[MCP YouTube] Available tools:', mcpTools.map(t => t.name));
    
    // Convert MCP tools to OpenAI Agent tools
    // For research, we'll focus on the most relevant tools
    const researchRelevantTools = [
      'search_youtube_videos',
      'analyze_video_landscape',
      'extract_youtube_seo',
      'analyze_video_comments'
    ];
    
    const filteredTools = mcpTools.filter(tool => researchRelevantTools.includes(tool.name));
    console.log('[MCP YouTube] Creating tools for:', filteredTools.map(t => t.name));
    
    const createdTools = filteredTools.map(mcpTool => {
      const tool = createSimpleMCPTool(mcpTool, client);
      console.log(`[MCP YouTube] Created tool:`, {
        type: tool.type,
        functionName: tool.function?.name,
        hasParameters: !!tool.function?.parameters
      });
      return tool;
    });
    
    return createdTools;
  } catch (error) {
    console.warn('[MCP YouTube] Failed to initialize YouTube MCP tools:', error);
    return [];
  }
}