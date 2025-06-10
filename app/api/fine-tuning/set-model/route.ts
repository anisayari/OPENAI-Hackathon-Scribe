import { NextResponse } from 'next/server';

// In a real app, you'd store this in a database or session
let activeModel = 'gpt-4o-mini-2024-07-18';

export async function POST(request: Request) {
  try {
    const { model } = await request.json();

    if (!model) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      );
    }

    // Validate the model exists by checking with OpenAI
    try {
      const response = await fetch(`https://api.openai.com/v1/models/${model}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Model not found');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or inaccessible model' },
        { status: 400 }
      );
    }

    activeModel = model;

    return NextResponse.json({ 
      success: true, 
      activeModel: model 
    });

  } catch (error) {
    console.error('Error setting model:', error);
    return NextResponse.json(
      { error: 'Failed to set model' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ activeModel });
}