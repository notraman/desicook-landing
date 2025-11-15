import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Nav } from '@/components/Nav';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { getRecipeById } from '@/lib/recipes';
import { FavoriteButton } from '@/components/FavoriteButton';
import { getRecipeImageUrlEnhanced } from '@/lib/recipeImages';
import { Clock, ChefHat, Star, Flame, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Recipe } from '@/lib/recipes';

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(4);

  useEffect(() => {
    if (id) {
      loadRecipe();
    }
  }, [id]);

  const loadRecipe = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const recipeData = await getRecipeById(id);
      if (recipeData) {
        setRecipe(recipeData);
        setServings(recipeData.servings || 4);
      } else {
        navigate('/home');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = () => {
    if (!recipe) return '/placeholder.svg';
    if (recipe.image_url && recipe.image_url !== '/placeholder.svg') {
      return recipe.image_url;
    }
    return getRecipeImageUrlEnhanced(recipe.title, recipe.ingredients || [], 1200, 800);
  };

  const adjustIngredientQuantity = (ingredient: string, baseServings: number) => {
    if (!recipe) return ingredient;
    
    // Try to extract quantity and unit
    const match = ingredient.match(/^(\d+(?:\.\d+)?)\s*(\w+)?\s*(.+)$/);
    if (match) {
      const quantity = parseFloat(match[1]);
      const unit = match[2] || '';
      const item = match[3];
      const adjustedQuantity = (quantity / baseServings) * servings;
      return `${adjustedQuantity.toFixed(1)} ${unit} ${item}`.trim();
    }
    return ingredient;
  };

  if (loading) {
    return (
      <main className="min-h-screen relative">
        <Nav />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-20">
          <div className="glass glass-reflection p-16 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto mb-4 animate-pulse">
              <ChefHat className="w-8 h-8 text-dc-gold" />
            </div>
            <p className="text-dc-cream/70 text-lg">Loading recipe...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen relative">
        <Nav />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-20">
          <div className="glass glass-reflection p-16 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-dc-cream mb-4">Recipe not found</h2>
            <button
              onClick={() => navigate('/home')}
              className="btn-gold inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

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
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 btn-glass inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <div className="space-y-6">
            <div className="glass glass-reflection rounded-2xl overflow-hidden">
              <img
                src={getImageUrl()}
                alt={recipe.title}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getRecipeImageUrlEnhanced(recipe.title, recipe.ingredients || [], 1200, 800);
                }}
              />
            </div>

            {/* Favorite Button */}
            <div className="flex justify-center">
              <FavoriteButton 
                recipeId={recipe.id} 
                recipeData={recipe}
                className="w-full max-w-xs"
              />
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title and Meta */}
            <div className="glass glass-reflection p-6 rounded-2xl">
              <h1 className="text-4xl md:text-5xl font-bold text-dc-cream mb-4">
                {recipe.title}
              </h1>
              
              {recipe.description && (
                <p className="text-lg text-dc-cream/80 mb-6">
                  {recipe.description}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 mb-6">
                {recipe.time_min && (
                  <div className="flex items-center gap-2 text-dc-cream/80">
                    <Clock className="w-5 h-5 text-dc-gold" />
                    <span>{recipe.time_min} min</span>
                  </div>
                )}
                {recipe.difficulty && (
                  <div className="flex items-center gap-2 text-dc-cream/80">
                    <ChefHat className="w-5 h-5 text-dc-gold" />
                    <span>{recipe.difficulty}</span>
                  </div>
                )}
                {recipe.rating && (
                  <div className="flex items-center gap-2 text-dc-cream/80">
                    <Star className="w-5 h-5 text-dc-gold fill-dc-gold" />
                    <span>{recipe.rating.toFixed(1)}</span>
                  </div>
                )}
                {recipe.nutrition?.calories && (
                  <div className="flex items-center gap-2 text-dc-cream/80">
                    <Flame className="w-5 h-5 text-dc-gold" />
                    <span>{recipe.nutrition.calories} cal</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-2 text-dc-cream/80">
                    <Users className="w-5 h-5 text-dc-gold" />
                    <span>{servings} servings</span>
                  </div>
                )}
              </div>

              {/* Servings Adjuster */}
              {recipe.servings && (
                <div className="flex items-center gap-4 pt-4 border-t border-dc-cream/10">
                  <label className="text-dc-cream/80">Servings:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={servings}
                    onChange={(e) => setServings(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    className="input-glass w-20 text-center"
                  />
                </div>
              )}

              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-dc-cream/10">
                  {recipe.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm rounded-full glass bg-dc-cream/5 text-dc-cream/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div className="glass glass-reflection p-6 rounded-2xl">
                <h2 className="text-2xl font-bold text-dc-cream mb-4">Ingredients</h2>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-dc-gold mt-0.5 flex-shrink-0" />
                      <span className="text-dc-cream/80">
                        {adjustIngredientQuantity(ingredient, recipe.servings || 4)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {recipe.steps && recipe.steps.length > 0 && (
              <div className="glass glass-reflection p-6 rounded-2xl">
                <h2 className="text-2xl font-bold text-dc-cream mb-4">Instructions</h2>
                <ol className="space-y-4">
                  {recipe.steps.map((step, index) => (
                    <li key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full glass flex items-center justify-center text-dc-gold font-bold">
                        {index + 1}
                      </div>
                      <p className="text-dc-cream/80 flex-1 pt-1">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Nutrition Info */}
            {recipe.nutrition && (
              <div className="glass glass-reflection p-6 rounded-2xl">
                <h2 className="text-2xl font-bold text-dc-cream mb-4">Nutrition</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recipe.nutrition.calories && (
                    <div>
                      <div className="text-sm text-dc-cream/60">Calories</div>
                      <div className="text-xl font-bold text-dc-gold">{recipe.nutrition.calories}</div>
                    </div>
                  )}
                  {recipe.nutrition.protein && (
                    <div>
                      <div className="text-sm text-dc-cream/60">Protein</div>
                      <div className="text-xl font-bold text-dc-gold">{recipe.nutrition.protein}g</div>
                    </div>
                  )}
                  {recipe.nutrition.carbs && (
                    <div>
                      <div className="text-sm text-dc-cream/60">Carbs</div>
                      <div className="text-xl font-bold text-dc-gold">{recipe.nutrition.carbs}g</div>
                    </div>
                  )}
                  {recipe.nutrition.fat && (
                    <div>
                      <div className="text-sm text-dc-cream/60">Fat</div>
                      <div className="text-xl font-bold text-dc-gold">{recipe.nutrition.fat}g</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default RecipeDetail;



