import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getPublicMenu } from 'wasp/client/operations';
import { Menu, MenuSection, MenuItem, assertMenu, DietaryTag, Allergen } from './types';

// Standalone public menu page without any app components
const PublicMenuPage = () => {
  const params = useParams<{ publicUrl: string }>();
  const publicUrl = params.publicUrl || '';
  
  const { data: menuData, isLoading, error } = useQuery(getPublicMenu, { publicUrl });
  const menu = menuData ? assertMenu(menuData) : null;
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const modalRef = useRef<HTMLDivElement | null>(null);
  
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
    setSelectedItem(null); // Close any selected item when changing sections
    
    // Scroll to section on mobile
    const sectionElement = sectionRefs.current[sectionId];
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item);
  };
  
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
      <style>
        {`
          body {
            margin: 0;
            padding: 0;
            background: #f9fafb;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .public-menu-page {
            isolation: isolate;
          }
          .menu-section-nav::-webkit-scrollbar {
            display: none;
          }
          .menu-section-nav {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .menu-item-card {
            transition: all 0.2s ease;
          }
          .menu-item-card:hover {
            transform: translateY(-2px);
          }
          /* Modern visible header styles */
          .visible-header {
            background: linear-gradient(135deg, #e65c00 0%, #F59E0B 100%);
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          .header-wave {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 50px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' fill='%23ffffff' fill-opacity='.8'/%3E%3C/svg%3E");
            background-size: cover;
            background-repeat: no-repeat;
            z-index: 1;
          }
          .logo-placeholder {
            width: 80px;
            height: 80px;
            background-color: white;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            position: relative;
            overflow: hidden;
          }
          .logo-placeholder::after {
            content: '';
            position: absolute;
            top: -10%;
            left: -10%;
            right: -10%;
            bottom: -10%;
            background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%);
            animation: shimmer 3s infinite;
          }
          @keyframes shimmer {
            0% { transform: translateX(-150%); }
            100% { transform: translateX(150%); }
          }
          .restaurant-title {
            font-family: 'Poppins', sans-serif;
            font-weight: 800;
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
          }
          .restaurant-title::after {
            content: '';
            position: absolute;
            left: 50%;
            bottom: -8px;
            transform: translateX(-50%);
            width: 50px;
            height: 3px;
            background-color: white;
            border-radius: 3px;
          }
          .item-image-container {
            transition: all 0.3s ease;
            overflow: hidden;
          }
          .item-thumbnail {
            width: 60px;
            height: 60px;
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
          .modal-image {
            width: 100%;
            height: 300px;
            object-fit: cover;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @media (min-width: 1024px) {
            .menu-grid {
              grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            }
          }
        `}
      </style>
      
      {/* Visible Restaurant Header */}
      <header className="visible-header w-full text-white">
        <div className="relative py-10 px-6 flex flex-col items-center justify-center min-h-[200px] md:min-h-[300px]">
          <button 
            onClick={() => window.history.back()} 
            className="absolute top-4 left-4 flex items-center space-x-1 px-3 py-2 rounded-full bg-white bg-opacity-90 text-amber-600 hover:bg-opacity-100 transition-all duration-200 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="z-10 transform transition-all duration-300 hover:scale-[1.02]">
            <div className="logo-placeholder mb-4 mx-auto">
              <svg className="w-10 h-10 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h1 className="restaurant-title text-center text-3xl md:text-5xl lg:text-6xl mb-4">
              {menu.name}
            </h1>
            
            {menu.description && (
              <p className="text-center text-white mt-4 max-w-md mx-auto text-base md:text-lg font-light">
                {menu.description}
              </p>
            )}
          </div>
          
          <div className="header-wave"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-1/3 left-10 w-8 h-8 bg-white opacity-20 rounded-full transform animate-pulse"></div>
          <div className="absolute top-2/3 right-10 w-6 h-6 bg-white opacity-10 rounded-full transform animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/4 w-10 h-10 bg-white opacity-15 rounded-full transform animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-white opacity-25 rounded-full transform animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
      </header>
      
      {/* Menu Sections Navigation */}
      <div className="sticky top-0 z-10 bg-white shadow-md">
        <nav className="menu-section-nav overflow-x-auto py-2 px-4 flex space-x-2 md:space-x-4 md:justify-center">
          {menu.sections?.map((section, index) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id, index)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm md:text-base font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Menu Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {menu.sections?.map((section, sectionIndex) => (
          <div
            key={section.id}
            ref={el => sectionRefs.current[section.id] = el}
            className={`mb-12 ${activeSection === section.id ? 'block' : 'hidden md:block'}`}
          >
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{section.name}</h2>
              {section.description && (
                <p className="mt-2 text-gray-600">{section.description}</p>
              )}
            </div>
            
            {section.items.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 menu-grid">
                {section.items.map((item) => (
                  <div 
                    key={item.id} 
                    className="menu-item-card bg-white rounded-lg overflow-hidden shadow-md border border-gray-100 cursor-pointer hover:shadow-lg"
                    onClick={() => openItemModal(item)}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          {/* Show thumbnail */}
                          {item.imageUrl && (
                            <div className="flex-shrink-0">
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="item-thumbnail"
                                onError={(e) => {
                                  const imgElement = e.currentTarget;
                                  imgElement.src = 'https://via.placeholder.com/60x60?text=NA';
                                  imgElement.style.objectFit = 'contain';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-amber-600">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="mt-2 text-gray-600 text-sm">{item.description}</p>
                            )}
                            
                            {/* Display dietary tags */}
                            {item.dietaryTags && item.dietaryTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.dietaryTags.map(tag => (
                                  <span 
                                    key={tag.id}
                                    className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-md flex items-center"
                                    title={tag.name}
                                  >
                                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Display allergens */}
                            {item.allergens && item.allergens.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.allergens.map(allergen => (
                                  <span 
                                    key={allergen.id}
                                    className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-md flex items-center"
                                    title={allergen.name}
                                  >
                                    {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                                    {allergen.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-amber-600 font-bold whitespace-nowrap ml-2">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No items in this section</p>
              </div>
            )}
          </div>
        ))}
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
            ) : (
              <div className="w-full h-48 bg-amber-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm0 2h10a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                <span className="text-amber-600 font-bold text-xl">${selectedItem.price.toFixed(2)}</span>
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
    </div>
  );
};

export default PublicMenuPage; 