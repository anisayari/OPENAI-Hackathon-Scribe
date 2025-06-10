import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let content = '';

    // Determine file type and parse accordingly
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      content = await parsePDF(buffer);
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword' ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.doc')
    ) {
      content = await parseDocx(buffer);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      content = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Clean and format the content
    content = cleanContent(content);

    if (content.length < 100) {
      return NextResponse.json(
        { error: 'File content too short for training' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      content,
      fileName: file.name,
      wordCount: content.split(/\s+/).length,
    });

  } catch (error) {
    console.error('File parsing error:', error);
    return NextResponse.json(
      { error: `Failed to parse file: ${error.message}` },
      { status: 500 }
    );
  }
}

async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // Simple approach for now - extract basic text
    // For production, you might want to use a more robust PDF parser
    const text = buffer.toString('latin1');
    
    // Basic text extraction from PDF streams
    const textRegex = /BT\s+(.+?)\s+ET/g;
    const matches = [];
    let match;
    
    while ((match = textRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    if (matches.length === 0) {
      // Fallback: try to extract any readable text
      const readableText = text
        .replace(/[^\x20-\x7E\n\r]/g, ' ') // Keep only printable ASCII
        .replace(/\s+/g, ' ')
        .trim();
      
      if (readableText.length < 100) {
        throw new Error('PDF appears to be image-based or encrypted. Please use a text-based PDF or convert to DOCX/TXT format.');
      }
      
      return readableText;
    }
    
    return matches.join(' ').replace(/\s+/g, ' ').trim();
  } catch (error) {
    throw new Error(`Failed to parse PDF file: ${error.message}. Please try converting to DOCX or TXT format for better results.`);
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid issues
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to parse DOCX file: ${error.message}`);
  }
}

function cleanContent(content: string): string {
  return content
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove page numbers and headers/footers patterns
    .replace(/\b\d+\b\s*$/gm, '')
    // Remove multiple consecutive newlines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Remove leading/trailing whitespace
    .trim()
    // Ensure proper sentence endings
    .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
    // Remove any remaining control characters
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    // Normalize spaces
    .replace(/\s+/g, ' ');
}