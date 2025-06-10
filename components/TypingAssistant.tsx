'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Loader2, X, Lightbulb, AlertCircle } from 'lucide-react';
import { debounce } from 'lodash';

interface TypingAssistantProps {
  content: string;
  onSuggestion: (suggestion: string) => void;
}

interface Suggestion {
  type: 'grammar' | 'style' | 'idea' | 'continuation';
  text: string;
  reason?: string;
}

export default function TypingAssistant({ content, onSuggestion }: TypingAssistantProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastTypedText, setLastTypedText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Analyze content for suggestions
  const analyzeContent = useCallback(async (text: string) => {
    if (!text || text.length < 10) {
      setSuggestions([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsAnalyzing(true);

    try {
      // Get the last paragraph or last 200 characters
      const contextText = text.split('\n\n').pop() || text.slice(-200);
      
      const response = await fetch('/api/ai/analyze-typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contextText }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to analyze');

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error analyzing content:', error);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Debounced analysis
  const debouncedAnalyze = useCallback(
    debounce((text: string) => {
      analyzeContent(text);
    }, 1000),
    [analyzeContent]
  );

  // Watch for content changes
  useEffect(() => {
    // Only analyze if the content has actually changed
    if (content !== lastTypedText) {
      setLastTypedText(content);
      // Extract the current paragraph for analysis
      const currentParagraph = content.split(/<p>|<\/p>/).filter(Boolean).pop() || '';
      if (currentParagraph.length > 20) { // Only analyze if the paragraph is long enough
        debouncedAnalyze(currentParagraph);
      }
    }
  }, [content, lastTypedText, debouncedAnalyze]);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Show AI Assistant"
      >
        <Bot className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">AI Writing Assistant</h3>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="hover:bg-white/20 p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Analyzing your writing...</span>
          </div>
        )}

        {suggestions.length === 0 && !isAnalyzing && (
          <div className="text-center py-8 text-gray-500">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Keep typing, and I'll provide suggestions!</p>
          </div>
        )}

        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="mb-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onSuggestion(suggestion.text)}
          >
            <div className="flex items-start gap-2">
              {suggestion.type === 'idea' ? (
                <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5" />
              ) : suggestion.type === 'grammar' ? (
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              ) : (
                <Bot className="w-4 h-4 text-blue-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm text-gray-800">{suggestion.text}</p>
                {suggestion.reason && (
                  <p className="text-xs text-gray-600 mt-1">{suggestion.reason}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
        <p className="text-xs text-gray-600">
          {content.length > 0 
            ? `Monitoring ${content.split(' ').length} words`
            : 'Start typing to get suggestions'
          }
        </p>
      </div>
    </div>
  );
}