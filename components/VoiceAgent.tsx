'use client';

import { useEffect, useRef } from 'react';
import { Agent, run } from '@openai/agents';
import { ThinkingEvent } from './AgentThinkingPanel';

interface VoiceAgentProps {
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  onScriptUpdate: (content: string) => void;
}

// Helper function to emit thinking events
const emitThinkingEvent = (event: Omit<ThinkingEvent, 'id' | 'timestamp'>) => {
  window.dispatchEvent(new CustomEvent('agent-thinking', {
    detail: {
      ...event,
      id: `event-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    }
  }));
};

export default function VoiceAgent({ 
  isListening, 
  setIsListening, 
  onScriptUpdate 
}: VoiceAgentProps) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Create the script generation agent
  const scriptAgent = new Agent({
    name: 'AI Script Assistant',
    instructions: `You are an intelligent writing assistant. Help the user write and format their document.
    When the user speaks, convert their speech into well-formatted text.
    Use proper grammar, punctuation, and formatting.
    If they ask you to format as a script, use proper script formatting.
    Be helpful and creative in developing their ideas.`,
  });

  // Get ephemeral token from backend
  const getEphemeralToken = async () => {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
      });
      const data = await response.json();
      return data.client_secret.value;
    } catch (error) {
      console.error('Failed to get ephemeral token:', error);
      return null;
    }
  };

  // Initialize WebRTC connection
  const initializeWebRTC = async () => {
    const token = await getEphemeralToken();
    if (!token) {
      console.error('Failed to get token');
      return;
    }

    // Create peer connection
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    // Set up audio element for playback
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audioRef.current = audio;
    
    pc.ontrack = (e) => {
      audio.srcObject = e.streams[0];
    };

    // Add microphone input
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      return;
    }

    // Set up data channel for events
    const dc = pc.createDataChannel('oai-events');
    dcRef.current = dc;

    dc.addEventListener('open', () => {
      // Send initial session configuration
      dc.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: scriptAgent.instructions,
          voice: 'verse',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          }
        }
      }));
    });

    dc.addEventListener('message', async (event) => {
      const data = JSON.parse(event.data);
      
      // Handle different event types
      switch (data.type) {
        case 'conversation.item.created':
          if (data.item.type === 'message' && data.item.role === 'user' && data.item.content[0]?.transcript) {
            const userInput = data.item.content[0].transcript;
            
            // Emit thinking event for user input
            emitThinkingEvent({
              type: 'thinking',
              content: `Processing: "${userInput}"`,
            });
            
            // Get active fine-tuned model if available
            let modelToUse = scriptAgent;
            try {
              const modelResponse = await fetch('/api/fine-tuning/set-model');
              const modelData = await modelResponse.json();
              if (modelData.activeModel && modelData.activeModel !== 'gpt-4o-mini-2024-07-18') {
                // Create agent with fine-tuned model
                modelToUse = new Agent({
                  name: 'Fine-tuned Script Assistant',
                  instructions: scriptAgent.instructions,
                  model: modelData.activeModel,
                });
              }
            } catch (error) {
              console.log('Using default model');
            }

            // Process user input with agent using streaming
            const stream = await run(modelToUse, userInput, { stream: true });
            
            let fullContent = '';
            
            // Process streaming events
            for await (const streamEvent of stream) {
              // Track different event types
              if (streamEvent.type === 'agent_updated_stream_event') {
                emitThinkingEvent({
                  type: 'handoff',
                  content: `Agent active: ${streamEvent.agent.name}`,
                });
              }
              
              if (streamEvent.type === 'run_item_stream_event') {
                const item = streamEvent.item;
                
                // Track tool calls
                if (item.type === 'tool_call') {
                  emitThinkingEvent({
                    type: 'tool_call',
                    content: `Using tool: ${item.name}`,
                    metadata: item
                  });
                }
                
                // Track messages
                if (item.type === 'message' && item.content) {
                  fullContent = item.content;
                  emitThinkingEvent({
                    type: 'thinking',
                    content: `Generating response...`,
                  });
                }
              }
            }
            
            // Wait for completion
            await stream.completed;
            
            // Update document with final content
            if (fullContent) {
              onScriptUpdate(prev => {
                const newContent = prev ? prev + '<p>' + fullContent + '</p>' : '<p>' + fullContent + '</p>';
                return newContent;
              });
              
              emitThinkingEvent({
                type: 'complete',
                content: 'Response added to document',
              });
            }
          }
          break;
        
        case 'response.audio_transcript.done':
          // Update with assistant's response if needed
          if (data.transcript) {
            emitThinkingEvent({
              type: 'thinking',
              content: 'Voice response received',
            });
            
            onScriptUpdate(prev => {
              const newContent = prev ? prev + '<p>' + data.transcript + '</p>' : '<p>' + data.transcript + '</p>';
              return newContent;
            });
          }
          break;
        
        case 'error':
          console.error('Realtime API error:', data.error);
          emitThinkingEvent({
            type: 'complete',
            content: `Error: ${data.error.message || 'Unknown error'}`,
          });
          break;
      }
    });

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = 'https://api.openai.com/v1/realtime';
    const model = 'gpt-4o-realtime-preview-2025-06-03';
    
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/sdp'
      },
    });

    const answer = {
      type: 'answer' as RTCSdpType,
      sdp: await sdpResponse.text(),
    };
    
    await pc.setRemoteDescription(answer);
  };

  useEffect(() => {
    if (isListening) {
      initializeWebRTC();
    } else {
      // Clean up connections
      if (dcRef.current) {
        dcRef.current.close();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [isListening]);

  return null; // This component doesn't render anything
}