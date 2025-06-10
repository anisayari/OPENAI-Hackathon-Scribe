'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import DocumentEditor from '@/components/DocumentEditor';
import Header from '@/components/Header';
import AgentThinkingPanel from '@/components/AgentThinkingPanel';
import SimpleFineTuning from '@/components/SimpleFineTuning';

export default function DocPage() {
  const searchParams = useSearchParams();
  const [scriptId, setScriptId] = useState<string>('');
  const [scriptContent, setScriptContent] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('What do you want to create today?');
  const [isThinkingPanelOpen, setIsThinkingPanelOpen] = useState(false);
  const [showStoryline, setShowStoryline] = useState(false);
  const [storylineData, setStorylineData] = useState<any>(null);

  useEffect(() => {
    // Check if we have data from the exploration
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        setScriptContent(parsedData.script || '');
        setDocumentTitle(parsedData.title || 'Generated Script');
        setStorylineData(parsedData.storyline || null);
      } catch (e) {
        console.error('Error parsing data:', e);
      }
    }

    // Generate a unique script ID when the app loads
    const newScriptId = `script-${Date.now()}`;
    setScriptId(newScriptId);

    // Set up real-time listener for script updates
    const scriptRef = doc(db, 'scripts', newScriptId);
    const unsubscribe = onSnapshot(scriptRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (!searchParams.get('data')) {
          setScriptContent(data.content || '');
          setDocumentTitle(data.title || 'What do you want to create today?');
        }
      }
    });

    // Initialize script in Firestore
    setDoc(scriptRef, {
      content: scriptContent,
      title: documentTitle,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return () => unsubscribe();
  }, []);

  const updateScript = async (newContent: string) => {
    setScriptContent(newContent);
    
    if (scriptId) {
      const scriptRef = doc(db, 'scripts', scriptId);
      await setDoc(scriptRef, {
        content: newContent,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  };

  const updateTitle = async (newTitle: string) => {
    setDocumentTitle(newTitle);
    
    if (scriptId) {
      const scriptRef = doc(db, 'scripts', scriptId);
      await setDoc(scriptRef, {
        title: newTitle,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  };

  // Automatically open thinking panel when listening starts
  useEffect(() => {
    if (isListening) {
      setIsThinkingPanelOpen(true);
    }
  }, [isListening]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Header 
        title={documentTitle}
        onTitleChange={updateTitle}
        isListening={isListening}
        setIsListening={setIsListening}
        scriptId={scriptId}
        onScriptUpdate={updateScript}
      />
      
      <div className="flex-1 flex relative">
        {storylineData && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setShowStoryline(!showStoryline)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {showStoryline ? 'Hide' : 'Show'} Storyline
            </button>
          </div>
        )}

        <main className={`flex-1 flex justify-center pt-8 pb-16 transition-all duration-300 ${
          isThinkingPanelOpen ? 'pr-[320px]' : ''
        } ${showStoryline ? 'pl-[400px]' : ''}`}>
          <DocumentEditor
            content={scriptContent}
            onChange={updateScript}
          />
        </main>

        {showStoryline && storylineData && (
          <div className="fixed left-0 top-16 bottom-0 w-[400px] bg-white border-r border-gray-200 overflow-y-auto p-6">
            <h2 className="text-xl font-light mb-6 text-gray-900">Storyline</h2>
            <div className="space-y-6">
              {storylineData.sections?.map((section: any, index: number) => (
                <div key={index} className="border-l-2 border-gray-300 pl-4">
                  <h3 className="font-medium text-base mb-2 text-gray-900">{section.nom}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Duration: {section.duree_sec || section.duree_max_sec || section.duree_moyenne_sec}s
                  </p>
                  {section.objectifs && (
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {section.objectifs.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  )}
                  {section.contenu && (
                    <p className="text-sm text-gray-700 mt-2">{section.contenu}</p>
                  )}
                  {section.acts && (
                    <div className="mt-2 space-y-2">
                      {section.acts.map((act: any, i: number) => (
                        <div key={i} className="ml-4 p-2 bg-gray-50 rounded-sm">
                          <p className="font-medium text-sm">{act.acte}</p>
                          <p className="text-xs text-gray-600">{act.contenu}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <AgentThinkingPanel 
          isOpen={isThinkingPanelOpen}
          onToggle={() => setIsThinkingPanelOpen(!isThinkingPanelOpen)}
        />
        
        {/* Toggle button when panel is closed */}
        {!isThinkingPanelOpen && (
          <button
            onClick={() => setIsThinkingPanelOpen(true)}
            className="fixed right-4 top-20 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            title="Show agent thinking"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}