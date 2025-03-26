// Type declarations for Menu Creator entities
export type Currency = {
  code: string;
  symbol: string;
  position: 'prefix' | 'suffix';
};

export const AVAILABLE_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', position: 'prefix' },
  { code: 'EUR', symbol: '€', position: 'suffix' },
  { code: 'GBP', symbol: '£', position: 'prefix' },
  { code: 'JPY', symbol: '¥', position: 'prefix' },
  { code: 'CNY', symbol: '¥', position: 'prefix' },
  { code: 'KRW', symbol: '₩', position: 'prefix' },
  { code: 'INR', symbol: '₹', position: 'prefix' },
];

export type MenuTemplate = 'default' | 'no-images';

export const AVAILABLE_TEMPLATES = [
  { id: 'default', name: 'Default Template', description: 'Standard menu layout with images' },
  { id: 'no-images', name: 'No Images', description: 'Clean layout without displaying any item images' }
];

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
  currencyCode: string;
  currencySymbol: string;
  currencyPosition: 'prefix' | 'suffix';
  template: MenuTemplate;
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
  videoUrl: string | null;
  icon: string | null;
  sectionId: string;
  dietaryTags?: DietaryTag[];
  allergens?: Allergen[];
};

export type DietaryTag = {
  id: string;
  name: string;
  icon?: string | null;
};

export type Allergen = {
  id: string;
  name: string;
  icon?: string | null;
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
export type GetMenuItemImageUploadUrl<Args, Result> = (args: Args, context: any) => Promise<Result>;
export type ImportMenuFromCsv<Args, Result> = (args: Args, context: any) => Promise<Result>;

// CSV import types
export interface CsvMenuItem {
  section_name: string;
  item_name: string;
  price: number | string;
  description: string | null | undefined;
  dietary_tags: string | null | undefined;
  allergens: string | null | undefined;
  icon: string | null | undefined;
}

// Helper function to format price according to currency
export function formatPrice(price: number, menu: Menu): string {
  const formattedPrice = price.toFixed(2);
  return menu.currencyPosition === 'prefix' 
    ? `${menu.currencySymbol}${formattedPrice}`
    : `${formattedPrice}${menu.currencySymbol}`;
}