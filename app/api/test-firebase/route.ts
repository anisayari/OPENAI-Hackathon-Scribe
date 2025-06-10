import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Test de connexion à Firestore via Firebase Admin
    const testDoc = await adminDb.collection('test').doc('test-doc').get();
    
    if (!testDoc.exists) {
      // Créer un document de test
      await adminDb.collection('test').doc('test-doc').set({
        message: 'Firebase Admin connecté avec succès',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Firebase Admin fonctionne correctement',
      data: testDoc.exists ? testDoc.data() : 'Document créé'
    });
  } catch (error: any) {
    console.error('Erreur Firebase Admin:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur de connexion Firebase Admin',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Écrire des données via Firebase Admin
    await adminDb.collection('scripts').add({
      ...body,
      createdAt: new Date().toISOString(),
      source: 'admin-api'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Document créé avec succès' 
    });
  } catch (error: any) {
    console.error('Erreur Firebase Admin:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la création du document',
        details: error.message 
      },
      { status: 500 }
    );
  }
}