/**
 * Recipe matching utilities
 * Implements scoring algorithm from PRD
 * Now uses Supabase recipes with fallback to static JSON
 */

import { getAllRecipes, searchRecipesByIngredients, getAllIngredients as getAllIngredientsFromSupabase, type Recipe } from '@/lib/recipes';

// Re-export Recipe type for convenience
export type { Recipe };
import recipesData from '@/data/recipes.json';

// Cache for recipes
let recipesCache: Recipe[] | null = null;
let recipesCachePromise: Promise<Recipe[]> | null = null;

/**
 * Get recipes (with caching)
 */
async function getRecipes(): Promise<Recipe[]> {
  if (recipesCache) {
    return recipesCache;
  }

  if (recipesCachePromise) {
    return recipesCachePromise;
  }

  recipesCachePromise = getAllRecipes().then(recipes => {
    recipesCache = recipes;
    return recipes;
  });

  return recipesCachePromise;
}

/**
 * Invalidate recipes cache (call after ETL runs)
 */
export function invalidateRecipesCache() {
  recipesCache = null;
  recipesCachePromise = null;
}

/**
 * Normalize ingredient name for matching
 */
export function normalizeIngredient(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Check if an ingredient matches a recipe ingredient (with fuzzy matching)
 */
function ingredientMatches(
  searchIngredient: string,
  recipeIngredient: string
): boolean {
  const normalizedSearch = normalizeIngredient(searchIngredient);
  const normalizedRecipe = normalizeIngredient(recipeIngredient);

  // Exact match
  if (normalizedRecipe === normalizedSearch) {
    return true;
  }

  // Contains match (e.g., "tomato" matches "tomatoes")
  if (normalizedRecipe.includes(normalizedSearch) || normalizedSearch.includes(normalizedRecipe)) {
    return true;
  }

  // Plural/singular matching (simple)
  const searchBase = normalizedSearch.replace(/s$/, '');
  const recipeBase = normalizedRecipe.replace(/s$/, '');
  if (searchBase === recipeBase && searchBase.length > 2) {
    return true;
  }

  return false;
}

/**
 * Calculate recipe match score
 * Formula: (matched_ingredients * 2 + partial_matches * 1) / (total_ingredients * 2)
 */
function calculateMatchScore(
  recipe: Recipe,
  selectedIngredients: string[]
): number {
  if (selectedIngredients.length === 0) {
    return 0;
  }

  const recipeIngredients = recipe.ingredients.map(normalizeIngredient);
  const selectedNormalized = selectedIngredients.map(normalizeIngredient);

  let matchedCount = 0;
  let partialCount = 0;

  selectedNormalized.forEach((selected) => {
    const exactMatch = recipeIngredients.some((recipeIng) => 
      recipeIng === selected
    );
    
    if (exactMatch) {
      matchedCount++;
    } else {
      const partialMatch = recipeIngredients.some((recipeIng) =>
        ingredientMatches(selected, recipeIng)
      );
      if (partialMatch) {
        partialCount++;
      }
    }
  });

  // Normalize by selected ingredients (not recipe ingredients)
  // This gives better scores when user selects fewer ingredients
  const totalSelected = selectedIngredients.length;
  const score = (matchedCount * 2 + partialCount * 1) / (totalSelected * 2);
  
  return Math.min(score, 1); // Cap at 1.0
}

/**
 * Match recipes based on selected ingredients
 * Returns recipes sorted by match score (descending)
 * Uses Supabase search API if available, otherwise client-side matching
 */
export async function matchRecipes(
  selectedIngredients: string[]
): Promise<Array<Recipe & { matchScore: number; matchPercentage: number }>> {
  // Try API search first if ingredients are provided (with timeout)
  if (selectedIngredients.length > 0) {
    try {
      // Use Promise.race to add timeout
      const searchPromise = searchRecipesByIngredients(selectedIngredients, 100);
      const timeoutPromise = new Promise<{ results: []; total: 0 }>((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 3000)
      );
      
      const { results } = await Promise.race([searchPromise, timeoutPromise]);
      
      if (results.length > 0) {
        // Use results directly - they already have the necessary data
        // No need to fetch all recipes again
        return results.map(result => ({
          ...result,
          matchScore: result.score,
          matchPercentage: Math.round(result.score * 100),
        }));
      }
    } catch (error) {
      // Silently fall through to client-side matching
      console.debug('API search unavailable, using client-side matching');
    }
  }

  // Fallback to client-side matching
  const recipes = await getRecipes();
  
  if (selectedIngredients.length === 0) {
    // Return all recipes sorted by rating if no ingredients selected
    return recipes
      .map((recipe) => ({
        ...recipe,
        matchScore: 0,
        matchPercentage: 0,
      }))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const normalizedIngredients = selectedIngredients.map(normalizeIngredient);

  const recipesWithScores = recipes.map((recipe) => {
    const matchScore = calculateMatchScore(recipe, normalizedIngredients);
    const matchPercentage = Math.round(matchScore * 100);

    return {
      ...recipe,
      matchScore,
      matchPercentage,
    };
  });

  // Filter out recipes with 0% match
  const matchedRecipes = recipesWithScores.filter((r) => r.matchScore > 0);

  // Sort by match score (descending), then by rating
  matchedRecipes.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return (b.rating || 0) - (a.rating || 0);
  });

  return matchedRecipes;
}

/**
 * Get all unique ingredients from recipes for autocomplete
 * Uses Supabase with fallback to static data
 */
export async function getAllIngredients(): Promise<string[]> {
  try {
    return await getAllIngredientsFromSupabase();
  } catch (error) {
    console.warn('Failed to fetch ingredients from Supabase, using static data:', error);
    // Fallback to static data
    const ingredientSet = new Set<string>();
    recipesData.forEach((recipe) => {
      recipe.ingredients.forEach((ing) => {
        const normalized = normalizeIngredient(ing);
        if (normalized.length > 1) {
          ingredientSet.add(normalized);
        }
      });
    });
    return Array.from(ingredientSet).sort();
  }
}

