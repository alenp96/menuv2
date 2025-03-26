import React from 'react';
import { MenuItem, DietaryTag, Allergen, Menu, formatPrice } from '../types';

interface NoImagesMenuItemProps {
  item: MenuItem;
  menu: Menu;
  onClick: () => void;
}

const NoImagesMenuItem: React.FC<NoImagesMenuItemProps> = ({ item, menu, onClick }) => {
  // Add handler for video icon click
  const handleVideoIconClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent onClick from firing
    onClick(); // Open the modal with this item
  };

  return (
    <div 
      className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer mb-4"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex justify-between items-start gap-4">
          {/* Icon Container */}
          {item.icon && (
            <div className="flex-shrink-0 w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
              <i className={`fas ${item.icon} text-3xl text-gray-600`}></i>
            </div>
          )}
          
          {/* Content Container */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <h3 className="text-gray-900 font-medium text-lg truncate pr-2">
                    {item.name}
                  </h3>
                  {item.videoUrl && (
                    <span 
                      className="ml-1 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center shadow-sm cursor-pointer hover:bg-amber-600 transition-colors group"
                      onClick={handleVideoIconClick}
                      title="Play video"
                    >
                      <svg className="w-3 h-3 mr-0.5 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Video
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                )}
                
                {/* Dietary Tags and Allergens */}
                {((item.dietaryTags && item.dietaryTags.length > 0) || (item.allergens && item.allergens.length > 0)) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.dietaryTags?.map((tag: DietaryTag) => (
                      <span 
                        key={tag.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100"
                      >
                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                        {tag.name}
                      </span>
                    ))}
                    {item.allergens?.map((allergen: Allergen) => (
                      <span 
                        key={allergen.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100"
                      >
                        {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                        {allergen.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-amber-600 font-bold whitespace-nowrap">
                {formatPrice(item.price, menu)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoImagesMenuItem; 