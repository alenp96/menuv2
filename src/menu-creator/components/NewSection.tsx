import React, { useState } from 'react';
import { useAction, useQuery } from 'wasp/client/operations';
import { createMenuSection, getMenuById } from 'wasp/client/operations';
import { assertMenu } from '../types';

interface NewSectionProps {
  menuId: string;
  onSectionAdded: () => void;
  onCancel: () => void;
}

const NewSection: React.FC<NewSectionProps> = ({ menuId, onSectionAdded, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Get the current menu to determine the position for the new section
  const { data: menuData } = useQuery(getMenuById, { menuId });
  const menu = menuData ? assertMenu(menuData) : null;
  
  const createMenuSectionFn = useAction(createMenuSection);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      // Calculate the position based on existing sections
      const position = menu?.sections?.length || 0;
      
      await createMenuSectionFn({
        menuId,
        name,
        description: description || '',
        position
      });
      setName('');
      setDescription('');
      onSectionAdded();
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-md bg-amber-50">
      <h3 className="text-lg font-medium mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add New Section
      </h3>
      
      <form onSubmit={handleAddSection}>
        <div className="space-y-4">
          <div>
            <label htmlFor="newSectionName" className="block text-sm font-medium text-gray-700">
              Section Name
            </label>
            <input
              type="text"
              id="newSectionName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
              required
            />
          </div>
          <div>
            <label htmlFor="newSectionDescription" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="newSectionDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 hover:shadow-md transition-all duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Section
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewSection; 