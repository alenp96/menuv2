import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getPublicMenu } from 'wasp/client/operations';
import { Menu, MenuSection, MenuItem, assertMenu } from './types';

const PublicMenuPage = () => {
  const params = useParams<{ publicUrl: string }>();
  const publicUrl = params.publicUrl || '';
  
  const { data: menuData, isLoading, error } = useQuery(getPublicMenu, { publicUrl });
  const menu = menuData ? assertMenu(menuData) : null;
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  useEffect(() => {
    if (menu && menu.sections && menu.sections.length > 0) {
      setActiveSection(menu.sections[0].id);
    }
  }, [menu]);
  
  if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div></div>;
  
  if (error) return <div className="text-center p-8 text-red-500">Error loading menu: {error.message}</div>;
  
  if (!menu) return <div className="text-center p-8">Menu not found</div>;
  
  const activeItems = menu.sections?.find(section => section.id === activeSection)?.items || [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Menu Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <h1 className="text-3xl font-bold">{menu.name}</h1>
            {menu.description && (
              <p className="mt-2 text-blue-100">{menu.description}</p>
            )}
          </div>
          
          {/* Menu Content */}
          <div className="flex flex-col md:flex-row">
            {/* Sections Sidebar */}
            <div className="md:w-1/3 border-r border-gray-200">
              <nav className="p-4">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Menu Sections</h2>
                <ul>
                  {menu.sections?.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left px-4 py-2 rounded-md mb-1 ${
                          activeSection === section.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {section.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            
            {/* Items Content */}
            <div className="md:w-2/3 p-4">
              {activeSection ? (
                <>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    {menu.sections?.find(section => section.id === activeSection)?.name}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {menu.sections?.find(section => section.id === activeSection)?.description}
                  </p>
                  
                  <div className="space-y-4">
                    {activeItems.length > 0 ? (
                      activeItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between">
                            <h3 className="text-lg font-medium text-gray-800">{item.name}</h3>
                            <span className="text-lg font-semibold text-blue-600">${item.price.toFixed(2)}</span>
                          </div>
                          {item.description && (
                            <p className="mt-1 text-gray-600">{item.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No items in this section</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">Select a section to view items</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicMenuPage; 