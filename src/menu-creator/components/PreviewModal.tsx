import React from 'react';
import { useAction } from 'wasp/client/operations';
import { publishMenu } from 'wasp/client/operations';
import { Menu, MenuSection, MenuItem, assertMenuSection, assertMenuItem } from '../types';

interface PreviewModalProps {
  menu: Menu;
  isOpen: boolean;
  isPublishing: boolean;
  onClose: () => void;
  onPublish: () => Promise<void>;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ 
  menu, 
  isOpen, 
  isPublishing, 
  onClose, 
  onPublish 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Preview Menu</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{menu.name}</h1>
            {menu.description && <p className="text-gray-600 mb-4">{menu.description}</p>}
          </div>
          
          {menu?.sections && menu.sections.length > 0 ? (
            <div className="space-y-8">
              {menu.sections.map((sectionData) => {
                const section = assertMenuSection(sectionData);
                return (
                  <div key={section.id} className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{section.name}</h2>
                    {section.description && <p className="text-gray-600 mb-4">{section.description}</p>}
                    
                    {section.items && section.items.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {section.items.map((itemData) => {
                          const item = assertMenuItem(itemData);
                          return (
                            <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                              {menu.template === 'default' && item.imageUrl && (
                                <div className="w-full h-32 overflow-hidden mb-3 rounded-md">
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex justify-between">
                                <h3 className="font-medium text-gray-800">{item.name}</h3>
                                <span className="font-medium text-amber-700">
                                  {menu.currencyPosition === 'prefix' 
                                    ? `${menu.currencySymbol}${item.price.toFixed(2)}`
                                    : `${item.price.toFixed(2)}${menu.currencySymbol}`
                                  }
                                </span>
                              </div>
                              {item.description && <p className="text-gray-600 text-sm mt-1">{item.description}</p>}
                              
                              {/* Show dietary tags and allergens */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.dietaryTags && item.dietaryTags.length > 0 && item.dietaryTags.map(tag => (
                                  <span 
                                    key={tag.id}
                                    className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-md flex items-center"
                                  >
                                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                                    {tag.name}
                                  </span>
                                ))}
                                
                                {item.allergens && item.allergens.length > 0 && item.allergens.map(allergen => (
                                  <span 
                                    key={allergen.id}
                                    className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-md flex items-center"
                                  >
                                    {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                                    {allergen.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No items in this section.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">No sections in this menu yet.</p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close Preview
          </button>
          {!menu?.isPublished && (
            <button
              onClick={onPublish}
              disabled={isPublishing}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 hover:shadow-md transition-all duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isPublishing ? 'Publishing...' : 'Publish Menu'}
            </button>
          )}
          {menu?.isPublished && (
            <button
              onClick={onPublish}
              disabled={isPublishing}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 hover:shadow-md transition-all duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isPublishing ? 'Updating...' : 'Update Published Menu'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal; 