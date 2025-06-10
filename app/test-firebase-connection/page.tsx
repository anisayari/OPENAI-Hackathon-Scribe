'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function TestFirebase() {
  const [status, setStatus] = useState<string>('Testing...');
  const [adminStatus, setAdminStatus] = useState<string>('Testing Admin...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test client-side Firebase
    const testClientFirebase = async () => {
      try {
        const testDoc = doc(db, 'test', 'client-test');
        await setDoc(testDoc, {
          message: 'Client Firebase works!',
          timestamp: new Date().toISOString()
        });
        
        const docSnap = await getDoc(testDoc);
        if (docSnap.exists()) {
          setStatus('✅ Client Firebase: Connected successfully!');
        }
      } catch (err: any) {
        setError(`Client Error: ${err.message}`);
        setStatus('❌ Client Firebase: Connection failed');
      }
    };

    // Test server-side Firebase Admin
    const testAdminFirebase = async () => {
      try {
        const response = await fetch('/api/test-firebase');
        const data = await response.json();
        
        if (data.success) {
          setAdminStatus('✅ Admin Firebase: Connected successfully!');
        } else {
          setAdminStatus(`❌ Admin Firebase: ${data.error}`);
        }
      } catch (err: any) {
        setAdminStatus(`❌ Admin Firebase: ${err.message}`);
      }
    };

    testClientFirebase();
    testAdminFirebase();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Client-side Firebase</h2>
            <p className={status.includes('✅') ? 'text-green-600' : 'text-red-600'}>
              {status}
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Server-side Firebase Admin</h2>
            <p className={adminStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}>
              {adminStatus}
            </p>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              <h3 className="font-semibold">Error Details:</h3>
              <pre className="mt-2 text-sm">{error}</pre>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-blue-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Configuration Status:</h3>
          <ul className="text-sm space-y-1">
            <li>Firebase Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Missing'}</li>
            <li>Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</li>
            <li>Firebase App ID: {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}