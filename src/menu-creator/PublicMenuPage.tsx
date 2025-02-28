import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getPublicMenu } from 'wasp/client/operations';
import { Menu, MenuSection, MenuItem, assertMenu } from './types';

// Standalone public menu page without any app components
const PublicMenuPage = () => {
  const params = useParams<{ publicUrl: string }>();
  const publicUrl = params.publicUrl || '';
  
  const { data: menuData, isLoading, error } = useQuery(getPublicMenu, { publicUrl });
  const menu = menuData ? assertMenu(menuData) : null;
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
  
  const activeItems = menu?.sections?.find(section => section.id === activeSection)?.items || [];
  const activeSection_data = menu?.sections?.find(section => section.id === activeSection);
  
  // Add useEffect to log image URLs
  useEffect(() => {
    if (activeItems) {
      activeItems.forEach(item => {
        if (item.imageUrl) {
          console.log('Menu item has image URL:', item.imageUrl);
        }
      });
    }
  }, [activeItems]);
  
  if (isLoading) return (
    <div className="flex justify-center items-center h-screen bg-white">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-screen bg-white">
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
    <div className="flex justify-center items-center h-screen bg-white">
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
    <div className="min-h-screen bg-white font-sans">
      {/* Add a style tag to ensure this page is completely standalone */}
      <style>
        {`
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .public-menu-page {
            isolation: isolate;
          }
        `}
      </style>
      
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white shadow-md">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold truncate">{menu.name}</h1>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md bg-amber-500 text-white"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-10 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute top-16 left-0 right-0 bottom-0 bg-white overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Menu Sections</h2>
              <ul className="space-y-2">
                {menu.sections?.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => {
                        setActiveSection(section.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg ${
                        activeSection === section.id
                          ? 'bg-amber-100 text-amber-800 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {section.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto pt-16 lg:pt-8 lg:flex">
        {/* Desktop Header & Sidebar */}
        <div className="hidden lg:block lg:w-1/4 h-screen sticky top-0 overflow-y-auto p-6 border-r border-gray-200">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{menu.name}</h1>
            {menu.description && (
              <p className="mt-2 text-gray-600">{menu.description}</p>
            )}
          </div>
          
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Menu Sections</h2>
          <ul className="space-y-2">
            {menu.sections?.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    activeSection === section.id
                      ? 'bg-amber-100 text-amber-800 font-medium shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {section.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Content */}
        <div className="lg:w-3/4 p-4 lg:p-8">
          {/* Mobile-only header for section name */}
          <div className="lg:hidden mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeSection_data?.name || "Select a section"}
            </h2>
          </div>
          
          {activeSection ? (
            <div>
              <div className="hidden lg:block mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {activeSection_data?.name}
                </h2>
                {activeSection_data?.description && (
                  <p className="text-gray-600">
                    {activeSection_data.description}
                  </p>
                )}
              </div>
              
              {activeItems.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {activeItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                      {item.imageUrl && (
                        <div className="w-full h-48 overflow-hidden">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            onLoad={() => console.log('Image loaded successfully:', item.imageUrl)}
                            onError={(e) => {
                              console.error('Image failed to load:', item.imageUrl);
                              // Try with a different URL format
                              const imgElement = e.currentTarget;
                              const originalSrc = imgElement.src;
                              
                              // If this is the first error, try changing the URL format
                              if (originalSrc === item.imageUrl) {
                                console.log('Trying alternative URL format...');
                                // Try a different URL format (without the region in the domain)
                                const altUrl = item.imageUrl.replace(
                                  /https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.*)/,
                                  'https://$1.s3.amazonaws.com/$3'
                                );
                                if (altUrl !== originalSrc) {
                                  console.log('Using alternative URL:', altUrl);
                                  imgElement.src = altUrl;
                                  return;
                                }
                              }
                              
                              // If we've already tried an alternative or no alternative is available, use a placeholder
                              imgElement.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                              imgElement.style.objectFit = 'contain';
                              console.log('Using placeholder image');
                            }}
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <span className="text-amber-600 font-bold">${item.price.toFixed(2)}</span>
                        </div>
                        {item.description && (
                          <p className="mt-2 text-gray-600">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <p className="text-gray-500 text-lg">No items in this section</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <p className="text-gray-500 text-lg">Select a section to view items</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Simple Footer */}
      <div className="mt-12 py-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} {menu.name}</p>
        </div>
      </div>
    </div>
  );
};

export default PublicMenuPage; 