'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestoreSync } from '@/lib/firestore-sync';
import DocumentEditor from '@/components/DocumentEditor';
import EnhancedDocumentEditor from '@/components/EnhancedDocumentEditor';
import Header from '@/components/Header';
import AgentThinkingPanel from '@/components/AgentThinkingPanel';
import SimpleFineTuning from '@/components/SimpleFineTuning';
import Timeline from '@/components/Timeline';
import ScriptImageGenerator from '@/components/ScriptImageGenerator';

export default function DocPage() {
  const searchParams = useSearchParams();
  const { saveScript, updateScript, loadScript, autoSave } = useFirestoreSync();
  const [scriptId, setScriptId] = useState<string>('');
  const [scriptContent, setScriptContent] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('What do you want to create today?');
  const [isThinkingPanelOpen, setIsThinkingPanelOpen] = useState(false);
  const [showStoryline, setShowStoryline] = useState(true);
  const [storylineData, setStorylineData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'doc' | 'timeline' | 'images'>('doc');
  const [targetDuration, setTargetDuration] = useState<number>(1500);
  const [fullScriptData, setFullScriptData] = useState<any>(null);
  const [parsedSections, setParsedSections] = useState<any[]>([]);

  useEffect(() => {
    const initializeScript = async () => {
      // Check if we have data from the exploration
      const data = searchParams.get('data');
      let newScriptId = '';
      
      if (data) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(data));
          let finalContent = '';
          
          // Handle script data - it might be an array of objects or a string
          if (Array.isArray(parsedData.script)) {
            // Convert array of timestamp objects to HTML format with bold titles
            finalContent = parsedData.script.map((item: any, index: number) => {
              if (typeof item === 'object' && item.timestamp && item.content) {
                // Extract title from content (first sentence or until comma)
                const titleMatch = item.content.match(/^([^.,:]+)/);
                const title = titleMatch ? titleMatch[1].trim().toUpperCase() : `SECTION ${index + 1}`;
                
                // Format as HTML with bold uppercase title
                return `<p><strong>${item.timestamp} - ${title}</strong></p><p>${item.content}</p>`;
              }
              return `<p>${item.toString()}</p>`;
            }).join('<br>');
            // Store the parsed sections for enhanced editor
            setParsedSections(parsedData.script);
          } else {
            const originalScript = parsedData.script || '';
            
            // Parse sections from string format if needed
            if (parsedData.script) {
              const sections = parsedData.script.split('\n\n');
              finalContent = sections.map((section: string, index: number) => {
                const match = section.match(/^(\d{2}:\d{2}):\s*(.+)$/);
                if (match) {
                  const titleMatch = match[2].match(/^([^.,:]+)/);
                  const title = titleMatch ? titleMatch[1].trim().toUpperCase() : `SECTION ${index + 1}`;
                  return `<p><strong>${match[1]} - ${title}</strong></p><p>${match[2]}</p>`;
                }
                return `<p>${section}</p>`;
              }).join('<br>');
              
              setParsedSections(sections.map((section: string) => {
                const match = section.match(/^(\d{2}:\d{2}):\s*(.+)$/);
                if (match) {
                  return { timestamp: match[1], content: match[2] };
                }
                return null;
              }).filter(Boolean));
            } else {
              finalContent = originalScript;
            }
          }
          setScriptContent(finalContent);
          
          setDocumentTitle(parsedData.title || 'Generated Script');
          setStorylineData(parsedData.storyline || parsedData.storyline_structure || null);
          setTargetDuration(parsedData.targetDuration || 1500);
          setFullScriptData(parsedData); // Store full data for image generation
          
          // Save to Firestore using sync utility
          try {
            const savedId = await saveScript({
              content: finalContent,
              title: parsedData.title || 'Generated Script',
              script: parsedData.script,
              storyline: parsedData.storyline,
              targetDuration: parsedData.targetDuration || 1500,
              fullData: parsedData
            });
            
            if (savedId) {
              newScriptId = savedId;
              setScriptId(newScriptId);
            }
          } catch (error) {
            console.error('Error saving script to Firestore:', error);
            newScriptId = `script-${Date.now()}`;
            setScriptId(newScriptId);
          }
        } catch (e) {
          console.error('Error parsing data:', e);
          newScriptId = `script-${Date.now()}`;
          setScriptId(newScriptId);
        }
      } else {
        // Check if we have a script ID in URL params to load existing script
        const existingScriptId = searchParams.get('id');
        if (existingScriptId) {
          try {
            const scriptData = await loadScript(existingScriptId);
            if (scriptData) {
              setScriptContent(scriptData.content || '');
              setDocumentTitle(scriptData.title || 'What do you want to create today?');
              setStorylineData(scriptData.storyline || null);
              setTargetDuration(scriptData.targetDuration || 1500);
              setFullScriptData(scriptData.fullData || null);
              setParsedSections(scriptData.script || []);
              setScriptId(existingScriptId);
            }
          } catch (error) {
            console.error('Error loading script:', error);
          }
        } else {
          // Generate a new script ID
          newScriptId = `script-${Date.now()}`;
          setScriptId(newScriptId);
        }
      }
    };

    initializeScript();
  }, []);

  const updateScriptContent = async (newContent: string) => {
    setScriptContent(newContent);
    
    if (scriptId) {
      // Use auto-save with 2 second delay to avoid too many requests
      autoSave(scriptId, { content: newContent }, 2000);
    }
  };

  const updateTitle = async (newTitle: string) => {
    setDocumentTitle(newTitle);
    
    if (scriptId) {
      // Save title immediately since it's less frequent
      await updateScript(scriptId, { title: newTitle });
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
        onScriptUpdate={updateScriptContent}
      />
      
      <div className="flex-1 flex relative">
        {/* View Mode Toggle */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('doc')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm ${
                viewMode === 'doc' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Document
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm ${
                viewMode === 'timeline' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timeline
            </button>
            <button
              onClick={() => setViewMode('images')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm ${
                viewMode === 'images' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Images
            </button>
          </div>
          
          {viewMode === 'doc' && storylineData && (
            <button
              onClick={() => setShowStoryline(!showStoryline)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {showStoryline ? 'Hide' : 'Show'} Storyline
            </button>
          )}
        </div>

        {viewMode === 'doc' ? (
          <main className={`flex-1 flex justify-center pt-8 pb-16 transition-all duration-300 ${
            isThinkingPanelOpen ? 'pr-[320px]' : ''
          } ${showStoryline && (storylineData || parsedSections.length > 0) ? 'pl-[300px]' : ''}`}>
            <DocumentEditor
              content={scriptContent}
              onChange={updateScriptContent}
            />
          </main>
        ) : viewMode === 'timeline' ? (
          <main className="flex-1 pt-16">
            <Timeline
              script={scriptContent}
              totalDuration={targetDuration}
            />
          </main>
        ) : (
          <main className="flex-1 pt-16 px-8">
            <ScriptImageGenerator
              scriptData={fullScriptData}
              onImagesGenerated={(updatedScript) => {
                console.log('Images generated:', updatedScript);
              }}
            />
          </main>
        )}

        {viewMode === 'doc' && showStoryline && (storylineData || parsedSections.length > 0) && (
          <div className="fixed left-0 top-16 bottom-0 w-[300px] bg-[#F8F9FA] border-r border-gray-300 overflow-y-auto">
            <div className="p-4 border-b border-gray-300 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-900">Outline</h2>
                <button
                  onClick={() => setShowStoryline(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {storylineData?.sections?.map((section: any, index: number) => (
                <div key={index} className="cursor-pointer hover:bg-gray-100 rounded p-2 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-500 mt-0.5">{index + 1}.</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 uppercase">{section.nom}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {section.duree_sec || section.duree_max_sec || section.duree_moyenne_sec}s
                      </p>
                      {section.objectifs && section.objectifs.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {section.objectifs.slice(0, 2).map((obj: string, i: number) => (
                            <li key={i} className="text-xs text-gray-600 pl-3 relative">
                              <span className="absolute left-0">•</span>
                              {obj}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* If no sections but we have parsed sections from script */}
              {(!storylineData?.sections || storylineData?.sections?.length === 0) && parsedSections.length > 0 && (
                <>
                  {parsedSections.map((section: any, index: number) => (
                    <div key={index} className="cursor-pointer hover:bg-gray-100 rounded p-2 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className="text-sm text-gray-500 mt-0.5">{index + 1}.</span>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {section.timestamp}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {section.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
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