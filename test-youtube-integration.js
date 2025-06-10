// Simple test script to verify YouTube MCP integration
const { createYouTubeCaptionsClient } = require('./lib/mcp/youtube-captions-client');

async function testYouTubeIntegration() {
  console.log('🚀 Testing YouTube MCP Server Integration...\n');
  
  // Test with a localhost MCP server (you need to run the Rails server)
  const client = createYouTubeCaptionsClient('http://localhost:3000');
  
  try {
    console.log('1. Testing YouTube search...');
    const videos = await client.searchVideos('artificial intelligence', 2);
    console.log(`✅ Found ${videos.length} videos`);
    videos.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title} by ${video.channelTitle}`);
    });
    
    if (videos.length > 0) {
      console.log('\n2. Testing caption retrieval...');
      const captionsData = await client.getVideoWithCaptions(videos[0].id);
      console.log(`✅ Retrieved ${captionsData.captions.length} caption segments`);
      console.log(`   Transcript length: ${captionsData.fullTranscript.length} characters`);
      console.log(`   Preview: ${captionsData.fullTranscript.substring(0, 100)}...`);
      
      console.log('\n3. Testing content analysis...');
      const analysis = await client.generateResponse(
        `Summarize the key points from this video transcript: ${captionsData.fullTranscript.substring(0, 500)}`
      );
      console.log(`✅ Generated analysis (${analysis.length} characters)`);
      console.log(`   Preview: ${analysis.substring(0, 150)}...`);
    }
    
    console.log('\n✅ YouTube MCP integration test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Make sure your YouTube MCP Rails server is running on http://localhost:3000');
    console.log('   And that you have set YOUTUBE_API_KEY and OPENAI_ACCESS_TOKEN environment variables');
  }
}

// Run the test
if (require.main === module) {
  testYouTubeIntegration();
}

module.exports = { testYouTubeIntegration };