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

// Type declarations for Menu Creator entities
export type Menu = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
  isPublished: boolean;
  publicUrl: string;
  userId: string;
  sections: MenuSection[];
};

export type MenuSection = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
  position: number;
  menuId: string;
  items: MenuItem[];
};

export type MenuItem = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
  price: number;
  position: number;
  imageUrl: string | null;
  sectionId: string;
};

// Add a type assertion function to help with TypeScript errors
export function assertMenu(menu: any): Menu {
  return menu as Menu;
}

export function assertMenuSection(section: any): MenuSection {
  return section as MenuSection;
}

export function assertMenuItem(item: any): MenuItem {
  return item as MenuItem;
}

// Operation types
export type GetMenusByUser = (args: any, context: any) => Promise<Menu[]>;
export type GetMenuById = (args: any, context: any) => Promise<Menu>;
export type GetPublicMenu = (args: any, context: any) => Promise<Menu>;
export type CreateMenu = (args: any, context: any) => Promise<Menu>;
export type UpdateMenu = (args: any, context: any) => Promise<Menu>;
export type DeleteMenu = (args: any, context: any) => Promise<void>;
export type PublishMenu = (args: any, context: any) => Promise<Menu>;
export type CreateMenuSection = (args: any, context: any) => Promise<MenuSection>;
export type UpdateMenuSection = (args: any, context: any) => Promise<MenuSection>;
export type DeleteMenuSection = (args: any, context: any) => Promise<void>;
export type CreateMenuItem = (args: any, context: any) => Promise<MenuItem>;
export type UpdateMenuItem = (args: any, context: any) => Promise<MenuItem>;
export type DeleteMenuItem = (args: any, context: any) => Promise<void>;
export type GetMenuItemImageUploadUrl = (args: any, context: any) => Promise<{ uploadUrl: string, publicUrl: string }>;

// Declare module for Wasp operations
declare module 'wasp/client/operations' {
  // Menu queries
  export const getMenusByUser: (args: { userId: string }) => Promise<Menu[]>;
  export const getMenuById: (args: { menuId: string }) => Promise<Menu>;
  export const getPublicMenu: (args: { publicUrl: string }) => Promise<Menu>;
  
  // Menu actions
  export const createMenu: (args: { name: string, description?: string }) => Promise<Menu>;
  export const updateMenu: (args: { menuId: string, name: string, description: string, publicUrl: string }) => Promise<Menu>;
  export const deleteMenu: (args: { menuId: string }) => Promise<void>;
  export const publishMenu: (args: { menuId: string }) => Promise<Menu>;
  
  // Section actions
  export const createMenuSection: (args: { menuId: string, name: string, description: string, position: number }) => Promise<MenuSection>;
  export const updateMenuSection: (args: { sectionId: string, name: string, description: string }) => Promise<MenuSection>;
  export const deleteMenuSection: (args: { sectionId: string }) => Promise<void>;
  
  // Item actions
  export const createMenuItem: (args: { sectionId: string, name: string, description: string, price: number, position: number }) => Promise<MenuItem>;
  export const updateMenuItem: (args: { itemId: string, name: string, description: string, price: number, imageUrl?: string }) => Promise<MenuItem>;
  export const deleteMenuItem: (args: { itemId: string }) => Promise<void>;
  export const getMenuItemImageUploadUrl: (args: { itemId: string, fileName: string, fileType: string }) => Promise<{ uploadUrl: string, publicUrl: string }>;
  
  // Hooks
  export const useQuery: any;
  export const useAction: any;
}

// Declare module for Wasp auth
declare module 'wasp/client/auth' {
  export const useAuth: () => {
    data: {
      id: string;
      email: string;
      username: string;
      isAdmin: boolean;
    } | null;
    isLoading: boolean;
    error: Error | null;
  };
} 