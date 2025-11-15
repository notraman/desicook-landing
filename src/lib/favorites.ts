import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

const FAVORITES_STORAGE_KEY = 'desicook_favorites';

/**
 * Sync localStorage favorites to Supabase when user signs in
 */
export async function syncFavoritesToSupabase(user: User) {
  const localFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
  
  if (localFavorites.length === 0) return;

  try {
    // Get existing Supabase favorites
    const { data: existingFavorites } = await supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', user.id);

    const existingIds = new Set(existingFavorites?.map(f => f.recipe_id) || []);

    // Insert new favorites that don't exist in Supabase
    const newFavorites = localFavorites
      .filter((recipeId: string) => !existingIds.has(recipeId))
      .map((recipeId: string) => ({
        user_id: user.id,
        recipe_id: recipeId,
        recipe_data: null,
      }));

    if (newFavorites.length > 0) {
      await supabase.from('favorites').insert(newFavorites);
    }

    // Clear localStorage after sync
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
  } catch (error) {
    console.error('Error syncing favorites:', error);
  }
}

/**
 * Get all favorites for a user (from Supabase or localStorage)
 */
export async function getFavorites(user: User | null): Promise<string[]> {
  if (user) {
    const { data } = await supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', user.id);

    return data?.map(f => f.recipe_id) || [];
  } else {
    return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
  }
}

