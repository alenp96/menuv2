# Database Migration Notice

This application has been updated to include menu templates. To fully enable these features, you need to run a database migration.

## Current Status

A new field `template` has been added to the `Menu` model in `schema.prisma`. However, the database migration hasn't been run yet. This means that:

1. The application will work with a temporary workaround
2. The template selection UI is fully functional 
3. Template preferences are stored in memory but will not persist in the database until migration is run

## How to Run the Migration

When you're ready to apply the migration, run the following command:

```bash
wasp db migrate-dev
```

## Temporary Workaround

Until the migration is run, we've implemented a temporary workaround:
- The application will default to the "default" template
- Your template selection in the UI will work within a session
- If you reload the page, your template selection will reset to "default"
- All database queries have been modified to explicitly select only existing fields
- The template field is added programmatically after data is retrieved from the database

## Debugging Tips

If you encounter errors mentioning `Menu.template` does not exist in the database, ensure that:

1. All Prisma queries use `select` instead of `include` or default selection
2. The select statements explicitly list only fields that exist in the database
3. The missing template field is added programmatically to the results
4. All database updates (create, update) must also use the select option to specify which fields to return

Common issues:
- A simple `findUnique({ where: { id: ... } })` without a `select` clause will try to select all fields
- Nested `include` statements may need to be converted to nested `select` statements
- Remember to check both the main query and any subqueries checking for existing records
- Update operations will return all fields by default, causing errors - use select here too!

Example of correct code pattern:
```typescript
// Wrong
const menu = await context.entities.Menu.findUnique({
  where: { id: menuId }
});

// Right
const menu = await context.entities.Menu.findUnique({
  where: { id: menuId },
  select: {
    id: true,
    userId: true,
    // other existing fields, but NOT template
  }
});

// Wrong for updates
const updatedMenu = await context.entities.Menu.update({
  where: { id: menuId },
  data: { name: 'New name' }
});

// Right for updates
const updatedMenu = await context.entities.Menu.update({
  where: { id: menuId },
  data: { name: 'New name' },
  select: {
    id: true,
    name: true,
    // other existing fields, but NOT template
  }
});

// Then add template field programmatically
return {
  ...menu,
  template: 'default'
};
```

## New Template Options

We've added the following template options:
1. **Default Template** - Standard layout with images (existing design)
2. **No Images Template** - Clean layout without displaying any item images (new design)

After running the migration, restaurant owners will be able to fully customize their menu display template. 