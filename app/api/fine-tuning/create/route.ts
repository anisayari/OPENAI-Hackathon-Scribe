import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('=== FINE-TUNING CREATE API CALLED ===');
  
  try {
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR: OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }
    console.log('✓ OpenAI API key found');

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
    } catch (e) {
      console.error('ERROR parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { training_data, model } = requestBody;
    
    console.log('Received training data:', {
      dataLength: training_data?.length,
      modelRequested: model,
      sampleData: training_data?.[0],
      allData: training_data
    });

    if (!training_data || training_data.length < 1) {
      console.error('ERROR: No training data provided');
      return NextResponse.json(
        { error: 'No training data provided.' },
        { status: 400 }
      );
    }

    // Ensure we have at least 10 examples for OpenAI fine-tuning
    let finalTrainingData = training_data;
    if (training_data.length < 10) {
      // Duplicate examples to reach minimum of 10
      const repeatsNeeded = Math.ceil(10 / training_data.length);
      finalTrainingData = [];
      for (let i = 0; i < repeatsNeeded; i++) {
        finalTrainingData.push(...training_data);
      }
      finalTrainingData = finalTrainingData.slice(0, Math.max(10, training_data.length));
    }

    console.log('Final training data length:', finalTrainingData.length);

    // Create JSONL format for OpenAI
    const jsonlData = finalTrainingData
      .map((example: any) => JSON.stringify(example))
      .join('\n');
    
    console.log('JSONL data preview (first 500 chars):', jsonlData.substring(0, 500));
    console.log('JSONL total length:', jsonlData.length);

    // First, upload the training file
    console.log('\n--- STEP 1: Uploading training file to OpenAI ---');
    const formData = new FormData();
    const blob = new Blob([jsonlData], { type: 'application/jsonl' });
    formData.append('file', blob, 'training_data.jsonl');
    formData.append('purpose', 'fine-tune');

    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    console.log('Upload response status:', uploadResponse.status);
    const uploadResponseText = await uploadResponse.text();
    console.log('Upload response body:', uploadResponseText);

    if (!uploadResponse.ok) {
      let error;
      try {
        error = JSON.parse(uploadResponseText);
      } catch {
        error = { error: { message: uploadResponseText } };
      }
      console.error('ERROR uploading file:', error);
      throw new Error(error.error?.message || 'Failed to upload training file');
    }

    const uploadedFile = JSON.parse(uploadResponseText);
    console.log('✓ File uploaded successfully:', uploadedFile);

    // Create fine-tuning job
    console.log('\n--- STEP 2: Creating fine-tuning job ---');
    const fineTunePayload = {
      training_file: uploadedFile.id,
      model: model || 'gpt-4o-mini-2024-07-18',
      suffix: 'scribe-style',
    };
    console.log('Fine-tune payload:', JSON.stringify(fineTunePayload, null, 2));

    const fineTuneResponse = await fetch('https://api.openai.com/v1/fine_tuning/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fineTunePayload),
    });

    console.log('Fine-tune response status:', fineTuneResponse.status);
    const fineTuneResponseText = await fineTuneResponse.text();
    console.log('Fine-tune response body:', fineTuneResponseText);

    if (!fineTuneResponse.ok) {
      let error;
      try {
        error = JSON.parse(fineTuneResponseText);
      } catch {
        error = { error: { message: fineTuneResponseText } };
      }
      console.error('ERROR creating fine-tuning job:', error);
      throw new Error(error.error?.message || 'Failed to create fine-tuning job');
    }

    const fineTuneJob = JSON.parse(fineTuneResponseText);
    console.log('✓ Fine-tuning job created successfully:', fineTuneJob);

    return NextResponse.json({
      id: fineTuneJob.id,
      status: fineTuneJob.status,
      model: fineTuneJob.model,
      created_at: fineTuneJob.created_at,
    });

  } catch (error: any) {
    console.error('=== FINE-TUNING ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: `Failed to create fine-tuning job: ${error.message}`,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}