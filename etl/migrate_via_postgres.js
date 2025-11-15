#!/usr/bin/env node

/**
 * Execute migration via direct PostgreSQL connection
 * Uses pg library to connect and run SQL
 */

import pg from 'pg';
const { Client } = pg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

/**
 * Get database connection string
 * Supabase provides connection pooling URLs
 */
function getConnectionString() {
  // Extract project ref
  const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    throw new Error('Invalid Supabase URL');
  }
  
  const projectRef = match[1];
  
  // Supabase connection string format for direct connection:
  // We need the database password, not the service role key
  // The service role key is for REST API, not direct DB connection
  
  // However, we can try using the connection pooling endpoint
  // Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  
  console.log('⚠️  Direct PostgreSQL connection requires database password.');
  console.log('   Service role key is for API access only.\n');
  console.log('   To get database password:');
  console.log('   1. Go to Supabase Dashboard → Settings → Database');
  console.log('   2. Copy "Connection string" or "Connection pooling"');
  console.log('   3. Use that connection string\n');
  
  return null;
}

/**
 * Try to execute migration using connection string
 */
async function executeMigration(connectionString) {
  if (!connectionString) {
    return false;
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Read migration SQL
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '001_create_recipes.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute SQL
    console.log('📝 Executing migration...\n');
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    await client.end().catch(() => {});
    return false;
  }
}

async function main() {
  console.log('🚀 Attempting direct PostgreSQL migration...\n');
  
  // Check if connection string is provided
  const connectionString = process.env.DATABASE_URL || getConnectionString();
  
  if (!connectionString) {
    console.log('📋 Since direct connection requires database password,');
    console.log('   please use one of these methods:\n');
    console.log('METHOD 1: Supabase Dashboard (Easiest - 2 minutes)');
    console.log('  1. Go to: https://supabase.com/dashboard/project/hfkaigavywgkdmtxhjsn/sql/new');
    console.log('  2. Open: MIGRATION_SQL.sql');
    console.log('  3. Copy all SQL and paste');
    console.log('  4. Click Run\n');
    
    console.log('METHOD 2: Provide Database Connection String');
    console.log('  If you have the database connection string, set:');
    console.log('  DATABASE_URL=postgresql://...');
    console.log('  Then run this script again\n');
    
    return;
  }
  
  const success = await executeMigration(connectionString);
  
  if (success) {
    console.log('✅ Migration complete! Now run: node etl/auto_setup.js');
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});



