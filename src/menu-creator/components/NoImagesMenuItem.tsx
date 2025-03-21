import React from 'react';
import { MenuItem, DietaryTag, Allergen, Menu, formatPrice } from '../types';

interface NoImagesMenuItemProps {
  item: MenuItem;
  menu: Menu;
  onClick: () => void;
}

const NoImagesMenuItem: React.FC<NoImagesMenuItemProps> = ({ item, menu, onClick }) => {
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
                <h3 className="text-gray-900 font-medium text-lg truncate pr-4">
                  {item.name}
                </h3>
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