// Simple tool creator that follows OpenAI's function calling format
export function createSimpleMCPTool(mcpTool: any, client: any) {
  return {
    type: "function" as const,
    function: {
      name: mcpTool.name,
      description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
      parameters: mcpTool.inputSchema || {
        type: "object",
        properties: {},
        required: []
      },
      parse: JSON.parse,
      function: async (argsJson: string) => {
        try {
          const args = JSON.parse(argsJson);
          console.log(`[MCP Tool] Calling ${mcpTool.name} with:`, args);
          const result = await client.callTool(mcpTool.name, args);
          console.log(`[MCP Tool] ${mcpTool.name} result:`, result);
          return JSON.stringify(result);
        } catch (error) {
          console.error(`[MCP Tool] Error in ${mcpTool.name}:`, error);
          return JSON.stringify({ error: error.message });
        }
      }
    }
  };
}