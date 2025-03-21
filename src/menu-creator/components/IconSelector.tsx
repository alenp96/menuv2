import React, { useState } from 'react';

interface IconSelectorProps {
  selectedIcon: string | null;
  onIconSelect: (icon: string) => void;
}

const IconSelector: React.FC<IconSelectorProps> = ({ selectedIcon, onIconSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Common Font Awesome icons for food and drinks, organized by category
  const commonIcons = [
    // Main dishes
    'fa-utensils',
    'fa-hamburger',
    'fa-pizza-slice',
    'fa-drumstick-bite',
    'fa-fish',
    
    // Desserts
    'fa-ice-cream',
    'fa-cookie',
    'fa-cake-candles',
    'fa-cookie-bite',
    
    // Beverages
    'fa-coffee',
    'fa-wine-glass',
    'fa-beer',
    'fa-cocktail',
    'fa-glass-martini',
    'fa-mug-hot',
    'fa-mug-saucer',
    'fa-wine-bottle',
    
    // Ingredients
    'fa-cheese',
    'fa-bread-slice',
    'fa-egg',
    'fa-apple-alt',
    'fa-lemon',
    'fa-carrot',
    'fa-shrimp'
  ];

  const filteredIcons = commonIcons.filter(icon =>
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Icon (Optional)
      </label>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          {selectedIcon ? (
            <i className={`fas ${selectedIcon} text-gray-600 text-lg`}></i>
          ) : (
            <i className="fas fa-icons text-gray-400 text-lg"></i>
          )}
        </button>
        {selectedIcon && (
          <button
            type="button"
            onClick={() => onIconSelect('')}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-2">
            <div className="grid grid-cols-4 gap-2">
              {filteredIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    onIconSelect(icon);
                    setIsOpen(false);
                  }}
                  className={`p-2 rounded-md hover:bg-gray-100 ${
                    selectedIcon === icon ? 'bg-amber-50' : ''
                  }`}
                >
                  <i className={`fas ${icon} text-gray-600 text-lg`}></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IconSelector; 