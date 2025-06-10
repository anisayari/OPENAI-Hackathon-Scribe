'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Wand2, 
  PenTool, 
  Search, 
  Sparkles, 
  Languages,
  BookOpen,
  MessageSquare,
  Copy,
  Volume2
} from 'lucide-react';

interface SelectionMenuProps {
  selectedText: string;
  position: { x: number; y: number };
  onAction: (action: string, text: string) => void;
  onClose: () => void;
}

export default function SelectionMenu({ selectedText, position, onAction, onClose }: SelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState(position);

  useEffect(() => {
    // Adjust position to keep menu in viewport
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newPosition = { ...position };

      // Check right boundary
      if (rect.right > window.innerWidth) {
        newPosition.x = window.innerWidth - rect.width - 10;
      }

      // Check bottom boundary
      if (rect.bottom > window.innerHeight) {
        newPosition.y = position.y - rect.height - 10;
      }

      setMenuPosition(newPosition);
    }

    // Close on escape or click outside
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [position, onClose]);

  const actions = [
    { 
      icon: PenTool, 
      label: 'Rewrite', 
      action: 'rewrite',
      description: 'Improve writing style'
    },
    { 
      icon: Sparkles, 
      label: 'Expand', 
      action: 'expand',
      description: 'Add more detail'
    },
    { 
      icon: BookOpen, 
      label: 'Summarize', 
      action: 'summarize',
      description: 'Make it concise'
    },
    { 
      icon: Search, 
      label: 'Research', 
      action: 'research',
      description: 'Find sources online'
    },
    { 
      icon: Languages, 
      label: 'Translate', 
      action: 'translate',
      description: 'Convert to another language'
    },
    { 
      icon: MessageSquare, 
      label: 'Explain', 
      action: 'explain',
      description: 'Clarify meaning'
    },
    { 
      icon: Copy, 
      label: 'Copy Style', 
      action: 'copy-style',
      description: 'Match this writing style'
    },
    { 
      icon: Volume2, 
      label: 'Read Aloud', 
      action: 'read-aloud',
      description: 'Text to speech'
    }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[200px]"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
    >
      <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100 mb-1">
        Selected: {selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}
      </div>
      
      <div className="grid grid-cols-2 gap-1">
        {actions.map((item) => (
          <button
            key={item.action}
            onClick={() => onAction(item.action, selectedText)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-md transition-colors group"
            title={item.description}
          >
            <item.icon className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
            <span className="text-sm text-gray-700 group-hover:text-blue-700">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}