import React from 'react';
import { MenuItem, DietaryTag, Allergen, Menu, formatPrice } from '../types';
import TagDisplay from './TagDisplay';

interface DefaultMenuItemProps {
  item: MenuItem;
  menu: Menu;
  onClick: () => void;
}

const DefaultMenuItem: React.FC<DefaultMenuItemProps> = ({ item, menu, onClick }) => {
  return (
    <div 
      className="border border-gray-200 rounded-md p-3 hover:shadow-md transition-all duration-200 bg-white cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {(item.icon || item.imageUrl) && (
          <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
            {item.imageUrl ? (
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
            ) : item.icon ? (
              <i className={`fas ${item.icon} text-2xl text-gray-600`}></i>
            ) : null}
          </div>
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h5 className="font-medium">{item.name}</h5>
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