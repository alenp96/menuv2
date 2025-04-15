import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // This script will run the Prisma migration directly
  console.log('Running Prisma migration...');
  
  // Find the .wasp/out/db/schema.prisma file
  const waspOutDir = path.join(__dirname, '.wasp', 'out');
  const dbDir = path.join(waspOutDir, 'db');
  const schemaPath = path.join(dbDir, 'schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('Could not find schema.prisma file at', schemaPath);
    console.log('Please make sure you run this from the root of your Wasp project');
    process.exit(1);
  }
  
  // Execute Prisma migration
  execSync(`npx prisma migrate dev --schema=${schemaPath} --name add_dietary_tags_and_allergens`, { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Error running migration:', error.message);
  process.exit(1);
} 