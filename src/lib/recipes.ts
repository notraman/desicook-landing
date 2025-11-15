/**
 * Recipe service - fetches recipes from Supabase database
 * Falls back to static JSON if Supabase is unavailable
 */

import { supabase } from '@/lib/supabaseClient';
import recipesData from '@/data/recipes.json';
import { getRecipeImageUrlEnhanced } from './recipeImages';

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  ingredients: string[];
  ingredients_arr: string[];
  steps: string[];
  time_min: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  rating: number | null;
  servings: number | null;
  cuisine: string | null;
  tags: string[];
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  } | null;
}

/**
 * Supabase recipe row type
 */
interface SupabaseRecipeRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  ingredients_arr: string[];
  steps: string[];
  time_min: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  rating: number | null;
  servings: number | null;
  cuisine: string | null;
  tags: string[];
  nutrition: Record<string, unknown> | null;
}

/**
 * Static JSON recipe type
 */
interface StaticRecipe {
  id: string;
  title: string;
  description?: string;
  image?: string;
  ingredients: string[];
  steps: string[];
  time?: number;
  difficulty?: string;
  rating?: number;
  servings?: number;
  cuisine?: string;
  tags?: string[];
  nutrition?: Record<string, unknown>;
}

/**
 * Component-compatible recipe type
 */
export interface ComponentRecipe extends Recipe {
  image: string;
  time: number;
}

/**
 * Convert Supabase recipe to frontend format
 */
function formatRecipe(dbRecipe: SupabaseRecipeRow): Recipe {
  return {
    id: dbRecipe.id,
    title: dbRecipe.title,
    description: dbRecipe.description || null,
    image_url: dbRecipe.image_url || null,
    ingredients: dbRecipe.ingredients_arr || [],
    ingredients_arr: dbRecipe.ingredients_arr || [],
    steps: dbRecipe.steps || [],
    time_min: dbRecipe.time_min,
    difficulty: dbRecipe.difficulty,
    rating: dbRecipe.rating ? Number(dbRecipe.rating) : null,
    servings: dbRecipe.servings,
    cuisine: dbRecipe.cuisine,
    tags: dbRecipe.tags || [],
    nutrition: dbRecipe.nutrition as Recipe['nutrition'],
  };
}

/**
 * Convert Recipe to component-compatible format (with image and time)
 */
export function toComponentRecipe(recipe: Recipe): ComponentRecipe {
  // Use existing image_url if available, otherwise use fast placeholder
  // Don't use slow Unsplash Source API - it's deprecated and very slow
  const imageUrl = recipe.image_url || '/placeholder.svg';
  
  return {
    ...recipe,
    image: imageUrl,
    time: recipe.time_min || 0,
  };
}

/**
 * Convert static JSON recipe to frontend format
 */
function formatStaticRecipe(jsonRecipe: StaticRecipe): Recipe {
  return {
    id: jsonRecipe.id,
    title: jsonRecipe.title,
    description: jsonRecipe.description || null,
    image_url: jsonRecipe.image || null,
    ingredients: jsonRecipe.ingredients || [],
    ingredients_arr: jsonRecipe.ingredients || [],
    steps: jsonRecipe.steps || [],
    time_min: jsonRecipe.time || null,
    difficulty: (jsonRecipe.difficulty === 'Easy' || jsonRecipe.difficulty === 'Medium' || jsonRecipe.difficulty === 'Hard') 
      ? jsonRecipe.difficulty 
      : null,
    rating: jsonRecipe.rating || null,
    servings: jsonRecipe.servings || null,
    cuisine: jsonRecipe.cuisine || null,
    tags: jsonRecipe.tags || [],
    nutrition: jsonRecipe.nutrition || null,
  };
}

/**
 * Fetch all recipes from Supabase
 * Falls back to static JSON if Supabase fails
 */
