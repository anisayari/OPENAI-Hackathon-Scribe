'use client';

import { useState, useEffect, useRef } from 'react';
import { Agent, run } from '@openai/agents';

interface VoiceControlProps {
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  scriptId: string;
  onScriptUpdate: (content: string) => void;
}

export default function VoiceControl({ 
  isListening, 
  setIsListening, 
  scriptId, 
  onScriptUpdate 
}: VoiceControlProps) {
  const [ephemeralKey, setEphemeralKey] = useState<string>('');
  const [status, setStatus] = useState<string>('Disconnected');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create the script generation agent
  const scriptAgent = new Agent({
    name: 'Script Creator',
    instructions: `You are a professional scriptwriter assistant. Help the user create, edit, and improve their scripts. 
    When the user speaks, transcribe their speech and convert it into properly formatted script content. 
    Maintain proper script formatting with scene headings, character names, dialogue, and action lines.
    Be creative and helpful in developing their ideas into compelling scripts.`,
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
      setStatus('Failed to get token');
      return;
    }
    setEphemeralKey(token);

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
      pc.addTrack(stream.getTracks()[0]);
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      setStatus('Microphone access denied');
      return;
    }

    // Set up data channel for events
    const dc = pc.createDataChannel('oai-events');
    dcRef.current = dc;

    dc.addEventListener('open', () => {
      setStatus('Connected');
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
          if (data.item.type === 'message' && data.item.role === 'user') {
            // Process user input with agent
            const result = await run(scriptAgent, data.item.content[0].transcript);
            if (result.finalOutput) {
              onScriptUpdate(result.finalOutput);
            }
          }
          break;
        
        case 'response.audio_transcript.done':
          // Update script with assistant's response
          if (data.transcript) {
            onScriptUpdate(prev => prev + '\n\n' + data.transcript);
          }
          break;
        
        case 'error':
          console.error('Realtime API error:', data.error);
          setStatus('Error: ' + data.error.message);
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
    setStatus('Connected to OpenAI Realtime');
  };

  // Toggle listening
  const toggleListening = async () => {
    if (!isListening) {
      await initializeWebRTC();
      setIsListening(true);
    } else {
      // Close connections
      if (dcRef.current) {
        dcRef.current.close();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsListening(false);
      setStatus('Disconnected');
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
      <div>
        <h3 className="text-lg font-semibold">Voice Control</h3>
        <p className="text-sm text-gray-600">{status}</p>
      </div>
      
      <button
        onClick={toggleListening}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
    </div>
  );
}