import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Delete the script from Firestore
    await adminDb.collection('scripts').doc(id).delete();
    
    return NextResponse.json({ success: true, message: 'Script deleted successfully' });
  } catch (error) {
    console.error('Error deleting script:', error);
    return NextResponse.json({ error: 'Failed to delete script' }, { status: 500 });
  }
}