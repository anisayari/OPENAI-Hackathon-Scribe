import { spawn } from 'child_process';
import { Tool } from '@openai/agents';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface MCPResponse {
  type: string;
  tools?: MCPTool[];
  result?: any;
  error?: string;
}

class MCPServerStdio {
  private process: any;
  private tools: MCPTool[] = [];
  private responseHandlers: Map<string, (response: any) => void> = new Map();
  private messageId = 0;

  constructor(private command: string, private args: string[]) {}

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(this.command, this.args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            this.handleResponse(response);
          } catch (error) {
            console.warn('Failed to parse MCP response:', line);
          }
        }
      });

      this.process.stderr.on('data', (data: Buffer) => {
        console.error('MCP Server error:', data.toString());
      });

      this.process.on('error', (error: Error) => {
        console.error('Failed to start MCP server:', error);
        reject(error);
      });

      // Initialize and list tools
      this.sendRequest('initialize', {}).then(() => {
        return this.sendRequest('tools/list', {});
      }).then((response) => {
        this.tools = response.tools || [];
        console.log(`[MCP] Loaded ${this.tools.length} tools from server`);
        resolve();
      }).catch(reject);
    });
  }

  private handleResponse(response: any): void {
    const id = response.id;
    if (id && this.responseHandlers.has(id)) {
      const handler = this.responseHandlers.get(id)!;
      this.responseHandlers.delete(id);
      handler(response);
    }
  }

  private sendRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = String(++this.messageId);
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.responseHandlers.set(id, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      });

      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async callTool(toolName: string, args: any): Promise<any> {
    return this.sendRequest('tools/call', {
      name: toolName,
      arguments: args
    });
  }

  getTools(): MCPTool[] {
    return this.tools;
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
    }
  }
}

export async function createYouTubeMCPTools(): Promise<Tool[]> {
  try {
    // Check if YouTube MCP server is configured
    const mcpCommand = process.env.YOUTUBE_MCP_COMMAND || 'npx';
    const mcpArgs = process.env.YOUTUBE_MCP_ARGS?.split(' ') || ['-y', '@modelcontextprotocol/server-youtube'];
    
    console.log('[MCP] Starting YouTube MCP server...');
    const server = new MCPServerStdio(mcpCommand, mcpArgs);
    await server.start();
    
    const mcpTools = server.getTools();
    
    // Convert MCP tools to OpenAI Agent tools
    return mcpTools.map(mcpTool => ({
      name: mcpTool.name,
      description: mcpTool.description,
      parameters: mcpTool.inputSchema,
      execute: async (args: any) => {
        try {
          const result = await server.callTool(mcpTool.name, args);
          return result;
        } catch (error) {
          console.error(`[MCP] Error calling tool ${mcpTool.name}:`, error);
          throw error;
        }
      }
    }));
  } catch (error) {
    console.warn('[MCP] Failed to initialize YouTube MCP server:', error);
    return [];
  }
}