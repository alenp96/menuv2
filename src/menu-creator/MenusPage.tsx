import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { useAction } from 'wasp/client/operations';
import { getMenusByUser, createMenu, deleteMenu } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { formatDistance } from 'date-fns';
import { Menu, assertMenu } from './types';

const MenusPage = () => {
  const { data: menus, isLoading, error, refetch } = useQuery(getMenusByUser);
  const createMenuFn = useAction(createMenu);
  const deleteMenuFn = useAction(deleteMenu);
  const [isCreating, setIsCreating] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuDescription, setNewMenuDescription] = useState('');
  const navigate = useNavigate();
  const { data: user } = useAuth();

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim()) return;

    try {
      const newMenu = await createMenuFn({
        name: newMenuName,
        description: newMenuDescription || undefined
      });
      setNewMenuName('');
      setNewMenuDescription('');
      setIsCreating(false);
      refetch();
      navigate(`/menus/${assertMenu(newMenu).id}`);
    } catch (error) {
      console.error('Failed to create menu:', error);
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (window.confirm('Are you sure you want to delete this menu? This action cannot be undone.')) {
      try {
        await deleteMenuFn({ menuId });
        refetch();
      } catch (error) {
        console.error('Failed to delete menu:', error);
      }
    }
  };

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
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
        >
          Create New Menu
        </button>
      </div>

      {isCreating && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Menu</h2>
          <form onSubmit={handleCreateMenu}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="menuName">
                Menu Name
              </label>
              <input
                id="menuName"
                type="text"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter menu name"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="menuDescription">
                Description (optional)
              </label>
              <textarea
                id="menuDescription"
                value={newMenuDescription}
                onChange={(e) => setNewMenuDescription(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter menu description"
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
              >
                Create Menu
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
              <div key={menu.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{menu.name}</h2>
                  {menu.description && <p className="text-gray-600 mb-4">{menu.description}</p>}
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>Created {formatDistance(new Date(menu.createdAt), new Date(), { addSuffix: true })}</span>
                    <span className={`px-2 py-1 rounded ${menu.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {menu.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <Link
                      to={`/menus/${menu.id}`}
                      className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
                    >
                      Edit Menu
                    </Link>
                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Delete
                    </button>
                  </div>
                  {menu.isPublished && (
                    <div className="mt-4">
                      <a
                        href={`/menu/${menu.publicUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark underline"
                      >
                        View Public Menu
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">No menus yet</h2>
          <p className="text-gray-600 mb-4">Create your first menu to get started!</p>
        </div>
      )}
    </div>
  );
};

export default MenusPage; 