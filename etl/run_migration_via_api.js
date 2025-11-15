#!/usr/bin/env node

/**
 * Attempt to run migration via Supabase Management API
 * This uses the project's database connection to execute SQL
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
 * Try to execute SQL via Supabase API
 * Note: Supabase doesn't expose a direct SQL execution endpoint for security
 * But we can try using the Management API or PostgREST
 */
async function executeMigration() {
  console.log('🚀 Attempting migration via API...\n');
  
  // Read migration SQL
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '001_create_recipes.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  // Try using Supabase Management API
  // The Management API endpoint is: https://api.supabase.com/v1/projects/{ref}/database/query
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    console.error('❌ Could not extract project ref from URL');
    return false;
  }
  
  console.log(`📋 Project Ref: ${projectRef}\n`);
  
  try {
    // Try Management API endpoint
    const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    
    console.log('🔍 Trying Management API...');
    
    const response = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        query: migrationSQL,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Migration executed via Management API!');
      return true;
    } else {
      const errorText = await response.text();
      console.log(`⚠️  Management API returned: ${response.status}`);
      console.log(`   ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`⚠️  Management API error: ${error.message}`);
  }
  
  // Alternative: Try using PostgREST with raw SQL (won't work for DDL)
  // Or use direct PostgreSQL connection
  
  console.log('\n💡 Supabase requires SQL to be executed via:');
  console.log('   1. Dashboard SQL Editor (recommended)');
  console.log('   2. Supabase CLI');
  console.log('   3. Direct PostgreSQL connection\n');
  
  return false;
}

async function main() {
  const success = await executeMigration();
  
  if (!success) {
    console.log('📋 Since API execution is limited, here are your options:\n');
    console.log('OPTION 1: Use Supabase Dashboard (2 minutes)');
    console.log('  → I can guide you through it step-by-step\n');
    console.log('OPTION 2: After you run migration manually, I can:');
    console.log('  → Automatically run the ETL to populate recipes');
    console.log('  → Verify everything is set up correctly\n');
    console.log('Would you like me to:');
    console.log('  A) Open browser to Supabase Dashboard SQL Editor?');
    console.log('  B) Wait for you to run migration, then auto-run ETL?');
  }
}

main();



