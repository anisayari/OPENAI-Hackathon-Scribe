import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST() {
  try {
    const testScript = {
      title: 'Test Script for Fine-Tuning',
      content: `This is the beginning of a test script. It contains multiple paragraphs that will be used for fine-tuning.

The second paragraph continues the narrative. It provides more context and detail about the subject matter. This helps create a coherent flow of ideas.

In the third paragraph, we expand on the previous concepts. We introduce new elements while maintaining consistency with the established tone and style.

The fourth paragraph brings everything together. It synthesizes the ideas presented earlier and provides a meaningful conclusion to this section.

Finally, the last paragraph offers a reflection on what was discussed. It leaves the reader with something to think about and sets up potential future discussions.`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create the test script
    const docRef = await adminDb.collection('scripts').add(testScript);
    
    console.log('Test script created with ID:', docRef.id);

    return NextResponse.json({ 
      success: true, 
      scriptId: docRef.id,
      message: 'Test script created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating test script:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}