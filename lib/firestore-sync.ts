// Utility functions for syncing data with Firestore using firebase-admin

export interface ScriptData {
  id?: string;
  title: string;
  content: string;
  script?: any[];
  storyline?: any;
  targetDuration?: number;
  fullData?: any;
  createdAt?: string;
  updatedAt?: string;
}

export class FirestoreSync {
  // Save a new script to Firestore
  static async saveScript(data: Omit<ScriptData, 'id'>): Promise<string | null> {
    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.id;
      }
      
      throw new Error('Failed to save script');
    } catch (error) {
      console.error('Error saving script:', error);
      return null;
    }
  }

  // Update an existing script
  static async updateScript(id: string, data: Partial<ScriptData>): Promise<boolean> {
    try {
      const response = await fetch(`/api/scripts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error updating script:', error);
      return false;
    }
  }

  // Load a script by ID
  static async loadScript(id: string): Promise<ScriptData | null> {
    try {
      const response = await fetch(`/api/scripts/${id}`);
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status === 404) {
        return null;
      }
      
      throw new Error('Failed to load script');
    } catch (error) {
      console.error('Error loading script:', error);
      return null;
    }
  }

  // Delete a script
  static async deleteScript(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/scripts/${id}`, {
        method: 'DELETE'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting script:', error);
      return false;
    }
  }

  // List all scripts
  static async listScripts(limit: number = 10, offset: number = 0): Promise<ScriptData[]> {
    try {
      const response = await fetch(`/api/scripts?limit=${limit}&offset=${offset}`);
      
      if (response.ok) {
        const result = await response.json();
        return result.scripts || [];
      }
      
      throw new Error('Failed to list scripts');
    } catch (error) {
      console.error('Error listing scripts:', error);
      return [];
    }
  }

  // Batch update multiple scripts
  static async batchUpdate(scripts: ScriptData[]): Promise<boolean> {
    try {
      const response = await fetch('/api/scripts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'batch_update',
          scripts
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error in batch update:', error);
      return false;
    }
  }

  // Auto-save functionality with debouncing
  static autoSaveTimer: NodeJS.Timeout | null = null;
  
  static autoSave(id: string, data: Partial<ScriptData>, delay: number = 2000) {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setTimeout(async () => {
      await this.updateScript(id, data);
    }, delay);
  }
}

// Hook for real-time syncing
export function useFirestoreSync() {
  const saveScript = async (data: Omit<ScriptData, 'id'>) => {
    return await FirestoreSync.saveScript(data);
  };

  const updateScript = async (id: string, data: Partial<ScriptData>) => {
    return await FirestoreSync.updateScript(id, data);
  };

  const loadScript = async (id: string) => {
    return await FirestoreSync.loadScript(id);
  };

  const deleteScript = async (id: string) => {
    return await FirestoreSync.deleteScript(id);
  };

  const listScripts = async (limit?: number, offset?: number) => {
    return await FirestoreSync.listScripts(limit, offset);
  };

  const autoSave = (id: string, data: Partial<ScriptData>, delay?: number) => {
    FirestoreSync.autoSave(id, data, delay);
  };

  return {
    saveScript,
    updateScript,
    loadScript,
    deleteScript,
    listScripts,
    autoSave
  };
}