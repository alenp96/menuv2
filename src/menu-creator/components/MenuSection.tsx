import React, { useState, useCallback } from 'react';
import { useAction } from 'wasp/client/operations';
import { updateMenuSection, deleteMenuSection, reorderMenuItems } from 'wasp/client/operations';
import { MenuSection as MenuSectionType, MenuItem, Menu, assertMenuItem, formatPrice } from '../types';
import MenuItemComponent from './MenuItem';
import NewMenuItem from './NewMenuItem';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface MenuSectionProps {
  section: MenuSectionType;
  menu: Menu;
  onItemClick?: (item: MenuItem) => void;
  onMenuUpdated?: () => void;
  isEditing?: boolean;
}

const MenuSection: React.FC<MenuSectionProps> = ({ 
  section, 
  menu,
  onItemClick,
  onMenuUpdated,
  isEditing = false
}) => {
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [name, setName] = useState(section.name);
  const [description, setDescription] = useState(section.description || '');

  const updateMenuSectionFn = useAction(updateMenuSection);
  const deleteMenuSectionFn = useAction(deleteMenuSection);
  const reorderMenuItemsFn = useAction(reorderMenuItems);

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMenuSectionFn({
        sectionId: section.id,
        name,
        description
      });
      setIsEditingSection(false);
      onMenuUpdated?.();
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };

  const handleDeleteSection = async () => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      await deleteMenuSectionFn({ sectionId: section.id });
      onMenuUpdated?.();
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    try {
      await reorderMenuItemsFn({
        sectionId: section.id,
        orderedItemIds: section.items.map((item, index) => 
          index === result.destination!.index ? result.draggableId : item.id
        )
      });
      onMenuUpdated?.();
    } catch (error) {
      console.error('Failed to reorder items:', error);
    }
  };

  // If we're in editing mode, show the editor interface
  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isEditingSection ? (
          <div className="p-4">
            <h3 className="font-semibold mb-3">Edit Section</h3>
            <form onSubmit={handleUpdateSection} className="space-y-3">
              <div>
                <label htmlFor={`sectionName-${section.id}`} className="block text-sm font-medium text-gray-700">
                  Section Name
                </label>
                <input
                  type="text"
                  id={`sectionName-${section.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label htmlFor={`sectionDescription-${section.id}`} className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id={`sectionDescription-${section.id}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSection(false)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{section.name}</h3>
                  {section.description && <p className="text-gray-600 mt-1">{section.description}</p>}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setIsEditingSection(true)}
                    className="p-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Edit Section"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDeleteSection}
                    className="p-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50"
                    title="Delete Section"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200">
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Items
                  </h4>
                  <button
                    onClick={() => setIsAddingItem(true)}
                    className="px-2 py-1 text-xs border border-transparent rounded-md shadow-sm font-medium text-white bg-amber-600 hover:bg-amber-700 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>

                {isAddingItem && (
                  <NewMenuItem
                    sectionId={section.id}
                    onItemAdded={() => {
                      setIsAddingItem(false);
                      onMenuUpdated?.();
                    }}
                    onCancel={() => setIsAddingItem(false)}
                  />
                )}

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId={`section-items-${section.id}`}>
                    {(provided) => (
                      <div
                        className="grid gap-3 md:grid-cols-2"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {section.items.map((itemData, index) => {
                          const item = assertMenuItem(itemData);
                          return (
                            <Draggable
                              key={item.id}
                              draggableId={item.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`${snapshot.isDragging ? 'opacity-70' : ''}`}
                                >
                                  <div className="flex items-center">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-move p-2 mr-2 text-gray-500 hover:text-amber-600"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <MenuItemComponent
                                        key={item.id}
                                        item={item}
                                        menu={menu}
                                        onItemUpdated={() => onMenuUpdated?.()}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If we're in display mode (public view), show the template version
  return (
    <div 
      id={`section-${section.id}`}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 relative pb-2">
          {section.name}
          <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-amber-500"></span>
        </h2>
        {section.description && (
          <p className="mt-2 text-gray-600 text-sm">{section.description}</p>
        )}
      </div>

      {section.items.length > 0 ? (
        <div className="space-y-4">
          {section.items.map((item) => (
            <div 
              key={item.id} 
              className="zvezda-menu-item cursor-pointer"
              onClick={() => onItemClick?.(item)}
            >
              {item.imageUrl && (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="zvezda-item-image"
                  onError={(e) => {
                    const imgElement = e.currentTarget;
                    imgElement.src = 'https://via.placeholder.com/90x90?text=No+Image';
                  }}
                />
              )}
              <div className="zvezda-item-content">
                <h3 className="zvezda-item-title">{item.name}</h3>
                {item.description && <p className="zvezda-item-description">{item.description}</p>}
                <p className="zvezda-item-price">{formatPrice(item.price, menu)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-sm">No items in this section</p>
        </div>
      )}
    </div>
  );
};

export default MenuSection; 