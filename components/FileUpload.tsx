'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  onFilesProcessed: (content: string[]) => void;
  className?: string;
}

interface UploadedFile {
  name: string;
  size: number;
  content: string;
  status: 'processing' | 'completed' | 'error';
}

export default function FileUpload({ onFilesProcessed, className = '' }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => 
      acceptedTypes.includes(file.type) || 
      file.name.endsWith('.pdf') || 
      file.name.endsWith('.docx') || 
      file.name.endsWith('.doc') ||
      file.name.endsWith('.txt')
    );

    if (validFiles.length === 0) {
      alert('Please upload PDF, DOCX, DOC, or TXT files only.');
      return;
    }

    setIsProcessing(true);
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      name: file.name,
      size: file.size,
      content: '',
      status: 'processing'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process each file
    const processedContents: string[] = [];
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const content = await processFile(file);
        
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === prev.length - validFiles.length + i 
            ? { ...f, content, status: 'completed' }
            : f
        ));
        
        processedContents.push(content);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === prev.length - validFiles.length + i 
            ? { ...f, status: 'error' }
            : f
        ));
        
        // Show user-friendly error message
        const errorMessage = error.message || 'Unknown error occurred';
        if (errorMessage.includes('PDF')) {
          alert(`PDF parsing failed for ${file.name}. Please try converting to DOCX or TXT format for better results.`);
        } else {
          alert(`Failed to process ${file.name}: ${errorMessage}`);
        }
      }
    }

    setIsProcessing(false);
    onFilesProcessed(processedContents.filter(content => content.length > 0));
  };

  const processFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/parse-file', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to process file');
    }

    const result = await response.json();
    return result.content;
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop your files here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, DOCX, DOC, and TXT files
            </p>
            <p className="text-xs text-gray-400 mt-1">
              For best results, use DOCX or TXT format
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  file.status === 'completed' ? 'bg-green-100' :
                  file.status === 'error' ? 'bg-red-100' :
                  'bg-yellow-100'
                }`}>
                  {file.status === 'completed' ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : file.status === 'error' ? (
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {file.status}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {isProcessing && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Processing files...
        </div>
      )}
    </div>
  );
}