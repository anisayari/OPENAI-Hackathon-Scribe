import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const { title, idea, mcpServer, youtubeKey, targetDuration, searchEnabled, customScripts } = await request.json();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Simulate MCP server call (replace with actual MCP integration)
          if (mcpServer === 'youtube' && youtubeKey) {
            // Send sample YouTube results in real-time
            const mockYoutubeResults = [
              {
                type: 'youtube',
                title: `Video 1 about ${title}`,
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
            const searchPrompt = `
              Analyse le sujet suivant et crée un script pour une vidéo YouTube:
              Titre: ${title}
              Idée: ${idea}
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