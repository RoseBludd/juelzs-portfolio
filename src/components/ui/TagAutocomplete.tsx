'use client';

import { useState, useEffect, useRef } from 'react';
import Button from './Button';

interface TagAutocompleteProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export default function TagAutocomplete({ 
  tags, 
  onTagsChange, 
  placeholder = "Add a tag",
  maxTags = 20 
}: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search for tag suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.trim() && inputValue.length > 1) {
        fetchSuggestions(inputValue.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const fetchSuggestions = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/journal/tags?q=${encodeURIComponent(query)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter out already selected tags
          const filteredSuggestions = data.tags.filter((tag: string) => 
            !tags.includes(tag) && tag.toLowerCase().includes(query.toLowerCase())
          );
          setSuggestions(filteredSuggestions);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }
      }
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim()) && tags.length < maxTags) {
      onTagsChange([...tags, tag.trim()]);
      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag if input is empty
      removeTag(tags.length - 1);
    } else if (e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Prevent comma from being typed
    if (value.includes(',')) {
      const newTag = value.replace(',', '').trim();
      if (newTag) {
        addTag(newTag);
      }
      return;
    }
    setInputValue(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className="space-y-2">
      {/* Input with suggestions */}
      <div className="relative">
        <div className="flex flex-wrap gap-2 p-3 bg-gray-700 border border-gray-600 rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500">
          {/* Existing tags */}
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-1 text-blue-300 hover:text-blue-200 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}
          
          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent text-white placeholder-gray-400 focus:outline-none"
            disabled={tags.length >= maxTags}
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 focus:bg-gray-700 focus:outline-none ${
                  index === selectedIndex ? 'bg-gray-700' : ''
                }`}
              >
                <span className="text-gray-400">#</span>
                <span className="text-white">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add button and hints */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {tags.length > 0 && (
            <span>{tags.length}/{maxTags} tags</span>
          )}
          {tags.length === 0 && (
            <span>Type and press Enter, comma, or Tab to add tags</span>
          )}
        </div>
        
        {inputValue.trim() && (
          <Button
            type="button"
            onClick={() => addTag(inputValue.trim())}
            className="text-xs bg-green-600 hover:bg-green-700"
            disabled={tags.length >= maxTags}
          >
            Add "{inputValue.trim()}"
          </Button>
        )}
      </div>

      {/* Popular tags suggestion */}
      {tags.length === 0 && !inputValue && (
        <div className="text-xs text-gray-500">
          <p className="mb-1">Popular tags:</p>
          <div className="flex flex-wrap gap-1">
            {['architecture', 'ai', 'performance', 'debugging', 'ideas', 'reminders'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="px-2 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-300 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
