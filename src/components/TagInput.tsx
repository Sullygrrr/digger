import React from 'react';
import { X } from 'lucide-react';
import { useTagSuggestions } from '../hooks/useTagSuggestions';

interface TagInputProps {
  tags: string[];
  currentTag: string;
  onTagChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveTag: (tag: string) => void;
  onSelectSuggestion: (tag: string) => void;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  currentTag,
  onTagChange,
  onKeyDown,
  onRemoveTag,
  onSelectSuggestion
}) => {
  const suggestions = useTagSuggestions(currentTag);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Tags (max 8)
      </label>
      <div className="relative">
        <input
          type="text"
          value={currentTag}
          onChange={(e) => onTagChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ajoute des tags (Enter ou virgule) 🏷️"
          className="w-full p-3 bg-dark-200 rounded-xl border border-gray-700 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
          maxLength={20}
        />
        
        {/* Liste des suggestions */}
        {suggestions.length > 0 && currentTag && (
          <div className="absolute z-10 w-full mt-1 bg-dark-200 rounded-xl border border-gray-700 shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSelectSuggestion(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-dark-100 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center bg-gradient-to-r from-accent-purple to-accent-blue bg-opacity-10 text-white px-3 py-1 rounded-full text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="ml-2 text-white hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};