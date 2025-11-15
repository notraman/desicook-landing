import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { addToHistory } from '@/lib/history';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { getRecipeImageUrlEnhanced } from '@/lib/recipeImages';

interface Recipe {
  id: string;
  title: string;
  image: string;
  time: number;
  difficulty: string;
  rating: number;
  ingredients: string[];
  steps: string[];
  nutrition: {
    calories: number;
    protein: number;
  };
  servings: number;
  tags: string[];
  cuisine: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  variant?: 'default' | 'large';
  className?: string;
  onClick?: () => void;
}

const FAVORITES_STORAGE_KEY = 'desicook_favorites';

export const RecipeCard = ({ recipe, variant = 'default', className = '', onClick }: RecipeCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkFavoriteStatus = useCallback(async () => {
    if (user) {
      // Check Supabase
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('recipe_id', recipe.id)
        .single();

      setIsFavorited(!!data);
    } else {
      // Check localStorage
      const favorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
      setIsFavorited(favorites.includes(recipe.id));
    }
  }, [user, recipe.id]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);

    try {
      if (user) {
        // Use Supabase
        if (isFavorited) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('recipe_id', recipe.id);

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
              recipe_id: recipe.id,
              recipe_data: (recipe as unknown as Record<string, unknown>) || null,
            } as never);

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
          const updated = favorites.filter((id: string) => id !== recipe.id);
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
          setIsFavorited(false);
          toast({
            title: 'Removed from favorites',
            description: 'Sign in to sync favorites across devices.',
          });
        } else {
          favorites.push(recipe.id);
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
          setIsFavorited(true);
          toast({
            title: 'Added to favorites',
            description: 'Sign in to sync favorites across devices.',
          });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update favorite.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    // Track in history - convert to compatible format
    const historyRecipe: import('@/lib/recipes').Recipe = {
      id: recipe.id,
      title: recipe.title,
      description: null,
      image_url: recipe.image,
      ingredients: recipe.ingredients,
      ingredients_arr: recipe.ingredients,
      steps: recipe.steps,
      time_min: recipe.time,
      difficulty: recipe.difficulty as 'Easy' | 'Medium' | 'Hard' | null,
      rating: recipe.rating,
      servings: recipe.servings,
      cuisine: recipe.cuisine,
      tags: recipe.tags,
      nutrition: recipe.nutrition,
    };
    addToHistory(user, recipe.id, historyRecipe);
    // Navigate to recipe detail page
    navigate(`/recipe/${recipe.id}`);
    // Call custom onClick if provided
    if (onClick) {
      onClick();
    }
  };

  const getImageUrl = () => {
    if (recipe.image && recipe.image !== '/placeholder.svg') {
      return recipe.image;
    }
    return getRecipeImageUrlEnhanced(recipe.title, recipe.ingredients || [], 800, 600);
  };

  const isLarge = variant === 'large';
  const cardPadding = isLarge ? 'p-6' : 'p-4';
  const imageHeight = isLarge ? 'aspect-[4/3]' : 'aspect-square';

  return (
    <article 
      onClick={handleClick}
      className={`glass glass-hover glass-reflection ${cardPadding} rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer ${className}`}
      role="article"
      aria-label={`Recipe: ${recipe.title}`}
    >
      {/* Image */}
      <div className={`${imageHeight} w-full rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-dc-gold/10 to-dc-burgundy/10 relative`}>
        <img
          src={getImageUrl()}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getRecipeImageUrlEnhanced(recipe.title, recipe.ingredients || [], 800, 600);
          }}
        />
        {/* Favorite Button Overlay */}
        <button
          onClick={handleFavorite}
          disabled={loading}
          className="absolute top-3 right-3 w-10 h-10 rounded-full glass flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isFavorited ? `Remove ${recipe.title} from favorites` : `Add ${recipe.title} to favorites`}
        >
          <svg
            className={`w-5 h-5 transition-all ${isFavorited ? 'fill-dc-gold text-dc-gold' : 'fill-none text-dc-cream/70'}`}
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
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Title */}
        <h3 className={`font-bold text-dc-cream leading-tight ${isLarge ? 'text-xl' : 'text-lg'}`}>
          {recipe.title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-dc-cream/70">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{recipe.time} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{recipe.difficulty}</span>
          </div>
          <div className="flex items-center gap-1 text-dc-gold font-semibold ml-auto">
            <svg className="w-4 h-4 fill-dc-gold" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{recipe.rating}</span>
          </div>
        </div>

        {/* Nutrition Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs">
            <svg className="w-3.5 h-3.5 text-dc-gold" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            <span className="text-dc-cream/80">{recipe.nutrition.calories} cal</span>
          </div>
          <span className="text-xs text-dc-cream/50">{recipe.servings} servings</span>
        </div>
      </div>
    </article>
  );
};
