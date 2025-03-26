import React from 'react';
import { MenuItem, DietaryTag, Allergen, Menu, formatPrice } from '../types';
import TagDisplay from './TagDisplay';

interface DefaultMenuItemProps {
  item: MenuItem;
  menu: Menu;
  onClick: () => void;
}

const DefaultMenuItem: React.FC<DefaultMenuItemProps> = ({ item, menu, onClick }) => {
  // Add handler for video icon click
  const handleVideoIconClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent onClick from firing
    onClick(); // Open the modal with this item
  };

  return (
    <div 
      className="border border-gray-200 rounded-md p-3 hover:shadow-md transition-all duration-200 bg-white cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {(item.icon || item.imageUrl) && (
          <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center relative">
            {item.imageUrl ? (
              <>
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const imgElement = e.currentTarget;
                    imgElement.src = 'https://via.placeholder.com/60x60?text=NA';
                    imgElement.style.objectFit = 'contain';
                  }}
                />
                {item.videoUrl && (
                  <div 
                    className="absolute top-0 right-0 bg-amber-500 text-white rounded-bl-md p-1.5 cursor-pointer hover:bg-amber-600 transition-colors shadow-md group"
                    onClick={handleVideoIconClick}
                    title="Play video"
                  >
                    <svg className="w-4 h-4 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </>
            ) : item.icon ? (
              <i className={`fas ${item.icon} text-2xl text-gray-600`}></i>
            ) : null}
          </div>
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h5 className="font-medium">{item.name}</h5>
                {item.videoUrl && !item.imageUrl && (
                  <span 
                    className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center cursor-pointer hover:bg-amber-600 transition-colors shadow-sm group"
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
              {item.description && <p className="text-gray-500 mt-1">{item.description}</p>}
              
              {/* Display dietary tags and allergens */}
              {item.dietaryTags && item.dietaryTags.length > 0 && (
                <TagDisplay 
                  tags={item.dietaryTags} 
                  type="dietary" 
                  size="sm" 
                />
              )}
              
              {item.allergens && item.allergens.length > 0 && (
                <TagDisplay 
                  tags={item.allergens} 
                  type="allergen" 
                  size="sm" 
                />
              )}
              
              <p className="text-amber-600 font-medium mt-1">{formatPrice(item.price, menu)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultMenuItem; 