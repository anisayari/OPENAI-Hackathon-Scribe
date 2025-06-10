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
    const lines = scriptContent.split('\n');
    
    lines.forEach((line) => {
      // Match patterns like "0-300 seconds: (Act 1)" or "300-600 seconds: (Act 2)"
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Timeline</h2>
          <p className="text-gray-600">Total Duration: {formatTime(totalDuration)}</p>
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
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-4 h-4 ${getColorForSection(index)} rounded-full mt-1`} />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    <span className="text-sm text-gray-500">
                      {formatTime(section.timeStart)} - {formatTime(section.timeEnd)}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  
                  {/* Progress indicator */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Duration</span>
                      <span>{section.timeEnd - section.timeStart}s</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getColorForSection(index)} opacity-60`}
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