import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { useAction } from 'wasp/client/operations';
import { 
  getMenuById, 
  updateMenu, 
  createMenuSection, 
  updateMenuSection, 
  deleteMenuSection,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  publishMenu
} from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { Menu, MenuSection, MenuItem, assertMenu, assertMenuSection, assertMenuItem } from './types';

const MenuEditorPage = () => {
  const params = useParams<{ menuId: string }>();
  const menuId = params.menuId || '';
  const navigate = useNavigate();
  const { data: user } = useAuth();
  
  const { data: menuData, isLoading, error, refetch } = useQuery(getMenuById, { menuId });
  const menu = menuData ? assertMenu(menuData) : null;
  
  const [menuName, setMenuName] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuPublicUrl, setMenuPublicUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Section state
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [editingSectionDescription, setEditingSectionDescription] = useState('');
  
  // Item state
  const [isAddingItemOpen, setIsAddingItemOpen] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingItemDescription, setEditingItemDescription] = useState('');
  const [editingItemPrice, setEditingItemPrice] = useState('');
  
  // Actions
  const updateMenuFn = useAction(updateMenu);
  const publishMenuFn = useAction(publishMenu);
  const createMenuSectionFn = useAction(createMenuSection);
  const updateMenuSectionFn = useAction(updateMenuSection);
  const deleteMenuSectionFn = useAction(deleteMenuSection);
  const createMenuItemFn = useAction(createMenuItem);
  const updateMenuItemFn = useAction(updateMenuItem);
  const deleteMenuItemFn = useAction(deleteMenuItem);
  
  useEffect(() => {
    if (menu) {
      setMenuName(menu.name);
      setMenuDescription(menu.description || '');
      setMenuPublicUrl(menu.publicUrl || '');
    }
  }, [menu]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading menu: {error.message}</p>
        </div>
      </div>
    );
  }
  
  if (!menu) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Menu not found</p>
        </div>
      </div>
    );
  }
  
  const handleSaveMenu = async () => {
    setIsSaving(true);
    try {
      // Generate a URL-friendly slug if the publicUrl is empty
      let publicUrl = menuPublicUrl.trim();
      if (!publicUrl) {
        publicUrl = menuName.toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
      }
      
      await updateMenuFn({
        menuId,
        name: menuName,
        description: menuDescription || '',
        publicUrl
      });
      setMenuPublicUrl(publicUrl);
      refetch();
    } catch (error) {
      console.error('Failed to update menu:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePublishMenu = async () => {
    setIsPublishing(true);
    try {
      await publishMenuFn({ menuId });
      refetch();
    } catch (error) {
      console.error('Failed to publish menu:', error);
    } finally {
      setIsPublishing(false);
    }
  };
  
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    try {
      await createMenuSectionFn({
        menuId,
        name: newSectionName,
        description: newSectionDescription || '',
        position: menu && menu.sections ? menu.sections.length : 0
      });
      setNewSectionName('');
      setNewSectionDescription('');
      setIsAddingSectionOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };
  
  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSectionId || !editingSectionName.trim()) return;

    try {
      await updateMenuSectionFn({
        sectionId: editingSectionId,
        name: editingSectionName,
        description: editingSectionDescription || ''
      });
      setEditingSectionId(null);
      refetch();
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };
  
  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Are you sure you want to delete this section and all its items?')) return;
    
    try {
      await deleteMenuSectionFn({ sectionId });
      refetch();
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };
  
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddingItemOpen || !newItemName.trim() || !newItemPrice.trim()) return;
    
    const price = parseFloat(newItemPrice);
    if (isNaN(price)) return;
    
    try {
      const sectionItems = menu.sections?.find(s => s.id === isAddingItemOpen)?.items || [];
      await createMenuItemFn({
        sectionId: isAddingItemOpen,
        name: newItemName,
        description: newItemDescription || '',
        price,
        position: sectionItems.length
      });
      setNewItemName('');
      setNewItemDescription('');
      setNewItemPrice('');
      setIsAddingItemOpen(null);
      refetch();
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };
  
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId || !editingItemName.trim() || !editingItemPrice.trim()) return;
    
    const price = parseFloat(editingItemPrice);
    if (isNaN(price)) return;
    
    try {
      await updateMenuItemFn({
        itemId: editingItemId,
        name: editingItemName,
        description: editingItemDescription || '',
        price
      });
      setEditingItemId(null);
      refetch();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };
  
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteMenuItemFn({ itemId });
      refetch();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };
  
  const startEditSection = (section: MenuSection) => {
    setEditingSectionId(section.id);
    setEditingSectionName(section.name);
    setEditingSectionDescription(section.description || '');
  };
  
  const startEditItem = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
    setEditingItemDescription(item.description || '');
    setEditingItemPrice(item.price.toString());
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Menu</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
          {menu.isPublished ? (
            <div className="flex items-center text-green-600">
              <span className="mr-2">✓</span>
              <span>Published</span>
            </div>
          ) : (
            <button
              onClick={handlePublishMenu}
              disabled={isPublishing}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {isPublishing ? 'Publishing...' : 'Publish Menu'}
            </button>
          )}
        </div>
      </div>
      
      {/* Menu Details */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Menu Details</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="menuName" className="block text-sm font-medium text-gray-700">
              Menu Name
            </label>
            <input
              type="text"
              id="menuName"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="menuDescription" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="menuDescription"
              value={menuDescription}
              onChange={(e) => setMenuDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                value={menuPublicUrl}
                onChange={(e) => setMenuPublicUrl(e.target.value)}
                placeholder={menuName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')}
                className="flex-1 block w-full rounded-none rounded-r-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {window.location.origin}/menu/{menu.publicUrl}
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/menu/${menu.publicUrl}`);
                    alert('URL copied to clipboard!');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Copy URL"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveMenu}
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Sections */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Menu Sections</h2>
          <button
            onClick={() => setIsAddingSectionOpen(true)}
            className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add Section
          </button>
        </div>
        
        {isAddingSectionOpen && (
          <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-lg font-medium mb-3">Add New Section</h3>
            <form onSubmit={handleAddSection}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="newSectionName" className="block text-sm font-medium text-gray-700">
                    Section Name
                  </label>
                  <input
                    type="text"
                    id="newSectionName"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newSectionDescription" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="newSectionDescription"
                    value={newSectionDescription}
                    onChange={(e) => setNewSectionDescription(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingSectionOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Section
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
        
        {menu.sections && menu.sections.length > 0 ? (
          <div className="space-y-6">
            {menu.sections.map((sectionData) => {
              const section = assertMenuSection(sectionData);
              return (
                <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {editingSectionId === section.id ? (
                    <div className="p-4 bg-gray-50">
                      <form onSubmit={handleUpdateSection}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="editingSectionName" className="block text-sm font-medium text-gray-700">
                              Section Name
                            </label>
                            <input
                              type="text"
                              id="editingSectionName"
                              value={editingSectionName}
                              onChange={(e) => setEditingSectionName(e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="editingSectionDescription" className="block text-sm font-medium text-gray-700">
                              Description
                            </label>
                            <textarea
                              id="editingSectionDescription"
                              value={editingSectionDescription}
                              onChange={(e) => setEditingSectionDescription(e.target.value)}
                              rows={2}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => setEditingSectionId(null)}
                              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">{section.name}</h3>
                        {section.description && <p className="text-gray-600 mt-1">{section.description}</p>}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditSection(section)}
                          className="p-1 text-gray-500 hover:text-indigo-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Items */}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Items</h4>
                      <button
                        onClick={() => setIsAddingItemOpen(section.id)}
                        className="px-2 py-1 text-xs border border-transparent rounded-md shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Add Item
                      </button>
                    </div>
                    
                    {isAddingItemOpen === section.id && (
                      <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
                        <h5 className="text-sm font-medium mb-2">Add New Item</h5>
                        <form onSubmit={handleAddItem}>
                          <div className="space-y-3">
                            <div>
                              <label htmlFor="newItemName" className="block text-xs font-medium text-gray-700">
                                Item Name
                              </label>
                              <input
                                type="text"
                                id="newItemName"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="newItemDescription" className="block text-xs font-medium text-gray-700">
                                Description
                              </label>
                              <textarea
                                id="newItemDescription"
                                value={newItemDescription}
                                onChange={(e) => setNewItemDescription(e.target.value)}
                                rows={2}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label htmlFor="newItemPrice" className="block text-xs font-medium text-gray-700">
                                Price ($)
                              </label>
                              <input
                                type="number"
                                id="newItemPrice"
                                value={newItemPrice}
                                onChange={(e) => setNewItemPrice(e.target.value)}
                                step="0.01"
                                min="0"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setIsAddingItemOpen(null)}
                                className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                              >
                                Add Item
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                    
                    {section.items && section.items.length > 0 ? (
                      <div className="space-y-3">
                        {section.items.map((itemData) => {
                          const item = assertMenuItem(itemData);
                          return (
                            <div key={item.id} className="border border-gray-200 rounded-md p-3">
                              {editingItemId === item.id ? (
                                <form onSubmit={handleUpdateItem}>
                                  <div className="space-y-3">
                                    <div>
                                      <label htmlFor="editingItemName" className="block text-xs font-medium text-gray-700">
                                        Item Name
                                      </label>
                                      <input
                                        type="text"
                                        id="editingItemName"
                                        value={editingItemName}
                                        onChange={(e) => setEditingItemName(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label htmlFor="editingItemDescription" className="block text-xs font-medium text-gray-700">
                                        Description
                                      </label>
                                      <textarea
                                        id="editingItemDescription"
                                        value={editingItemDescription}
                                        onChange={(e) => setEditingItemDescription(e.target.value)}
                                        rows={2}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                      />
                                    </div>
                                    <div>
                                      <label htmlFor="editingItemPrice" className="block text-xs font-medium text-gray-700">
                                        Price ($)
                                      </label>
                                      <input
                                        type="number"
                                        id="editingItemPrice"
                                        value={editingItemPrice}
                                        onChange={(e) => setEditingItemPrice(e.target.value)}
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => setEditingItemId(null)}
                                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                      >
                                        Save Changes
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h5 className="font-medium">{item.name}</h5>
                                      {item.description && <p className="text-gray-600 text-sm mt-1">{item.description}</p>}
                                    </div>
                                    <div className="flex items-center">
                                      <span className="font-medium mr-4">${item.price.toFixed(2)}</span>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => startEditItem(item)}
                                          className="p-1 text-xs text-gray-500 hover:text-indigo-600"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteItem(item.id)}
                                          className="p-1 text-xs text-gray-500 hover:text-red-600"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No items in this section.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">No sections yet. Add a section to get started.</p>
        )}
      </div>
      
      {/* Public URL */}
      {menu.isPublished && menu.publicUrl && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Public Menu URL</h2>
          <div className="flex items-center">
            <input
              type="text"
              value={`${window.location.origin}/menu/${menu.publicUrl}`}
              readOnly
              className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/menu/${menu.publicUrl}`);
                alert('URL copied to clipboard!');
              }}
              className="ml-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Copy URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuEditorPage; 