#!/usr/bin/env node

/**
 * ETL Script to seed Supabase with recipes and images
 * 
 * Usage:
 *   node etl/seed_recipes.js --sample          # Test mode with sample recipes
 *   node etl/seed_recipes.js --full            # Full mode with all recipes
 *   node etl/seed_recipes.js --full --concurrency=5  # With custom concurrency
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Note: fetch is available in Node.js 18+, no need for node-fetch

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY; // Optional free tier available
const RECIPES_JSON_PATH = process.env.RECIPES_JSON_PATH || 'src/data/recipes.json';

// Parse command line arguments
const args = process.argv.slice(2);
const isSampleMode = args.includes('--sample');
const isFullMode = args.includes('--full');
const concurrencyArg = args.find(arg => arg.startsWith('--concurrency='));
const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1]) : 3;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

// At least one free image API key is recommended, but we can use public domain fallbacks
if (!UNSPLASH_ACCESS_KEY && !PEXELS_API_KEY && !PIXABAY_API_KEY) {
  console.warn('⚠️  Warning: No image API keys provided. Will use public domain image fallbacks only.');
}

// Initialize Supabase client with service role key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Statistics
const stats = {
  total: 0,
  inserted: 0,
  failed: 0,
  skipped: 0,
  imagesUnsplash: 0,
  imagesPexels: 0,
  imagesPixabay: 0,
  imagesPublicDomain: 0,
  imagesFailed: 0
};

/**
 * Normalize ingredient name
 */
function normalizeIngredientName(ingredient) {
  if (!ingredient) return "";
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove punctuation except hyphens
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\bs\b/g, "") // Remove standalone 's' (simple pluralization)
    .trim();
}

/**
 * Build search keywords for image search
 */
function buildImageKeywords(recipe) {
  const keywords = [];
  
  // Primary: exact recipe title
  keywords.push(recipe.title);
  
  // Secondary: main ingredients (first 2)
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const mainIngredients = recipe.ingredients.slice(0, 2).join(' ');
    keywords.push(mainIngredients);
  }
  
  // Tertiary: cuisine + dish type
  if (recipe.cuisine) {
    const dishType = recipe.title.split(' ').slice(-2).join(' '); // Last 2 words
    keywords.push(`${recipe.cuisine} ${dishType}`);
  }
  
  return keywords;
}

/**
 * Search Unsplash for recipe image
 */
async function searchUnsplash(query) {
  if (!UNSPLASH_ACCESS_KEY) return null;
  
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        console.warn(`⚠️  Unsplash rate limit hit for query: ${query}`);
        return null;
      }
      throw new Error(`Unsplash API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Prefer images with food-related tags or higher resolution
      const bestImage = data.results
        .sort((a, b) => {
          const aHasFood = a.tags?.some(tag => 
            tag.title?.toLowerCase().includes('food') || 
            tag.title?.toLowerCase().includes('cooking')
          );
          const bHasFood = b.tags?.some(tag => 
            tag.title?.toLowerCase().includes('food') || 
            tag.title?.toLowerCase().includes('cooking')
          );
          if (aHasFood && !bHasFood) return -1;
          if (!aHasFood && bHasFood) return 1;
          return (b.width * b.height) - (a.width * a.height); // Higher resolution
        })[0];
      
      return bestImage.urls.regular || bestImage.urls.full;
    }
    
    return null;
  } catch (error) {
    console.warn(`⚠️  Unsplash search failed for "${query}":`, error.message);
    return null;
  }
}

/**
 * Search Pexels for recipe image (fallback)
 */
async function searchPexels(query) {
  if (!PEXELS_API_KEY) return null;
  
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const response = await fetch(url, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`⚠️  Pexels rate limit hit for query: ${query}`);
        return null;
      }
      throw new Error(`Pexels API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      // Prefer higher resolution images
      const bestImage = data.photos.sort((a, b) => 
        (b.width * b.height) - (a.width * a.height)
      )[0];
      
      return bestImage.src.large || bestImage.src.original;
    }
    
    return null;
  } catch (error) {
    console.warn(`⚠️  Pexels search failed for "${query}":`, error.message);
    return null;
  }
}

/**
 * Search Pixabay for recipe image (free tier available)
 */
async function searchPixabay(query) {
  if (!PIXABAY_API_KEY) return null;
  
  try {
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=5`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`⚠️  Pixabay rate limit hit for query: ${query}`);
        return null;
      }
      throw new Error(`Pixabay API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.hits && data.hits.length > 0) {
      // Prefer higher resolution images
      const bestImage = data.hits.sort((a, b) => 
        (b.imageWidth * b.imageHeight) - (a.imageWidth * a.imageHeight)
      )[0];
      
      return bestImage.largeImageURL || bestImage.webformatURL;
    }
    
    return null;
  } catch (error) {
    console.warn(`⚠️  Pixabay search failed for "${query}":`, error.message);
    return null;
  }
}

/**
 * Get a public domain placeholder image (final fallback)
 * Uses free, no-API-key-required services
 */
