import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/fine_tuning/jobs?limit=10', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to fetch fine-tuning jobs');
    }

    const data = await response.json();
    
    // Filter for scribe-style jobs and format response
    const scribeJobs = data.data
      .filter((job: any) => job.suffix === 'scribe-style')
      .map((job: any) => ({
        id: job.id,
        status: job.status,
        model: job.fine_tuned_model || job.model,
        created_at: job.created_at,
        error: job.error,
      }));

    return NextResponse.json({ jobs: scribeJobs });

  } catch (error) {
    console.error('Error fetching fine-tuning jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fine-tuning jobs' },
      { status: 500 }
    );
  }
}