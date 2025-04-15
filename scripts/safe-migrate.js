// This script provides a safer way to run migrations
// Usage: node scripts/safe-migrate.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Backup the database before migrations
function backupDatabase() {
  console.log('Creating database backup...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `db-backup-${timestamp}.sql`;
  
  try {
    // Extract connection details from DATABASE_URL
    // This assumes you're using PostgreSQL - adjust as needed
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not found');
    }
    
    // Extract connection parts from URL
    const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = dbUrl.match(regex);
    
    if (!match) {
      throw new Error('Could not parse DATABASE_URL');
    }
    
    const [, user, password, host, port, dbName] = match;
    
    // Run pg_dump to create a backup
    execSync(`pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName} -f ${backupName}`, {
      env: { ...process.env, PGPASSWORD: password }
    });
    
    console.log(`Database backup created: ${backupName}`);
    return true;
  } catch (error) {
    console.error('Failed to backup database:', error.message);
    return false;
  }
}

// Run migrations using Prisma migrate deploy (safe for production)
function runSafeMigration() {
  console.log('Running safe database migration...');
  try {
    execSync('wasp db deploy', { stdio: 'inherit' });
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  // Create migrations directory if it doesn't exist
  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  console.log('Starting safe migration process...');
  
  const backupSuccess = backupDatabase();
  if (!backupSuccess) {
    console.log('Warning: Database backup failed, proceeding with migration anyway...');
  }
  
  const migrationSuccess = runSafeMigration();
  if (!migrationSuccess) {
    console.error('Migration failed. If you have a backup, you can restore it.');
    process.exit(1);
  }
  
  console.log('Migration process completed successfully');
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 