async function getPublicDomainImage(query) {
  try {
    // Use Lorem Picsum (completely free, no API key required)
    // Generate a deterministic seed based on query for consistency
    const seed = Math.abs(query.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    const width = 800;
    const height = 600;
    
    // Lorem Picsum - free, public domain images, no API key needed
    const placeholderUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;
    
    // Verify the image is accessible
    const response = await fetch(placeholderUrl, { method: 'HEAD' });
    if (response.ok) {
      return placeholderUrl;
    }
    
    return null;
  } catch (error) {
    console.warn(`⚠️  Public domain image fallback failed for "${query}":`, error.message);
    return null;
  }
}

/**
 * Download and optionally resize image
 */
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Optional: Resize image if too large (max width 1200px)
    // For now, we'll upload as-is. You can add sharp or similar for resizing.
    
    return buffer;
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Upload image to Supabase Storage
 */
async function uploadImageToStorage(recipeId, imageBuffer) {
  const bucketName = 'recipes-images';
  const filePath = `recipes/${recipeId}.jpg`;
  
  try {
    // Ensure bucket exists (create if not)
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.log(`📦 Creating storage bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      });
      
      if (createError && !createError.message.includes('already exists')) {
        throw createError;
      }
    }
    
    // Upload image
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Get or create ingredient
 */
async function getOrCreateIngredient(ingredientName) {
  const normalized = normalizeIngredientName(ingredientName);
  
  // Check if ingredient exists
  const { data: existing } = await supabase
    .from('ingredients')
    .select('id')
    .eq('name', normalized)
    .single();
  
  if (existing) {
    return existing.id;
  }
  
  // Create new ingredient
  const { data: newIngredient, error } = await supabase
    .from('ingredients')
    .insert({ name: normalized })
    .select('id')
    .single();
  
  if (error) {
    // Handle race condition (ingredient created by another process)
    if (error.code === '23505') { // Unique violation
      const { data: retry } = await supabase
        .from('ingredients')
        .select('id')
        .eq('name', normalized)
        .single();
      return retry?.id;
    }
    throw error;
  }
  
  return newIngredient.id;
}

/**
 * Process a single recipe
 */
async function processRecipe(recipe, index, total) {
  const recipeTitle = recipe.title || `Recipe ${index + 1}`;
  console.log(`\n[${index + 1}/${total}] Processing: ${recipeTitle}`);
  
  try {
    // Check if recipe already exists (idempotency)
    const { data: existing } = await supabase
      .from('recipes')
      .select('id')
      .eq('title', recipe.title)
      .single();
    
    if (existing) {
      console.log(`⏭️  Recipe already exists, skipping...`);
      stats.skipped++;
      return;
    }
    
    // Step 1: Get image
    let imageUrl = null;
    const keywords = buildImageKeywords(recipe);
    
    for (const keyword of keywords) {
      console.log(`  🔍 Searching image for: "${keyword}"`);
      
      // Try Unsplash first (free, high quality)
      let imageUrlCandidate = await searchUnsplash(keyword);
      if (imageUrlCandidate) {
        stats.imagesUnsplash++;
        console.log(`  ✅ Found image on Unsplash (free, public domain)`);
        imageUrl = imageUrlCandidate;
        break;
      }
      
      // Fallback to Pexels (free, public domain)
      imageUrlCandidate = await searchPexels(keyword);
      if (imageUrlCandidate) {
        stats.imagesPexels++;
        console.log(`  ✅ Found image on Pexels (free, public domain)`);
        imageUrl = imageUrlCandidate;
        break;
      }
      
      // Fallback to Pixabay (free tier available)
      imageUrlCandidate = await searchPixabay(keyword);
      if (imageUrlCandidate) {
        stats.imagesPixabay++;
        console.log(`  ✅ Found image on Pixabay (free, public domain)`);
        imageUrl = imageUrlCandidate;
        break;
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Final fallback: Use public domain placeholder if no API found images
    if (!imageUrl) {
      console.log(`  🔄 Trying public domain image fallback...`);
      const publicDomainUrl = await getPublicDomainImage(keywords[0] || recipe.title);
      if (publicDomainUrl) {
        stats.imagesPublicDomain++;
        console.log(`  ✅ Using public domain placeholder image`);
        imageUrl = publicDomainUrl;
      }
    }
    
    if (!imageUrl) {
      console.warn(`  ⚠️  No image found for "${recipeTitle}"`);
      stats.imagesFailed++;
    } else {
      // Download and upload image
      try {
        console.log(`  📥 Downloading image...`);
        const imageBuffer = await downloadImage(imageUrl);
        
        console.log(`  📤 Uploading to Supabase Storage...`);
        // We'll get the recipe ID after insert, so use a temp ID for now
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const uploadedUrl = await uploadImageToStorage(tempId, imageBuffer);
        imageUrl = uploadedUrl;
        console.log(`  ✅ Image uploaded: ${imageUrl}`);
      } catch (imageError) {
        console.warn(`  ⚠️  Image upload failed: ${imageError.message}`);
        stats.imagesFailed++;
        imageUrl = null; // Continue without image
      }
    }
    
    // Step 2: Insert recipe
    const recipeData = {
      title: recipe.title,
      description: recipe.description || null,
      image_url: imageUrl,
      time_min: recipe.time || null,
      difficulty: recipe.difficulty || null,
      rating: recipe.rating || null,
      servings: recipe.servings || null,
      cuisine: recipe.cuisine || null,
      tags: recipe.tags || [],
      nutrition: recipe.nutrition || null,
      steps: recipe.steps || [],
      ingredients_arr: [] // Will be populated after ingredients are processed
    };
    
    const { data: insertedRecipe, error: recipeError } = await supabase
      .from('recipes')
      .insert(recipeData)
      .select('id')
      .single();
    
    if (recipeError) throw recipeError;
    
    // Update image URL with actual recipe ID
    if (imageUrl && imageUrl.includes('temp-')) {
      const actualFilePath = `recipes/${insertedRecipe.id}.jpg`;
      const { data: urlData } = supabase.storage
        .from('recipes-images')
        .getPublicUrl(actualFilePath);
      
      await supabase
        .from('recipes')
        .update({ image_url: urlData.publicUrl })
        .eq('id', insertedRecipe.id);
      
      imageUrl = urlData.publicUrl;
    }
    
    console.log(`  ✅ Recipe inserted with ID: ${insertedRecipe.id}`);
    
    // Step 3: Process ingredients
    const normalizedIngredients = [];
    const ingredientIds = [];
    
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      for (let i = 0; i < recipe.ingredients.length; i++) {
        const ingredientName = recipe.ingredients[i];
        const normalized = normalizeIngredientName(ingredientName);
        
        try {
          const ingredientId = await getOrCreateIngredient(ingredientName);
          ingredientIds.push(ingredientId);
          normalizedIngredients.push(normalized);
          
          // Insert recipe_ingredient relationship
          await supabase
            .from('recipe_ingredients')
            .insert({
              recipe_id: insertedRecipe.id,
              ingredient_id: ingredientId,
              position: i,
              quantity: null // Can be extracted from recipe if available
            });
        } catch (ingError) {
          console.warn(`  ⚠️  Failed to process ingredient "${ingredientName}": ${ingError.message}`);
        }
      }
    }
    
    // Step 4: Update ingredients_arr
    await supabase
      .from('recipes')
      .update({ ingredients_arr: normalizedIngredients })
      .eq('id', insertedRecipe.id);
    
    console.log(`  ✅ Processed ${ingredientIds.length} ingredients`);
    stats.inserted++;
    
  } catch (error) {
    console.error(`  ❌ Failed to process recipe "${recipeTitle}":`, error.message);
    stats.failed++;
  }
}

/**
 * Process recipes in batches with concurrency control
 */
async function processRecipesBatch(recipes, startIndex, batchSize) {
  const batch = recipes.slice(startIndex, startIndex + batchSize);
  await Promise.all(batch.map((recipe, i) => 
    processRecipe(recipe, startIndex + i, recipes.length)
  ));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting recipe seeding ETL...\n');
  console.log(`Mode: ${isSampleMode ? 'SAMPLE' : isFullMode ? 'FULL' : 'SAMPLE (default)'}`);
  console.log(`Concurrency: ${concurrency}\n`);
  
  // Load recipes
  let recipes;
  if (isSampleMode || !isFullMode) {
    const samplePath = join(__dirname, 'recipes_sample.json');
    console.log(`📖 Loading sample recipes from: ${samplePath}`);
    recipes = JSON.parse(readFileSync(samplePath, 'utf-8'));
  } else {
    const recipesPath = join(__dirname, '..', RECIPES_JSON_PATH);
    console.log(`📖 Loading recipes from: ${recipesPath}`);
    recipes = JSON.parse(readFileSync(recipesPath, 'utf-8'));
  }
  
  stats.total = recipes.length;
  console.log(`📊 Total recipes to process: ${stats.total}\n`);
  
  // Process recipes in batches
  for (let i = 0; i < recipes.length; i += concurrency) {
    await processRecipesBatch(recipes, i, concurrency);
    
    // Rate limiting delay between batches
    if (i + concurrency < recipes.length) {
      console.log(`\n⏸️  Waiting 1 second before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 ETL Summary');
  console.log('='.repeat(50));
  console.log(`Total recipes:     ${stats.total}`);
  console.log(`✅ Inserted:        ${stats.inserted}`);
  console.log(`⏭️  Skipped:         ${stats.skipped}`);
  console.log(`❌ Failed:          ${stats.failed}`);
  console.log(`\n📸 Image Statistics (all free/public domain):`);
  console.log(`   Unsplash:        ${stats.imagesUnsplash}`);
  console.log(`   Pexels:          ${stats.imagesPexels}`);
  console.log(`   Pixabay:         ${stats.imagesPixabay}`);
  console.log(`   Public Domain:   ${stats.imagesPublicDomain}`);
  console.log(`   Failed:          ${stats.imagesFailed}`);
  console.log('='.repeat(50));
  
  if (stats.failed > 0) {
    console.log('\n⚠️  Some recipes failed to process. Check logs above.');
    process.exit(1);
  }
  
  console.log('\n✅ ETL completed successfully!');
}

// Run main
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

