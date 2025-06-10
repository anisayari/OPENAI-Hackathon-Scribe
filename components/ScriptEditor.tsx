'use client';

import { useEffect, useRef } from 'react';

interface ScriptEditorProps {
  content: string;
  onChange: (content: string) => void;
  scriptId: string;
}

export default function ScriptEditor({ content, onChange, scriptId }: ScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className="w-full">
      <label htmlFor="script-editor" className="block text-sm font-medium text-gray-700 mb-2">
        Script Editor
      </label>
      <textarea
        ref={textareaRef}
        id="script-editor"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[400px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
        placeholder="Start writing your script here or use voice commands to dictate..."
      />
      <div className="mt-2 text-xs text-gray-500">
        Script ID: {scriptId}
      </div>
    </div>
  );
}