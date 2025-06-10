import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check file size
    if (audioFile.size < 1000) { // Less than 1KB is likely too short
      return NextResponse.json({ error: 'Audio file is too short' }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Create a File object that OpenAI expects
    const file = new File([buffer], audioFile.name || 'audio.webm', {
      type: audioFile.type || 'audio/webm',
    });

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: file,
      response_format: 'text',
    });

    return NextResponse.json({ text: transcription });
  } catch (error: any) {
    console.error('Transcription error:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'audio_too_short') {
      return NextResponse.json(
        { error: 'Audio recording is too short. Please hold the button longer.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}