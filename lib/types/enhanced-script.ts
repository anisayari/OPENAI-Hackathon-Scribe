// Enhanced Script Data Structure with Image Generation Support

export interface ScriptSection {
  timestamp: string;
  content: string;
  duration?: number; // in seconds
  visualDescription?: string; // Description for image generation
  generatedImage?: {
    url?: string;
    base64?: string;
    prompt: string;
    revisedPrompt?: string;
    style: string;
    generatedAt: string;
    firestoreId?: string;
  };
  imageStatus?: 'pending' | 'generating' | 'completed' | 'error';
  imageError?: string;
}

export interface EnhancedStoryline {
  sections: StorylineSection[];
  totalDuration: number;
  imageGenerationProgress?: number; // 0-100
}

export interface StorylineSection {
  name: string;
  duration: number; // in seconds
  objectives?: string[];
  content?: string;
  visualThemes?: string[]; // Themes for image generation
  generatedImages?: GeneratedImage[];
}

export interface GeneratedImage {
  id: string;
  base64: string;
  prompt: string;
  revisedPrompt?: string;
  style: string;
  purpose: 'scene' | 'transition' | 'thumbnail' | 'background';
  timestamp?: string;
  firestoreId?: string;
}

export interface EnhancedScript {
  id: string;
  title: string;
  prompt: string;
  script: ScriptSection[];
  storyline: EnhancedStoryline;
  metadata: {
    createdAt: string;
    updatedAt: string;
    targetDuration: number;
    platform: 'youtube' | 'tiktok' | 'instagram';
    generationMode: 'standard' | 'advanced';
    sessionId?: string;
  };
  imageGeneration?: {
    status: 'idle' | 'in_progress' | 'completed' | 'partial';
    totalImages: number;
    completedImages: number;
    errors: string[];
    startedAt?: string;
    completedAt?: string;
  };
  productionPlan?: any; // From advanced generation
  researchData?: any; // From advanced generation
}

// Helper function to convert old format to enhanced format
export function convertToEnhancedScript(data: any): Partial<EnhancedScript> {
  const script: ScriptSection[] = [];
  
  // Handle different script formats
  if (Array.isArray(data.script)) {
    script.push(...data.script.map((item: any) => ({
      timestamp: item.timestamp || '00:00',
      content: item.content || item.text || '',
      visualDescription: extractVisualDescription(item.content || item.text || '')
    })));
  } else if (typeof data.script === 'string') {
    // Parse string format (e.g., "0-300 seconds: content")
    const sections = data.script.split('\n\n');
    sections.forEach(section => {
      const match = section.match(/^(\d+)-(\d+)\s*seconds?:\s*(.*)$/s);
      if (match) {
        const [, start, end, content] = match;
        script.push({
          timestamp: formatTimestamp(parseInt(start)),
          content: content.trim(),
          duration: parseInt(end) - parseInt(start),
          visualDescription: extractVisualDescription(content)
        });
      }
    });
  }

  // Convert storyline
  const storyline: EnhancedStoryline = {
    sections: [],
    totalDuration: data.targetDuration || 1500
  };

  if (data.storyline?.sections) {
    storyline.sections = data.storyline.sections.map((section: any) => ({
      name: section.nom || section.name || '',
      duration: section.duree_sec || section.duration || 0,
      objectives: section.objectifs || section.objectives || [],
      content: section.contenu || section.content || '',
      visualThemes: extractVisualThemes(section)
    }));
  } else if (data.storyline_structure) {
    storyline.sections = data.storyline_structure.map((section: any) => ({
      name: section.part || '',
      duration: section.duration || 0,
      content: section.content || ''
    }));
  }

  return {
    title: data.title || 'Untitled Script',
    prompt: data.prompt || '',
    script,
    storyline,
    metadata: {
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetDuration: data.targetDuration || 1500,
      platform: data.mcpServer || 'youtube',
      generationMode: data._advancedGeneration ? 'advanced' : 'standard',
      sessionId: data.sessionId
    },
    productionPlan: data.productionPlan,
    researchData: data.researchResult
  };
}

// Extract visual description from content for image generation
function extractVisualDescription(content: string): string {
  // Look for visual cues in brackets or specific keywords
  const visualMatch = content.match(/\[([^\]]+)\]/);
  if (visualMatch) {
    return visualMatch[1];
  }
  
  // Extract first sentence as fallback
  const firstSentence = content.split(/[.!?]/)[0];
  return firstSentence || content.substring(0, 100);
}

// Extract visual themes from section data
function extractVisualThemes(section: any): string[] {
  const themes: string[] = [];
  
  // Extract from objectives
  if (section.objectifs || section.objectives) {
    const objectives = section.objectifs || section.objectives;
    themes.push(...objectives.slice(0, 3));
  }
  
  // Extract from content
  if (section.contenu || section.content) {
    const content = section.contenu || section.content;
    // Simple keyword extraction (can be improved)
    const keywords = content.match(/\b[A-Z][a-z]+\b/g) || [];
    themes.push(...keywords.slice(0, 2));
  }
  
  return [...new Set(themes)]; // Remove duplicates
}

// Format seconds to timestamp
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}