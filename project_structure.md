# Menu Creator Project Structure

This document outlines the structure and component relationships in the Menu Creator application.

## Core Architecture

This is a Wasp application that uses:
- TypeScript for type safety
- React for the UI
- Prisma for database access
- Tailwind CSS for styling
- Font Awesome for icons

## Directory Structure

The main application code is organized in the `src/` directory with the following structure:

```
src/
├── menu-creator/          # Main feature directory
│   ├── components/        # Reusable UI components
│   ├── constants/         # Constants like dietary tags, allergens
│   ├── types.ts           # Type definitions for the menu system
│   ├── operations.ts      # Backend operations (queries and actions)
│   ├── PublicMenuPage.tsx # Public-facing menu page
│   ├── MenuEditorPage.tsx # Admin menu editing page
│   └── menuItemImageUtils.ts # Utilities for image handling
├── user/                  # User-related components
└── ...                    # Other app modules
```

## Core Components

### Menu Structure Components

1. **`MenuSectionsList.tsx`**
   - Renders the list of sections in a menu
   - Handles reordering sections via drag and drop
   - Manages adding new sections

2. **`MenuSection.tsx`**
   - Renders a single menu section with its items
   - Has two modes:
     - Editing mode (for admin)
     - Display mode (for public view)
   - In display mode, renders using the specified template
   - Handles section editing, deletion
   - Contains drag-and-drop functionality for items

3. **`MenuItem.tsx`**
   - Admin component for editing a menu item
   - Contains forms for updating item details
   - Handles item deletion

### Template Components

1. **`DefaultMenuItem.tsx`**
   - Public view component for the default template (with images)
   - Displays:
     - Item image (if available)
     - Icon (as fallback if no image)
     - Name, description, price
     - Dietary tags and allergens

2. **`NoImagesMenuItem.tsx`**
   - Public view component for the no-images template
   - More compact, list-based layout
   - Displays:
     - Icon 
     - Name, description, price
     - Dietary tags and allergens

### Form Components

1. **`NewMenuItem.tsx`**
   - Form for creating new menu items
   - Used inside MenuSection when adding items

2. **`NewSection.tsx`**
   - Form for creating new menu sections
   - Used in MenuSectionsList

3. **`MenuItemImageUpload.tsx`** and **`NewItemImageUpload.tsx`**
   - Components for uploading and cropping item images

4. **`IconSelector.tsx`**
   - Component for selecting Font Awesome icons for items

### Pages

1. **`PublicMenuPage.tsx`**
   - Public-facing page to display the menu
   - Handles section navigation
   - Applies filtering based on dietary preferences and allergens
   - Renders using the selected template

2. **`MenuEditorPage.tsx`**
   - Admin page for editing the entire menu
   - Contains the MenuSectionsList
   - Handles menu metadata editing

## Data Flow

1. **Operations**
   - Defined in `operations.ts`
   - Contains Wasp queries and actions for CRUD operations

2. **Type Definitions**
   - Defined in `types.ts`
   - Contains interfaces for Menu, MenuSection, MenuItem, etc.

## Template System

The application supports multiple templates for displaying menus:

1. **Default Template**
   - Uses `DefaultMenuItem.tsx`
   - Grid-based layout
   - Prominently features images
   - Falls back to icons when no image is available

2. **No-Images Template**
   - Uses `NoImagesMenuItem.tsx`
   - List-based layout
   - Only uses icons, no images
   - More compact presentation

## Important Notes

1. Both templates are selected and rendered through the `MenuSection` component based on the `template` prop.

2. The editing functionality is separate from the display templates - editing always uses the `MenuItem` component.

3. Icon handling requires both:
   - Selection in the admin interface via `IconSelector`
   - Display in both template components
   - Proper inclusion in the database queries

4. Section navigation requires proper ID attributes on section containers.

5. Operations for menu items and sections must include all necessary fields. 