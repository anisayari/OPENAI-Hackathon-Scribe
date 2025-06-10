'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AgentThought {
  agentName: string;
  thought: string;
  timestamp: number;
  type: 'reasoning' | 'action' | 'observation' | 'decision';
}

interface AgentAction {
  agentName: string;
  action: string;
  parameters: any;
  timestamp: number;
}

interface AgentThinkingPanelProps {
  isVisible: boolean;
  sessionId?: string;
}

export default function AgentThinkingPanel({ isVisible, sessionId }: AgentThinkingPanelProps) {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState(0);
  const thoughtsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isVisible || !sessionId) return;

    // Connect to SSE endpoint for real-time updates
    const eventSource = new EventSource(`/api/ai/agent-stream?sessionId=${sessionId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener('thought', (event) => {
      const thought: AgentThought = JSON.parse(event.data);
      setThoughts(prev => [...prev, thought]);
      setActiveAgent(thought.agentName);
    });

    eventSource.addEventListener('action', (event) => {
      const action: AgentAction = JSON.parse(event.data);
      setActions(prev => [...prev, action]);
    });

    eventSource.addEventListener('agent-change', (event) => {
      const { agentName } = JSON.parse(event.data);
      setActiveAgent(agentName);
    });

    eventSource.addEventListener('progress', (event) => {
      const { percentage } = JSON.parse(event.data);
      setProgress(percentage);
    });

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [isVisible, sessionId]);

  useEffect(() => {
    // Auto-scroll to latest thought
    thoughtsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thoughts]);

  const getThoughtIcon = (type: AgentThought['type']) => {
    switch (type) {
      case 'reasoning':
        return '🤔';
      case 'action':
        return '⚡';
      case 'observation':
        return '👁️';
      case 'decision':
        return '✓';
      default:
        return '💭';
    }
  };

  const getAgentColor = (agentName: string) => {
    const colors = {
      'Coordinator Agent': 'bg-purple-100 border-purple-300',
      'Research Agent': 'bg-blue-100 border-blue-300',
      'Structure Agent': 'bg-green-100 border-green-300',
      'Writing Agent': 'bg-yellow-100 border-yellow-300',
    };
    return colors[agentName as keyof typeof colors] || 'bg-gray-100 border-gray-300';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-8">
      <div className="w-full max-w-6xl h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Agents at Work</h2>
              <p className="text-gray-600 mt-1">Watch as our AI agents collaborate to create your script</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? 'Processing' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Thoughts Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {thoughts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin" />
                  <div className="absolute inset-2 bg-white rounded-full" />
                  <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                </div>
                <p className="mt-6 text-lg text-gray-600">Initializing AI agents...</p>
                <p className="mt-2 text-sm text-gray-500">This may take a few moments</p>
              </div>
            ) : (
              thoughts.map((thought, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${getAgentColor(thought.agentName)} transition-all duration-300 transform ${
                    index === thoughts.length - 1 ? 'scale-105 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getThoughtIcon(thought.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {thought.agentName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(thought.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-base text-gray-700 leading-relaxed">{thought.thought}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={thoughtsEndRef} />
          </div>
          
          {/* Agent Status Sidebar */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Agents</h3>
            <div className="space-y-4">
              {['Coordinator Agent', 'Research Agent', 'Structure Agent', 'Writing Agent'].map((agent) => {
                const isActive = activeAgent === agent;
                const agentStats = {
                  'Coordinator Agent': { icon: '🎯', color: 'purple', tasks: thoughts.filter(t => t.agentName === agent).length },
                  'Research Agent': { icon: '🔍', color: 'blue', tasks: thoughts.filter(t => t.agentName === agent).length },
                  'Structure Agent': { icon: '📋', color: 'green', tasks: thoughts.filter(t => t.agentName === agent).length },
                  'Writing Agent': { icon: '✍️', color: 'yellow', tasks: thoughts.filter(t => t.agentName === agent).length },
                };
                const stats = agentStats[agent as keyof typeof agentStats];
                
                return (
                  <div
                    key={agent}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      isActive
                        ? `bg-${stats.color}-100 border-${stats.color}-400 shadow-md`
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{stats.icon}</span>
                        <div>
                          <p className="font-medium text-gray-800">{agent}</p>
                          <p className="text-sm text-gray-600">
                            {stats.tasks} thoughts
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Key Insights */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Key Insights</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  <span>Multiple agents working in parallel</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  <span>Real-time collaboration</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  <span>Context-aware processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {thoughts.length} thoughts processed • {actions.length} actions taken
            </p>
            <p className="text-sm text-gray-500">
              Powered by advanced AI orchestration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}