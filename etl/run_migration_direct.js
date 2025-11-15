#!/usr/bin/env node

/**
 * Run migration via direct PostgreSQL connection
 * Uses the database connection string from Supabase
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
 * Get database connection string from Supabase
 * We can construct it from the project ref and service role key
 */
function getConnectionString() {
  // Extract project ref from URL
  const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    throw new Error('Invalid Supabase URL');
  }
  
  const projectRef = match[1];
  
  // Supabase connection string format:
  // postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  // But we need the actual database password, not the service role key
  
  // Alternative: Use Supabase's connection pooling
  // The direct connection requires the database password which is different from service role key
  
  console.log('⚠️  Direct PostgreSQL connection requires database password.');
  console.log('   Service role key is for API access, not direct DB connection.\n');
  
  return null;
}

/**
 * Try to execute migration using Supabase REST API workaround
 * We'll create tables one by one using the REST API's table creation
 */
async function createTablesViaAPI() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
  });
  
  console.log('🚀 Attempting to create tables via Supabase API...\n');
  
  // Unfortunately, Supabase JS client doesn't support DDL operations
  // We need to use raw SQL execution which requires:
  // 1. Supabase Dashboard SQL Editor (manual)
  // 2. Supabase CLI
  // 3. Direct PostgreSQL connection with database password
  
  console.log('📋 Migration Options:\n');
  console.log('OPTION 1: Supabase Dashboard (Recommended - 2 minutes)');
  console.log('  1. Go to: https://supabase.com/dashboard/project/hfkaigavywgkdmtxhjsn');
  console.log('  2. Click: SQL Editor (left sidebar)');
  console.log('  3. Click: New Query');
  console.log('  4. Open: MIGRATION_SQL.sql in this project');
  console.log('  5. Copy ALL SQL code');
  console.log('  6. Paste into SQL Editor');
  console.log('  7. Click: Run (or Ctrl+Enter)\n');
  
  console.log('OPTION 2: After migration, I can automatically:');
  console.log('  ✅ Run ETL to populate recipes');
  console.log('  ✅ Verify everything works');
  console.log('  ✅ Set up Edge Function\n');
  
  console.log('💡 Once migration is done, run:');
  console.log('   node etl/auto_setup.js\n');
  
  return false;
}

async function main() {
  await createTablesViaAPI();
}

main();

