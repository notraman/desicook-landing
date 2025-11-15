import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Recipe } from './recipeMatching';

const HISTORY_STORAGE_KEY = 'desicook_history';
const MAX_LOCAL_HISTORY = 50;

export interface HistoryEntry {
  recipe_id: string;
  recipe_data: Recipe | null;
  viewed_at: string;
}

/**
 * Add a recipe to history (Supabase or localStorage)
 */
export async function addToHistory(
  user: User | null,
  recipeId: string,
  recipeData?: Recipe | null
): Promise<void> {
  if (user) {
    // Use Supabase - upsert to update viewed_at if already exists
    await supabase
      .from('recipe_history')
      .upsert({
        user_id: user.id,
        recipe_id: recipeId,
        recipe_data: recipeData || null,
        viewed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,recipe_id'
      });
  } else {
    // Use localStorage
    const history = getLocalHistory();
    
    // Remove if already exists
    const filtered = history.filter(h => h.recipe_id !== recipeId);
    
    // Add to beginning
    filtered.unshift({
      recipe_id: recipeId,
      recipe_data: recipeData || null,
      viewed_at: new Date().toISOString(),
    });
    
    // Keep only last MAX_LOCAL_HISTORY entries
    const trimmed = filtered.slice(0, MAX_LOCAL_HISTORY);
    
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  }
}

/**
 * Get history for a user (Supabase or localStorage)
 */
export async function getHistory(user: User | null): Promise<HistoryEntry[]> {
  if (user) {
    const { data, error } = await supabase
      .from('recipe_history')
      .select('recipe_id, recipe_data, viewed_at')
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }
    
    return (data || []).map(item => ({
      recipe_id: item.recipe_id,
      recipe_data: item.recipe_data as Recipe | null,
      viewed_at: item.viewed_at,
    }));
  } else {
    return getLocalHistory();
  }
}

/**
 * Clear history for a user
 */
export async function clearHistory(user: User | null): Promise<void> {
  if (user) {
    await supabase
      .from('recipe_history')
      .delete()
      .eq('user_id', user.id);
  } else {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }
}

/**
 * Remove a specific recipe from history
 */
export async function removeFromHistory(
  user: User | null,
  recipeId: string
): Promise<void> {
  if (user) {
    await supabase
      .from('recipe_history')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);
  } else {
    const history = getLocalHistory();
    const filtered = history.filter(h => h.recipe_id !== recipeId);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
  }
}

/**
 * Sync localStorage history to Supabase when user signs in
 */
export async function syncHistoryToSupabase(user: User): Promise<void> {
  const localHistory = getLocalHistory();
  
  if (localHistory.length === 0) return;

  try {
    // Get existing Supabase history
    const { data: existingHistory } = await supabase
      .from('recipe_history')
      .select('recipe_id')
      .eq('user_id', user.id);

    const existingIds = new Set(existingHistory?.map(h => h.recipe_id) || []);

    // Insert new history entries that don't exist in Supabase
    const newHistory = localHistory
      .filter(entry => !existingIds.has(entry.recipe_id))
      .map(entry => ({
        user_id: user.id,
        recipe_id: entry.recipe_id,
        recipe_data: entry.recipe_data,
        viewed_at: entry.viewed_at,
      }));

    if (newHistory.length > 0) {
      await supabase.from('recipe_history').insert(newHistory);
    }

    // Clear localStorage after sync
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Error syncing history:', error);
  }
}

/**
 * Get local history from localStorage
 */
function getLocalHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

