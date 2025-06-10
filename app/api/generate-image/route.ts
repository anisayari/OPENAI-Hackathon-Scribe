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

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, try to get the text content for debugging
      const text = await response.text();
      console.error('Non-JSON response from Cloud Function:', text.substring(0, 500));
      
      // Check if it's an HTML error page
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        return NextResponse.json(
          { 
            error: 'Cloud Function not found or not deployed. Please ensure the Firebase functions are deployed.',
            details: 'Received HTML response instead of JSON. This usually means the function URL is incorrect or the function is not deployed.'
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid response from image generation service' },
        { status: 500 }
      );
    }

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