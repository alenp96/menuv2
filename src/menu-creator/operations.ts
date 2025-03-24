import { HttpError } from 'wasp/server';
import { type Menu, type MenuSection, type MenuItem } from 'wasp/entities';
import type { 
  GetMenuById,
  GetPublicMenu, 
  GetMenusByUser, 
  CreateMenu, 
  UpdateMenu, 
  DeleteMenu, 
  PublishMenu, 
  CreateMenuSection, 
  UpdateMenuSection, 
  DeleteMenuSection, 
  CreateMenuItem, 
  UpdateMenuItem, 
  DeleteMenuItem,
  GetMenuItemImageUploadUrl,
  ImportMenuFromCsv,
  CsvMenuItem
} from './types';
import { nanoid } from 'nanoid';
import { getMenuItemImageUploadURL, getMenuItemImageDownloadURL, deleteMenuItemImage } from './menuItemImageUtils';

// Queries
export const getMenusByUser: GetMenusByUser<void, Menu[]> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view menus');
  }

  // Get menus without requesting the template field by explicitly selecting fields
  const menus = await context.entities.Menu.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      description: true,
      isPublished: true,
      publicUrl: true,
      userId: true,
      currencyCode: true,
      currencySymbol: true,
      currencyPosition: true,
      sections: true
    }
  });

  // Add the template field programmatically
  return menus.map((menu: any) => ({
    ...menu,
    template: 'default'
  }));
};

export const getMenuById: GetMenuById<{ menuId: string; template?: string }, Menu> = async ({ menuId, template }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view this menu');
  }

  const menu = await context.entities.Menu.findUnique({
    where: { id: menuId },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      description: true,
      isPublished: true,
      publicUrl: true,
      userId: true,
      currencyCode: true,
      currencySymbol: true,
      currencyPosition: true,
      sections: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          name: true,
          description: true,
          position: true,
          menuId: true,
          items: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              createdAt: true,
              updatedAt: true,
              name: true,
              description: true,
              price: true,
              position: true,
              imageUrl: true,
              sectionId: true,
              dietaryTags: true,
              allergens: true
            }
          }
        }
      }
    }
  });

  if (!menu) {
    throw new HttpError(404, 'Menu not found');
  }

  if (menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to view this menu');
  }

  // Add the template field programmatically, using any template value passed in or default
  return {
    ...menu,
    template: template || 'default'
  };
};

export const getPublicMenu: GetPublicMenu<{ publicUrl: string; template?: string }, Menu> = async ({ publicUrl, template }, context) => {
  const menu = await context.entities.Menu.findUnique({
    where: { publicUrl },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      description: true,
      isPublished: true,
      publicUrl: true,
      userId: true,
      currencyCode: true,
      currencySymbol: true,
      currencyPosition: true,
      sections: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          name: true,
          description: true,
          position: true,
          menuId: true,
          items: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              createdAt: true,
              updatedAt: true,
              name: true,
              description: true,
              price: true,
              position: true,
              imageUrl: true,
              icon: true,
              sectionId: true,
              dietaryTags: true,
              allergens: true
            }
          }
        }
      }
    }
  });

  if (!menu || !menu.isPublished) {
    throw new HttpError(404, 'Menu not found or not published');
  }

  // Add the template field programmatically, using the requested template if available
  return {
    ...menu,
    template: template || 'default'
  };
};

// Actions
export const createMenu: CreateMenu<{ name: string; description?: string }, Menu> = async ({ name, description }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to create a menu');
  }

  try {
    // Generate a unique URL for the menu
    const publicUrl = nanoid(10);

    // Create the menu WITHOUT the template field
    const menuData = {
      name,
      description,
      publicUrl,
      currencyCode: 'USD',
      currencySymbol: '$',
      currencyPosition: 'prefix',
      user: { connect: { id: context.user.id } }
    };
    
    // Create the menu in a single transaction to ensure consistency
    const menu = await context.entities.Menu.create({
      data: menuData
    });

    if (!menu || !menu.id) {
      throw new Error('Failed to create menu: Database operation did not return a valid menu');
    }

    // Add the template field programmatically and empty sections array
    return {
      ...menu,
      template: 'default',
      sections: []
    };
  } catch (error) {
    console.error('Error creating menu:', error);
    if (error instanceof Error) {
      throw new HttpError(500, `Failed to create menu: ${error.message}`);
    }
    throw new HttpError(500, 'Failed to create menu due to an unknown error');
  }
};

