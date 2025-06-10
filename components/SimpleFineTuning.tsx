'use client';

import { useState } from 'react';
import FileUpload from './FileUpload';

export default function SimpleFineTuning() {
  const [uploadedContent, setUploadedContent] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFilesProcessed = (content: string[]) => {
    setUploadedContent(content);
  };

  const startFineTuning = async () => {
    if (uploadedContent.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare training data from uploaded content
      const allContent = uploadedContent.join('\n\n');
      const paragraphs = allContent
        .split(/\n\s*\n/)
        .filter(p => p.trim() && p.length > 50)
        .slice(0, 20); // Limit for testing

      const trainingData = [];
      for (let i = 0; i < paragraphs.length - 1; i++) {
        trainingData.push({
          messages: [
            {
              role: "system",
              content: "You are a professional writer. Continue writing in the same style and tone."
            },
            {
              role: "user", 
              content: paragraphs[i].trim()
            },
            {
              role: "assistant",
              content: paragraphs[i + 1].trim()
            }
          ]
        });
      }

      console.log('Prepared training data:', trainingData);

      const response = await fetch('/api/fine-tuning/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          training_data: trainingData,
          model: 'gpt-4o-mini-2024-07-18',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create fine-tuning job');
      }

      setResult(data);
      alert(`Fine-tuning job created! ID: ${data.id}`);
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Simple Fine-tuning Test</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Your Writing Sample</h3>
        <FileUpload onFilesProcessed={handleFilesProcessed} />
      </div>

      {uploadedContent.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Processing Summary</h3>
          <p className="text-sm text-gray-600">
            {uploadedContent.length} file(s) uploaded
          </p>
          <p className="text-sm text-gray-600">
            Total words: {uploadedContent.join(' ').split(/\s+/).length}
          </p>
        </div>
      )}

      {result && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">Fine-tuning Job Created</h3>
          <p className="text-sm text-green-700">ID: {result.id}</p>
          <p className="text-sm text-green-700">Status: {result.status}</p>
        </div>
      )}

      <button
        onClick={startFineTuning}
        disabled={uploadedContent.length === 0 || isLoading}
        className={`w-full py-2 px-4 text-sm font-medium rounded-md ${
          uploadedContent.length === 0 || isLoading
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Creating Fine-tuning Job...' : 'Start Fine-tuning'}
      </button>
    </div>
  );
}