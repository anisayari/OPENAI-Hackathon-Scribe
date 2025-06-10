'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Section {
  timestamp: string;
  content: string;
  title?: string;
  duration?: number;
}

interface EnhancedDocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  sections?: any[];
}

export default function EnhancedDocumentEditor({ content, onChange, sections }: EnhancedDocumentEditorProps) {
  const [parsedSections, setParsedSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Parse content into sections
    const parseSections = () => {
      const sectionList: Section[] = [];
      
      // Try to parse timestamp format (00:00: content)
      const timestampRegex = /^(\d{2}:\d{2}):\s*(.+)$/gm;
      let match;
      let lastIndex = 0;
      
      while ((match = timestampRegex.exec(content)) !== null) {
        sectionList.push({
          timestamp: match[1],
          content: match[2].trim(),
          title: extractTitle(match[2])
        });
        lastIndex = match.index + match[0].length;
      }
      
      // If no timestamp format found, try to parse range format (0-300 seconds: content)
      if (sectionList.length === 0) {
        const rangeRegex = /^(\d+)-(\d+)\s*seconds?:\s*\(([^)]+)\)\s*(.+?)(?=\n\n|\n\d+-\d+\s*seconds?:|$)/gms;
        while ((match = rangeRegex.exec(content)) !== null) {
          const startTime = parseInt(match[1]);
          const endTime = parseInt(match[2]);
          sectionList.push({
            timestamp: formatTimestamp(startTime),
            content: match[4].trim(),
            title: match[3],
            duration: endTime - startTime
          });
        }
      }
      
      setParsedSections(sectionList);
    };

    parseSections();
  }, [content]);

  const extractTitle = (text: string): string => {
    // Extract title from content (first sentence or until comma)
    const match = text.match(/^([^.,:]+)/);
    return match ? match[1].trim() : 'Section';
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSectionEdit = (index: number, newContent: string) => {
    const newSections = [...parsedSections];
    newSections[index].content = newContent;
    
    // Rebuild the full content
    const newFullContent = newSections.map(section => {
      if (section.duration) {
        // Range format
        const endSeconds = parseInt(section.timestamp.split(':')[0]) * 60 + 
                         parseInt(section.timestamp.split(':')[1]) + 
                         section.duration;
        return `${parseInt(section.timestamp.split(':')[0]) * 60 + parseInt(section.timestamp.split(':')[1])}-${endSeconds} seconds: (${section.title})\n${section.content}`;
      } else {
        // Timestamp format
        return `${section.timestamp}: ${section.content}`;
      }
    }).join('\n\n');
    
    onChange(newFullContent);
  };

  const addNewSection = () => {
    const lastSection = parsedSections[parsedSections.length - 1];
    let newTimestamp = '00:00';
    
    if (lastSection) {
      // Calculate next timestamp
      const [mins, secs] = lastSection.timestamp.split(':').map(Number);
      const totalSeconds = mins * 60 + secs + (lastSection.duration || 30);
      newTimestamp = formatTimestamp(totalSeconds);
    }
    
    const newContent = content + `\n\n${newTimestamp}: New section content here`;
    onChange(newContent);
  };

  const deleteSection = (index: number) => {
    const newSections = parsedSections.filter((_, i) => i !== index);
    const newFullContent = newSections.map(section => {
      return `${section.timestamp}: ${section.content}`;
    }).join('\n\n');
    onChange(newFullContent);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Document Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 text-gray-500 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Total Duration: {Math.ceil(parsedSections.reduce((acc, s) => {
            const [mins, secs] = s.timestamp.split(':').map(Number);
            return Math.max(acc, mins * 60 + secs + (s.duration || 0));
          }, 0) / 60)} minutes</span>
        </div>
      </div>

      {/* Section Navigation */}
      {parsedSections.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Navigation</h3>
          <div className="flex flex-wrap gap-2">
            {parsedSections.map((section, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedSection(index);
                  // Scroll to section
                  const element = document.getElementById(`section-${index}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedSection === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {section.timestamp} - {section.title || `Section ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {parsedSections.map((section, index) => (
          <div
            key={index}
            id={`section-${index}`}
            className={`group relative bg-white rounded-lg border-2 transition-all ${
              selectedSection === index
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono text-sm font-medium text-gray-900">{section.timestamp}</span>
                </div>
                {section.duration && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {section.duration}s
                  </span>
                )}
                {section.title && (
                  <h3 className="text-base font-medium text-gray-800">{section.title}</h3>
                )}
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <button
                  onClick={() => deleteSection(index)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                  title="Delete section"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Section Content */}
            <div className="p-4">
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleSectionEdit(index, e.currentTarget.textContent || '')}
                className="min-h-[60px] text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-2"
                dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br>') }}
              />
            </div>
          </div>
        ))}
        
        {/* Add Section Button */}
        <button
          onClick={addNewSection}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Section
        </button>
      </div>

      {/* Fallback for raw editing */}
      {parsedSections.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onChange(e.currentTarget.textContent || '')}
            className="min-h-[400px] text-gray-700 leading-relaxed focus:outline-none whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
    </div>
  );
}