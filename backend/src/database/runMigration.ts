import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
// Uses environment variables from .env file (production/cloud)
// Falls back to local defaults for development
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'spectra_dev',
  user: process.env.DB_USER || 'spectra_user',
  password: process.env.DB_PASSWORD,
});

async function runMigration(migrationFile: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log(`Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log(`✓ Migration completed: ${migrationFile}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Migration failed: ${migrationFile}`);
    console.error(error);
    throw error;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  try {
    console.log('Starting database migrations...\n');
    
    // Run migrations in order
    await runMigration('001_create_users_table.sql');
    
    console.log('\n✓ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration process failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
