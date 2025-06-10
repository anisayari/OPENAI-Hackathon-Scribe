import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

// Batch update multiple scripts or perform bulk operations
export async function POST(request: NextRequest) {
  try {
    const { operation, scripts } = await request.json();
    
    if (operation === 'batch_update') {
      const batch = adminDb.batch();
      
      scripts.forEach((script: any) => {
        const docRef = adminDb.collection('scripts').doc(script.id);
        batch.set(docRef, {
          ...script,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
      
      await batch.commit();
      
      return NextResponse.json({ success: true, updated: scripts.length });
    }
    
    if (operation === 'sync_session') {
      // Sync session data with agent thinking and progress
      const { sessionId, agentData, progress } = request.body;
      
      const sessionRef = adminDb.collection('sessions').doc(sessionId);
      await sessionRef.set({
        agentData,
        progress,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in sync operation:', error);
    return NextResponse.json(
      { error: 'Sync operation failed' },
      { status: 500 }
    );
  }
}