'use client'

import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AgentThinkingPanel from '@/components/AgentThinkingPanel'

export default function Home() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [mcpServer, setMcpServer] = useState('youtube')
  const [youtubeKey, setYoutubeKey] = useState('')
  const [targetDuration, setTargetDuration] = useState(1500)
  const [searchEnabled, setSearchEnabled] = useState(true)
  const [customScripts, setCustomScripts] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [pastProjects, setPastProjects] = useState<any[]>([])
  const [showNewProject, setShowNewProject] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const testModePrompt = `I want to create a video about the evolution of humanoid robots from science fiction to economic revolution. The video should explore the history from early mechanical automatons to modern AI-powered humanoids like NVIDIA's Project GR00T and Tesla's Optimus. I'd like to cover key milestones, breakthrough technologies, and analyze the profound impact on the global economy, job markets, and society as we transition into an era where humanoid robots become commonplace.`
  const [results, setResults] = useState<any[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showAgentPanel, setShowAgentPanel] = useState(false)
  const [agentSessionId, setAgentSessionId] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordingStartTimeRef = useRef<number | null>(null)

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return
    }

    setIsLoading(true)
    setResults([])
    
    // Generate session ID for agent tracking
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setAgentSessionId(sessionId);
    setShowAgentPanel(true);

    try {
      const response = await fetch('/api/ai/explore-topic-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mcpServer,
          youtubeKey,
          targetDuration,
          searchEnabled,
          testMode,
          sessionId,
        }),
      })

      if (!response.ok) throw new Error('Error during exploration')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        const lines = text.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'youtube') {
                setResults(prev => [...prev, data])
              } else if (data.type === 'final') {
                router.push(`/doc?data=${encodeURIComponent(JSON.stringify(data.content))}`)
              }
            } catch (e) {
              console.error('Error parsing SSE:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCustomScripts(Array.from(e.target.files))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const visualizeAudio = () => {
    if (!analyserRef.current) {
      return
    }
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // Focus on voice frequency range (85-255 Hz and 500-2000 Hz)
    let maxValue = 0
    let sum = 0
    let count = 0
    
    // Sample the frequency bins that correspond to human voice
    for (let i = 10; i < 100; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i]
      }
      sum += dataArray[i]
      count++
    }
    
    // Calculate average and normalize
    const average = sum / count
    
    // Use combination of max and average for better response
    const combinedLevel = (maxValue * 0.7 + average * 0.3) / 255
    
    // Apply logarithmic scaling for better perception
    const logLevel = Math.log10(1 + combinedLevel * 9) // log10(1 to 10)
    
    // Amplify and smooth
    const amplifiedLevel = Math.min(1, logLevel * 2.5)
    
    // Apply smoothing to reduce jitter
    const currentLevel = audioLevel * 0.7 + amplifiedLevel * 0.3
    setAudioLevel(currentLevel)
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      animationFrameRef.current = requestAnimationFrame(visualizeAudio)
    } else {
      setAudioLevel(0)
    }
  }

  // Function to clean up transcribed text
  const enhanceTranscription = (text: string): string => {
    // Remove common filler words and clean up
    let enhanced = text
    
    // Remove filler words
    const fillerWords = ['uh', 'um', 'euh', 'eh', 'ah', 'uhm', 'umm', 'hmm', 'huh', 'like', 'you know']
    fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi')
      enhanced = enhanced.replace(regex, '')
    })
    
    // Clean up multiple spaces
    enhanced = enhanced.replace(/\s+/g, ' ').trim()
    
    // Fix punctuation spacing
    enhanced = enhanced.replace(/\s+([.,!?;:])/g, '$1')
    enhanced = enhanced.replace(/([.,!?;:])\s*/g, '$1 ')
    
    // Capitalize first letter
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1)
    
    // Remove trailing spaces
    enhanced = enhanced.trim()
    
    return enhanced
  }

  // Enhanced context cleaning using AI
  const enhanceContext = async () => {
    if (!prompt.trim() || isEnhancing) return
    
    console.log('Starting enhancement...')
    setIsEnhancing(true)
    try {
      const response = await fetch('/api/ai/enhance-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Enhanced text received:', data.enhancedText)
        if (data.enhancedText) {
          setPrompt(data.enhancedText)
        }
      } else {
        console.error('Enhancement response not ok')
        // Fallback to basic enhancement
        const enhanced = enhanceTranscription(prompt)
        setPrompt(enhanced)
      }
    } catch (error) {
      console.error('Error enhancing context:', error)
      // Fallback to basic enhancement
      const enhanced = enhanceTranscription(prompt)
      setPrompt(enhanced)
    } finally {
      setTimeout(() => {
        setIsEnhancing(false)
      }, 500) // Keep animation visible for a moment after completion
    }
  }

  const startRecording = async () => {
    if (isRecording || isTranscribing) return;
    
    try {
      // Clean up any existing resources first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Set up audio visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 2048
      analyserRef.current.smoothingTimeConstant = 0.3
      analyserRef.current.minDecibels = -90
      analyserRef.current.maxDecibels = -10

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        setAudioLevel(0)
        
        // Clean up resources
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try {
            await audioContextRef.current.close()
          } catch (e) {
            // Ignore error
          }
          audioContextRef.current = null
        }
        
        // Check if recording was long enough
        const recordingDuration = recordingStartTimeRef.current ? Date.now() - recordingStartTimeRef.current : 0
        
        // Process recording if we have data and it's long enough (at least 200ms)
        if (chunksRef.current.length > 0 && recordingDuration > 200) {
          setIsTranscribing(true)
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          try {
            const response = await fetch('/api/audio/transcribe', {
              method: 'POST',
              body: formData,
            })

            if (response.ok) {
              const { text } = await response.json()
              if (text && text.trim()) {
                const enhancedText = enhanceTranscription(text)
                setPrompt(prev => prev + (prev ? '\n' : '') + enhancedText)
              }
            } else {
              const error = await response.json()
              console.error('Transcription failed:', error)
              if (error.error && error.error.includes('too short')) {
                // Don't show error for recordings that are too short
              } else {
                alert('Failed to transcribe audio. Please try again.')
              }
            }
          } catch (error) {
            console.error('Error transcribing:', error)
          } finally {
            setIsTranscribing(false)
          }
        } else if (recordingDuration > 0 && recordingDuration <= 200) {
          // Recording was too short, don't process
          console.log('Recording too short, ignoring')
        }
        
        // Reset recorder reference
        mediaRecorderRef.current = null
      }

      mediaRecorder.start()
      setIsRecording(true)
      recordingStartTimeRef.current = Date.now()
      
      // Start visualization
      requestAnimationFrame(visualizeAudio)
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Unable to access microphone')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Fetch past projects
  useEffect(() => {
    fetchPastProjects()
  }, [])
  
  const fetchPastProjects = async () => {
    try {
      const response = await fetch('/api/scripts')
      if (response.ok) {
        const data = await response.json()
        setPastProjects(data.scripts || [])
      }
    } catch (error) {
      console.error('Error fetching past projects:', error)
    }
  }
  
  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    
    setDeletingId(projectId)
    try {
      const response = await fetch(`/api/scripts/${projectId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchPastProjects()
      } else {
        alert('Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">Script Generator</h1>
            </div>
            <button
              onClick={() => setShowNewProject(!showNewProject)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{showNewProject ? 'View all projects' : 'Create new topic'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {!showNewProject ? (
          /* Past Projects View */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Projects</h2>
            
            {pastProjects.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new topic.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create new topic
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pastProjects.map((project) => (
                  <div
                    key={project.id}
                    className="relative group bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
                  >
                    {/* Placeholder for future image */}
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <div 
                      onClick={() => {
                        const data = encodeURIComponent(JSON.stringify({
                          script: project.script,
                          title: project.title,
                          storyline: project.storyline,
                          targetDuration: project.targetDuration
                        }))
                        router.push(`/doc?data=${data}`)
                      }}
                      className="cursor-pointer p-6"
                    >
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {project.title || 'Untitled Script'}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Duration: {Math.floor((project.targetDuration || 0) / 60)} minutes
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteProject(project.id)
                      }}
                      disabled={deletingId === project.id}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 hover:bg-red-50 rounded-full shadow-sm"
                    >
                      {deletingId === project.id ? (
                        <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* New Project View */
          <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col">
          {/* Results */}
          {results.length > 0 && (
            <div className="mb-6 space-y-3">
              <h2 className="text-sm font-medium text-gray-700">Search Results</h2>
              {results.map((result, index) => (
                <div key={index} className="p-3 rounded-lg border border-gray-200 bg-white">
                  <div className="flex gap-3">
                    {result.thumbnail && (
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate">{result.title}</h3>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{result.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prompt Area */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-normal text-gray-900 text-center mb-8">What do you want to create today?</h1>
              <div className="relative">
                <div className={`relative bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 ${
                  isEnhancing ? 'rainbow-shadow-effect' : ''
                }`}>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your video idea in detail...

Example:
I want to create a biographical video about Marie Curie. The video should explore her revolutionary scientific discoveries, her journey from Poland to France, her pioneering work on radioactivity, becoming the first woman to win a Nobel Prize, and the obstacles she overcame as a woman in the early 20th century scientific world. Include her personal struggles, her partnership with Pierre Curie, and her lasting impact on science and society."
                    className="w-full h-48 p-4 text-gray-900 placeholder-gray-400 bg-white focus:outline-none resize-none border-0 rounded-lg"
                    disabled={isLoading || isRecording || isTranscribing || isEnhancing}
                  />
                
                  {/* Footer with buttons */}
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {/* Voice Recording Button with Audio Level Indicator */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => isRecording ? stopRecording() : startRecording()}
                          disabled={isLoading || isTranscribing || isEnhancing}
                          className={`p-1.5 rounded transition-all text-xs select-none ${
                            isRecording
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 scale-110'
                              : isTranscribing
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-gray-200 active:scale-95'
                          }`}
                          title={isRecording ? "Click to stop recording" : "Click to start recording"}
                        >
                          {isTranscribing ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                              />
                            </svg>
                          )}
                        </button>
                        
                        {/* Audio Level Visualizer */}
                        {isRecording && (
                          <div className="flex items-center gap-0.5 px-2">
                            {[...Array(5)].map((_, i) => {
                              // Create varied heights for each bar
                              const variance = 1 - (i * 0.12)
                              const barHeight = Math.max(3, Math.min(24, audioLevel * 40 * variance))
                              return (
                                <div
                                  key={i}
                                  className="w-1.5 bg-red-500 rounded-full transition-all duration-100"
                                  style={{
                                    height: `${barHeight}px`,
                                    opacity: 0.6 + (audioLevel * 0.4),
                                    transform: `scaleY(${1 + audioLevel * 0.3})`,
                                  }}
                                />
                              )
                            })}
                          </div>
                        )}
                      </div>
                      
                      {/* Attachment button placeholder */}
                      <button
                        className="p-1.5 rounded text-gray-600 hover:bg-gray-200 transition-all"
                        title="Attach files"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {prompt.length > 0 && `${prompt.split(' ').filter(w => w).length} words`}
                      </span>
                      
                      {/* Enhance Context Button */}
                      {prompt.trim() && (
                        <button
                          onClick={enhanceContext}
                          disabled={isEnhancing || isLoading}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                            isEnhancing || isLoading
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isEnhancing ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Enhancing...</span>
                            </span>
                          ) : (
                            <span>Enhance Context</span>
                          )}
                        </button>
                      )}
                      
                      {/* Submit button */}
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading || !prompt.trim()}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                          isLoading || !prompt.trim()
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generating...</span>
                          </span>
                        ) : (
                          <span>Generate</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Test Mode Indicator */}
              {testMode && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-yellow-800">
                      Test Mode Active - Using mock data (no API calls)
                    </span>
                  </div>
                </div>
              )}
              
              {/* Options below textarea */}
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                      <div className="flex gap-2">
                        {['youtube', 'tiktok', 'instagram'].map((server) => (
                          <button
                            key={server}
                            onClick={() => setMcpServer(server)}
                            className={`px-3 py-1.5 rounded-md text-sm capitalize transition-all ${
                              mcpServer === server
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {server}
                          </button>
                        ))}
                      </div>
                    </div>

                    {mcpServer === 'youtube' && (
                      <input
                        type="text"
                        placeholder="YouTube API Key"
                        value={youtubeKey}
                        onChange={(e) => setYoutubeKey(e.target.value)}
                        className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:border-gray-500 focus:outline-none"
                      />
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Duration: {targetDuration}s
                      </label>
                      <input
                        type="range"
                        min="300"
                        max="3600"
                        step="300"
                        value={targetDuration}
                        onChange={(e) => setTargetDuration(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Web Search</label>
                      <button
                        onClick={() => setSearchEnabled(!searchEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          searchEnabled ? 'bg-gray-900' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            searchEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Test Mode</label>
                      <button
                        onClick={() => {
                          const newTestMode = !testMode;
                          setTestMode(newTestMode);
                          if (newTestMode && !prompt.trim()) {
                            setPrompt(testModePrompt);
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          testMode ? 'bg-yellow-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            testMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Scripts
                      </label>
                      <input
                        type="file"
                        multiple
                        accept=".txt,.md"
                        onChange={handleFileUpload}
                        className="w-full text-sm text-gray-900 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      />
                      {customScripts.length > 0 && (
                        <p className="mt-1 text-xs text-gray-600">
                          {customScripts.length} file(s) selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* See all projects button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowNewProject(false)}
              className="text-gray-600 hover:text-gray-900 underline text-sm"
            >
              See all my projects ({pastProjects.length})
            </button>
          </div>
          
          {/* Recent projects */}
          {pastProjects.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
              <div className="grid grid-cols-3 gap-4">
                {pastProjects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="relative group bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
                  >
                    {/* Placeholder for future image */}
                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <div 
                      onClick={() => {
                        const data = encodeURIComponent(JSON.stringify({
                          script: project.script,
                          title: project.title,
                          storyline: project.storyline,
                          targetDuration: project.targetDuration
                        }))
                        router.push(`/doc?data=${data}`)
                      }}
                      className="cursor-pointer p-4"
                    >
                      <h4 className="font-medium text-gray-900 truncate">
                        {project.title || 'Untitled Script'}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {Math.floor((project.targetDuration || 0) / 60)} minutes
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteProject(project.id)
                      }}
                      disabled={deletingId === project.id}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 hover:bg-red-50 rounded-full shadow-sm"
                    >
                      {deletingId === project.id ? (
                        <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
      
      {/* Agent Thinking Panel */}
      <AgentThinkingPanel 
        isVisible={showAgentPanel} 
        sessionId={agentSessionId || undefined}
      />
    </div>
  );
}