export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('rating', { ascending: false, nullsFirst: false });

    if (error) {
      // Check if table doesn't exist (404/PGRST205 error)
      if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('NOT_FOUND')) {
        console.warn('⚠️ Recipes table does not exist. Using static data. Run migration: supabase/migrations/001_create_recipes.sql');
      } else {
        console.warn('Failed to fetch recipes from Supabase, using static data:', error);
      }
      return recipesData.map(formatStaticRecipe);
    }

    if (!data || data.length === 0) {
      console.warn('No recipes found in Supabase, using static data');
      return recipesData.map(formatStaticRecipe);
    }

    return data.map(formatRecipe);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return recipesData.map(formatStaticRecipe);
  }
}

/**
 * Fetch a single recipe by ID
 */
export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      // Fallback to static data
      const staticRecipe = recipesData.find(r => r.id === id);
      return staticRecipe ? formatStaticRecipe(staticRecipe) : null;
    }

    return formatRecipe(data);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    const staticRecipe = recipesData.find(r => r.id === id);
    return staticRecipe ? formatStaticRecipe(staticRecipe) : null;
  }
}

/**
 * Search recipes by ingredients using the Edge Function
 * Falls back to client-side matching if API fails
 */
export async function searchRecipesByIngredients(
  ingredients: string[],
  limit: number = 20,
  offset: number = 0
): Promise<{
  results: Array<Recipe & { score: number; matched: string[]; total_ingredients: number }>;
  total: number;
}> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  
  if (!SUPABASE_URL) {
    console.warn('SUPABASE_URL not configured, using client-side matching');
    return { results: [], total: 0 };
  }

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/search-by-ingredients`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          ingredients,
          limit,
          offset,
        }),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Format results to match Recipe interface
    interface SearchResult {
      recipe_id: string;
      title: string;
      image_url: string | null;
      time_min: number | null;
      difficulty: string | null;
      rating: number | null;
      cuisine: string | null;
      score: number;
      matched: string[];
      total_ingredients: number;
    }
    
    const results = (data.results as SearchResult[]).map((result): Recipe & { score: number; matched: string[]; total_ingredients: number } => ({
      id: result.recipe_id,
      title: result.title,
      description: null,
      image_url: result.image_url,
      ingredients: [], // Will be populated from ingredients_arr if needed
      ingredients_arr: [], // Will be fetched separately if needed
      steps: [],
      time_min: result.time_min,
      difficulty: (result.difficulty === 'Easy' || result.difficulty === 'Medium' || result.difficulty === 'Hard')
        ? result.difficulty
        : null,
      rating: result.rating,
      servings: null,
      cuisine: result.cuisine,
      tags: [],
      nutrition: null,
      score: result.score,
      matched: result.matched || [],
      total_ingredients: result.total_ingredients || 0,
    }));

    return {
      results,
      total: data.total || 0,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Search API timeout, using client-side matching');
    } else {
      console.error('Error searching recipes:', error);
    }
    // Fallback: return empty results (client-side matching can be used as backup)
    return { results: [], total: 0 };
  }
}

/**
 * Get all unique ingredients from Supabase
 * Falls back to static data if Supabase fails
 */
export async function getAllIngredients(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .select('name')
      .order('name');

    if (error || !data || data.length === 0) {
      // Fallback to static data
      const ingredientSet = new Set<string>();
      recipesData.forEach((recipe) => {
        recipe.ingredients.forEach((ing) => {
          ingredientSet.add(ing.toLowerCase().trim());
        });
      });
      return Array.from(ingredientSet).sort();
    }

    interface IngredientRow {
      name: string;
    }
    
    return (data as IngredientRow[]).map(item => item.name).sort();
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    // Fallback to static data
    const ingredientSet = new Set<string>();
    recipesData.forEach((recipe) => {
      recipe.ingredients.forEach((ing) => {
        ingredientSet.add(ing.toLowerCase().trim());
      });
    });
    return Array.from(ingredientSet).sort();
  }
}

