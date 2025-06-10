async function testMCPConnection() {
  const MCP_SERVER_URL = 'https://youtube-mcp-server.anis-ayari-perso.workers.dev';
  
  try {
    console.log('Testing MCP server connection...');
    
    // Test tools/list endpoint
    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'tools/list' })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed data:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
    
  } catch (error) {
    console.error('Connection error:', error);
  }
}

testMCPConnection();