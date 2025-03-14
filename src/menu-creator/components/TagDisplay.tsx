import React from 'react';
import { Tag } from './TagSelector';

interface TagDisplayProps {
  tags: Tag[];
  type: 'dietary' | 'allergen';
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

const TagDisplay: React.FC<TagDisplayProps> = ({ 
  tags, 
  type, 
  size = 'sm',
  showLabels = false
}) => {
  if (!tags || tags.length === 0) return null;
  
  const getTagColor = (type: 'dietary' | 'allergen') => {
    return type === 'dietary' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm'
  };
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {showLabels && (
        <span className="text-xs text-gray-500 mr-1">
          {type === 'dietary' ? 'Dietary:' : 'Allergens:'}
        </span>
      )}
      {tags.map(tag => (
        <span
          key={tag.id}
          title={tag.name}
          className={`inline-flex items-center rounded-md font-medium ${getTagColor(type)} ${sizeClasses[size]}`}
        >
          {tag.icon && <span className="mr-1">{tag.icon}</span>}
          {tag.name}
        </span>
      ))}
    </div>
  );
};

export default TagDisplay; 