import { NextRequest, NextResponse } from 'next/server';

// Replace with your actual Cloud Function URLs
const CLOUD_FUNCTION_BASE_URL = process.env.CLOUD_FUNCTION_BASE_URL || 'https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style, save_to_firestore } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Call the Python Cloud Function
    const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/generate_image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style: style || 'cinematic',
        size: '1024x1024',
        quality: 'standard',
        save_to_firestore: save_to_firestore || false
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calling image generation function:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}