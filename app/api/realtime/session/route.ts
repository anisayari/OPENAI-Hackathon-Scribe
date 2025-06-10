import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { instructions, voice = 'alloy', temperature = 0.8 } = body;

    // Call OpenAI API to create a session
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        modalities: ['text', 'audio'],
        instructions: instructions || 'You are a helpful assistant specializing in video script creation and analysis.',
        voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        temperature,
        max_response_output_tokens: 4096,
        tools: [
          {
            type: 'function',
            name: 'analyze_script_requirements',
            description: 'Analyze the user requirements for script creation',
            parameters: {
              type: 'object',
              properties: {
                topic: { type: 'string', description: 'Main topic of the video' },
                duration: { type: 'number', description: 'Target duration in seconds' },
                style: { type: 'string', description: 'Video style (educational, entertainment, etc.)' },
                key_points: { type: 'array', items: { type: 'string' }, description: 'Key points to cover' }
              },
              required: ['topic']
            }
          },
          {
            type: 'function',
            name: 'search_resources',
            description: 'Search for resources and information about a topic',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                source: { type: 'string', enum: ['youtube', 'web', 'academic'], description: 'Source to search' }
              },
              required: ['query', 'source']
            }
          },
          {
            type: 'function',
            name: 'generate_script_section',
            description: 'Generate a specific section of the video script',
            parameters: {
              type: 'object',
              properties: {
                section: { type: 'string', enum: ['hook', 'introduction', 'body', 'conclusion'], description: 'Section to generate' },
                content: { type: 'string', description: 'Content for the section' },
                duration_seconds: { type: 'number', description: 'Duration for this section' }
              },
              required: ['section', 'content']
            }
          }
        ],
        tool_choice: 'auto'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      sessionId: data.id,
      clientSecret: data.client_secret,
      session: data
    });
  } catch (error) {
    console.error('Error creating realtime session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}