import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useAction } from 'wasp/client/operations';
import { getMenuById, publishMenu } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { Menu, assertMenu } from './types';
import { MenuDetailsForm } from './components/MenuDetailsForm';
import MenuSectionsList from './components/MenuSectionsList';
import PreviewModal from './components/PreviewModal';
import PublicUrl from './components/PublicUrl';

// Custom hooks and components
import useNavigationBlocker from './hooks/useNavigationBlocker';

const MenuEditorPage = () => {
  const params = useParams<{ menuId: string }>();
  const menuId = params.menuId || '';
  const { data: user } = useAuth();
  
  const { data: menuData, isLoading, error, refetch } = useQuery(getMenuById, { menuId });
  const menu = menuData ? assertMenu(menuData) : null;
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Actions
  const publishMenuFn = useAction(publishMenu);
  
  // Custom navigation blocker
  const { handleNavigateBack } = useNavigationBlocker(hasUnsavedChanges);
  
  // Handlers
  const handleMenuUpdated = () => {
    setHasUnsavedChanges(false);
    // Force a full refetch to get the latest data
    refetch();
  };
  
  const handleSectionsUpdated = () => {
    refetch();
  };
  
  const openPreview = () => {
    setShowPreviewModal(true);
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
      <PreviewModal 
        menu={menu}
        isOpen={showPreviewModal}
        isPublishing={isPublishing}
        onClose={() => setShowPreviewModal(false)}
        onPublish={handlePublishMenu}
      />
      
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
          <MenuDetailsForm 
            menu={menu} 
            onMenuUpdated={handleMenuUpdated} 
          />
          
          {/* Menu Sections */}
          <MenuSectionsList 
            menu={menu} 
            onSectionsUpdated={handleSectionsUpdated} 
          />
          
          {/* Public URL (if published) */}
          <PublicUrl menu={menu} />
        </div>
      </div>
    </div>
  );
};

export default MenuEditorPage; 