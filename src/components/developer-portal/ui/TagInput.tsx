"use client";

import { useState, useEffect, useRef } from 'react';
import { IconTag, IconX, IconChevronDown } from '@tabler/icons-react';

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export const TagInput = ({ 
  value, 
  onChange, 
  placeholder = "Start typing to add tags...",
  className = "",
  label,
  required = false
}: TagInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse current tags from the comma-separated value
  const currentTags = value.split(',').map(tag => tag.trim()).filter(tag => tag);

  // Load all existing tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/tags');
        const data = await response.json();
        setAllTags(data.tags || []);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, []);

  // Filter tags based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = allTags.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !currentTags.includes(tag)
      );
      setFilteredTags(filtered);
    } else {
      // Show popular tags when no input
      const remainingTags = allTags.filter(tag => !currentTags.includes(tag));
      setFilteredTags(remainingTags.slice(0, 10));
    }
  }, [inputValue, allTags, currentTags]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    if (!tag.trim() || currentTags.includes(tag.trim())) return;
    
    const newTags = [...currentTags, tag.trim()];
    onChange(newTags.join(', '));
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    onChange(newTags.join(', '));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && !inputValue && currentTags.length > 0) {
      removeTag(currentTags[currentTags.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      
      <div className={`bg-gray-700 text-white rounded-md border border-gray-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors ${className}`}>
        {/* Tags Display */}
        <div className="flex flex-wrap gap-1 p-2 pb-1">
          {currentTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs"
            >
              <IconTag size={12} />
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-300 transition-colors"
              >
                <IconX size={12} />
              </button>
            </span>
          ))}
        </div>

        {/* Input Field */}
        <div className="flex items-center px-2 pb-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={currentTags.length === 0 ? placeholder : "Add more tags..."}
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-400"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-white transition-colors ml-2"
          >
            <IconChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredTags.length > 0 ? (
            <div className="py-1">
              {filteredTags.map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <IconTag size={14} className="text-gray-400" />
                  {tag}
                </button>
              ))}
            </div>
          ) : inputValue.trim() ? (
            <div className="py-1">
              <button
                type="button"
                onClick={() => addTag(inputValue.trim())}
                className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <IconTag size={14} />
                Create "{inputValue.trim()}"
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-400">
              {allTags.length === 0 ? 'No tags available' : 'Start typing to see suggestions'}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Type and press Enter or comma to add tags. Click existing tags to select them.
      </p>
    </div>
  );
}; 