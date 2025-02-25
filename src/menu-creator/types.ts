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
export type GetMenusByUser<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type GetMenuById<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type GetPublicMenu<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type CreateMenu<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type UpdateMenu<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type DeleteMenu<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type PublishMenu<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type CreateMenuSection<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type UpdateMenuSection<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type DeleteMenuSection<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type CreateMenuItem<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type UpdateMenuItem<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type DeleteMenuItem<Args, Result> = (args: Args, context: any) => Promise<Result>; 