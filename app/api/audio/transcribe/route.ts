import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🎤 [TRANSCRIBE] Request received at:', new Date().toISOString());
  
  try {
    console.log('🎤 [TRANSCRIBE] Parsing form data...');
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    console.log('🎤 [TRANSCRIBE] Audio file received:', {
      name: audioFile?.name,
      size: audioFile?.size,
      type: audioFile?.type,
      exists: !!audioFile
    });

    if (!audioFile) {
      console.error('🎤 [TRANSCRIBE] ❌ No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check file size
    if (audioFile.size < 1000) { // Less than 1KB is likely too short
      console.error('🎤 [TRANSCRIBE] ❌ Audio file too short:', audioFile.size, 'bytes');
      return NextResponse.json({ error: 'Audio file is too short' }, { status: 400 });
    }

    console.log('🎤 [TRANSCRIBE] Converting file to buffer...');
    // Convert File to Buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    console.log('🎤 [TRANSCRIBE] Buffer created, size:', buffer.length, 'bytes');
    
    // Create a File object that OpenAI expects
    const file = new File([buffer], audioFile.name || 'audio.webm', {
      type: audioFile.type || 'audio/webm',
    });

    console.log('🎤 [TRANSCRIBE] Sending to OpenAI Whisper API...');
    const transcriptionStart = Date.now();
    
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: file,
      response_format: 'text',
    });

    const transcriptionTime = Date.now() - transcriptionStart;
    const totalTime = Date.now() - startTime;
    
    console.log('🎤 [TRANSCRIBE] ✅ Transcription completed:', {
      text: transcription,
      textLength: transcription.length,
      transcriptionTime: `${transcriptionTime}ms`,
      totalTime: `${totalTime}ms`
    });

    return NextResponse.json({ 
      text: transcription,
      metadata: {
        audioSize: audioFile.size,
        audioType: audioFile.type,
        processingTime: totalTime,
        transcriptionTime: transcriptionTime
      }
    });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error('🎤 [TRANSCRIBE] ❌ Error after', totalTime, 'ms:', {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack
    });
    
    // Handle specific OpenAI errors
    if (error.code === 'audio_too_short') {
      console.error('🎤 [TRANSCRIBE] ❌ OpenAI rejected: audio too short');
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