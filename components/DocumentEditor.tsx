'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import SelectionMenu from './SelectionMenu';
import TypingAssistant from './TypingAssistant';
import ImageSearch from './ImageSearch';

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function DocumentEditor({ content, onChange }: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '<p><br></p>';
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString();
      setSelectedText(text);
      
      // Get selection position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 5
      });
      setShowSelectionMenu(true);
    } else {
      setSelectedText('');
      setShowSelectionMenu(false);
    }
  }, []);

  const handleSelectionAction = async (action: string, text: string) => {
    console.log('Selection action:', action, 'Text:', text);
    setShowSelectionMenu(false);

    if (action === 'research') {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(text)}`, '_blank');
      return;
    }

    const apiActions = ['rewrite', 'expand', 'summarize', 'explain', 'translate'];

    if (apiActions.includes(action)) {
      try {
        const response = await fetch('/api/ai/selection-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, action }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Request failed with no JSON response' }));
          throw new Error(errorData.error || `Failed to perform action: ${action}`);
        }

        const data = await response.json();
        const { newText } = data;

        if (newText) {
          if (editorRef.current) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              const lines = newText.split('\n');
              const fragment = document.createDocumentFragment();
              lines.forEach((line: string, index: number) => {
                fragment.appendChild(document.createTextNode(line));
                if (index < lines.length - 1) {
                  fragment.appendChild(document.createElement('br'));
                }
              });
              range.insertNode(fragment);
              range.collapse(false);
              handleInput();
            }
          }
        }
      } catch (error: any) {
        console.error('Error handling selection action:', error);
        alert(`An error occurred: ${error.message}`);
      }
    } else {
      console.log(`Action "${action}" is not yet implemented.`);
      alert(`Action "${action}" is not yet implemented.`);
    }
  };

  const handleAISuggestion = (suggestion: string) => {
    // Insert suggestion at cursor position
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(suggestion));
        range.collapse(false);
        handleInput();
      }
    }
  };

  const handleImageInsert = (imageUrl: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.marginTop = '16px';
        img.style.marginBottom = '16px';
        range.insertNode(img);
        range.collapse(false);
        handleInput();
      }
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  return (
    <div className="w-full max-w-[816px]">
      {/* Formatting Toolbar */}
      <div className={`sticky top-0 bg-white border border-gray-200 rounded-t-lg px-2 py-1 flex items-center space-x-1 transition-opacity ${
        isFocused ? 'opacity-100' : 'opacity-0'
      }`}>
        <button
          onClick={() => formatText('bold')}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
          title="Bold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h10a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </button>
        
        <button
          onClick={() => formatText('italic')}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
          title="Italic"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4M14 20H8M15 4L9 20"/>
          </svg>
        </button>
        
        <button
          onClick={() => formatText('underline')}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
          title="Underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v7a5 5 0 0 0 10 0V4M5 21h14"/>
          </svg>
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          onClick={() => formatText('formatBlock', '<h1>')}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
          title="Heading 1"
        >
          <span className="text-sm font-bold">H1</span>
        </button>
        
        <button
          onClick={() => formatText('formatBlock', '<h2>')}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
          title="Heading 2"
        >
          <span className="text-sm font-bold">H2</span>
        </button>
        
        <button
          onClick={() => formatText('formatBlock', '<p>')}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
          title="Normal text"
        >
          <span className="text-sm">¶</span>
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          onClick={() => formatText('insertUnorderedList')}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
          title="Bullet list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
          </svg>
        </button>
        
        <button
          onClick={() => formatText('insertOrderedList')}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
          title="Numbered list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13m-13 6h13M4 6h.01M4 12h.01M4 18h.01"/>
          </svg>
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ImageSearch onImageSelect={handleImageInsert} />
      </div>

      {/* Document Editor */}
      <div 
        className="bg-white border border-t-0 border-gray-200 rounded-b-lg min-h-[842px] focus:outline-none"
        style={{
          boxShadow: isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none',
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          className="px-24 py-16 min-h-[842px] focus:outline-none prose prose-lg max-w-none"
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseUp={handleSelection}
          onKeyUp={handleSelection}
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.5',
            color: '#202124',
          }}
        />
      </div>

      {/* Selection Menu */}
      {showSelectionMenu && selectionPosition && (
        <SelectionMenu
          selectedText={selectedText}
          position={selectionPosition}
          onAction={handleSelectionAction}
          onClose={() => setShowSelectionMenu(false)}
        />
      )}
      
      {/* AI Typing Assistant */}
      <TypingAssistant
        content={editorRef.current?.innerText || ''}
        onSuggestion={handleAISuggestion}
      />
    </div>
  );
}