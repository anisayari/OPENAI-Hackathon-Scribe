'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [mcpServer, setMcpServer] = useState('youtube')
  const [youtubeKey, setYoutubeKey] = useState('')
  const [targetDuration, setTargetDuration] = useState(1500)
  const [searchEnabled, setSearchEnabled] = useState(true)
  const [customScripts, setCustomScripts] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return
    }

    // Extract title and idea from prompt
    const lines = prompt.split('\n')
    const title = lines[0] || ''
    const idea = lines.slice(1).join('\n') || ''

    if (!title || !idea) {
      alert('Please include a title and description')
      return
    }

    setIsLoading(true)
    setResults([])

    try {
      const response = await fetch('/api/ai/explore-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          idea,
          mcpServer,
          youtubeKey,
          targetDuration,
          searchEnabled,
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">AI Video Script & Storyboard Generator</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What do you want to create today?

Enter your video title on the first line, then describe your idea...

Example:
The Fascinating Story of Marie Curie
I want to create a biographical video about Marie Curie, emphasizing her revolutionary scientific discoveries and the obstacles she had to overcome as a woman in the early 20th century scientific world."
                  className="w-full h-48 p-4 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none resize-none"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !prompt.trim()}
                  className={`absolute bottom-3 right-3 p-2 rounded-md transition-all ${
                    isLoading || !prompt.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              
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
        </div>
      </div>
    </div>
  )
}