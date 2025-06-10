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
  const [inspirationalText, setInspirationalText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
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

  // Inspirational text animation
  useEffect(() => {
    if (thoughts.length > 0 || !isVisible) return;

    const inspirationalMessages = [
      "I'm assembling my team of expert agents...",
      "Together, we'll create something extraordinary...",
      "Analyzing your vision and crafting the perfect narrative...",
      "Our AI agents are collaborating to bring your ideas to life...",
      "Preparing to transform your concept into compelling content...",
      "Let's create a masterpiece together..."
    ];

    const fullText = inspirationalMessages.join(' ');
    const words = fullText.split(' ');
    
    const interval = setInterval(() => {
      setCurrentWordIndex(prev => {
        if (prev >= words.length - 1) {
          return 0; // Loop back to start
        }
        return prev + 1;
      });
    }, 200); // Add a new word every 200ms

    return () => clearInterval(interval);
  }, [thoughts.length, isVisible]);

  useEffect(() => {
    const inspirationalMessages = [
      "I'm assembling my team of expert agents...",
      "Together, we'll create something extraordinary...",
      "Analyzing your vision and crafting the perfect narrative...",
      "Our AI agents are collaborating to bring your ideas to life...",
      "Preparing to transform your concept into compelling content...",
      "Let's create a masterpiece together..."
    ];

    const fullText = inspirationalMessages.join(' ');
    const words = fullText.split(' ');
    
    setInspirationalText(words.slice(0, currentWordIndex + 1).join(' '));
  }, [currentWordIndex]);

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
      'Advanced Research Agent': 'bg-indigo-100 border-indigo-300',
      'Showrunner Agent': 'bg-pink-100 border-pink-300',
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
                <div className="relative mb-8">
                  <div className="w-32 h-32 relative">
                    {/* Outer rotating ring */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-spin" />
                    <div className="absolute inset-1 bg-white rounded-full" />
                    
                    {/* Inner pulsing core */}
                    <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                    
                    {/* Orbiting dots */}
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full -mt-1.5" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-400 rounded-full -mb-1.5" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-pink-400 rounded-full -ml-1.5" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-400 rounded-full -mr-1.5" />
                    </div>
                  </div>
                </div>
                
                <div className="text-center max-w-2xl px-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Initializing AI Agents
                  </h3>
                  
                  <div className="min-h-[80px] flex items-center justify-center">
                    <p className="text-lg text-gray-600 leading-relaxed animate-fade-in">
                      {inspirationalText}<span className="animate-pulse">|</span>
                    </p>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-center gap-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>Systems Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span>Agents Activating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      <span>Ready to Create</span>
                    </div>
                  </div>
                </div>
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
              {['Coordinator Agent', 'Research Agent', 'Structure Agent', 'Writing Agent', 'Advanced Research Agent', 'Showrunner Agent'].map((agent) => {
                const isActive = activeAgent === agent;
                const agentStats = {
                  'Coordinator Agent': { icon: '🎯', color: 'purple', tasks: thoughts.filter(t => t.agentName === agent).length },
                  'Research Agent': { icon: '🔍', color: 'blue', tasks: thoughts.filter(t => t.agentName === agent).length },
                  'Structure Agent': { icon: '📋', color: 'green', tasks: thoughts.filter(t => t.agentName === agent).length },
                  'Writing Agent': { icon: '✍️', color: 'yellow', tasks: thoughts.filter(t => t.agentName === agent).length },
                  'Advanced Research Agent': { icon: '🔬', color: 'indigo', tasks: thoughts.filter(t => t.agentName === agent).length },
                  'Showrunner Agent': { icon: '🎬', color: 'pink', tasks: thoughts.filter(t => t.agentName === agent).length },
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