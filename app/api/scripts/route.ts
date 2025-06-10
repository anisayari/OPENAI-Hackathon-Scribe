import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get all scripts from Firestore, ordered by creation date
    const scriptsSnapshot = await adminDb
      .collection('scripts')
      .orderBy('createdAt', 'desc')
      .limit(50) // Limit to last 50 scripts
      .get();

    const scripts = scriptsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ scripts });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 });
  }
}