'use client';

import React, { useState } from 'react';
import { mockScripts } from '@/lib/mock-data';

export default function TestAnalysisPage() {
  const [selectedScript, setSelectedScript] = useState('spacex');
  const [customScript, setCustomScript] = useState('');
  const [context, setContext] = useState('');
  const [duration, setDuration] = useState('180');
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const scriptToAnalyze = selectedScript === 'custom' ? customScript : mockScripts[selectedScript as keyof typeof mockScripts];

    try {
      const response = await fetch('/api/ai/analyze-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: scriptToAnalyze,
          context,
          duration: parseInt(duration),
          testMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze script');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Test Script Analysis API</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium">Test Mode (Use Mock Data)</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, uses mock data instead of calling OpenAI API
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Script</label>
                <select
                  value={selectedScript}
                  onChange={(e) => setSelectedScript(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="spacex">SpaceX Story</option>
                  <option value="mariecurie">Marie Curie Biography</option>
                  <option value="cooking">Carbonara Tutorial</option>
                  <option value="custom">Custom Script</option>
                </select>
              </div>

              {selectedScript === 'custom' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Custom Script</label>
                  <textarea
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                    className="w-full p-2 border rounded-md h-32"
                    placeholder="Enter your script here..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Context (Optional)</label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., Script pour une vidéo YouTube"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="180"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? 'Analyzing...' : 'Analyze Script'}
              </button>
            </div>
          </div>

          {/* Script Preview */}
          {selectedScript !== 'custom' && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Script Preview</h3>
              <pre className="text-sm whitespace-pre-wrap">
                {mockScripts[selectedScript as keyof typeof mockScripts]}
              </pre>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Analysis Results</h2>
                {result._testMode && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                    Test Mode
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {/* Idea Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Idea Details</h3>
                  <div className="bg-gray-50 p-4 rounded space-y-2">
                    <p><strong>Main Concept:</strong> {result.idea_details.main_concept}</p>
                    <p><strong>Unique Angle:</strong> {result.idea_details.unique_angle}</p>
                    <p><strong>Value Proposition:</strong> {result.idea_details.value_proposition}</p>
                    <div>
                      <strong>Key Points:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {result.idea_details.key_points.map((point: string, index: number) => (
                          <li key={index} className="text-sm">{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Things to Explore */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Things to Explore</h3>
                  <div className="space-y-2">
                    {result.things_to_explore.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">{item.topic}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.why_interesting}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          <strong>Potential:</strong> {item.potential_content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Keywords & Tags</h3>
                  <div className="space-y-2">
                    <div>
                      <strong className="text-sm">Primary:</strong>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {result.keywords.primary.map((keyword: string, index: number) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong className="text-sm">YouTube Tags:</strong>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {result.keywords.youtube_tags.slice(0, 5).map((tag: string, index: number) => (
                          <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw JSON */}
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  View Raw JSON Response
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}