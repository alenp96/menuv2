import React, { useState, useEffect } from 'react';
import { useAction } from 'wasp/client/operations';
import { updateMenu } from 'wasp/client/operations';
import { Menu } from '../types';

interface MenuDetailsFormProps {
  menu: Menu;
  onMenuUpdated: () => void;
}

const MenuDetailsForm: React.FC<MenuDetailsFormProps> = ({ menu, onMenuUpdated }) => {
  const [name, setName] = useState(menu.name);
  const [description, setDescription] = useState(menu.description || '');
  const [publicUrl, setPublicUrl] = useState(menu.publicUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateMenuFn = useAction(updateMenu);

  // Track if menu details have been modified
  useEffect(() => {
    const isModified = 
      name !== menu.name || 
      description !== (menu.description || '') || 
      publicUrl !== (menu.publicUrl || '');
    
    setHasUnsavedChanges(isModified);
  }, [name, description, publicUrl, menu]);

  const handleSaveMenu = async () => {
    setIsSaving(true);
    try {
      // Generate a URL-friendly slug if the publicUrl is empty
      let finalPublicUrl = publicUrl.trim();
      if (!finalPublicUrl) {
        finalPublicUrl = name.toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
      }
      
      await updateMenuFn({
        menuId: menu.id,
        name,
        description: description || '',
        publicUrl: finalPublicUrl
      });
      setPublicUrl(finalPublicUrl);
      setHasUnsavedChanges(false);
      onMenuUpdated();
    } catch (error) {
      console.error('Failed to update menu:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-800">Menu Details</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="menuName" className="block text-sm font-medium text-gray-700">
            Menu Name
          </label>
          <input
            type="text"
            id="menuName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
          />
        </div>
        <div>
          <label htmlFor="menuDescription" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="menuDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
          />
        </div>
        <div>
          <label htmlFor="menuPublicUrl" className="block text-sm font-medium text-gray-700">
            Permalink
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              /menu/
            </span>
            <input
              type="text"
              id="menuPublicUrl"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              placeholder={name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')}
              className="flex-1 block w-full rounded-none rounded-r-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Customize the URL for your public menu. Leave blank to use the menu name.
          </p>
          {menu.isPublished && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm text-gray-500">Public URL:</span>
              <a 
                href={`/menu/${menu.publicUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-amber-600 hover:text-amber-800 transition-colors duration-200"
              >
                {window.location.origin}/menu/{menu.publicUrl}
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/menu/${menu.publicUrl}`);
                  alert('URL copied to clipboard!');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Copy URL"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveMenu}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-400'} disabled:opacity-50 hover:shadow-md transition-all duration-200 flex items-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuDetailsForm; 