import React from 'react';
import { MenuSection } from '../types';

interface MenuNavigationProps {
  sections: MenuSection[];
  activeSection: string | null;
  onSectionClick: (sectionId: string, index: number) => void;
  className?: string;
}

const MenuNavigation: React.FC<MenuNavigationProps> = ({
  sections,
  activeSection,
  onSectionClick,
  className = ''
}) => {
  return (
    <div className={`sticky top-0 z-40 bg-[#2d2d2d] ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 py-3 px-6">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => onSectionClick(section.id, index)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-amber-500 text-white shadow-md transform scale-102'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuNavigation; 