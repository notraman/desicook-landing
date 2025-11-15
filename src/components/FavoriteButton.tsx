import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface FavoriteButtonProps {
  recipeId: string;
  recipeData?: Record<string, any>;
  className?: string;
}

const FAVORITES_STORAGE_KEY = 'desicook_favorites';

export const FavoriteButton = ({ recipeId, recipeData, className = '' }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if recipe is favorited on mount
  useEffect(() => {
    checkFavoriteStatus();
  }, [user, recipeId]);

  const checkFavoriteStatus = async () => {
    if (user) {
      // Check Supabase
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
        .single();

      setIsFavorited(!!data);
    } else {
      // Check localStorage
      const favorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
      setIsFavorited(favorites.includes(recipeId));
    }
  };

  const toggleFavorite = async () => {
    setLoading(true);

    try {
      if (user) {
        // Use Supabase
        if (isFavorited) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('recipe_id', recipeId);

          if (error) throw error;
          setIsFavorited(false);
          toast({
            title: 'Removed from favorites',
            description: 'Recipe removed from your favorites.',
          });
        } else {
          const { error } = await supabase
            .from('favorites')
            .insert({
              user_id: user.id,
              recipe_id: recipeId,
              recipe_data: recipeData || null,
            });

          if (error) throw error;
          setIsFavorited(true);
          toast({
            title: 'Added to favorites',
            description: 'Recipe saved to your favorites.',
          });
        }
      } else {
        // Use localStorage
        const favorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
        
        if (isFavorited) {
          const updated = favorites.filter((id: string) => id !== recipeId);
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
          setIsFavorited(false);
          toast({
            title: 'Removed from favorites',
            description: 'Sign in to sync favorites across devices.',
          });
        } else {
          favorites.push(recipeId);
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
          setIsFavorited(true);
          toast({
            title: 'Added to favorites',
            description: 'Sign in to sync favorites across devices.',
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update favorite.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`btn-glass px-6 py-3 ${className}`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={`w-5 h-5 transition-all ${isFavorited ? 'fill-dc-gold text-dc-gold' : 'fill-none'}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
};

