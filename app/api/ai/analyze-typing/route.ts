import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || text.length < 10) {
      return NextResponse.json({ suggestions: [] });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a helpful writing assistant. Analyze the given text and provide up to 3 suggestions. Focus on:
1. Grammar and spelling corrections
2. Style improvements
3. Content ideas or continuations
4. Clarity enhancements

Return suggestions in JSON format:
{
  "suggestions": [
    {
      "type": "grammar" | "style" | "idea" | "continuation",
      "text": "The suggestion text",
      "reason": "Brief explanation (optional)"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Analyze this text and provide suggestions: "${text}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const suggestions = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error analyzing typing:', error);
    return NextResponse.json({ suggestions: [] });
  }
}