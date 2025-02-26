import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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

// Custom hook for navigation blocking - rewritten to ensure consistent hook execution
const useNavigationBlocker = (
  shouldBlock: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave?'
) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle browser back/forward buttons and tab/window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldBlock) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock, message]);

  // Always define these callbacks regardless of shouldBlock to maintain consistent hook order
  const confirmNavigation = useCallback((callback: () => void) => {
    if (!shouldBlock || window.confirm(message)) {
      callback();
    }
  }, [shouldBlock, message]);

  const handleNavigateTo = useCallback((to: string) => {
    confirmNavigation(() => navigate(to));
  }, [confirmNavigation, navigate]);

  const handleNavigateBack = useCallback(() => {
    confirmNavigation(() => navigate(-1));
  }, [confirmNavigation, navigate]);

  // Handle in-app navigation - always define this effect regardless of shouldBlock
  useEffect(() => {
    // This is a placeholder for when useBlocker becomes stable in React Router v6
    return () => {}; // Always return a cleanup function for consistent hook behavior
  }, [shouldBlock, navigate, location]);

  return useMemo(() => ({
    confirmNavigation,
    handleNavigateTo,
    handleNavigateBack
  }), [confirmNavigation, handleNavigateTo, handleNavigateBack]);
};

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
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
  
  // Track if menu has been modified
  useEffect(() => {
    if (menu) {
      const isModified = 
        menuName !== menu.name || 
        menuDescription !== (menu.description || '') || 
        menuPublicUrl !== (menu.publicUrl || '');
      
      setHasUnsavedChanges(isModified);
    }
  }, [menuName, menuDescription, menuPublicUrl, menu]);
  
  // Use our custom navigation blocker - now returns an object with navigation handlers
  const { confirmNavigation, handleNavigateTo, handleNavigateBack } = useNavigationBlocker(hasUnsavedChanges);
  
  useEffect(() => {
    if (menu) {
      setMenuName(menu.name);
      setMenuDescription(menu.description || '');
      setMenuPublicUrl(menu.publicUrl || '');
    }
  }, [menu]);
  
  // Always define this callback to maintain consistent hook order
  const openPreview = useCallback(() => {
    // Save any pending changes first
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Save before previewing?')) {
        handleSaveMenu().then(() => {
          setShowPreviewModal(true);
        });
      } else {
        setShowPreviewModal(true);
      }
    } else {
      setShowPreviewModal(true);
    }
  }, [hasUnsavedChanges]);
  
  // Define handleSaveMenu outside of the component render function
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
      setHasUnsavedChanges(false);
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
      setHasUnsavedChanges(false);
      refetch();
    } catch (error) {
      console.error('Failed to publish menu:', error);
    } finally {
      setIsPublishing(false);
      setShowPreviewModal(false);
    }
  };
  
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
    <div className="min-h-screen bg-gray-50 bg-[url('/subtle-food-pattern.png')] bg-opacity-5 bg-fixed">
      {/* Background pattern overlay */}
      <style>{`
        @media (max-width: 768px) {
          .grid-cols-1-2 {
            grid-template-columns: 1fr;
          }
        }
        @media (min-width: 769px) {
          .grid-cols-1-2 {
            grid-template-columns: 1fr 2fr;
          }
        }
      `}</style>
      
      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Preview Menu</h2>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{menuName}</h1>
                {menuDescription && <p className="text-gray-600 mb-4">{menuDescription}</p>}
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
                                  <div className="flex justify-between">
                                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                                    <span className="font-medium text-amber-700">${item.price.toFixed(2)}</span>
                                  </div>
                                  {item.description && <p className="text-gray-600 text-sm mt-1">{item.description}</p>}
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
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close Preview
              </button>
              {!menu?.isPublished && (
                <button
                  onClick={handlePublishMenu}
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
                  onClick={handlePublishMenu}
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
      )}
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Edit Menu</h1>
            <p className="text-gray-600 mt-1">Customize your menu details and items</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleNavigateBack}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            
            {hasUnsavedChanges && (
              <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Unsaved changes
              </div>
            )}
            
            <button
              onClick={openPreview}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
            
            {menu?.isPublished ? (
              <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-md border border-green-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Published</span>
              </div>
            ) : (
              <button
                onClick={openPreview}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 hover:shadow-md transition-all duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Publish Menu
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-1-2 gap-6">
          {/* Menu Details Card */}
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
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
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
                    value={menuPublicUrl}
                    onChange={(e) => setMenuPublicUrl(e.target.value)}
                    placeholder={menuName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')}
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
          
          {/* Menu Sections */}
          <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-800">Menu Sections</h2>
              </div>
              <button
                onClick={() => setIsAddingSectionOpen(true)}
                className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 hover:shadow-md transition-all duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Section
              </button>
            </div>
            
            {isAddingSectionOpen && (
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
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
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
                        value={newSectionDescription}
                        onChange={(e) => setNewSectionDescription(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsAddingSectionOpen(false)}
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
            )}
            
            {menu.sections && menu.sections.length > 0 ? (
              <div className="space-y-6">
                {menu.sections.map((sectionData) => {
                  const section = assertMenuSection(sectionData);
                  return (
                    <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
                      {editingSectionId === section.id ? (
                        <div className="p-4 bg-amber-50">
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
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
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
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
                                />
                              </div>
                              <div className="flex justify-end space-x-3">
                                <button
                                  type="button"
                                  onClick={() => setEditingSectionId(null)}
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-medium text-gray-800">{section.name}</h3>
                            {section.description && <p className="text-gray-600 mt-1">{section.description}</p>}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditSection(section)}
                              className="p-1 text-gray-500 hover:text-amber-600 transition-colors duration-200 flex items-center"
                              title="Edit section"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-1 text-gray-500 hover:text-red-600 transition-colors duration-200 flex items-center"
                              title="Delete section"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Items */}
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Items
                          </h4>
                          <button
                            onClick={() => setIsAddingItemOpen(section.id)}
                            className="px-2 py-1 text-xs border border-transparent rounded-md shadow-sm font-medium text-white bg-amber-600 hover:bg-amber-700 hover:shadow-md transition-all duration-200 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Item
                          </button>
                        </div>
                        
                        {isAddingItemOpen === section.id && (
                          <div className="mb-4 p-3 border border-gray-200 rounded-md bg-amber-50">
                            <h5 className="text-sm font-medium mb-2 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add New Item
                            </h5>
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
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
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
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
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
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
                                    required
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setIsAddingItemOpen(null)}
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
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Item
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        )}
                        
                        {section.items && section.items.length > 0 ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            {section.items.map((itemData) => {
                              const item = assertMenuItem(itemData);
                              return (
                                <div key={item.id} className="border border-gray-200 rounded-md p-3 hover:shadow-md transition-all duration-200 bg-white">
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
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
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
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
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
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
                                            required
                                          />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                          <button
                                            type="button"
                                            onClick={() => setEditingItemId(null)}
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
                                    <div>
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <h5 className="font-medium text-gray-800">{item.name}</h5>
                                          {item.description && <p className="text-gray-600 text-sm mt-1">{item.description}</p>}
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium mr-4 text-amber-700">${item.price.toFixed(2)}</span>
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => startEditItem(item)}
                                              className="p-1 text-xs text-gray-500 hover:text-amber-600 transition-colors duration-200"
                                              title="Edit item"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                              </svg>
                                            </button>
                                            <button
                                              onClick={() => handleDeleteItem(item.id)}
                                              className="p-1 text-xs text-gray-500 hover:text-red-600 transition-colors duration-200"
                                              title="Delete item"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic bg-gray-50 p-4 rounded-md text-center">No items in this section. Add your first item to get started.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-xl font-semibold mb-2 text-gray-700">No sections yet</h2>
                <p className="text-gray-500 mb-4">Add a section to get started with your menu.</p>
                <button
                  onClick={() => setIsAddingSectionOpen(true)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 hover:shadow-md transition-all duration-200 flex items-center mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Section
                </button>
              </div>
            )}
          </div>
          
          {/* Public URL */}
          {menu.isPublished && menu.publicUrl && (
            <div className="bg-white shadow-md rounded-lg p-6 mt-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-800">Public Menu URL</h2>
              </div>
              <div className="flex items-center flex-wrap md:flex-nowrap gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={`${window.location.origin}/menu/${menu.publicUrl}`}
                    readOnly
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/menu/${menu.publicUrl}`);
                    alert('URL copied to clipboard!');
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 hover:shadow-md transition-all duration-200 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy URL
                </button>
                <a 
                  href={`/menu/${menu.publicUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Menu
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuEditorPage; 