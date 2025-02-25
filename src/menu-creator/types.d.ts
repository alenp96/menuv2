// Declaration for react-beautiful-dnd
declare module 'react-beautiful-dnd' {
  import * as React from 'react';

  // DragDropContext
  export interface DragDropContextProps {
    onDragEnd: (result: DropResult) => void;
    onDragStart?: (initial: DragStart) => void;
    onDragUpdate?: (update: DragUpdate) => void;
    children: React.ReactNode;
  }
  export const DragDropContext: React.FC<DragDropContextProps>;

  // Droppable
  export interface DroppableProps {
    droppableId: string;
    type?: string;
    direction?: 'horizontal' | 'vertical';
    isDropDisabled?: boolean;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactNode;
  }
  export const Droppable: React.FC<DroppableProps>;

  // Draggable
  export interface DraggableProps {
    draggableId: string;
    index: number;
    isDragDisabled?: boolean;
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactNode;
  }
  export const Draggable: React.FC<DraggableProps>;

  // Provided
  export interface DroppableProvided {
    innerRef: React.RefCallback<HTMLElement>;
    droppableProps: {
      [key: string]: any;
    };
    placeholder?: React.ReactNode;
  }

  export interface DraggableProvided {
    draggableProps: {
      [key: string]: any;
    };
    dragHandleProps: {
      [key: string]: any;
    } | null;
    innerRef: React.RefCallback<HTMLElement>;
  }

  // Snapshot
  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: string;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    draggingOver?: string;
    dropAnimation?: {
      duration: number;
      curve: string;
      moveTo: {
        x: number;
        y: number;
      };
    };
  }

  // Result
  export interface DropResult {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
    destination?: {
      droppableId: string;
      index: number;
    };
    reason: 'DROP' | 'CANCEL';
  }

  export interface DragStart {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
  }

  export interface DragUpdate extends DragStart {
    destination?: {
      droppableId: string;
      index: number;
    };
  }
}

// Declaration for wasp modules
declare module 'wasp/client/operations' {
  // Define Menu types directly in the module declaration
  export interface Menu {
    id: string;
    name: string;
    description: string;
    userId: string;
    publicUrl: string | null;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    sections: MenuSection[];
  }

  export interface MenuSection {
    id: string;
    name: string;
    description: string;
    menuId: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
    items: MenuItem[];
  }

  export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    sectionId: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }

  export function useQuery<T, P>(
    query: (args: P) => Promise<T>,
    args: P
  ): {
    data: T | undefined;
    isLoading: boolean;
    error: Error | undefined;
    refetch: () => void;
  };

  export function useAction<T, P>(
    action: (args: P) => Promise<T>
  ): (args: P) => Promise<T>;

  // Menu queries
  export const getMenuById: (args: { menuId: string }) => Promise<Menu>;
  export const getPublicMenu: (args: { publicUrl: string }) => Promise<Menu>;
  export const getMenusByUser: () => Promise<Menu[]>;

  // Menu actions
  export const createMenu: (args: { name: string; description: string }) => Promise<Menu>;
  export const updateMenu: (args: { menuId: string; name: string; description: string }) => Promise<Menu>;
  export const deleteMenu: (args: { menuId: string }) => Promise<void>;
  export const publishMenu: (args: { menuId: string }) => Promise<Menu>;

  // Section actions
  export const createMenuSection: (args: { menuId: string; name: string; description: string; position: number }) => Promise<MenuSection>;
  export const updateMenuSection: (args: { sectionId: string; name: string; description: string }) => Promise<MenuSection>;
  export const deleteMenuSection: (args: { sectionId: string }) => Promise<void>;

  // Item actions
  export const createMenuItem: (args: { sectionId: string; name: string; description: string; price: number; position: number }) => Promise<MenuItem>;
  export const updateMenuItem: (args: { itemId: string; name: string; description: string; price: number }) => Promise<MenuItem>;
  export const deleteMenuItem: (args: { itemId: string }) => Promise<void>;
}

declare module 'wasp/client/auth' {
  export interface User {
    id: string;
    username: string;
    email: string;
  }

  export function useAuth(): {
    data: User | null;
    isLoading: boolean;
    error: Error | null;
  };
} 