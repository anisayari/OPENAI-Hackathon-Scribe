'use client';

import { useState, useEffect, useRef } from 'react';

export interface ThinkingEvent {
  id: string;
  type: 'thinking' | 'tool_call' | 'handoff' | 'complete';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface AgentThinkingPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AgentThinkingPanel({ isOpen, onToggle }: AgentThinkingPanelProps) {
  const [events, setEvents] = useState<ThinkingEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to thinking events
  useEffect(() => {
    const handleThinkingEvent = (event: CustomEvent<ThinkingEvent>) => {
      setEvents(prev => [...prev, event.detail]);
    };

    window.addEventListener('agent-thinking' as any, handleThinkingEvent);
    return () => {
      window.removeEventListener('agent-thinking' as any, handleThinkingEvent);
    };
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getEventIcon = (type: ThinkingEvent['type']) => {
    switch (type) {
      case 'thinking':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'tool_call':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'handoff':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'complete':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getEventColor = (type: ThinkingEvent['type']) => {
    switch (type) {
      case 'thinking': return 'text-blue-600 bg-blue-50';
      case 'tool_call': return 'text-purple-600 bg-purple-50';
      case 'handoff': return 'text-orange-600 bg-orange-50';
      case 'complete': return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-full bg-white border-l border-gray-200 transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`} style={{ width: '320px', marginTop: '60px' }}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-900">Agent Thinking</h2>
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight: 'calc(100vh - 140px)' }}
      >
        {events.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p>Agent thinking will appear here</p>
            <p className="text-xs text-gray-400 mt-1">Start voice input to see the process</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="animate-fadeIn">
              <div className={`flex items-start space-x-3 p-3 rounded-lg ${getEventColor(event.type).split(' ')[1]}`}>
                <div className={`p-1.5 rounded-full ${getEventColor(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{event.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {event.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => setEvents([])}
          className="w-full text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded hover:bg-gray-100 transition-colors"
        >
          Clear thinking log
        </button>
      </div>
    </div>
  );
}