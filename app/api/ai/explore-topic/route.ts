import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { mockScripts } from '@/lib/mock-data';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const { prompt, mcpServer, youtubeKey, targetDuration, searchEnabled, customScripts, testMode } = await request.json();
    
    // Extract a title from the prompt for display purposes
    const title = prompt.split('.')[0].substring(0, 50) + '...';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Simulate MCP server call (replace with actual MCP integration)
          if (mcpServer === 'youtube' && youtubeKey) {
            // Send sample YouTube results in real-time
            const mockYoutubeResults = [
              {
                type: 'youtube',
                title: `Video 1 about ${title.substring(0, 30)}`,
                description: 'Lorem ipsum dolor sit amet...',
                thumbnail: 'https://via.placeholder.com/320x180',
                subtitles: true
              },
              {
                type: 'youtube',
                title: `Tutorial: ${title}`,
                description: 'Complete guide and explanation...',
                thumbnail: 'https://via.placeholder.com/320x180',
                subtitles: true
              }
            ];

            for (const result of mockYoutubeResults) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
              await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            }
          }

          // Perform OpenAI search and analysis
          if (searchEnabled) {
            // Use mock data in test mode
            if (testMode) {
              console.log('Test mode enabled - using mock data for explore-topic');
              
              // Simulate processing delay
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Determine script type based on title/idea
              let scriptType = 'spacex';
              if (title.toLowerCase().includes('humanoid') || title.toLowerCase().includes('robot') || 
                  idea.toLowerCase().includes('humanoid') || idea.toLowerCase().includes('optimus') ||
                  idea.toLowerCase().includes('nvidia')) {
                scriptType = 'humanoid';
              } else if (title.toLowerCase().includes('marie') || title.toLowerCase().includes('curie') || 
                  idea.toLowerCase().includes('biographie')) {
                scriptType = 'mariecurie';
              } else if (title.toLowerCase().includes('carbonara') || title.toLowerCase().includes('cooking') ||
                         idea.toLowerCase().includes('tutoriel')) {
                scriptType = 'cooking';
              }
              
              const mockScript = mockScripts[scriptType as keyof typeof mockScripts];
              
              const mockResult = {
                type: 'final',
                content: {
                  script: mockScript,
                  title: title || "Test Video Title",
                  storyline: {
                    sections: [
                      { name: "Hook", duration: 15, content: "Engaging opening" },
                      { name: "Act 1", duration: Math.floor(targetDuration * 0.3), content: "Setup and context" },
                      { name: "Act 2", duration: Math.floor(targetDuration * 0.4), content: "Main content" },
                      { name: "Act 3", duration: Math.floor(targetDuration * 0.25), content: "Resolution" },
                      { name: "Outro", duration: Math.floor(targetDuration * 0.05), content: "Call to action" }
                    ]
                  },
                  _testMode: true
                }
              };
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(mockResult)}\n\n`));
              controller.close();
              return;
            }
            
            const searchPrompt = `
              Analyse le sujet suivant et crée un script pour une vidéo YouTube:
              Description: ${prompt}
              Durée cible: ${targetDuration} secondes

              En te basant sur la méthodologie fournie, génère:
              1. Un script détaillé structuré selon les sections (Hook, Body avec Actes I/II/III, Outro)
              2. Une storyline mappée selon la structure_video.json
              3. Des recommandations pour les open loops et la rétention

              Retourne le résultat au format JSON avec:
              {
                "script": "Le script complet en markdown",
                "title": "Le titre optimisé",
                "storyline": {
                  "sections": [...]
                }
              }
            `;

            const completion = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content: "Tu es un expert en création de scripts vidéo YouTube. Tu connais parfaitement la méthodologie de création et la structure des vidéos biographiques."
                },
                {
                  role: "user",
                  content: searchPrompt
                }
              ],
              temperature: 0.7,
            });

            const result = {
              type: 'final',
              content: JSON.parse(completion.choices[0].message.content || '{}')
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in explore-topic:', error);
    return NextResponse.json({ error: 'Failed to explore topic' }, { status: 500 });
  }
}