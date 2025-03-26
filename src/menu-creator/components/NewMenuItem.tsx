import React, { useState } from 'react';
import { useAction, useQuery } from 'wasp/client/operations';
import { createMenuItem, getMenuById } from 'wasp/client/operations';
import { NewItemImageUpload } from './NewItemImageUpload';
import { assertMenu, assertMenuSection, DietaryTag, Allergen } from '../types';
import TagSelector from './TagSelector';
import IconSelector from './IconSelector';
import { PREDEFINED_DIETARY_TAGS } from '../constants/dietaryTags';
import { PREDEFINED_ALLERGENS } from '../constants/allergens';

interface NewMenuItemProps {
  sectionId: string;
  onItemAdded: () => void;
  onCancel: () => void;
}

const NewMenuItem: React.FC<NewMenuItemProps> = ({ sectionId, onItemAdded, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);

  // Find the section in the menu to determine the position for the new item
  const { data: menuData } = useQuery(getMenuById, { 
    menuId: sectionId.split('_')[0] // Extract menuId from sectionId if needed
  });
  const menu = menuData ? assertMenu(menuData) : null;

  const createMenuItemFn = useAction(createMenuItem);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;
    
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return;
    
    try {
      // Find the section and calculate position
      let position = 0;
      if (menu?.sections) {
        const section = menu.sections.find((s: { id: string }) => s.id === sectionId);
        if (section) {
          const typedSection = assertMenuSection(section);
          position = typedSection.items.length;
        }
      }
      
      // If we have an image URL, include it in the initial item creation
      const newItem = await createMenuItemFn({
        sectionId,
        name,
        description: description || '',
        price: numericPrice,
        position,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        icon: icon || undefined,
        dietaryTags: dietaryTags.length > 0 ? dietaryTags : undefined,
        allergens: allergens.length > 0 ? allergens : undefined
      });
      
      setName('');
      setDescription('');
      setPrice('');
      setImageUrl(null);
      setImageFile(null);
      setVideoUrl(null);
      setIcon(null);
      setDietaryTags([]);
      setAllergens([]);
      onItemAdded();
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  return (
    <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
      <h4 className="text-sm font-medium mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add New Item
      </h4>
      
      <form onSubmit={handleAddItem} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label htmlFor="newItemName" className="block text-xs font-medium text-gray-700">
              Item Name
            </label>
            <input
              type="text"
              id="newItemName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
              required
            />
          </div>
          <div className="w-full sm:w-24">
            <label htmlFor="newItemPrice" className="block text-xs font-medium text-gray-700">
              Price
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="newItemPrice"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 pl-7 pr-3 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
                required
              />
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="newItemDescription" className="block text-xs font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            id="newItemDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
          />
        </div>

        <div>
          <label htmlFor="newItemVideoUrl" className="block text-xs font-medium text-gray-700">
            Video URL (Optional)
          </label>
          <input
            type="url"
            id="newItemVideoUrl"
            value={videoUrl || ''}
            onChange={(e) => setVideoUrl(e.target.value || null)}
            placeholder="https://example.com/video.mp4 or YouTube/Vimeo URL"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide a direct link to a video file (mp4, webm, ogg), YouTube, or Vimeo URL.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <IconSelector
            selectedIcon={icon}
            onIconSelect={setIcon}
          />
          
          <NewItemImageUpload
            onImageSelected={(url: string) => setImageUrl(url)}
            onFileSelected={(file: File) => setImageFile(file)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TagSelector
            title="Dietary Tags"
            description="Select dietary preferences for this item"
            availableTags={PREDEFINED_DIETARY_TAGS}
            selectedTags={dietaryTags}
            onTagsChange={setDietaryTags}
          />
          
          <TagSelector
            title="Allergens"
            description="Select allergens present in this item"
            availableTags={PREDEFINED_ALLERGENS}
            selectedTags={allergens}
            onTagsChange={setAllergens}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 hover:shadow-md transition-all duration-200"
          >
            Add Item
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewMenuItem; 