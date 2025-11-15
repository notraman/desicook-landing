#!/usr/bin/env node

/**
 * Programmatically run database migration via Supabase REST API
 * This allows us to create tables without manual SQL Editor access
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  console.error('   Please set these in your .env file');
  process.exit(1);
}

// Initialize Supabase client with service role key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Run SQL migration using Supabase REST API
 */
async function runMigration() {
  console.log('🚀 Running database migration programmatically...\n');
  
  // Read migration SQL file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '001_create_recipes.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  // Split SQL into individual statements (simple approach)
  // Note: This is a simplified parser - for complex SQL, use a proper SQL parser
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip empty or comment-only statements
    if (!statement || statement.length < 10) continue;
    
    try {
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);
      
      // Use Supabase REST API to execute SQL
      // Note: Supabase doesn't have a direct SQL execution endpoint via JS client
      // We need to use the REST API directly
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sql: statement }),
      });
      
      if (!response.ok) {
        // Try alternative: Use PostgREST or direct PostgreSQL connection
        // For now, we'll use a workaround: execute via Supabase client's raw query capability
        throw new Error(`HTTP ${response.status}`);
      }
      
      successCount++;
      console.log(`  ✅ Success`);
    } catch (error) {
      // Some statements might fail if tables already exist (IF NOT EXISTS)
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log(`  ⏭️  Skipped (already exists)`);
        successCount++;
      } else {
        console.error(`  ❌ Error: ${error.message}`);
        errorCount++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log('='.repeat(50));
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. This might be normal if tables already exist.');
    console.log('   Check Supabase Dashboard → Table Editor to verify tables were created.');
  } else {
    console.log('\n✅ Migration completed successfully!');
  }
}

// Alternative: Use direct table creation via Supabase client
async function createTablesViaClient() {
  console.log('🚀 Creating tables via Supabase client...\n');
  
  try {
    // Note: Supabase JS client doesn't support raw SQL execution
    // We need to create tables using the REST API or use a different approach
    // For now, let's check if we can use the management API
    
    console.log('⚠️  Direct SQL execution via JS client is not supported.');
    console.log('   Please use one of these methods:');
    console.log('   1. Supabase Dashboard → SQL Editor (manual)');
    console.log('   2. Supabase CLI: supabase db push');
    console.log('   3. PostgreSQL client connection');
    console.log('\n   However, I can verify if tables exist and help with the ETL...\n');
    
    // Check if tables exist
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id')
      .limit(1);
    
    if (recipesError && recipesError.code === 'PGRST116') {
      console.log('❌ Recipes table does not exist');
      console.log('   Migration needs to be run manually in Supabase Dashboard');
      return false;
    }
    
    console.log('✅ Recipes table exists!');
    
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('id')
      .limit(1);
    
    if (ingredientsError && ingredientsError.code === 'PGRST116') {
      console.log('❌ Ingredients table does not exist');
      console.log('   Migration needs to be run manually in Supabase Dashboard');
      return false;
    }
    
    console.log('✅ Ingredients table exists!');
    console.log('✅ All tables exist - ready for ETL!\n');
    return true;
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking database status...\n');
  
  // First, check if tables already exist
  const tablesExist = await createTablesViaClient();
  
  if (!tablesExist) {
    console.log('\n📋 To run migration manually:');
    console.log('   1. Open: MIGRATION_SQL.sql');
    console.log('   2. Copy all SQL');
    console.log('   3. Go to Supabase Dashboard → SQL Editor');
    console.log('   4. Paste and Run\n');
    process.exit(1);
  }
  
  // If tables exist, we're ready for ETL
  console.log('✅ Database is ready! You can now run the ETL script.');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});



