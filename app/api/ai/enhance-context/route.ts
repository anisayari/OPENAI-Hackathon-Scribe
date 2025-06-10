import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional writing assistant. Your task is to enhance and improve the given text by:
1. Fixing grammar and spelling errors
2. Improving clarity and coherence
3. Making the language more professional and engaging
4. Maintaining the original intent and meaning
5. Ensuring proper punctuation and capitalization

Return only the enhanced text without any explanations or preamble.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const enhancedText = response.choices[0].message.content?.trim();
    
    if (!enhancedText) {
      return NextResponse.json({ error: 'Failed to enhance text' }, { status: 500 });
    }

    return NextResponse.json({ enhancedText });
  } catch (error) {
    console.error('Error enhancing context:', error);
    return NextResponse.json({ error: 'Failed to enhance text' }, { status: 500 });
  }
}