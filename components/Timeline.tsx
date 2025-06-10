'use client';

import React from 'react';

interface TimelineSection {
  timeStart: number;
  timeEnd: number;
  title: string;
  content: string;
  color?: string;
}

interface TimelineProps {
  script: string;
  totalDuration: number;
}

export default function Timeline({ script, totalDuration }: TimelineProps) {
  // Parse script to extract timeline sections
  const parseScript = (scriptContent: string): TimelineSection[] => {
    const sections: TimelineSection[] = [];
    
    // Try timestamp format first (00:00: content)
    const timestampRegex = /^(\d{2}:\d{2}):\s*(.+)$/gm;
    let matches = Array.from(scriptContent.matchAll(timestampRegex));
    
    if (matches.length > 0) {
      matches.forEach((match, index) => {
        const [, timestamp, content] = match;
        const [mins, secs] = timestamp.split(':').map(Number);
        const timeStart = mins * 60 + secs;
        
        // Calculate end time based on next timestamp or default duration
        let timeEnd = timeStart + 30; // Default 30 seconds
        if (index < matches.length - 1) {
          const nextMatch = matches[index + 1];
          const [nextMins, nextSecs] = nextMatch[1].split(':').map(Number);
          timeEnd = nextMins * 60 + nextSecs;
        }
        
        sections.push({
          timeStart,
          timeEnd,
          title: `Part ${index + 1}`,
          content: content.trim()
        });
      });
    } else {
      // Try range format (0-300 seconds: (Act 1) content)
      const lines = scriptContent.split('\n');
      lines.forEach((line) => {
        const match = line.match(/^(\d+)-(\d+)\s*seconds?:\s*\(([^)]+)\)\s*(.+)/);
        if (match) {
          const [, startStr, endStr, title, content] = match;
          sections.push({
            timeStart: parseInt(startStr),
            timeEnd: parseInt(endStr),
            title,
            content: content.trim()
          });
        }
      });
    }
    
    return sections;
  };

  const sections = parseScript(script);
  
  // Calculate colors for each section
  const getColorForSection = (index: number): string => {
    const colors = [
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const extractKeywords = (text: string): string[] => {
    // Simple keyword extraction - extract capitalized words and important phrases
    const words = text.split(/\s+/);
    const keywords: string[] = [];
    
    words.forEach(word => {
      // Remove punctuation
      const cleanWord = word.replace(/[.,!?;:'"]/g, '');
      // Check if word starts with capital letter and is not at sentence start
      if (cleanWord.length > 3 && /^[A-Z]/.test(cleanWord)) {
        keywords.push(cleanWord);
      }
    });
    
    // Also extract some common important words
    const importantWords = ['communication', 'barrier', 'language', 'culture', 'understanding', 'solution'];
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:'"]/g, '');
      if (importantWords.includes(cleanWord) && !keywords.includes(cleanWord)) {
        keywords.push(cleanWord);
      }
    });
    
    return [...new Set(keywords)].slice(0, 5); // Return max 5 unique keywords
  };

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No timeline data available. Script format not recognized.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Timeline Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Video Timeline</h2>
          <p className="text-lg text-gray-600">Total Duration: {formatTime(totalDuration)}</p>
          <div className="mt-4 inline-flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
              </svg>
              {sections.length} Sections
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(totalDuration)}
            </span>
          </div>
        </div>

        {/* Timeline Bar */}
        <div className="relative mb-12">
          <div className="w-full h-16 bg-gray-200 rounded-lg overflow-hidden flex">
            {sections.map((section, index) => {
              const widthPercentage = ((section.timeEnd - section.timeStart) / totalDuration) * 100;
              return (
                <div
                  key={index}
                  className={`h-full ${getColorForSection(index)} relative group cursor-pointer transition-all hover:opacity-90`}
                  style={{ width: `${widthPercentage}%` }}
                  title={`${section.title}: ${formatTime(section.timeStart)} - ${formatTime(section.timeEnd)}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xs font-medium px-1 truncate">
                      {section.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Time markers */}
          <div className="absolute w-full flex justify-between mt-2 text-xs text-gray-600">
            <span>0:00</span>
            <span>{formatTime(totalDuration / 2)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Timeline Details */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Connection Line */}
              {index < sections.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-300" />
              )}
              
              <div className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Section Header */}
                <div className={`${getColorForSection(index)} bg-opacity-10 p-6 border-b border-gray-100`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${getColorForSection(index)} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm font-medium text-gray-600">
                            {formatTime(section.timeStart)} → {formatTime(section.timeEnd)}
                          </span>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {section.timeEnd - section.timeStart}s
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Visual Indicator */}
                    <div className="hidden group-hover:flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Section Content */}
                <div className="p-6">
                  <p className="text-gray-700 leading-relaxed text-base">{section.content}</p>
                  
                  {/* Visual Elements */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {extractKeywords(section.content).map((keyword, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Section Progress</span>
                      <span>{Math.round(((section.timeEnd - section.timeStart) / totalDuration) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${getColorForSection(index)} bg-opacity-80 transition-all duration-300`}
                        style={{ width: `${((section.timeEnd - section.timeStart) / totalDuration) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Timeline Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Sections</p>
              <p className="text-2xl font-bold text-gray-900">{sections.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(totalDuration)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Section</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(Math.floor(totalDuration / sections.length))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Script Type</p>
              <p className="text-2xl font-bold text-gray-900">Video</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}