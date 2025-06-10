import { Tool } from '@openai/agents';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

// Create a hosted tool wrapper for MCP tools
export function createHostedTool(mcpTool: MCPTool, callToolFn: (name: string, args: any) => Promise<any>): Tool {
  return {
    type: 'hosted_tool',
    name: mcpTool.name,
    // Store the actual function reference in a way the agent can use
    _mcpCallTool: async (args: any) => {
      console.log(`[MCP Tool] Calling ${mcpTool.name} with:`, args);
      const result = await callToolFn(mcpTool.name, args);
      console.log(`[MCP Tool] ${mcpTool.name} returned:`, result);
      return result;
    },
    // Include metadata for the agent
    _description: mcpTool.description,
    _parameters: mcpTool.inputSchema
  } as any;
}

// Alternative: Create a function tool if hosted doesn't work
export function createFunctionTool(mcpTool: MCPTool, callToolFn: (name: string, args: any) => Promise<any>): Tool {
  // Create the function object first
  const functionDef = {
    name: mcpTool.name,
    description: mcpTool.description,
    parameters: mcpTool.inputSchema,
    parse: JSON.parse,
    function: async (argsString: string) => {
      const args = JSON.parse(argsString);
      const result = await callToolFn(mcpTool.name, args);
      return JSON.stringify(result);
    }
  };

  // Return the proper tool structure with name at the top level
  return {
    type: 'function',
    name: mcpTool.name,  // Add name at top level
    function: functionDef
  } as any;
}