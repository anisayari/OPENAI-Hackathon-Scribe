import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { apiLogger } from '@/lib/logger';
import { getMockAnalysis } from '@/lib/mock-data';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  let requestData: any;
  
  try {
    requestData = await request.json();
    const { script, context, duration, testMode } = requestData;

    if (!script) {
      const errorResponse = { error: 'Script is required' };
      apiLogger.log('analyze-script', requestData, errorResponse, 'Missing script');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Use mock data in test mode
    if (testMode) {
      console.log('Test mode enabled - using mock data');
      let scriptType = 'default';
      
      // Detect script type based on content
      if (script.toLowerCase().includes('spacex') || script.toLowerCase().includes('fusée')) {
        scriptType = 'default';
      } else if (script.toLowerCase().includes('biographie') || script.toLowerCase().includes('marie curie')) {
        scriptType = 'biography';
      } else if (script.toLowerCase().includes('tutoriel') || script.toLowerCase().includes('comment') || script.toLowerCase().includes('carbonara')) {
        scriptType = 'tutorial';
      }
      
      const mockAnalysis = await getMockAnalysis(scriptType);
      
      // Log mock response
      apiLogger.log('analyze-script', requestData, { ...mockAnalysis, _testMode: true });
      
      return NextResponse.json({ ...mockAnalysis, _testMode: true });
    }

    const systemPrompt = `Tu es un expert en analyse de scripts vidéo YouTube. Tu dois analyser le script fourni et générer un JSON structuré avec les éléments suivants:

1. **idea_details**: Une analyse détaillée de l'idée principale du script, incluant:
   - Le concept principal
   - Les points clés abordés
   - L'angle unique ou la perspective adoptée
   - La valeur apportée au spectateur

2. **things_to_explore**: Une liste de sujets, concepts ou angles à explorer davantage, incluant:
   - Des approfondissements possibles
   - Des sujets connexes intéressants
   - Des questions soulevées par le script
   - Des pistes de recherche complémentaires

3. **keywords**: Une liste de mots-clés pertinents pour le SEO et la découvrabilité, incluant:
   - Mots-clés principaux (3-5)
   - Mots-clés secondaires (5-10)
   - Tags YouTube recommandés
   - Expressions de recherche potentielles

Le JSON doit être structuré ainsi:
{
  "idea_details": {
    "main_concept": "string",
    "key_points": ["string"],
    "unique_angle": "string",
    "value_proposition": "string"
  },
  "things_to_explore": [
    {
      "topic": "string",
      "why_interesting": "string",
      "potential_content": "string"
    }
  ],
  "keywords": {
    "primary": ["string"],
    "secondary": ["string"],
    "youtube_tags": ["string"],
    "search_phrases": ["string"]
  }
}`;

    const userPrompt = `Analyse le script suivant:

Script: ${script}

${context ? `Contexte additionnel: ${context}` : ''}
${duration ? `Durée cible de la vidéo: ${duration} secondes` : ''}

Génère un JSON structuré avec les détails de l'idée, les choses à explorer et les mots-clés.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    // Log successful response
    apiLogger.log('analyze-script', requestData, analysis);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing script:', error);
    const errorResponse = { 
      error: 'Failed to analyze script',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    // Log error response
    apiLogger.log('analyze-script', requestData || {}, errorResponse, error);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}