export const updateMenu: UpdateMenu<{ 
  menuId: string; 
  name: string; 
  description?: string; 
  publicUrl: string;
  currencyCode?: string;
  currencySymbol?: string;
  currencyPosition?: string;
  template?: string;
}, Menu> = async ({ 
  menuId, 
  name, 
  description, 
  publicUrl,
  currencyCode,
  currencySymbol,
  currencyPosition,
  template  // We'll receive this but not use it until migration is run
}, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to update a menu');
  }

  const menu = await context.entities.Menu.findUnique({
    where: { id: menuId },
    select: {
      id: true,
      userId: true,
      publicUrl: true
    }
  });

  if (!menu) {
    throw new HttpError(404, 'Menu not found');
  }

  if (menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to update this menu');
  }

  // Check if the publicUrl is already in use by another menu
  if (publicUrl !== menu.publicUrl) {
    const existingMenu = await context.entities.Menu.findUnique({
      where: { publicUrl },
      select: {
        id: true
      }
    });

    if (existingMenu && existingMenu.id !== menuId) {
      throw new HttpError(400, 'This URL is already in use. Please choose a different one.');
    }
  }

  // Update the menu without the template field
  const updatedMenu = await context.entities.Menu.update({
    where: { id: menuId },
    data: { 
      name, 
      description, 
      publicUrl,
      ...(currencyCode && { currencyCode }),
      ...(currencySymbol && { currencySymbol }),
      ...(currencyPosition && { currencyPosition })
      // template field omitted until migration is run
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      description: true,
      isPublished: true,
      publicUrl: true,
      userId: true,
      currencyCode: true,
      currencySymbol: true,
      currencyPosition: true
    }
  });

  // Add the template field programmatically
  return {
    ...updatedMenu,
    template: template || 'default'
  };
};

export const deleteMenu: DeleteMenu<{ menuId: string }, void> = async ({ menuId }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to delete a menu');
  }

  const menu = await context.entities.Menu.findUnique({
    where: { id: menuId },
    select: {
      id: true,
      userId: true
    }
  });

  if (!menu) {
    throw new HttpError(404, 'Menu not found');
  }

  if (menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to delete this menu');
  }

  await context.entities.Menu.delete({
    where: { id: menuId }
  });
};

export const publishMenu: PublishMenu<{ menuId: string }, Menu> = async ({ menuId }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to publish a menu');
  }

  const menu = await context.entities.Menu.findUnique({
    where: { id: menuId },
    select: {
      id: true,
      userId: true,
      sections: {
        select: {
          id: true,
          items: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  if (!menu) {
    throw new HttpError(404, 'Menu not found');
  }

  if (menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to publish this menu');
  }

  // Check if menu has at least one section
  if (!menu.sections || menu.sections.length === 0) {
    throw new HttpError(400, 'Menu must have at least one section before publishing');
  }

  // Check if at least one section has items
  let hasItems = false;
  for (const section of menu.sections) {
    if (section.items && section.items.length > 0) {
      hasItems = true;
      break;
    }
  }

  if (!hasItems) {
    throw new HttpError(400, 'Menu must have at least one item before publishing');
  }

  const updatedMenu = await context.entities.Menu.update({
    where: { id: menuId },
    data: { isPublished: true },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      description: true,
      isPublished: true,
      publicUrl: true,
      userId: true,
      currencyCode: true,
      currencySymbol: true,
      currencyPosition: true
    }
  });

  // Add the template field programmatically
  return {
    ...updatedMenu,
    template: 'default',
    sections: menu.sections
  };
};

export const createMenuSection: CreateMenuSection<{ menuId: string; name: string; description?: string; position: number }, MenuSection> = async ({ menuId, name, description, position }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to create a menu section');
  }

  const menu = await context.entities.Menu.findUnique({
    where: { id: menuId },
    select: {
      id: true,
      userId: true
    }
  });

  if (!menu) {
    throw new HttpError(404, 'Menu not found');
  }

  if (menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to update this menu');
  }

  return context.entities.MenuSection.create({
    data: {
      name,
      description,
      position,
      menu: { connect: { id: menuId } }
    }
  });
};

export const updateMenuSection: UpdateMenuSection<{ sectionId: string; name?: string; description?: string; position?: number }, MenuSection> = async ({ sectionId, name, description, position }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to update a menu section');
  }

  const section = await context.entities.MenuSection.findUnique({
    where: { id: sectionId },
    select: {
      id: true,
      menu: {
        select: {
          userId: true
        }
      }
    }
  });

  if (!section) {
    throw new HttpError(404, 'Section not found');
  }

  if (section.menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to update this section');
  }

  return context.entities.MenuSection.update({
    where: { id: sectionId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(position !== undefined && { position })
    }
  });
};

export const deleteMenuSection: DeleteMenuSection<{ sectionId: string }, void> = async ({ sectionId }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to delete a menu section');
  }

  const section = await context.entities.MenuSection.findUnique({
    where: { id: sectionId },
    select: {
      id: true,
      menu: {
        select: {
          userId: true
        }
      }
    }
  });

  if (!section) {
    throw new HttpError(404, 'Section not found');
  }

  if (section.menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to delete this section');
  }

  await context.entities.MenuSection.delete({
    where: { id: sectionId }
  });
};

