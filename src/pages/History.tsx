import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '@/components/Nav';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeGrid } from '@/components/RecipeGrid';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { getHistory, clearHistory, removeFromHistory, type HistoryEntry } from '@/lib/history';
import { Clock, Trash2, X, Search, Filter, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import recipesData from '@/data/recipes.json';
import { format } from 'date-fns';

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const historyData = await getHistory(user);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipe history.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return;

    try {
      await clearHistory(user);
      setHistory([]);
      toast({
        title: 'History cleared',
        description: 'All recipe history has been removed.',
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear history.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromHistory = async (recipeId: string) => {
    try {
      await removeFromHistory(user, recipeId);
      setHistory(history.filter(h => h.recipe_id !== recipeId));
      toast({
        title: 'Removed',
        description: 'Recipe removed from history.',
      });
    } catch (error) {
      console.error('Error removing from history:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove recipe from history.',
        variant: 'destructive',
      });
    }
  };

  // Get full recipe data for history entries with filtering and sorting
  const recipesWithHistory = useMemo(() => {
    let recipes = history.map(entry => {
      const recipe = recipesData.find(r => r.id === entry.recipe_id) || entry.recipe_data;
      return recipe ? { ...recipe, viewedAt: entry.viewed_at } : null;
    }).filter((recipe): recipe is NonNullable<typeof recipe> => recipe !== null);

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      recipes = recipes.filter(recipe => 
        recipe.title.toLowerCase().includes(query) ||
        recipe.cuisine.toLowerCase().includes(query) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(query))
      );
    }

    // Sort by date
    recipes.sort((a, b) => {
      const dateA = new Date(a.viewedAt || 0).getTime();
      const dateB = new Date(b.viewedAt || 0).getTime();
      return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
    });

    return recipes;
  }, [history, searchQuery, sortBy]);

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
                <Clock className="w-7 h-7 text-dc-gold" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dc-cream mb-2 tracking-tight">
                  Recipe History
                </h1>
                <p className="text-lg text-dc-cream/60">
                  Recipes you've recently viewed
                </p>
              </div>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
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
                <Clock className="w-8 h-8 text-dc-gold" />
              </div>
              <p className="text-dc-cream/70 text-lg">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="glass glass-reflection p-20 rounded-2xl text-center">
              <div className="w-24 h-24 rounded-full glass flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-dc-cream/30" />
              </div>
              <h2 className="text-3xl font-bold text-dc-cream mb-3">No history yet</h2>
              <p className="text-dc-cream/60 mb-8 text-lg max-w-md mx-auto">
                Start browsing recipes to see them here. Your viewing history will appear automatically.
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
                      placeholder="Search recipes, cuisines, or ingredients..."
                      className="input-glass pl-12 w-full"
                    />
                  </div>
                  
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-dc-cream/60" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest')}
                      className="input-glass px-4 py-3 cursor-pointer"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between">
                <p className="text-dc-cream/70">
                  {recipesWithHistory.length} of {history.length} recipe{history.length !== 1 ? 's' : ''}
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
              {recipesWithHistory.length === 0 ? (
                <div className="glass glass-reflection p-16 rounded-2xl text-center">
                  <Search className="w-16 h-16 text-dc-cream/30 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-dc-cream mb-2">No recipes found</h3>
                  <p className="text-dc-cream/60">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <RecipeGrid recipes={recipesWithHistory} />
              )}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
};

export default History;

