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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Empêcher le comportement par défaut
      onKeyDown(e);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Tags (max 8)
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="text" // Pour le clavier mobile
          value={currentTag}
          onChange={(e) => onTagChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ajoute des tags (Entrée) 🏷️"
          className="w-full p-3 bg-dark-200 rounded-xl border border-gray-700 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
          maxLength={20}
        />
        
        {suggestions.length > 0 && currentTag && (
          <div className="absolute z-10 w-full mt-1 bg-dark-200 rounded-xl border border-gray-700 shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSelectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-dark-100 transition-colors first:rounded-t-xl last:rounded-b-xl active:bg-dark-100"
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
            className="inline-flex items-center bg-gradient-to-r from-accent-purple to-accent-blue bg-opacity-10 text-white px-3 py-1.5 rounded-full text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="ml-2 text-white hover:text-gray-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};