export const createMenuItem: CreateMenuItem<
  { 
    sectionId: string; 
    name: string; 
    description?: string; 
    price?: number; 
    position: number; 
    imageUrl?: string;
    icon?: string;
    dietaryTags?: { id: string; name: string; icon?: string | null }[];
    allergens?: { id: string; name: string; icon?: string | null }[];
  }, 
  MenuItem
> = async ({ 
  sectionId, 
  name, 
  description, 
  price, 
  position, 
  imageUrl,
  icon,
  dietaryTags = [],
  allergens = []
}, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to create menu items');
  }

  // Verify the section exists and belongs to the user
  const section = await context.entities.MenuSection.findUnique({
    where: { id: sectionId },
    include: { menu: true }
  });

  if (!section) {
    throw new HttpError(404, 'Menu section not found');
  }

  if (section.menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to add items to this menu');
  }

  // Create the menu item
  const menuItem = await context.entities.MenuItem.create({
    data: {
      name,
      description,
      price: price || 0,
      position,
      imageUrl,
      icon,
      section: { connect: { id: sectionId } },
      dietaryTags: {
        connect: dietaryTags.map(tag => ({ id: tag.id }))
      },
      allergens: {
        connect: allergens.map(allergen => ({ id: allergen.id }))
      }
    }
  });

  return menuItem;
};

export const updateMenuItem: UpdateMenuItem<
  { 
    itemId: string; 
    name?: string; 
    description?: string; 
    price?: number; 
    position?: number; 
    imageUrl?: string;
    icon?: string;
    dietaryTags?: { id: string; name: string; icon?: string | null }[];
    allergens?: { id: string; name: string; icon?: string | null }[];
  }, 
  MenuItem
> = async ({ 
  itemId, 
  name, 
  description, 
  price, 
  position, 
  imageUrl,
  icon,
  dietaryTags,
  allergens
}, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to update menu items');
  }

  // Verify the item exists and belongs to the user
  const item = await context.entities.MenuItem.findUnique({
    where: { id: itemId },
    include: { section: { include: { menu: true } } }
  });

  if (!item) {
    throw new HttpError(404, 'Menu item not found');
  }

  if (item.section.menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to update this menu item');
  }

  // Update the menu item
  const updatedItem = await context.entities.MenuItem.update({
    where: { id: itemId },
    data: {
      name,
      description,
      price,
      position,
      imageUrl,
      icon,
      dietaryTags: dietaryTags ? {
        set: dietaryTags.map(tag => ({ id: tag.id }))
      } : undefined,
      allergens: allergens ? {
        set: allergens.map(allergen => ({ id: allergen.id }))
      } : undefined
    }
  });

  return updatedItem;
};

export const deleteMenuItem: DeleteMenuItem<{ itemId: string }, void> = async ({ itemId }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to delete a menu item');
  }

  const item = await context.entities.MenuItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      section: {
        select: {
          menu: {
            select: {
              userId: true
            }
          }
        }
      }
    }
  });

  if (!item) {
    throw new HttpError(404, 'Item not found');
  }

  if (item.section.menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to delete this item');
  }

  await context.entities.MenuItem.delete({
    where: { id: itemId }
  });
};

export const getMenuItemImageUploadUrl: GetMenuItemImageUploadUrl<{ itemId: string; fileName: string; fileType: string }, { uploadUrl: string; publicUrl: string }> = async ({ itemId, fileName, fileType }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to upload an image');
  }

  // Check if this is a temporary ID (for new items)
  const isTemporaryId = itemId.startsWith('new-');
  
  let menuId;
  
  if (isTemporaryId) {
    // For temporary IDs, we'll just use the user ID for the path
    menuId = 'temp';
  } else {
    // For existing items, verify permissions
    const item = await context.entities.MenuItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        section: {
          select: {
            menu: {
              select: {
                id: true,
                userId: true
              }
            }
          }
        }
      }
    });

    if (!item) {
      throw new HttpError(404, 'Item not found');
    }

    if (item.section.menu.userId !== context.user.id) {
      throw new HttpError(403, 'You do not have permission to upload an image for this item');
    }
    
    menuId = item.section.menu.id;
  }

  const { uploadUrl, publicUrl } = await getMenuItemImageUploadURL({
    fileName,
    fileType,
    userId: context.user.id,
    menuId,
    itemId
  });

  return { uploadUrl, publicUrl };
};

