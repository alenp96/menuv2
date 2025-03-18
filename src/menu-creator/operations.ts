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
  GetMenuItemImageUploadUrl
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
  console.log('Create menu called with:', { name, description });
  
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to create a menu');
  }

  try {
    // Generate a unique URL for the menu
    const publicUrl = nanoid(10);
    console.log('Generated publicUrl:', publicUrl);

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
    
    // Explicitly don't include the template field here
    console.log('Creating menu with data:', menuData);
    
    const menu = await context.entities.Menu.create({
      data: menuData
    });

    console.log('Menu created:', menu);

    // Add the template field programmatically and empty sections array
    return {
      ...menu,
      template: 'default',
      sections: []
    };
  } catch (error) {
    console.error('Error creating menu:', error);
    throw error;
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
  dietaryTags = [],
  allergens = []
}, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to create a menu item');
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
    throw new HttpError(403, 'You do not have permission to update this menu');
  }

  return context.entities.MenuItem.create({
    data: {
      name,
      description,
      price: price || 0,
      position,
      imageUrl,
      section: { connect: { id: sectionId } },
      // Connect or create the dietary tags
      ...(dietaryTags.length > 0 && {
        dietaryTags: {
          connectOrCreate: dietaryTags.map(tag => ({
            where: { id: tag.id },
            create: {
              id: tag.id,
              name: tag.name,
              icon: tag.icon
            }
          }))
        }
      }),
      // Connect or create the allergens
      ...(allergens.length > 0 && {
        allergens: {
          connectOrCreate: allergens.map(allergen => ({
            where: { id: allergen.id },
            create: {
              id: allergen.id,
              name: allergen.name,
              icon: allergen.icon
            }
          }))
        }
      })
    },
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
  });
};

export const updateMenuItem: UpdateMenuItem<
  { 
    itemId: string; 
    name?: string; 
    description?: string; 
    price?: number; 
    position?: number; 
    imageUrl?: string;
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
  dietaryTags,
  allergens
}, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to update a menu item');
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
    throw new HttpError(403, 'You do not have permission to update this item');
  }

  // Disconnect all existing dietary tags and allergens if they're being updated
  const updateData: any = {
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price }),
    ...(position !== undefined && { position }),
    ...(imageUrl !== undefined && { imageUrl })
  };

  // Handle dietary tags updates
  if (dietaryTags !== undefined) {
    // First disconnect all existing tags
    updateData.dietaryTags = {
      set: [] // Clear existing connections
    };
    
    // Then connect or create new tags
    if (dietaryTags.length > 0) {
      updateData.dietaryTags = {
        connectOrCreate: dietaryTags.map(tag => ({
          where: { id: tag.id },
          create: {
            id: tag.id,
            name: tag.name,
            icon: tag.icon
          }
        }))
      };
    }
  }

  // Handle allergens updates
  if (allergens !== undefined) {
    // First disconnect all existing allergens
    updateData.allergens = {
      set: [] // Clear existing connections
    };
    
    // Then connect or create new allergens
    if (allergens.length > 0) {
      updateData.allergens = {
        connectOrCreate: allergens.map(allergen => ({
          where: { id: allergen.id },
          create: {
            id: allergen.id,
            name: allergen.name,
            icon: allergen.icon
          }
        }))
      };
    }
  }

  return context.entities.MenuItem.update({
    where: { id: itemId },
    data: updateData,
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
  });
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