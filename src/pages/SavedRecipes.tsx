import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Nav } from '@/components/Nav';
import { RecipeGrid } from '@/components/RecipeGrid';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { getFavorites } from '@/lib/favorites';
import { Heart, Trash2, Search, Filter, Star, TrendingUp, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import recipesData from '@/data/recipes.json';
import { supabase } from '@/lib/supabaseClient';

const SavedRecipes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'time' | 'alphabetical'>('rating');

  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Refresh favorites when navigating to this page
  useEffect(() => {
    if (location.pathname === '/saved') {
      loadFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Refresh favorites when window regains focus (user might have favorited in another tab)
  useEffect(() => {
    const handleFocus = () => {
      loadFavorites();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const favorites = await getFavorites(user);
      setFavoriteIds(favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved recipes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (recipeId: string) => {
    try {
      if (user) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);
      } else {
        const favorites = JSON.parse(localStorage.getItem('desicook_favorites') || '[]');
        const updated = favorites.filter((id: string) => id !== recipeId);
        localStorage.setItem('desicook_favorites', JSON.stringify(updated));
      }
      
      setFavoriteIds(favoriteIds.filter(id => id !== recipeId));
      toast({
        title: 'Removed',
        description: 'Recipe removed from saved recipes.',
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove recipe.',
        variant: 'destructive',
      });
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to remove all saved recipes?')) return;

    try {
      if (user) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id);
      } else {
        localStorage.removeItem('desicook_favorites');
      }
      
      setFavoriteIds([]);
      toast({
        title: 'Cleared',
        description: 'All saved recipes have been removed.',
      });
    } catch (error) {
      console.error('Error clearing favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear saved recipes.',
        variant: 'destructive',
      });
    }
  };

  // Get full recipe data for favorites with filtering and sorting
  const favoriteRecipes = useMemo(() => {
    let recipes = favoriteIds
      .map(id => recipesData.find(r => r.id === id))
      .filter(Boolean) as typeof recipesData;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      recipes = recipes.filter(recipe => 
        recipe.title.toLowerCase().includes(query) ||
        recipe.cuisine.toLowerCase().includes(query) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(query))
      );
    }

    // Sort recipes
    recipes.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'time':
          return a.time - b.time;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return recipes;
  }, [favoriteIds, searchQuery, sortBy]);

  return (
    <main className="min-h-screen relative">
      <Nav />
      
      {/* Background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 15% 30%, hsl(165 63% 15% / 0.4) 0%, transparent 45%),
            radial-gradient(circle at 85% 70%, hsl(342 68% 18% / 0.35) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, hsl(215 49% 13% / 0.3) 0%, transparent 60%),
            linear-gradient(135deg, hsl(215 49% 13%) 0%, hsl(165 63% 15%) 100%)
          `
        }}
      />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 pt-24 pb-20">
        {/* Header */}
        <section className="py-12 md:py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl glass glass-reflection flex items-center justify-center">
                <Heart className="w-7 h-7 text-dc-gold fill-dc-gold" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dc-cream mb-2 tracking-tight">
                  Saved Recipes
                </h1>
                <p className="text-lg text-dc-cream/60">
                  Your favorite recipes, all in one place
                </p>
              </div>
            </div>
            {favoriteIds.length > 0 && (
              <button
                onClick={handleClearAll}
                className="btn-glass text-sm px-5 py-2.5 flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {loading ? (
            <div className="glass glass-reflection p-16 rounded-2xl text-center">
              <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Heart className="w-8 h-8 text-dc-gold fill-dc-gold" />
              </div>
              <p className="text-dc-cream/70 text-lg">Loading saved recipes...</p>
            </div>
          ) : favoriteIds.length === 0 ? (
            <div className="glass glass-reflection p-20 rounded-2xl text-center">
              <div className="w-24 h-24 rounded-full glass flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-dc-cream/30" />
              </div>
              <h2 className="text-3xl font-bold text-dc-cream mb-3">No saved recipes yet</h2>
              <p className="text-dc-cream/60 mb-8 text-lg max-w-md mx-auto">
                Start saving your favorite recipes by clicking the heart icon on any recipe card.
              </p>
              <button
                onClick={() => navigate('/home')}
                className="btn-gold inline-flex items-center gap-2"
              >
                Browse Recipes
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Search and Filter Bar */}
              <div className="glass glass-reflection p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dc-cream/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your saved recipes..."
                      className="input-glass pl-12 w-full"
                    />
                  </div>
                  
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-dc-cream/60" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'rating' | 'time' | 'alphabetical')}
                      className="input-glass px-4 py-3 cursor-pointer"
                    >
                      <option value="rating">Highest Rated</option>
                      <option value="time">Quickest First</option>
                      <option value="alphabetical">A-Z</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between">
                <p className="text-dc-cream/70">
                  {favoriteRecipes.length} of {favoriteIds.length} saved recipe{favoriteIds.length !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-sm text-dc-gold hover:text-dc-gold/80 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear search
                  </button>
                )}
              </div>

              {/* Recipe Grid */}
              {favoriteRecipes.length === 0 ? (
                <div className="glass glass-reflection p-16 rounded-2xl text-center">
                  <Search className="w-16 h-16 text-dc-cream/30 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-dc-cream mb-2">No recipes found</h3>
                  <p className="text-dc-cream/60">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <RecipeGrid recipes={favoriteRecipes} />
              )}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
};

export default SavedRecipes;

