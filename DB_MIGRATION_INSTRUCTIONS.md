# Database Migration Instructions

This application has been updated to include dietary tags and allergens for menu items. To fully enable these features, you need to run a database migration.

Since we're having trouble running the migration automatically, here's how to apply the changes manually:

## Method 1: Run Wasp Migration Command

If you have Wasp installed globally:

```bash
wasp db migrate-dev
```

## Method 2: Manual Update for Testing Without Migration

If you can't run migrations yet, we've made temporary changes to the code to keep the application working. The dietary tags and allergens should now display correctly even without running the migration.

When you add tags or allergens to menu items, they will still appear in the UI (we've added the UI components for this), but they won't be saved to the database until the migration is run.

## Changes Made in This Update

We've updated the following:

1. Added UI components to display dietary tags and allergens in:
   - The menu item editor
   - The public menu view

2. Modified the schema.prisma file to include:
   - A `DietaryTag` model 
   - An `Allergen` model
   - Many-to-many relationships between these models and MenuItem

After running the migration, restaurant owners will be able to tag menu items with dietary preferences (like vegetarian, vegan, gluten-free) and allergen information (like nuts, dairy, shellfish). 