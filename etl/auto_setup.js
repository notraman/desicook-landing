#!/usr/bin/env node

/**
 * Automated setup script - checks and runs everything possible
 * This will:
 * 1. Check if migration is needed (verify tables exist)
 * 2. Run ETL if tables exist
 * 3. Provide clear instructions for manual steps
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
  console.error('\n   Get these from: Supabase Dashboard → Settings → API');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Check if database tables exist
 */
async function checkTables() {
  console.log('🔍 Checking database tables...\n');
  
  const tables = ['recipes', 'ingredients', 'recipe_ingredients'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          results[table] = { exists: false, error: 'Table does not exist' };
        } else {
          results[table] = { exists: false, error: error.message };
        }
      } else {
        results[table] = { exists: true };
      }
    } catch (error) {
      results[table] = { exists: false, error: error.message };
    }
  }
  
  return results;
}

/**
 * Check if recipes exist
 */
async function checkRecipes() {
  try {
    const { data, error, count } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true });
    
    if (error) return { exists: false, count: 0 };
    return { exists: true, count: count || 0 };
  } catch (error) {
    return { exists: false, count: 0 };
  }
}

/**
 * Check if storage bucket exists
 */
async function checkStorage() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) return { exists: false };
    
    const recipesBucket = buckets?.find(b => b.name === 'recipes-images');
    return { exists: !!recipesBucket };
  } catch (error) {
    return { exists: false };
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Automated Setup Check\n');
  console.log('='.repeat(50));
  
  // Step 1: Check tables
  console.log('\n📊 Step 1: Checking Database Tables...\n');
  const tableStatus = await checkTables();
  
  let allTablesExist = true;
  for (const [table, status] of Object.entries(tableStatus)) {
    if (status.exists) {
      console.log(`✅ ${table} table exists`);
    } else {
      console.log(`❌ ${table} table missing: ${status.error}`);
      allTablesExist = false;
    }
  }
  
  if (!allTablesExist) {
    console.log('\n⚠️  Database migration needed!');
    console.log('\n📋 To run migration:');
    console.log('   1. Open: MIGRATION_SQL.sql');
    console.log('   2. Copy all SQL code');
    console.log('   3. Go to: Supabase Dashboard → SQL Editor');
    console.log('   4. Paste SQL and click "Run"');
    console.log('\n   Or use Supabase CLI: supabase db push\n');
    return;
  }
  
  // Step 2: Check recipes
  console.log('\n📊 Step 2: Checking Recipes...\n');
  const recipesStatus = await checkRecipes();
  
  if (recipesStatus.exists) {
    console.log(`✅ Recipes table has ${recipesStatus.count} recipes`);
    
    if (recipesStatus.count === 0) {
      console.log('\n⚠️  No recipes found. Running ETL...\n');
      // Import and run ETL
      const { spawn } = await import('child_process');
      
      return new Promise((resolve) => {
        const etl = spawn('node', [join(__dirname, 'seed_recipes.js'), '--sample'], {
          stdio: 'inherit',
          shell: true
        });
        
        etl.on('close', (code) => {
          if (code === 0) {
            console.log('\n✅ ETL completed successfully!');
          } else {
            console.log('\n❌ ETL failed. Check errors above.');
          }
          resolve();
        });
      });
    } else {
      console.log('✅ Recipes already exist. ETL not needed.');
    }
  }
  
  // Step 3: Check storage
  console.log('\n📊 Step 3: Checking Storage...\n');
  const storageStatus = await checkStorage();
  
  if (storageStatus.exists) {
    console.log('✅ recipes-images bucket exists');
  } else {
    console.log('⚠️  recipes-images bucket missing (will be created by ETL)');
  }
  
  // Step 4: Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 Setup Summary');
  console.log('='.repeat(50));
  console.log(`Database Tables: ${allTablesExist ? '✅ Ready' : '❌ Need Migration'}`);
  console.log(`Recipes: ${recipesStatus.exists && recipesStatus.count > 0 ? `✅ ${recipesStatus.count} recipes` : '⚠️  Empty'}`);
  console.log(`Storage: ${storageStatus.exists ? '✅ Ready' : '⚠️  Will be created'}`);
  console.log('='.repeat(50));
  
  if (allTablesExist && recipesStatus.count === 0) {
    console.log('\n🚀 Ready to run ETL! Execute:');
    console.log('   node etl/seed_recipes.js --sample\n');
  } else if (allTablesExist && recipesStatus.count > 0) {
    console.log('\n✅ Setup complete! Your database is ready.');
    console.log('\n📋 Optional: Deploy Edge Function for faster search');
    console.log('   See: EDGE_FUNCTION_CODE.ts\n');
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

