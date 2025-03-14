import React, { useState } from 'react';
import { Menu, MenuSection, assertMenuSection } from '../types';
import MenuSectionComponent from './MenuSection';
import NewSection from './NewSection';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAction } from 'wasp/client/operations';
import { reorderMenuSections } from 'wasp/client/operations';

interface MenuSectionsListProps {
  menu: Menu;
  onSectionsUpdated: () => void;
}

const MenuSectionsList: React.FC<MenuSectionsListProps> = ({ menu, onSectionsUpdated }) => {
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false);
  // Use the imported reorderMenuSections action
  const reorderMenuSectionsFn = useAction(reorderMenuSections);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;
    
    // Return if dropped outside the list or if position didn't change
    if (!destination || (destination.index === source.index)) {
      return;
    }

    // Get current sections array
    const sections = [...menu.sections];
    
    // Reorder sections array based on drag result
    const [removed] = sections.splice(source.index, 1);
    sections.splice(destination.index, 0, removed);
    
    // Get ordered section IDs
    const orderedSectionIds = sections.map(section => section.id);
    
    try {
      // Call the reorder action
      await reorderMenuSectionsFn({
        menuId: menu.id,
        orderedSectionIds
      });
      
      // Refresh sections
      onSectionsUpdated();
    } catch (error) {
      console.error('Failed to reorder sections:', error);
    }
  };

  return (
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
        <NewSection 
          menuId={menu.id}
          onSectionAdded={() => {
            setIsAddingSectionOpen(false);
            onSectionsUpdated();
          }}
          onCancel={() => setIsAddingSectionOpen(false)}
        />
      )}
      
      {menu.sections && menu.sections.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="menu-sections">
            {(provided) => (
              <div 
                className="space-y-6"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {menu.sections.map((sectionData, index) => {
                  const section = assertMenuSection(sectionData);
                  return (
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
                          <div className="flex items-center">
                            <div 
                              {...provided.dragHandleProps}
                              className="cursor-move p-2 mr-2 text-gray-500 hover:text-amber-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <MenuSectionComponent
                                key={section.id}
                                section={section}
                                menu={menu}
                                onSectionUpdated={onSectionsUpdated}
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
  );
};

export default MenuSectionsList; 