'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import FileUpload from './FileUpload';

interface FineTuningPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentScriptId: string;
}

interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

interface FineTuningJob {
  id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  model: string;
  created_at: number;
}

export default function FineTuningPanel({ isOpen, onClose, currentScriptId }: FineTuningPanelProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [uploadedContent, setUploadedContent] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fineTuningJobs, setFineTuningJobs] = useState<FineTuningJob[]>([]);
  const [activeModel, setActiveModel] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'scripts' | 'files'>('scripts');

  // Load recent scripts
  useEffect(() => {
    if (isOpen) {
      loadRecentScripts();
      loadFineTuningJobs();
    }
  }, [isOpen]);

  const loadRecentScripts = async () => {
    console.log('Loading recent scripts from Firebase...');
    try {
      const scriptsRef = collection(db, 'scripts');
      const q = query(scriptsRef, orderBy('createdAt', 'desc'), limit(20));
      const querySnapshot = await getDocs(q);
      
      console.log('Query snapshot size:', querySnapshot.size);
      
      const loadedScripts: Script[] = [];
      querySnapshot.forEach((doc) => {
        console.log('Script doc:', doc.id, doc.data());
        if (doc.id !== currentScriptId) {
          loadedScripts.push({
            id: doc.id,
            ...doc.data()
          } as Script);
        }
      });
      
      console.log('Loaded scripts:', loadedScripts);
      setScripts(loadedScripts);
    } catch (error) {
      console.error('Error loading scripts:', error);
    }
  };

  const loadFineTuningJobs = async () => {
    try {
      const response = await fetch('/api/fine-tuning/jobs');
      const data = await response.json();
      setFineTuningJobs(data.jobs || []);
      
      // Set active model if there's a succeeded job
      const succeededJob = data.jobs?.find((job: FineTuningJob) => job.status === 'succeeded');
      if (succeededJob) {
        setActiveModel(succeededJob.model);
      }
    } catch (error) {
      console.error('Error loading fine-tuning jobs:', error);
    }
  };

  const toggleScriptSelection = (scriptId: string) => {
    setSelectedScripts(prev => 
      prev.includes(scriptId)
        ? prev.filter(id => id !== scriptId)
        : [...prev, scriptId]
    );
  };

  const prepareTrainingData = () => {
    console.log('=== Preparing Training Data ===');
    let allContent: string[] = [];

    // Add content from selected scripts
    const scriptContent = selectedScripts.map(scriptId => {
      const script = scripts.find(s => s.id === scriptId);
      return script ? script.content.replace(/<[^>]*>/g, '') : '';
    }).filter(content => content.length > 0);
    console.log('Script content pieces:', scriptContent.length);

    // Add uploaded file content
    allContent = [...scriptContent, ...uploadedContent];
    console.log('Total content pieces:', allContent.length);
    console.log('Sample content:', allContent[0]?.substring(0, 200));

    // Create training examples from all content
    const trainingExamples = allContent.map((content, contentIndex) => {
      const paragraphs = content
        .split(/\n\s*\n/)
        .filter(p => p.trim() && p.length > 50);
      console.log(`Content ${contentIndex}: ${paragraphs.length} paragraphs found`);

      // Create examples from consecutive paragraphs
      const examples = paragraphs.slice(0, -1).map((paragraph, index) => ({
        messages: [
          {
            role: "system",
            content: "You are a professional writer. Continue writing in the same style and tone as the examples provided."
          },
          {
            role: "user",
            content: paragraph.trim()
          },
          {
            role: "assistant",
            content: paragraphs[index + 1].trim()
          }
        ]
      }));
      return examples;
    }).filter(Boolean).flat();

    console.log('Total training examples created:', trainingExamples.length);
    console.log('First example:', JSON.stringify(trainingExamples[0], null, 2));

    return trainingExamples;
  };

  const handleFilesProcessed = (content: string[]) => {
    setUploadedContent(prev => [...prev, ...content]);
  };

  const startFineTuning = async () => {
    console.log('=== Starting Fine-Tuning Process ===');
    console.log('Selected scripts:', selectedScripts.length);
    console.log('Uploaded content:', uploadedContent.length);
    
    const totalContent = selectedScripts.length + uploadedContent.length;
    if (totalContent < 1) {
      alert('Please select at least 1 script or upload a file for fine-tuning');
      return;
    }

    setIsLoading(true);
    try {
      const trainingData = prepareTrainingData();
      console.log('Training data prepared:', {
        count: trainingData.length,
        sample: trainingData[0],
        allData: trainingData
      });
      
      const requestBody = {
        training_data: trainingData,
        model: 'gpt-4o-mini-2024-07-18', // Best model for fine-tuning
      };
      
      console.log('Sending request to /api/fine-tuning/create with body:', requestBody);
      
      const response = await fetch('/api/fine-tuning/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }

      if (!response.ok) {
        console.error('API returned error:', result);
        throw new Error(result.error || 'Failed to create fine-tuning job');
      }

      console.log('Fine-tuning job created:', result);
      alert(`Fine-tuning job created successfully! Job ID: ${result.id}`);
      
      // Reload jobs
      await loadFineTuningJobs();
    } catch (error: any) {
      console.error('Error creating fine-tuning job:', error);
      alert(`Failed to create fine-tuning job: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFineTunedModel = async (model: string) => {
    try {
      const response = await fetch('/api/fine-tuning/set-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model }),
      });

      if (response.ok) {
        setActiveModel(model);
        alert('Fine-tuned model activated!');
      }
    } catch (error) {
      console.error('Error setting model:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Fine-tune Your Writing Style</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">How it works</h3>
            <p className="text-sm text-gray-600">
              Select at least 3 of your previous scripts to train the AI on your writing style. 
              The AI will learn your patterns, tone, and formatting preferences to help you write future scripts.
            </p>
          </div>

          {/* Existing Fine-tuning Jobs */}
          {fineTuningJobs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Your Fine-tuned Models</h3>
              <div className="space-y-2">
                {fineTuningJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {job.model || 'Processing...'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Status: <span className={`font-medium ${
                          job.status === 'succeeded' ? 'text-green-600' :
                          job.status === 'failed' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>{job.status}</span>
                      </p>
                    </div>
                    {job.status === 'succeeded' && (
                      <button
                        onClick={() => selectFineTunedModel(job.model)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          activeModel === job.model
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {activeModel === job.model ? 'Active' : 'Use Model'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('scripts')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'scripts'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Existing Scripts ({selectedScripts.length})
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'files'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upload Files ({uploadedContent.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'scripts' ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Select Scripts for Training</h3>
              {scripts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No previous scripts found. Create some scripts first!
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {scripts.map(script => (
                    <label
                      key={script.id}
                      className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScripts.includes(script.id)}
                        onChange={() => toggleScriptSelection(script.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {script.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {script.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Writing Samples</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload PDF, DOCX, DOC, or TXT files containing your writing samples. 
                The AI will learn from these examples to mimic your writing style.
              </p>
              <FileUpload onFilesProcessed={handleFilesProcessed} />
              
              {uploadedContent.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-700 mb-2">
                    {uploadedContent.length} file(s) processed successfully
                  </p>
                  <div className="space-y-2">
                    {uploadedContent.map((content, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          Sample {index + 1}: {content.split(/\s+/).length} words
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {content.substring(0, 150)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {selectedScripts.length} scripts + {uploadedContent.length} files selected
            </p>
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={startFineTuning}
                disabled={(selectedScripts.length + uploadedContent.length) < 1 || isLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  (selectedScripts.length + uploadedContent.length) < 1 || isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Creating...' : 'Start Fine-tuning'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}