'use client';

import React, { useState, useEffect } from 'react';
import { EnhancedScript, ScriptSection, convertToEnhancedScript } from '@/lib/types/enhanced-script';

interface ScriptImageGeneratorProps {
  scriptData: any;
  onImagesGenerated?: (updatedScript: EnhancedScript) => void;
}

export default function ScriptImageGenerator({ scriptData, onImagesGenerated }: ScriptImageGeneratorProps) {
  const [enhancedScript, setEnhancedScript] = useState<EnhancedScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (scriptData) {
      const enhanced = convertToEnhancedScript(scriptData) as EnhancedScript;
      enhanced.id = scriptData.scriptId || `script_${Date.now()}`;
      enhanced.imageGeneration = {
        status: 'idle',
        totalImages: enhanced.script.length,
        completedImages: 0,
        errors: []
      };
      setEnhancedScript(enhanced);
    }
  }, [scriptData]);

  const generateImageForSection = async (section: ScriptSection, index: number) => {
    if (!section.visualDescription) return;

    try {
      // Determine style based on section
      const style = determineStyleForSection(section, index);
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: section.visualDescription,
          style: style,
          save_to_firestore: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const imageData = {
          base64: result.image,
          prompt: section.visualDescription,
          revisedPrompt: result.revised_prompt,
          style: style,
          generatedAt: new Date().toISOString(),
          firestoreId: result.firestore_id
        };
        
        setGeneratedImages(prev => new Map(prev).set(`${index}`, imageData));
        
        // Update the enhanced script
        setEnhancedScript(prev => {
          if (!prev) return null;
          const updated = { ...prev };
          updated.script[index] = {
            ...updated.script[index],
            generatedImage: imageData,
            imageStatus: 'completed'
          };
          if (updated.imageGeneration) {
            updated.imageGeneration.completedImages++;
            if (updated.imageGeneration.completedImages === updated.imageGeneration.totalImages) {
              updated.imageGeneration.status = 'completed';
              updated.imageGeneration.completedAt = new Date().toISOString();
            }
          }
          return updated;
        });
      } else {
        throw new Error(result.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error(`Error generating image for section ${index}:`, error);
      setErrors(prev => [...prev, `Section ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      
      setEnhancedScript(prev => {
        if (!prev) return null;
        const updated = { ...prev };
        updated.script[index] = {
          ...updated.script[index],
          imageStatus: 'error',
          imageError: error instanceof Error ? error.message : 'Unknown error'
        };
        return updated;
      });
    }
  };

  const generateAllImages = async () => {
    if (!enhancedScript) return;

    setIsGenerating(true);
    setErrors([]);
    
    setEnhancedScript(prev => {
      if (!prev) return null;
      return {
        ...prev,
        imageGeneration: {
          ...prev.imageGeneration!,
          status: 'in_progress',
          startedAt: new Date().toISOString()
        }
      };
    });

    // Generate images with a delay to avoid rate limits
    for (let i = 0; i < enhancedScript.script.length; i++) {
      setCurrentSection(i);
      await generateImageForSection(enhancedScript.script[i], i);
      
      // Add delay between requests (2 seconds)
      if (i < enhancedScript.script.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsGenerating(false);
    
    // Notify parent component
    if (onImagesGenerated && enhancedScript) {
      onImagesGenerated(enhancedScript);
    }
  };

  const generateKeyFrames = async () => {
    if (!enhancedScript) return;

    // Generate images only for key moments (every 3-4 sections)
    const keyIndices = [0]; // Always include first
    for (let i = 3; i < enhancedScript.script.length; i += 3) {
      keyIndices.push(i);
    }
    if (keyIndices[keyIndices.length - 1] !== enhancedScript.script.length - 1) {
      keyIndices.push(enhancedScript.script.length - 1); // Always include last
    }

    setIsGenerating(true);
    setErrors([]);

    for (const index of keyIndices) {
      setCurrentSection(index);
      await generateImageForSection(enhancedScript.script[index], index);
      if (index !== keyIndices[keyIndices.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsGenerating(false);
  };

  const determineStyleForSection = (section: ScriptSection, index: number): string => {
    // Determine style based on content and position
    const content = section.content.toLowerCase();
    
    if (index === 0) return 'cinematic'; // Opening shot
    if (content.includes('example') || content.includes('real-life')) return 'documentary';
    if (content.includes('imagine') || content.includes('future')) return 'futuristic';
    if (content.includes('personal') || content.includes('emotion')) return 'intimate';
    
    return 'cinematic'; // Default
  };

  const downloadAllImages = () => {
    generatedImages.forEach((imageData, key) => {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${imageData.base64}`;
      link.download = `script-section-${key}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  if (!enhancedScript) return null;

  const progress = enhancedScript.imageGeneration
    ? (enhancedScript.imageGeneration.completedImages / enhancedScript.imageGeneration.totalImages) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Image Generation</h3>
        <p className="text-gray-600">
          Generate unique visuals for each section of your script using AI
        </p>
      </div>

      {/* Status Overview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Generation Progress</span>
          <span className="text-sm text-gray-600">
            {enhancedScript.imageGeneration?.completedImages || 0} / {enhancedScript.imageGeneration?.totalImages || 0} images
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={generateAllImages}
          disabled={isGenerating}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Section {currentSection + 1}...
            </span>
          ) : (
            'Generate All Images'
          )}
        </button>
        
        <button
          onClick={generateKeyFrames}
          disabled={isGenerating}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          Generate Key Frames Only
        </button>

        {generatedImages.size > 0 && (
          <button
            onClick={downloadAllImages}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Download All
          </button>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">Generation Errors:</h4>
          <ul className="list-disc list-inside text-sm text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Generated Images Preview */}
      {generatedImages.size > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Generated Images:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from(generatedImages.entries()).map(([key, imageData]) => {
              const sectionIndex = parseInt(key);
              const section = enhancedScript.script[sectionIndex];
              
              return (
                <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={`data:image/png;base64,${imageData.base64}`}
                      alt={`Section ${sectionIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      {section.timestamp}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50">
                    <p className="text-sm text-gray-700 line-clamp-2">{section.content}</p>
                    <p className="text-xs text-gray-500 mt-1">Style: {imageData.style}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}