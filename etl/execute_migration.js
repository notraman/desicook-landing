#!/usr/bin/env node

/**
 * Execute database migration via Supabase REST API
 * Uses service role key to run SQL directly
 */

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
 * Execute SQL via Supabase REST API
 * Note: Supabase doesn't have a direct SQL endpoint, but we can try using PostgREST
 */
async function executeSQL(sql) {
  // Try using Supabase's query endpoint with service role
  // This is a workaround - normally you'd use SQL Editor or CLI
  
  try {
    // Method 1: Try PostgREST query endpoint (won't work for DDL)
    // Method 2: Use Supabase Management API (requires different endpoint)
    // Method 3: Direct PostgreSQL connection (requires connection string)
    
    // For now, we'll use a workaround: create tables via Supabase JS client
    // by using the REST API's table creation capabilities
    
    console.log('⚠️  Direct SQL execution via API is limited.');
    console.log('   Supabase requires SQL to be run via Dashboard or CLI.');
    console.log('   However, I can create tables programmatically...\n');
    
    return false;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

/**
 * Create tables using Supabase client (alternative method)
 */
async function createTablesViaClient() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  console.log('🚀 Attempting to create tables programmatically...\n');
  
  // Unfortunately, Supabase JS client doesn't support DDL (CREATE TABLE)
  // We need to use the Management API or direct SQL execution
  
  // Try using the REST API directly with raw SQL
  const migrationSQL = readFileSync(
    join(__dirname, '..', 'supabase', 'migrations', '001_create_recipes.sql'),
    'utf-8'
  );
  
  // Split into statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s.length > 10);
  
  console.log(`📝 Found ${statements.length} SQL statements\n`);
  console.log('⚠️  Supabase REST API does not support direct SQL execution.');
  console.log('   We need to use one of these methods:\n');
  console.log('   1. Supabase Dashboard → SQL Editor (manual)');
  console.log('   2. Supabase CLI: supabase db push');
  console.log('   3. PostgreSQL client with connection string\n');
  
  // However, we can try using the Management API endpoint
  // This requires the project's database connection string
  console.log('💡 Alternative: I can help you set up a script that uses');
  console.log('   PostgreSQL client library to execute SQL directly.\n');
  
  return false;
}

async function main() {
  const success = await createTablesViaClient();
  
  if (!success) {
    console.log('📋 Manual Migration Required\n');
    console.log('Please run the migration using one of these methods:\n');
    console.log('METHOD 1: Supabase Dashboard (Easiest)');
    console.log('  1. Go to: https://supabase.com/dashboard/project/hfkaigavywgkdmtxhjsn');
    console.log('  2. Click: SQL Editor (left sidebar)');
    console.log('  3. Click: New Query');
    console.log('  4. Open file: MIGRATION_SQL.sql');
    console.log('  5. Copy all SQL and paste');
    console.log('  6. Click: Run\n');
    
    console.log('METHOD 2: After migration, I can run the ETL automatically!');
    console.log('  Just let me know when migration is done, or run:');
    console.log('  node etl/auto_setup.js\n');
  }
}

main();