// Type definitions for the reordering functions
interface ReorderMenuSectionsInput {
  menuId: string;
  orderedSectionIds: string[];
}

interface ReorderMenuItemsInput {
  sectionId: string;
  orderedItemIds: string[];
}

export const reorderMenuSections = async ({ menuId, orderedSectionIds }: ReorderMenuSectionsInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to reorder menu sections');
  }

  const menu = await context.entities.Menu.findUnique({
    where: { id: menuId },
    select: {
      id: true,
      userId: true,
      sections: {
        select: {
          id: true
        }
      }
    }
  });

  if (!menu) {
    throw new HttpError(404, 'Menu not found');
  }

  if (menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to update this menu');
  }

  // Verify all section IDs belong to this menu
  const menuSectionIds = menu.sections.map((section: { id: string }) => section.id);
  const allSectionsValid = orderedSectionIds.every((id: string) => menuSectionIds.includes(id));
  
  if (!allSectionsValid) {
    throw new HttpError(400, 'Invalid section IDs provided');
  }

  // Update positions for all sections
  await Promise.all(
    orderedSectionIds.map((sectionId: string, index: number) => {
      return context.entities.MenuSection.update({
        where: { id: sectionId },
        data: { position: index }
      });
    })
  );
  
  // Return the updated menu with sections in the new order
  const updatedMenu = await context.entities.Menu.findUnique({
    where: { id: menuId },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      description: true,
      isPublished: true,
      publicUrl: true,
      userId: true,
      currencyCode: true,
      currencySymbol: true,
      currencyPosition: true,
      sections: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          name: true,
          description: true,
          position: true,
          menuId: true,
          items: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              createdAt: true,
              updatedAt: true,
              name: true,
              description: true,
              price: true,
              position: true,
              imageUrl: true,
              sectionId: true
            }
          }
        }
      }
    }
  });

  // Add the template field programmatically
  return {
    ...updatedMenu,
    template: 'default'
  };
};

export const reorderMenuItems = async ({ sectionId, orderedItemIds }: ReorderMenuItemsInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to reorder menu items');
  }

  const section = await context.entities.MenuSection.findUnique({
    where: { id: sectionId },
    select: {
      id: true,
      menu: {
        select: {
          userId: true
        }
      },
      items: {
        select: {
          id: true
        }
      }
    }
  });

  if (!section) {
    throw new HttpError(404, 'Section not found');
  }

  if (section.menu.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to update this section');
  }

  // Verify all item IDs belong to this section
  const sectionItemIds = section.items.map((item: { id: string }) => item.id);
  const allItemsValid = orderedItemIds.every((id: string) => sectionItemIds.includes(id));
  
  if (!allItemsValid) {
    throw new HttpError(400, 'Invalid item IDs provided');
  }

  // Update positions for all items
  await Promise.all(
    orderedItemIds.map((itemId: string, index: number) => {
      return context.entities.MenuItem.update({
        where: { id: itemId },
        data: { position: index }
      });
    })
  );
  
  // Return the updated section with items in the new order
  const updatedSection = await context.entities.MenuSection.findUnique({
    where: { id: sectionId },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      description: true,
      position: true,
      menuId: true,
      items: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          name: true,
          description: true,
          price: true,
          position: true,
          imageUrl: true,
          sectionId: true,
          dietaryTags: true,
          allergens: true
        }
      }
    }
  });

  return updatedSection;
};

