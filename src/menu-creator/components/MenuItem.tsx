import React, { useState } from 'react';
import { useAction } from 'wasp/client/operations';
import { updateMenuItem, deleteMenuItem } from 'wasp/client/operations';
import { MenuItem as MenuItemType, Menu, assertMenuItem, DietaryTag, Allergen, formatPrice } from '../types';
import { MenuItemImageUpload } from './MenuItemImageUpload';
import TagSelector from './TagSelector';
import TagDisplay from './TagDisplay';
import { PREDEFINED_DIETARY_TAGS } from '../constants/dietaryTags';
import { PREDEFINED_ALLERGENS } from '../constants/allergens';

interface MenuItemProps {
  item: MenuItemType;
  menu: Menu;  // Add menu prop to access currency info
  onItemUpdated: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, menu, onItemUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || '');
  const [price, setPrice] = useState(item.price.toString());
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>(item.dietaryTags || []);
  const [allergens, setAllergens] = useState<Allergen[]>(item.allergens || []);

  const updateMenuItemFn = useAction(updateMenuItem);
  const deleteMenuItemFn = useAction(deleteMenuItem);

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;
    
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return;
    
    try {
      await updateMenuItemFn({
        itemId: item.id,
        name,
        description: description || '',
        price: numericPrice,
        imageUrl: item.imageUrl || undefined,
        dietaryTags: dietaryTags,
        allergens: allergens
      });
      setIsEditing(false);
      onItemUpdated();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };
  
  const handleDeleteItem = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteMenuItemFn({ itemId: item.id });
      onItemUpdated();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const typedItem = assertMenuItem(item);

  return (
    <div className="border border-gray-200 rounded-md p-3 hover:shadow-md transition-all duration-200 bg-white">
      {isEditing ? (
        <form onSubmit={handleUpdateItem}>
          <div className="space-y-3">
            <div>
              <label htmlFor={`editingItemName-${item.id}`} className="block text-xs font-medium text-gray-700">
                Item Name
              </label>
              <input
                type="text"
                id={`editingItemName-${item.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor={`editingItemDescription-${item.id}`} className="block text-xs font-medium text-gray-700">
                Description
              </label>
              <textarea
                id={`editingItemDescription-${item.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor={`editingItemPrice-${item.id}`} className="block text-xs font-medium text-gray-700">
                Price
              </label>
              <input
                type="number"
                id={`editingItemPrice-${item.id}`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Item Image
              </label>
              <MenuItemImageUpload 
                itemId={item.id} 
                currentImageUrl={item.imageUrl} 
                onImageUploaded={onItemUpdated}
              />
            </div>
            
            <div className="flex space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 hover:shadow-md transition-all duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-start space-x-3">
          {typedItem.imageUrl && (
            <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={typedItem.imageUrl} 
                alt={typedItem.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const imgElement = e.currentTarget;
                  imgElement.src = 'https://via.placeholder.com/60x60?text=NA';
                  imgElement.style.objectFit = 'contain';
                }}
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-medium">{typedItem.name}</h5>
                {typedItem.description && <p className="text-gray-500 mt-1">{typedItem.description}</p>}
                
                {/* Display dietary tags and allergens */}
                {typedItem.dietaryTags && typedItem.dietaryTags.length > 0 && (
                  <TagDisplay 
                    tags={typedItem.dietaryTags} 
                    type="dietary" 
                    size="sm" 
                  />
                )}
                
                {typedItem.allergens && typedItem.allergens.length > 0 && (
                  <TagDisplay 
                    tags={typedItem.allergens} 
                    type="allergen" 
                    size="sm" 
                  />
                )}
                
                <p className="text-amber-600 font-medium mt-1">{formatPrice(typedItem.price, menu)}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200"
                  title="Edit Item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteItem}
                  className="p-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-red-600 bg-white hover:bg-red-50 hover:shadow transition-all duration-200"
                  title="Delete Item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItem; 