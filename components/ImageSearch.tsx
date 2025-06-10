'use client';

import { useState } from 'react';
import { Search, Image, X, Loader2, Download } from 'lucide-react';

interface ImageResult {
  url: string;
  preview_url: string;
  source: string;
  license: string;
  title: string;
  photographer?: string;
  source_website?: string;
}

interface ImageSearchProps {
  onImageSelect?: (imageUrl: string) => void;
  sessionId?: string;
}

export default function ImageSearch({ onImageSelect, sessionId }: ImageSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);

  const searchImages = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/search-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          count: 12,
          budget: 'mixed',
          generateIfNeeded: true,
          sessionId
        }),
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Image search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (image: ImageResult) => {
    setSelectedImage(image);
    if (onImageSelect) {
      onImageSelect(image.url);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        title="Search images"
      >
        <Image className="w-4 h-4" />
        <span>Images</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium">Search Images</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchImages()}
                    placeholder="Search for images..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={searchImages}
                  disabled={loading || !query.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              )}

              {!loading && images.length === 0 && query && (
                <div className="text-center py-12 text-gray-500">
                  No images found. Try a different search term.
                </div>
              )}

              {!loading && images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer"
                      onClick={() => handleImageSelect(image)}
                    >
                      <img
                        src={image.preview_url}
                        alt={image.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-3 py-1 rounded-md text-sm font-medium">
                          Select
                        </button>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 truncate">{image.title}</p>
                        <p className="text-xs text-gray-500">
                          {image.source} • {image.license}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}