#!/usr/bin/env node

/**
 * Complete automated setup script
 * 1. Checks if migration is done
 * 2. Runs ETL automatically if tables exist
 * 3. Provides clear next steps
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing credentials in .env');
  console.error('   Need: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkMigration() {
  console.log('🔍 Checking if migration is complete...\n');
  
  const tables = ['recipes', 'ingredients', 'recipe_ingredients'];
  const status = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          status[table] = false;
        } else {
          status[table] = { exists: false, error: error.message };
        }
      } else {
        status[table] = true;
      }
    } catch (error) {
      status[table] = false;
    }
  }
  
  const allExist = Object.values(status).every(s => s === true);
  
  if (!allExist) {
    console.log('❌ Migration not complete. Missing tables:\n');
    for (const [table, exists] of Object.entries(status)) {
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }
    console.log('\n📋 Please run migration first:');
    console.log('   1. Open: MIGRATION_SQL.sql');
    console.log('   2. Go to: https://supabase.com/dashboard/project/hfkaigavywgkdmtxhjsn/sql/new');
    console.log('   3. Copy SQL, paste, and Run');
    console.log('   4. Then run this script again: node run_setup.js\n');
    return false;
  }
  
  console.log('✅ All tables exist! Migration complete.\n');
  return true;
}

async function checkRecipes() {
  const { data, error, count } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true });
  
  if (error) return { count: 0 };
  return { count: count || 0 };
}

async function runETL() {
  return new Promise((resolve) => {
    console.log('🚀 Running ETL to populate recipes...\n');
    
    const etl = spawn('node', [join(__dirname, 'etl', 'seed_recipes.js'), '--sample'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env }
    });
    
    etl.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function main() {
  console.log('🚀 Automated Setup Script\n');
  console.log('='.repeat(50));
  
  // Step 1: Check migration
  const migrationDone = await checkMigration();
  if (!migrationDone) {
    process.exit(1);
  }
  
  // Step 2: Check recipes
  console.log('📊 Checking recipes...\n');
  const recipesStatus = await checkRecipes();
  
  if (recipesStatus.count === 0) {
    console.log('⚠️  No recipes found. Running ETL...\n');
    const etlSuccess = await runETL();
    
    if (etlSuccess) {
      console.log('\n✅ Setup complete!');
      console.log('\n📋 Next: Deploy Edge Function (optional)');
      console.log('   See: EDGE_FUNCTION_CODE.ts\n');
    } else {
      console.log('\n❌ ETL failed. Check errors above.\n');
      process.exit(1);
    }
  } else {
    console.log(`✅ Found ${recipesStatus.count} recipes in database`);
    console.log('✅ Setup already complete!\n');
  }
  
  console.log('='.repeat(50));
  console.log('🎉 Your database is ready!');
  console.log('   Frontend should now load recipes from Supabase.\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});



