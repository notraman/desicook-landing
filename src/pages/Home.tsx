import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '@/components/Nav';
import { IngredientSearchBar } from '@/components/IngredientSearchBar';
import { ImageUploader } from '@/components/ImageUploader';
import { TodayPicks } from '@/components/TodayPicks';
import { ChipBar } from '@/components/ChipBar';
import { CollectionRow } from '@/components/CollectionRow';
import { AIRecipeSuggestions } from '@/components/AIRecipeSuggestions';
import { RecipeCard } from '@/components/RecipeCard';
import Footer from '@/components/Footer';
import { matchRecipes, getAllIngredients as getAllIngredientsFromMatching, type Recipe } from '@/lib/recipeMatching';
import { getAllRecipes, toComponentRecipe } from '@/lib/recipes';
import { Clock, TrendingUp, Flame, ChefHat, Sparkles, Star, Users, Zap, Award, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isImageUploaderOpen, setIsImageUploaderOpen] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allIngredients, setAllIngredients] = useState<string[]>([]);
  const [matchedRecipes, setMatchedRecipes] = useState<Array<Recipe & { matchScore: number; matchPercentage: number }> | null>(null);
  const [loading, setLoading] = useState(true);

  // Load recipes and ingredients on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [recipesData, ingredientsData] = await Promise.all([
          getAllRecipes(),
          getAllIngredientsFromMatching(),
        ]);
        setRecipes(recipesData);
        setAllIngredients(ingredientsData.slice(0, 20)); // Limit to 20 for UI
      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Match recipes based on selected ingredients (from search bar)
  useEffect(() => {
    if (selectedIngredients.length === 0) {
      setMatchedRecipes(null);
      return;
    }

    async function searchRecipes() {
      try {
        const matched = await matchRecipes(selectedIngredients);
        setMatchedRecipes(matched);
      } catch (error) {
        console.error('Error matching recipes:', error);
        setMatchedRecipes(null);
      }
    }

    searchRecipes();
  }, [selectedIngredients]);

  // Filter recipes based on selected chips (from ChipBar)
  const filteredRecipes = useMemo(() => {
    // If ingredients are selected via search bar, use matched recipes
    if (matchedRecipes) {
      // Further filter by chips if any are selected
      if (selectedChips.length === 0) {
        return matchedRecipes.map((r) => {
          const { matchScore, matchPercentage, ...recipe } = r;
          return recipe;
        });
      }
      return matchedRecipes
        .filter((recipe) => {
          const recipeIngredients = recipe.ingredients.map((ing) => ing.toLowerCase());
          return selectedChips.every((chip) => recipeIngredients.includes(chip.toLowerCase()));
        })
        .map((r) => {
          const { matchScore, matchPercentage, ...recipe } = r;
          return recipe;
        });
    }

    // Otherwise, use chip-based filtering
    if (selectedChips.length === 0) {
      return recipes;
    }
    return recipes.filter((recipe) => {
      const recipeIngredients = recipe.ingredients.map((ing) => ing.toLowerCase());
      return selectedChips.every((chip) => recipeIngredients.includes(chip.toLowerCase()));
    });
  }, [selectedChips, matchedRecipes, recipes]);

  // Get top-rated recipes for Today's Picks
  const todaysPicks = useMemo(() => {
    return [...recipes]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [recipes]);

  // Get recipes by cuisine for collections
  const getRecipesByCuisine = (cuisine: string, limit: number = 6) => {
    return recipes
      .filter((r) => r.cuisine?.toLowerCase() === cuisine.toLowerCase())
      .slice(0, limit);
  };

  // Get trending recipes (high rating + recent)
  const trendingRecipes = useMemo(() => {
    return [...recipes]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [recipes]);

  // Get quick recipes (under 30 minutes)
  const quickRecipes = useMemo(() => {
    return recipes
      .filter((r) => r.time_min && r.time_min <= 30)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [recipes]);

  // Get popular cuisines
  const popularCuisines = useMemo(() => {
    const cuisineCounts = new Map<string, number>();
    recipes.forEach((recipe) => {
      if (recipe.cuisine) {
        cuisineCounts.set(recipe.cuisine, (cuisineCounts.get(recipe.cuisine) || 0) + 1);
      }
    });
    return Array.from(cuisineCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cuisine]) => cuisine);
  }, [recipes]);

  // Editor's picks (top rated + diverse cuisines)
  const editorsPicks = useMemo(() => {
    const cuisines = new Set<string>();
    return recipes
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .filter((r) => {
        if (cuisines.size >= 3) return false;
        if (r.cuisine && !cuisines.has(r.cuisine)) {
          cuisines.add(r.cuisine);
          return true;
        }
        return false;
      })
      .slice(0, 6);
  }, [recipes]);

  const handleChipToggle = (ingredient: string) => {
    setSelectedChips((prev) => {
      if (prev.includes(ingredient)) {
        return prev.filter((chip) => chip !== ingredient);
      }
      return [...prev, ingredient];
    });
  };

  const handleClear = () => {
    setSelectedChips([]);
  };

  const handleFindRecipes = () => {
    // Scroll to results section
    const resultsSection = document.getElementById('recipe-results');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleIngredientsFromImage = (ingredients: string[]) => {
    setSelectedIngredients(ingredients);
    setIsImageUploaderOpen(false);
    // Scroll to results after a brief delay
    setTimeout(() => {
      const resultsSection = document.getElementById('recipe-results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Determine which recipes to show
  const displayRecipes = matchedRecipes 
    ? matchedRecipes.slice(0, 12).map((r) => {
        const { matchScore, matchPercentage, ...recipe } = r;
        return recipe;
      })
    : (filteredRecipes.length > 0 ? filteredRecipes.slice(0, 6) : todaysPicks);

  return (
    <main className="min-h-screen relative overflow-x-hidden">
      {/* Navigation */}
      <Nav />
      
      {/* Enhanced Background with animated gradients */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 15% 30%, hsl(165 63% 15% / 0.5) 0%, transparent 50%),
            radial-gradient(circle at 85% 70%, hsl(342 68% 18% / 0.4) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, hsl(215 49% 13% / 0.35) 0%, transparent 65%),
            linear-gradient(135deg, hsl(215 49% 13%) 0%, hsl(165 63% 15%) 100%)
          `
        }}
      />
      
      {/* Animated floating orbs for depth */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-dc-gold/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-dc-burgundy/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 sm:pt-24">
        {/* Enhanced Hero Search Section */}
        <section className="py-8 sm:py-12 md:py-16 lg:py-20 mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass glass-hover mb-6 sm:mb-8 animate-fade-up hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-dc-gold animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-dc-cream/90">AI-Powered Recipe Discovery</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-dc-cream mb-6 sm:mb-8 tracking-tight leading-[1.1] animate-fade-up px-4">
              Cook Smarter,<br />
              <span className="bg-gradient-to-r from-dc-gold via-dc-gold/90 to-dc-gold/70 bg-clip-text text-transparent">
                Waste Less
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-lg sm:text-xl md:text-2xl text-dc-cream/70 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-12 animate-fade-up px-4" style={{ animationDelay: '0.1s' }}>
              Transform what's in your kitchen into exceptional meals. Enter ingredients or upload a photo to discover personalized recipes instantly.
            </p>
          </div>

          {/* Ingredient Search Bar - Enhanced */}
          <div className="max-w-5xl mx-auto mb-12 sm:mb-16 animate-fade-up px-4" style={{ animationDelay: '0.2s' }}>
            <IngredientSearchBar
              selectedIngredients={selectedIngredients}
              onIngredientsChange={setSelectedIngredients}
              onFindRecipes={handleFindRecipes}
              onOpenImageUploader={() => setIsImageUploaderOpen(true)}
            />
          </div>

          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto animate-fade-up px-4" style={{ animationDelay: '0.3s' }}>
            <div className="glass glass-hover glass-reflection p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl md:rounded-2xl text-center group cursor-pointer">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg md:rounded-xl glass flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-dc-gold" />
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-dc-gold mb-1.5 sm:mb-2">{recipes.length}+</div>
              <div className="text-xs sm:text-sm md:text-base text-dc-cream/70 font-medium">Recipes</div>
            </div>
            <div className="glass glass-hover glass-reflection p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl md:rounded-2xl text-center group cursor-pointer">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg md:rounded-xl glass flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-dc-gold" />
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-dc-gold mb-1.5 sm:mb-2">{popularCuisines.length}</div>
              <div className="text-xs sm:text-sm md:text-base text-dc-cream/70 font-medium">Cuisines</div>
            </div>
            <div className="glass glass-hover glass-reflection p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl md:rounded-2xl text-center group cursor-pointer">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg md:rounded-xl glass flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-dc-gold" />
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-dc-gold mb-1.5 sm:mb-2">
                {recipes.length > 0 ? Math.round(recipes.reduce((acc, r) => acc + (r.time_min || 0), 0) / recipes.length) : 0}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-dc-cream/70 font-medium">Avg Time</div>
            </div>
            <div className="glass glass-hover glass-reflection p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl md:rounded-2xl text-center group cursor-pointer">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg md:rounded-xl glass flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-dc-gold fill-dc-gold" />
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-dc-gold mb-1.5 sm:mb-2">4.7</div>
              <div className="text-xs sm:text-sm md:text-base text-dc-cream/70 font-medium">Avg Rating</div>
            </div>
          </div>
        </section>

        {/* Image Uploader Modal */}
        <ImageUploader
          isOpen={isImageUploaderOpen}
          onClose={() => setIsImageUploaderOpen(false)}
          onIngredientsDetected={handleIngredientsFromImage}
        />

        {/* Recipe Results Section */}
        <section id="recipe-results" className="py-8 sm:py-12 md:py-16 px-4 sm:px-0">
          {selectedIngredients.length > 0 && matchedRecipes && (
            <div className="mb-8 sm:mb-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl glass flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-dc-gold" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-dc-cream tracking-tight">
                      Matched Recipes
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg text-dc-cream/70 ml-0 sm:ml-14">
                    Found <span className="font-semibold text-dc-gold">{matchedRecipes.length}</span> recipe{matchedRecipes.length !== 1 ? 's' : ''} for: <span className="font-medium">{selectedIngredients.join(', ')}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedIngredients([]);
                    setSelectedChips([]);
                  }}
                  className="btn-glass text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 flex items-center gap-2 hover:scale-105 transition-transform whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              </div>
              {matchedRecipes.length === 0 && (
                <div className="glass glass-reflection p-16 rounded-2xl text-center">
                  <div className="w-20 h-20 rounded-full glass flex items-center justify-center mx-auto mb-6">
                    <ChefHat className="w-10 h-10 text-dc-cream/30" />
                  </div>
                  <p className="text-dc-cream/70 text-xl mb-3 font-medium">
                    No recipes found matching your ingredients.
                  </p>
                  <p className="text-dc-cream/50 text-sm">
                    Try different ingredients or check spelling.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Today's Picks Section */}
          {selectedIngredients.length === 0 && (
            <TodayPicks 
              recipes={displayRecipes.map(toComponentRecipe)}
              title="Today's Picks"
              description="Handpicked recipes to inspire your next meal"
            />
          )}

          {/* Show matched recipes if search active */}
          {selectedIngredients.length > 0 && matchedRecipes && matchedRecipes.length > 0 && (
            <TodayPicks 
              recipes={displayRecipes.map(toComponentRecipe)}
              title="Matched Recipes"
              description={`Recipes matching your ingredients: ${selectedIngredients.join(', ')}`}
            />
          )}

          {/* AI Recipe Suggestions */}
          {selectedIngredients.length > 0 && (
            <div className="mt-16">
              <AIRecipeSuggestions ingredients={selectedIngredients} />
            </div>
          )}
        </section>

        {/* ChipBar - Cook With What You Have */}
        {selectedIngredients.length === 0 && (
          <section className="py-8 sm:py-12">
            <ChipBar
              availableIngredients={allIngredients}
              selectedChips={selectedChips}
              onChipToggle={handleChipToggle}
              onClear={handleClear}
            />
          </section>
        )}

        {/* Featured Categories */}
        {selectedIngredients.length === 0 && (
          <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-0">
            <div className="mb-8 sm:mb-12 text-center">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass mb-4 sm:mb-6">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-dc-gold" />
                <span className="text-xs sm:text-sm text-dc-cream/80">Explore Cuisines</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-dc-cream mb-3 sm:mb-4 tracking-tight px-4">
                Explore by Category
              </h2>
              <p className="text-base sm:text-lg text-dc-cream/60 max-w-2xl mx-auto px-4">
                Discover recipes organized by cuisine and style from around the world
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {popularCuisines.map((cuisine) => {
                const cuisineRecipes = getRecipesByCuisine(cuisine, 1);
                const recipe = cuisineRecipes[0];
                const recipeCount = getRecipesByCuisine(cuisine, 100).length;
                return (
                  <button
                    key={cuisine}
                    onClick={() => {
                      setSelectedChips([]);
                      navigate(`/home?cuisine=${cuisine}`);
                    }}
                    className="glass glass-hover glass-reflection p-6 rounded-2xl text-center group relative overflow-hidden hover:scale-105 transition-all duration-300"
                  >
                    <div className="aspect-square w-full rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-dc-gold/20 to-dc-burgundy/20 relative">
                      {recipe && (
                        <img
                          src={recipe.image_url || '/placeholder.svg'}
                          alt={cuisine}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 className="font-bold text-lg text-dc-cream group-hover:text-dc-gold transition-colors mb-1">
                      {cuisine}
                    </h3>
                    <p className="text-sm text-dc-cream/60 flex items-center justify-center gap-1">
                      <span className="font-medium">{recipeCount}</span>
                      <span>recipes</span>
                    </p>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-dc-gold" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Trending Now Section */}
        {selectedIngredients.length === 0 && (
          <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-0">
            <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl glass flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-dc-gold" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-dc-cream tracking-tight mb-1.5 sm:mb-2">
                  Trending Now
                </h2>
                <p className="text-sm sm:text-base text-dc-cream/60">Most popular recipes this week</p>
              </div>
            </div>
            <CollectionRow
              title=""
              recipes={trendingRecipes.map(toComponentRecipe)}
              variant="large"
              className="py-0"
            />
          </section>
        )}

        {/* Quick & Easy Section */}
        {selectedIngredients.length === 0 && (
          <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-0">
            <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl glass flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-dc-gold" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-dc-cream tracking-tight mb-1.5 sm:mb-2">
                  Quick & Easy
                </h2>
                <p className="text-sm sm:text-base text-dc-cream/60">Delicious meals in 30 minutes or less</p>
              </div>
            </div>
            <CollectionRow
              title=""
              recipes={quickRecipes.map(toComponentRecipe)}
              variant="large"
              className="py-0"
            />
          </section>
        )}

        {/* Featured Collections */}
        {selectedIngredients.length === 0 && (
          <div id="collections" className="py-12 sm:py-16 md:py-20 lg:py-24 space-y-12 sm:space-y-16 md:space-y-20 px-4 sm:px-0">
            {/* Indian Cuisine */}
            {getRecipesByCuisine('Indian', 6).length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-dc-gold flex-shrink-0" />
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-dc-cream">Indian Classics</h3>
                </div>
                <CollectionRow
                  title=""
                  recipes={getRecipesByCuisine('Indian', 6).map(toComponentRecipe)}
                />
              </div>
            )}

            {/* Italian Cuisine */}
            {getRecipesByCuisine('Italian', 6).length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                  <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-dc-gold flex-shrink-0" />
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-dc-cream">Italian Favorites</h3>
                </div>
                <CollectionRow
                  title=""
                  recipes={getRecipesByCuisine('Italian', 6).map(toComponentRecipe)}
                />
              </div>
            )}

            {/* Editor's Picks */}
            <div>
              <div className="flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-dc-gold fill-dc-gold flex-shrink-0" />
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-dc-cream">Editor's Picks</h3>
              </div>
              <CollectionRow
                title=""
                recipes={editorsPicks.map(toComponentRecipe)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default Home;
