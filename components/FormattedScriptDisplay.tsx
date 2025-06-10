'use client';

import React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import SelectionMenu from './SelectionMenu';

interface ScriptSection {
  timestamp: string;
  section: string;
  content: string;
}

interface FormattedScriptDisplayProps {
  title: string;
  script: ScriptSection[] | string | any;
  storyline?: any;
  duration?: number;
  onChange?: (content: string) => void;
}

export default function FormattedScriptDisplay({ 
  title, 
  script, 
  storyline,
  duration = 1500,
  onChange 
}: FormattedScriptDisplayProps) {
  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Process script into sections
    const processedSections: ScriptSection[] = [];
    
    if (Array.isArray(script)) {
      // Already in the format we want
      setSections(script);
    } else if (typeof script === 'object' && script !== null) {
      // Handle object format (Scene 1, Scene 2, etc.)
      Object.entries(script).forEach(([key, value]) => {
        processedSections.push({
          timestamp: key,
          section: key,
          content: String(value)
        });
      });
      setSections(processedSections);
    } else if (typeof script === 'string') {
      // Parse string format into sections
      const lines = script.split('\n').filter(line => line.trim());
      let currentSection: ScriptSection | null = null;
      
      lines.forEach((line) => {
        // Check if it's a timestamp line
        const timestampMatch = line.match(/^(\d+:\d+|\d+-\d+\s*seconds?)[\s:-]*(.*?)$/i);
        if (timestampMatch) {
          if (currentSection) {
            processedSections.push(currentSection);
          }
          currentSection = {
            timestamp: timestampMatch[1],
            section: timestampMatch[2] || 'Section',
            content: ''
          };
        } else if (currentSection) {
          currentSection.content += (currentSection.content ? '\n' : '') + line;
        }
      });
      
      if (currentSection) {
        processedSections.push(currentSection);
      }
      
      setSections(processedSections);
    }
  }, [script]);
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Handle text selection
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
  
  // Update section content
  const updateSectionContent = (sectionIndex: number, newContent: string) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].content = newContent;
    setSections(updatedSections);
    
    // Notify parent component of changes
    if (onChange) {
      const fullContent = updatedSections.map(section => 
        `${section.timestamp}: ${section.section}\n${section.content}`
      ).join('\n\n');
      onChange(fullContent);
    }
  };
  
  // Handle selection action
  const handleSelectionAction = async (action: string, result?: string) => {
    if (!selectedText) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Find which section contains the selection
    const range = selection.getRangeAt(0);
    const sectionElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement?.closest('[data-section-index]')
      : (range.commonAncestorContainer as Element).closest('[data-section-index]');
    
    if (sectionElement) {
      const sectionIndex = parseInt(sectionElement.getAttribute('data-section-index') || '0');
      const section = sections[sectionIndex];
      
      if (section) {
        let updatedContent = section.content;
        
        if (result) {
          // Replace selected text with result
          updatedContent = updatedContent.replace(selectedText, result);
        }
        
        updateSectionContent(sectionIndex, updatedContent);
      }
    }
    
    // Clear selection
    selection.removeAllRanges();
    setShowSelectionMenu(false);
    setSelectedText('');
  };
  
  // Add event listeners for selection
  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, [handleSelection]);
  
  return (
    <div className="max-w-4xl mx-auto" ref={contentRef}>
      {/* Document Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{title || 'Video Script'}</h1>
        <p className="text-gray-600">
          Duration: {formatDuration(duration)} | 
          Sections: {sections.length} | 
          Words: {sections.reduce((acc, s) => acc + s.content.split(' ').length, 0)}
        </p>
      </div>
      
      {/* Table of Contents */}
      {sections.length > 0 && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
          <ul className="space-y-2">
            {sections.map((section, index) => (
              <li key={index}>
                <a 
                  href={`#section-${index}`}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-3"
                >
                  <span className="text-sm text-gray-500 font-mono">{section.timestamp}</span>
                  <span>{section.section}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Script Content */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <div 
            key={index} 
            id={`section-${index}`}
            data-section-index={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            {/* Section Header */}
            <div className="mb-4 pb-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {section.section}
                </h3>
                <span className="text-sm font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded">
                  {section.timestamp}
                </span>
              </div>
              {storyline?.sections?.[index] && (
                <p className="text-sm text-gray-600 mt-2">
                  {storyline.sections[index].content || storyline.sections[index].description}
                </p>
              )}
            </div>
            
            {/* Section Content */}
            <div className="prose prose-lg max-w-none">
              {section.content.split('\n').map((paragraph, pIndex) => {
                // Handle visual cues
                if (paragraph.includes('[VISUAL:') || paragraph.includes('[Visual:')) {
                  const [text, visual] = paragraph.split(/\[VISUAL:|\[Visual:/);
                  return (
                    <div key={pIndex}>
                      {text && <p className="mb-2">{text.trim()}</p>}
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
                        <p className="text-sm font-medium text-blue-800">
                          <span className="font-bold">Visual:</span> {visual?.replace(']', '').trim()}
                        </p>
                      </div>
                    </div>
                  );
                }
                
                // Regular paragraph
                return paragraph.trim() && (
                  <p key={pIndex} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>
            
            {/* Section Metadata */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>Words: {section.content.split(' ').filter(w => w).length}</span>
              <span>Section {index + 1} of {sections.length}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation */}
      <div className="mt-8 flex justify-center">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
        >
          Back to Top ↑
        </button>
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
    </div>
  );
}