import React, { useState, useCallback } from 'react';
import { Menu, MenuSection } from '../types';
import MenuSectionComponent from './MenuSection';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAction } from 'wasp/client/operations';
import { reorderMenuSections } from 'wasp/client/operations';
import NewSection from './NewSection';

interface MenuSectionsListProps {
  menu: Menu;
  onMenuUpdated: () => void;
}

const MenuSectionsList: React.FC<MenuSectionsListProps> = ({ menu, onMenuUpdated }) => {
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false);
  const reorderMenuSectionsFn = useAction(reorderMenuSections);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    // Reorder the sections based on the drag result
    const sections = Array.from(menu.sections);
    const [reorderedSection] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, reorderedSection);

    const orderedSectionIds = sections.map(section => section.id);

    try {
      await reorderMenuSectionsFn({
        menuId: menu.id,
        orderedSectionIds: orderedSectionIds
      });
      onMenuUpdated();
    } catch (error) {
      console.error('Failed to reorder sections:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Menu Sections</h2>
        <button
          onClick={() => setIsAddingSectionOpen(true)}
          className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Section
        </button>
      </div>

      {isAddingSectionOpen && (
        <NewSection
          menuId={menu.id}
          onSectionAdded={() => {
            setIsAddingSectionOpen(false);
            onMenuUpdated();
          }}
          onCancel={() => setIsAddingSectionOpen(false)}
        />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="menu-sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-6"
            >
              {menu.sections.map((section, index) => (
                <Draggable
                  key={section.id}
                  draggableId={section.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${snapshot.isDragging ? 'opacity-70' : ''}`}
                    >
                      <div className="flex items-start">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-move p-2 mr-2 text-gray-500 hover:text-amber-600 mt-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <MenuSectionComponent
                            key={section.id}
                            section={section}
                            menu={menu}
                            onMenuUpdated={onMenuUpdated}
                            isEditing={true}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default MenuSectionsList; 