// Import menu from CSV
export const importMenuFromCsv = async ({ csvData }: { csvData: CsvMenuItem[] }, context: any): Promise<Menu> => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to import a menu');
  }
  
  if (!Array.isArray(csvData) || csvData.length === 0) {
    throw new HttpError(400, 'Invalid CSV data: expecting a non-empty array');
  }

  try {
    // Generate a unique URL for the menu
    const publicUrl = nanoid(10);
    
    // Extract a menu name from the first row's section name or use a default
    let menuName = 'Imported Menu';
    if (csvData.length > 0 && csvData[0].section_name) {
      menuName = `${csvData[0].section_name} Menu`;
    }

    // Create the menu
    const menu = await context.entities.Menu.create({
      data: {
        name: menuName,
        description: 'Imported from CSV',
        publicUrl,
        currencyCode: 'USD',
        currencySymbol: '$',
        currencyPosition: 'prefix',
        user: { connect: { id: context.user.id } }
      }
    });

    // Group items by section
    const sectionMap = new Map<string, CsvMenuItem[]>();
    csvData.forEach((row: CsvMenuItem) => {
      // Ensure section_name is a string
      const sectionName = String(row.section_name).trim();
      
      // Ensure item_name is a string
      const itemName = String(row.item_name).trim();
      
      // Ensure price is a number
      let price: number;
      if (typeof row.price === 'number') {
        price = row.price;
      } else {
        // Try to parse the price, removing any non-numeric chars except decimal point
        const cleanedPrice = String(row.price).replace(/[^\d.]/g, '');
        price = parseFloat(cleanedPrice);
        if (isNaN(price)) {
          throw new HttpError(400, `Invalid price value: ${row.price}`);
        }
      }
      
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, []);
      }
      
      // Create a sanitized version of the row with properly typed values
      const sanitizedRow: CsvMenuItem = {
        section_name: sectionName,
        item_name: itemName,
        price: price,
        description: row.description ? String(row.description).trim() : null,
        dietary_tags: row.dietary_tags ? String(row.dietary_tags).trim() : null,
        allergens: row.allergens ? String(row.allergens).trim() : null,
        icon: row.icon ? String(row.icon).trim() : null
      };
      
      sectionMap.get(sectionName)?.push(sanitizedRow);
    });

    // Create sections and items
    let sectionPosition = 0;
    const createSectionPromises = Array.from(sectionMap.entries()).map(async ([sectionName, items]) => {
      // Create the section
      const section = await context.entities.MenuSection.create({
        data: {
          name: sectionName,
          description: null,
          position: sectionPosition++,
          menu: { connect: { id: menu.id } }
        }
      });
      
      // Create items for this section
      let itemPosition = 0;
      const createItemPromises = items.map(async (item) => {
        // Process dietary tags if present
        const dietaryTagsArray = item.dietary_tags ? 
          item.dietary_tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : 
          [];
        
        // Process allergens if present
        const allergensArray = item.allergens ? 
          item.allergens.split(',').map((allergen: string) => allergen.trim()).filter(Boolean) : 
          [];

        // Find or create dietary tags
        const dietaryTagPromises = dietaryTagsArray.map(async (tagName: string) => {
          const existingTag = await context.entities.DietaryTag.findUnique({
            where: { name: tagName }
          });

          if (existingTag) {
            return { id: existingTag.id };
          } else {
            const newTag = await context.entities.DietaryTag.create({
              data: { name: tagName }
            });
            return { id: newTag.id };
          }
        });

        // Find or create allergens
        const allergenPromises = allergensArray.map(async (allergenName: string) => {
          const existingAllergen = await context.entities.Allergen.findUnique({
            where: { name: allergenName }
          });

          if (existingAllergen) {
            return { id: existingAllergen.id };
          } else {
            const newAllergen = await context.entities.Allergen.create({
              data: { name: allergenName }
            });
            return { id: newAllergen.id };
          }
        });

        // Wait for all tags and allergens to be processed
        const [dietaryTags, allergens] = await Promise.all([
          Promise.all(dietaryTagPromises),
          Promise.all(allergenPromises)
        ]);

        // Create the menu item
        return context.entities.MenuItem.create({
          data: {
            name: item.item_name,
            description: item.description || null,
            price: item.price,
            position: itemPosition++,
            imageUrl: null,
            section: { connect: { id: section.id } },
            dietaryTags: { connect: dietaryTags },
            allergens: { connect: allergens }
          }
        });
      });

      // Wait for all items to be created
      await Promise.all(createItemPromises);
      return section;
    });

    // Wait for all sections and their items to be created
    await Promise.all(createSectionPromises);
    
    // Fetch the full menu with all relations
    const importedMenu = await context.entities.Menu.findUnique({
      where: { id: menu.id },
      include: {
        sections: {
          orderBy: { position: 'asc' },
          include: {
            items: {
              orderBy: { position: 'asc' },
              include: {
                dietaryTags: true,
                allergens: true
              }
            }
          }
        }
      }
    });

    if (!importedMenu) {
      throw new Error(`Failed to fetch imported menu with ID: ${menu.id}`);
    }

    // Add the template field programmatically 
    return {
      ...importedMenu,
      template: 'default'
    };
  } catch (error: unknown) {
    console.error('Error importing menu from CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpError(500, `Failed to import menu: ${errorMessage}`);
  }
}; 