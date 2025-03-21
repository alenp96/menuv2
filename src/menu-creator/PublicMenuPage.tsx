import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getPublicMenu } from 'wasp/client/operations';
import { Menu, MenuSection as MenuSectionType, MenuItem, assertMenu, DietaryTag, Allergen, formatPrice } from './types';
import NoImagesMenuItem from './components/NoImagesMenuItem';
import MenuSection from './components/MenuSection';

// Add Font Awesome CSS
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
document.head.appendChild(fontAwesomeLink);

// Standalone public menu page without any app components
const PublicMenuPage = () => {
  const params = useParams<{ publicUrl: string }>();
  const publicUrl = params.publicUrl || '';
  
  const { data: menuData, isLoading, error } = useQuery(getPublicMenu, { publicUrl });
  const menu = menuData ? assertMenu(menuData) : null;
  
  // Check localStorage for saved template if menu is available
  useEffect(() => {
    if (menu) {
      // Try to get the template from localStorage
      const savedTemplate = localStorage.getItem(`menu_template_${menu.id}`);
      if (savedTemplate && (savedTemplate === 'default' || savedTemplate === 'no-images')) {
        // Update the menu object with the saved template
        menu.template = savedTemplate;
      }
      console.log('Using template:', menu.template);
    }
  }, [menu]);
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const modalRef = useRef<HTMLDivElement | null>(null);
  
  // New state for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [availableDietaryTags, setAvailableDietaryTags] = useState<DietaryTag[]>([]);
  const [availableAllergens, setAvailableAllergens] = useState<Allergen[]>([]);
  
  useEffect(() => {
    if (menu && menu.sections && menu.sections.length > 0) {
      setActiveSection(menu.sections[0].id);
    }
    
    // Set document title to menu name
    if (menu) {
      document.title = `${menu.name} | Menu`;
    }

    // Remove any app-specific styles or elements that might be inherited
    document.body.classList.add('public-menu-page');
    
    return () => {
      document.body.classList.remove('public-menu-page');
    };
  }, [menu]);

  // Extract all available dietary tags and allergens
  useEffect(() => {
    if (menu && menu.sections) {
      const dietaryTagsSet = new Set<string>();
      const dietaryTagsMap = new Map<string, DietaryTag>();
      const allergensSet = new Set<string>();
      const allergensMap = new Map<string, Allergen>();
      
      menu.sections.forEach(section => {
        section.items.forEach(item => {
          if (item.dietaryTags) {
            item.dietaryTags.forEach(tag => {
              dietaryTagsSet.add(tag.id);
              dietaryTagsMap.set(tag.id, tag);
            });
          }
          if (item.allergens) {
            item.allergens.forEach(allergen => {
              allergensSet.add(allergen.id);
              allergensMap.set(allergen.id, allergen);
            });
          }
        });
      });
      
      setAvailableDietaryTags(Array.from(dietaryTagsMap.values()));
      setAvailableAllergens(Array.from(allergensMap.values()));
    }
  }, [menu]);

  // Add event listener to close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setSelectedItem(null);
      }
    };

    if (selectedItem) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [selectedItem]);

  const handleSectionClick = (sectionId: string, index: number) => {
    setActiveSection(sectionId);
    setActiveSectionIndex(index);
    
    // Use the id attribute for smooth scrolling
    const sectionElement = document.getElementById(`section-${sectionId}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item);
  };
  
  // Filter menu items based on search term and selected filters
  const getFilteredMenuSections = () => {
    if (!menu || !menu.sections) return [];
    
    return menu.sections.map(section => {
      // Filter items by search term and dietary preferences
      const filteredItems = section.items.filter(item => {
        // Search filter - check if name or description contains search term
        const matchesSearch = searchTerm === '' || 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Dietary tags filter
        const matchesDietaryTags = selectedDietaryTags.length === 0 || 
          (item.dietaryTags && selectedDietaryTags.every(tagId => 
            item.dietaryTags!.some(tag => tag.id === tagId)
          ));
        
        // Allergens filter (exclude items that contain selected allergens)
        const matchesAllergens = selectedAllergens.length === 0 || 
          !item.allergens || 
          !selectedAllergens.some(allergenId => 
            item.allergens!.some(allergen => allergen.id === allergenId)
          );
        
        return matchesSearch && matchesDietaryTags && matchesAllergens;
      });
      
      return {
        ...section,
        items: filteredItems
      };
    }).filter(section => section.items.length > 0); // Only show sections with matching items
  };

  const toggleDietaryTag = (tagId: string) => {
    setSelectedDietaryTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergenId) ? prev.filter(id => id !== allergenId) : [...prev, allergenId]
    );
  };

  const clearFilters = () => {
    setSelectedDietaryTags([]);
    setSelectedAllergens([]);
    setSearchTerm('');
  };

  const filteredSections = getFilteredMenuSections();
  const hasActiveFilters = searchTerm !== '' || selectedDietaryTags.length > 0 || selectedAllergens.length > 0;
  
  // Check if we need to update active section after filtering
  useEffect(() => {
    if (filteredSections.length > 0 && (!activeSection || !filteredSections.some(s => s.id === activeSection))) {
      setActiveSection(filteredSections[0].id);
      setActiveSectionIndex(0);
    }
  }, [filteredSections, activeSection]);

  // Add scroll event listener to update active section based on scroll position
  useEffect(() => {
    // Skip if no sections available
    if (!filteredSections.length) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // Offset for header
      
      const sectionPositions = Object.keys(sectionRefs.current).map(sectionId => {
        const element = sectionRefs.current[sectionId];
        if (!element) return { id: sectionId, top: 0 };
        
        return {
          id: sectionId,
          top: element.offsetTop
        };
      });
      
      // Sort by position
      sectionPositions.sort((a, b) => a.top - b.top);
      
      // Find the current section
      for (let i = sectionPositions.length - 1; i >= 0; i--) {
        if (scrollPosition >= sectionPositions[i].top) {
          if (activeSection !== sectionPositions[i].id) {
            setActiveSection(sectionPositions[i].id);
            // Find index of this section in filteredSections
            const index = filteredSections.findIndex(s => s.id === sectionPositions[i].id);
            if (index !== -1) {
              setActiveSectionIndex(index);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeSection, filteredSections]);

  // Add scroll event listener for back to top button
  useEffect(() => {
    const handleScroll = () => {
      const backToTopButton = document.querySelector('.back-to-top');
      if (backToTopButton) {
        if (window.scrollY > 300) {
          backToTopButton.classList.add('visible');
        } else {
          backToTopButton.classList.remove('visible');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-center p-8 text-red-500 max-w-md">
        <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold mb-2">Error Loading Menu</h2>
        <p>{error.message}</p>
      </div>
    </div>
  );
  
  if (!menu) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold mb-2">Menu Not Found</h2>
        <p className="text-gray-600">The menu you're looking for doesn't exist or has been removed.</p>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Add a style tag to ensure this page is completely standalone */}
      <style>{`
        body {
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .visible-header {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          position: relative;
          overflow: hidden;
        }
        .header-wave {
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 20px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' opacity='.1' fill='%23FFFFFF'%3E%3C/path%3E%3Cpath d='M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z' opacity='.2' fill='%23FFFFFF'%3E%3C/path%3E%3Cpath d='M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z' fill='%23FFFFFF'%3E%3C/path%3E%3C/svg%3E") no-repeat;
          background-size: cover;
        }
        .logo-placeholder {
          background-color: white;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .menu-section-nav {
          background-color: white;
          height: auto;
          padding: 0.5rem 1rem;
          max-width: 100%;
        }
        .menu-section-nav a {
          font-size: 0.875rem;
          padding: 0.5rem 0.75rem;
        }
        .restaurant-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: white;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          position: relative;
        }
        .restaurant-title::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -8px;
          transform: translateX(-50%);
          width: 40px;
          height: 3px;
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 2px;
        }
        .item-image-container {
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .item-thumbnail {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 8px;
          transition: transform 0.3s ease;
        }
        .item-thumbnail:hover {
          transform: scale(1.05);
        }
        .expanded-image {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 8px 8px 0 0;
        }
        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 50;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }
        .modal-content {
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease;
        }
        .modal-image-container {
          position: relative;
          width: 85%;
          max-width: 400px;
          margin: 0 auto;
          padding-bottom: 113.33%; /* Slightly shorter 4:3 aspect ratio */
          overflow: hidden;
        }
        .modal-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
        @media (min-width: 1024px) {
          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          }
        }
        
        /* New compact design for no-images template */
        .compact-menu-item {
          transition: all 0.2s ease;
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
          background-color: white;
          padding: 1rem;
          position: relative;
          overflow: hidden;
          height: auto;
          width: 100%;
          will-change: transform, opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
          border: 1px solid #f0f0f0;
        }
        .compact-menu-item:hover {
          background-color: #fafafa;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }
        .item-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: calc(100% - 80px);
          font-weight: 500;
        }
        .item-price {
          min-width: 60px;
          text-align: right;
          color: #1a1a1a;
          font-weight: 600;
        }
        .item-description {
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          max-height: 2.5rem;
          min-height: 0;
          color: #666;
        }
        .tags-container {
          min-height: 22px;
          width: 100%;
        }
        .menu-section-title {
          position: relative;
          display: inline-block;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          color: #1a1a1a;
          font-weight: 600;
        }
        .menu-section-title::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 30px;
          height: 2px;
          background-color: #1a1a1a;
          border-radius: 2px;
        }
        .section-container {
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        /* Quick filter bar styles */
        .quick-filter-bar {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background-color: #f8f8f8;
          border-bottom: 1px solid #eee;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .quick-filter-bar::-webkit-scrollbar {
          display: none;
        }
        .quick-filter-button {
          padding: 0.5rem 1rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #666;
          background-color: white;
          border: 1px solid #eee;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .quick-filter-button:hover {
          background-color: #f0f0f0;
          color: #1a1a1a;
        }
        .quick-filter-button.active {
          background-color: #1a1a1a;
          color: white;
          border-color: #1a1a1a;
        }
        /* Back to top button */
        .back-to-top {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 40px;
          height: 40px;
          background-color: #1a1a1a;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          z-index: 50;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .back-to-top.visible {
          opacity: 1;
        }
        .back-to-top:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
      
      {/* Visible Restaurant Header */}
      <header className="visible-header w-full text-white">
        <div className="relative py-6 px-4 flex flex-col items-center justify-center min-h-[150px] md:min-h-[180px]">
          <div className="z-10 transform transition-all duration-300">
            <div className="logo-placeholder mb-3 mx-auto">
              <svg className="w-10 h-10 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h1 className="restaurant-title text-center text-3xl md:text-4xl lg:text-5xl mb-5">
              {menu.name}
            </h1>
            
            {menu.description && (
              <p className="text-center text-white mt-3 max-w-md mx-auto text-sm md:text-base font-light opacity-90">
                {menu.description}
              </p>
            )}
          </div>
          
          <div className="header-wave"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-1/3 left-10 w-6 h-6 bg-white opacity-10 rounded-full transform animate-pulse"></div>
          <div className="absolute top-2/3 right-10 w-4 h-4 bg-white opacity-5 rounded-full transform animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/4 w-8 h-8 bg-white opacity-10 rounded-full transform animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/4 right-1/3 w-3 h-3 bg-white opacity-15 rounded-full transform animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
      </header>
      
      {/* Menu Sections Navigation */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        {/* Search and Filter Bar */}
        <div className="p-2 bg-white border-b">
          <div className="flex flex-row items-center justify-between max-w-7xl mx-auto gap-2">
            <div className="relative flex-grow md:max-w-md">
              <input
                type="text"
                placeholder="Search menu items..."
                className="w-full px-3 py-1.5 pr-8 text-gray-700 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
            <button 
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
              </svg>
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center w-4 h-4 ml-1 text-xs font-bold text-white bg-amber-500 rounded-full">
                  {selectedDietaryTags.length + selectedAllergens.length + (searchTerm ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
          
          {/* Filter Options */}
          {isFilterVisible && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg animate-fadeIn max-w-7xl mx-auto">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Dietary Preferences */}
                <div>
                  <h3 className="text-xs font-medium text-gray-700 mb-2">Dietary Preferences</h3>
                  <div className="flex flex-wrap gap-1">
                    {availableDietaryTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleDietaryTag(tag.id)}
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-full flex items-center ${
                          selectedDietaryTags.includes(tag.id)
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                        {tag.name}
                      </button>
                    ))}
                    {availableDietaryTags.length === 0 && (
                      <span className="text-xs text-gray-500">No dietary options available</span>
                    )}
                  </div>
                </div>
                
                {/* Allergen Filters */}
                <div>
                  <h3 className="text-xs font-medium text-gray-700 mb-2">Exclude Allergens</h3>
                  <div className="flex flex-wrap gap-1">
                    {availableAllergens.map(allergen => (
                      <button
                        key={allergen.id}
                        onClick={() => toggleAllergen(allergen.id)}
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-full flex items-center ${
                          selectedAllergens.includes(allergen.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                        {allergen.name}
                      </button>
                    ))}
                    {availableAllergens.length === 0 && (
                      <span className="text-xs text-gray-500">No allergen options available</span>
                    )}
                  </div>
                </div>
              </div>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="mt-2 px-2 py-1 text-xs text-amber-600 hover:text-amber-800 font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
        
        <nav className="menu-section-nav overflow-x-auto py-1 flex space-x-1 md:space-x-2">
          {filteredSections.map((section, index) => (
            <a
              key={section.id}
              href={`#section-${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleSectionClick(section.id, index);
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section.name}
            </a>
          ))}
        </nav>
      </div>
      
      {/* Menu Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {filteredSections.length > 0 ? (
          filteredSections.map((section, sectionIndex) => (
            <MenuSection
              key={section.id}
              section={section}
              menu={menu}
              template={menu.template || 'default'}
              onItemClick={openItemModal}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg mt-4">
            <p className="text-gray-500">No items found with the current filters</p>
          </div>
        )}
      </main>
      
      {/* Item Modal/Popup */}
      {selectedItem && (
        <div className="modal-overlay">
          <div 
            ref={modalRef}
            className="modal-content overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.imageUrl ? (
              <div className="modal-image-container">
                <img 
                  src={selectedItem.imageUrl} 
                  alt={selectedItem.name} 
                  className="modal-image"
                  onError={(e) => {
                    const imgElement = e.currentTarget;
                    imgElement.src = 'https://via.placeholder.com/600x300?text=Image+Not+Available';
                    imgElement.style.objectFit = 'contain';
                  }}
                />
              </div>
            ) : (
              <div className="modal-image-container">
                <div className="modal-image bg-amber-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm0 2h10a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                <span className="text-amber-600 font-bold text-xl">
                  {formatPrice(selectedItem.price, menu)}
                </span>
              </div>
              
              {selectedItem.description && (
                <p className="text-gray-600 mb-6">{selectedItem.description}</p>
              )}
              
              {/* Dietary tags and allergens in modal */}
              <div className="space-y-4">
                {selectedItem.dietaryTags && selectedItem.dietaryTags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Dietary Options</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.dietaryTags.map(tag => (
                        <span 
                          key={tag.id}
                          className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md flex items-center"
                        >
                          {tag.icon && <span className="mr-1">{tag.icon}</span>}
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Contains Allergens</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.allergens.map(allergen => (
                        <span 
                          key={allergen.id}
                          className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-md flex items-center"
                        >
                          {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                          {allergen.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                className="mt-6 w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md transition-colors duration-200 shadow-sm"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">{menu.name}</h3>
              {menu.description && (
                <p className="mt-1 text-gray-400 text-sm">{menu.description}</p>
              )}
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} {menu.name}. All rights reserved.</p>
            <p className="mt-1">Powered by <a href="#" className="text-amber-400 hover:text-amber-300">OpenSaaS Menu</a></p>
          </div>
        </div>
      </footer>

      {/* Quick Filter Bar for No-Images Template */}
      {menu.template === 'no-images' && (
        <div className="quick-filter-bar">
          <button
            className={`quick-filter-button ${!hasActiveFilters ? 'active' : ''}`}
            onClick={clearFilters}
          >
            All Items
          </button>
          {availableDietaryTags.slice(0, 5).map(tag => (
            <button
              key={tag.id}
              className={`quick-filter-button ${selectedDietaryTags.includes(tag.id) ? 'active' : ''}`}
              onClick={() => toggleDietaryTag(tag.id)}
            >
              {tag.icon && <span className="mr-1">{tag.icon}</span>}
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Back to Top Button */}
      <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
};

export default PublicMenuPage; 