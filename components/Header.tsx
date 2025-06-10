'use client';

import { useState } from 'react';
import VoiceAgent from './VoiceAgent';
import FineTuningPanel from './FineTuningPanel';

interface HeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  scriptId: string;
  onScriptUpdate: (content: string) => void;
}

export default function Header({ 
  title, 
  onTitleChange,
  isListening,
  setIsListening,
  scriptId,
  onScriptUpdate
}: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showFineTuningPanel, setShowFineTuningPanel] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-lg font-normal text-gray-700 bg-transparent border-b border-gray-300 focus:border-blue-600 focus:outline-none px-1"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-lg font-normal text-gray-700 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title}
                </h1>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsListening(!isListening)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isListening
                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {isListening ? (
                  <>
                    <div className="relative">
                      <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17.3 12c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                      </svg>
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span>Start Voice</span>
                  </>
                )}
              </button>

              <button 
                onClick={() => setShowFineTuningPanel(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Fine-tune Writing Style"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Fine-tune</span>
              </button>

              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <VoiceAgent 
        isListening={isListening}
        setIsListening={setIsListening}
        onScriptUpdate={onScriptUpdate}
      />

      <FineTuningPanel
        isOpen={showFineTuningPanel}
        onClose={() => setShowFineTuningPanel(false)}
        currentScriptId={scriptId}
      />
    </>
  );
}