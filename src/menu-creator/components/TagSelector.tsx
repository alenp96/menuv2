import React, { useState, useEffect, useRef } from 'react';

export interface Tag {
  id: string;
  name: string;
  icon?: string | null;
}

interface TagSelectorProps {
  title: string;
  description: string;
  availableTags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  className?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  title,
  description,
  availableTags,
  selectedTags,
  onTagsChange,
  className = ''
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };
  
  const isTagSelected = (tagId: string) => {
    return selectedTags.some(tag => tag.id === tagId);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {title}
      </label>
      <div className="text-xs text-gray-500 mb-2">
        {description}
      </div>
      
      {/* Selected tags display */}
      <div className="flex flex-wrap gap-1 mb-2">
        {selectedTags.length > 0 ? (
          selectedTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800"
            >
              {tag.icon && <span className="mr-1">{tag.icon}</span>}
              {tag.name}
              <button
                type="button"
                className="ml-1 text-amber-600 hover:text-amber-800"
                onClick={() => toggleTag(tag)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">No {title.toLowerCase()} selected</span>
        )}
      </div>
      
      {/* Dropdown button */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add {title}
        </button>
        
        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 py-1 max-h-48 overflow-auto">
            {availableTags.length > 0 ? (
              availableTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                    isTagSelected(tag.id) ? 'bg-amber-50' : ''
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-4">
                      {isTagSelected(tag.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-2 flex items-center">
                      {tag.icon && <span className="mr-1">{tag.icon}</span>}
                      {tag.name}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-gray-500">No available {title.toLowerCase()}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSelector; 