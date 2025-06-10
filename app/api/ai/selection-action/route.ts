import { NextResponse } from 'next/server';
import OpenAI from 'openai';

function getSystemPrompt(action: string): string {
  switch (action) {
    case 'rewrite':
      return 'You are an expert writer. Rewrite the following text to improve its clarity, style, and flow. Return only the rewritten text, without any preamble.';
    case 'expand':
      return 'You are a creative writer. Expand upon the following text, adding more detail, examples, and depth. Return only the expanded text, without any preamble.';
    case 'summarize':
      return 'You are a concise writer. Summarize the following text, capturing the main points succinctly. Return only the summarized text, without any preamble.';
    case 'explain':
        return 'You are a knowledgable teacher. Explain the following concept or text in simple terms. Return only the explanation, without any preamble.';
    case 'translate':
        return 'You are a multilingual translator. Translate the following text. The user might specify a language. If not, assume a common target language or ask for clarification (though for this API, just translate to English if unsure). Return only the translated text, without any preamble.';
    default:
      return 'You are a helpful writing assistant. Process the following text as requested.';
  }
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in the environment.');
    return NextResponse.json(
      { error: 'Server configuration error: The OPENAI_API_KEY is missing. Please ensure it is set in your .env.local file and restart the server.' },
      { status: 500 }
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { text, action } = await request.json();

    if (!text || !action) {
      return NextResponse.json({ error: 'Missing text or action' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(action),
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const newText = response.choices[0].message.content?.trim();
    
    if (!newText) {
        return NextResponse.json({ error: 'AI did not return any text.' }, { status: 500 });
    }

    return NextResponse.json({ newText });
  } catch (error) {
    const action = (await (request.clone().json()).catch(() => ({})))?.action || 'unknown';
    console.error(`Error with action '${action}':`, error);
    return NextResponse.json({ error: 'Failed to process request with AI.' }, { status: 500 });
  }
} 