import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { adminDb } from '@/lib/firebase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ImageResult {
  url: string;
  preview_url: string;
  source: string;
  license: string;
  cost: number;
  width: number;
  height: number;
  title: string;
  relevance_score: number;
  photographer: string;
  source_website: string;
}

interface SearchRequest {
  query: string;
  count?: number;
  budget?: 'free' | 'mixed' | 'premium';
  style?: string;
  generateIfNeeded?: boolean;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { 
      query, 
      count = 10, 
      budget = 'mixed', 
      style = 'cinematic',
      generateIfNeeded = false,
      sessionId 
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const results: ImageResult[] = [];

    // Search Pexels (always free)
    if (budget === 'free' || budget === 'mixed') {
      const pexelsResults = await searchPexels(query, Math.min(count, 20));
      results.push(...pexelsResults);
    }

    // If we need more results and budget allows, use DataForSEO
    if (results.length < count && budget === 'mixed' && process.env.DATAFORSEO_LOGIN) {
      const dataforseoResults = await searchDataForSEO(query, count - results.length);
      results.push(...dataforseoResults);
    }

    // Generate with DALL-E if needed and allowed
    if (generateIfNeeded && results.length < 3) {
      const generatedImage = await generateAIImage(query, style);
      if (generatedImage) {
        results.push(generatedImage);
      }
    }

    // Save search to Firebase if sessionId provided
    if (sessionId) {
      await saveSearchToFirebase(sessionId, query, results);
    }

    return NextResponse.json({ 
      images: results.slice(0, count),
      total: results.length,
      query
    });

  } catch (error) {
    console.error('Image search error:', error);
    return NextResponse.json(
      { error: 'Failed to search images' }, 
      { status: 500 }
    );
  }
}

async function searchPexels(query: string, count: number): Promise<ImageResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.photos.map((photo: any) => ({
      url: photo.src.original,
      preview_url: photo.src.medium,
      source: 'pexels',
      license: 'CC0',
      cost: 0,
      width: photo.width,
      height: photo.height,
      title: photo.alt || '',
      relevance_score: 0.8,
      photographer: photo.photographer,
      source_website: 'pexels.com'
    }));
  } catch (error) {
    console.error('Pexels search error:', error);
    return [];
  }
}

async function searchDataForSEO(query: string, count: number): Promise<ImageResult[]> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  
  if (!login || !password) return [];

  try {
    const credentials = Buffer.from(`${login}:${password}`).toString('base64');
    
    const response = await fetch(
      'https://api.dataforseo.com/v3/serp/google/images/live/advanced',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          keyword: query,
          location_code: 2840, // United States
          language_code: "en",
          device: "desktop",
          os: "windows",
          depth: count * 2 // Get more to filter
        }])
      }
    );

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status}`);
    }

    const data = await response.json();
    const results: ImageResult[] = [];

    if (data.tasks?.[0]?.result?.[0]?.items) {
      const items = data.tasks[0].result[0].items;
      
      for (const item of items) {
        if (item.type === 'images_search') {
          const sourceWebsite = item.subtitle?.toLowerCase() || '';
          let license = 'unknown';
          
          // Check if from known free sources
          const freeSources = ['wikimedia', 'commons', 'flickr', 'unsplash', 'pexels', 'pixabay'];
          const premiumSources = ['shutterstock', 'getty', 'istockphoto', 'adobestock'];
          
          if (freeSources.some(src => sourceWebsite.includes(src))) {
            license = 'likely free';
          } else if (premiumSources.some(src => sourceWebsite.includes(src))) {
            license = 'premium';
          }

          results.push({
            url: item.source_url || '',
            preview_url: item.encoded_url || item.source_url || '',
            source: 'dataforseo',
            license,
            cost: license === 'premium' ? 5.0 : 0,
            width: 0,
            height: 0,
            title: item.title || '',
            relevance_score: 0.7,
            photographer: '',
            source_website: item.subtitle || ''
          });
        }
      }
    }

    // Filter based on license
    return results.filter(img => img.license !== 'premium').slice(0, count);
    
  } catch (error) {
    console.error('DataForSEO search error:', error);
    return [];
  }
}

async function generateAIImage(prompt: string, style: string): Promise<ImageResult | null> {
  try {
    const enhancedPrompt = `${prompt}, ${style} style, high quality, professional photography`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      size: "1024x1024",
      quality: "hd",
      n: 1
    });

    if (response.data[0]?.url) {
      return {
        url: response.data[0].url,
        preview_url: response.data[0].url,
        source: 'dalle-3',
        license: 'ai-generated',
        cost: 0.04,
        width: 1024,
        height: 1024,
        title: `AI Generated: ${prompt.substring(0, 50)}...`,
        relevance_score: 1.0,
        photographer: 'DALL-E 3',
        source_website: 'openai.com'
      };
    }
  } catch (error) {
    console.error('DALL-E generation error:', error);
  }
  
  return null;
}

async function saveSearchToFirebase(sessionId: string, query: string, results: ImageResult[]) {
  try {
    await adminDb.collection('imageSea

').doc(sessionId).collection('searches').add({
      query,
      results: results.map(r => ({
        ...r,
        savedAt: new Date().toISOString()
      })),
      timestamp: new Date().toISOString(),
      resultsCount: results.length
    });
  } catch (error) {
    console.error('Firebase save error:', error);
  }
}