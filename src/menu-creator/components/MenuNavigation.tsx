import React, { useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // Scroll active section into view
  useEffect(() => {
    if (activeButtonRef.current && containerRef.current) {
      const container = containerRef.current;
      const button = activeButtonRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      
      // Check if the button is not fully visible
      const isButtonVisible = 
        buttonRect.left >= containerRect.left && 
        buttonRect.right <= containerRect.right;
      
      if (!isButtonVisible) {
        // Calculate the scroll position to center the button
        const scrollLeft = 
          buttonRect.left - containerRect.left + container.scrollLeft - 
          (containerRect.width / 2) + (buttonRect.width / 2);
        
        // Scroll the container to the calculated position
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  }, [activeSection]);

  return (
    <div className={`sticky top-0 z-40 bg-[#2d2d2d] ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div 
          ref={containerRef}
          className="overflow-x-auto scrollbar-hide"
        >
          <div className="flex space-x-2 py-3 px-6">
            {sections.map((section, index) => (
              <button
                key={section.id}
                ref={activeSection === section.id ? activeButtonRef : null}
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