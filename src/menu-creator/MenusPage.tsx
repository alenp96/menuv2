import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { useAction } from 'wasp/client/operations';
import { getMenusByUser, createMenu, deleteMenu } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { formatDistance } from 'date-fns';
import { Menu, assertMenu } from './types';
import CsvImportModal from './components/CsvImportModal';

const MenusPage = () => {
  const { data: menus, isLoading, error, refetch } = useQuery(getMenusByUser);
  const createMenuFn = useAction(createMenu);
  const deleteMenuFn = useAction(deleteMenu);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuDescription, setNewMenuDescription] = useState('');
  const navigate = useNavigate();
  const { data: user } = useAuth();

  const handleCreateMenu = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newMenu = await createMenuFn({
        name: newMenuName,
        description: newMenuDescription || undefined
      });
      
      if (newMenu) {
        setNewMenuName('');
        setNewMenuDescription('');
        setIsSubmitting(false);
        setIsCreating(false);
        
        await refetch();
        navigate(`/menus/${assertMenu(newMenu).id}`);
      } else {
        alert('Error: Menu was created but no data was returned. Please refresh the page.');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      alert(`Failed to create menu: ${error.message || 'Unknown error'}`);
      setIsSubmitting(false);
    }
  }, [newMenuName, newMenuDescription, createMenuFn, refetch, navigate, isSubmitting]);

  const handleDeleteMenu = useCallback(async (menuId: string) => {
    if (window.confirm('Are you sure you want to delete this menu? This action cannot be undone.')) {
      try {
        await deleteMenuFn({ menuId });
        refetch();
      } catch (error) {
        console.error('Failed to delete menu:', error);
      }
    }
  }, [deleteMenuFn, refetch]);

  const showCreateForm = useCallback(() => {
    setIsCreating(true);
    setIsSubmitting(false);
    setNewMenuName('');
    setNewMenuDescription('');
  }, []);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    setIsSubmitting(false);
    setNewMenuName('');
    setNewMenuDescription('');
  }, []);

  const handleOpenImportModal = useCallback(() => {
    setShowImportModal(true);
  }, []);

  const handleCloseImportModal = useCallback(() => {
    setShowImportModal(false);
    setIsSubmitting(false);
  }, []);

  const handleImportSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading menus: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Menus</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleOpenImportModal}
            className="bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded"
            disabled={isSubmitting}
          >
            Import Menu
          </button>
          <button
            onClick={showCreateForm}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
            disabled={isSubmitting}
          >
            Create New Menu
          </button>
        </div>
      </div>

      {/* Import Modal */}
      <CsvImportModal 
        isOpen={showImportModal} 
        onClose={handleCloseImportModal} 
        onSuccess={handleImportSuccess} 
      />

      {isCreating && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Menu</h2>
          <form onSubmit={handleCreateMenu}>
            <div className="mb-4">
              <label htmlFor="menuName" className="block text-sm font-medium text-gray-700 mb-1">
                Menu Name *
              </label>
              <input
                type="text"
                id="menuName"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter menu name"
                disabled={isSubmitting}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="menuDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="menuDescription"
                value={newMenuDescription}
                onChange={(e) => setNewMenuDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter a description for your menu"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelCreate}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newMenuName.trim() || isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary-dark'
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Menu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {menus && menus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menuData: any) => {
            const menu = assertMenu(menuData);
            return (
              <div key={menu.id} className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{menu.name}</h2>
                    {menu.isPublished && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Published
                      </span>
                    )}
                  </div>
                  {menu.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{menu.description}</p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <div>
                      <span>{menu.sections?.length || 0} sections</span>
                      <span className="mx-2">•</span>
                      <span>
                        {menu.updatedAt 
                          ? `Updated ${formatDistance(new Date(menu.updatedAt), new Date(), { addSuffix: true })}`
                          : `Created ${formatDistance(new Date(menu.createdAt), new Date(), { addSuffix: true })}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <Link
                        to={`/menus/${menu.id}`}
                        className="flex-1 inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 hover:shadow-md transition-all duration-200"
                      >
                        Edit Menu
                      </Link>
                      {menu.isPublished && menu.publicUrl && (
                        <Link
                          to={`/menu/${menu.publicUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 hover:shadow-md transition-all duration-200"
                        >
                          View
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteMenu(menu.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-semibold mb-2 text-gray-700">No menus yet</h2>
          <p className="text-gray-500 mb-6">Create your first menu to get started.</p>
          <button
            onClick={showCreateForm}
            className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Create Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default MenusPage; 