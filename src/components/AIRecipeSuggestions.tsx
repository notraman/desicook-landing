import { useState } from 'react';
import { getRecipeSuggestions, type RecipeSuggestion } from '@/lib/recipeSuggestions';
import { useToast } from '@/hooks/use-toast';

interface AIRecipeSuggestionsProps {
  ingredients: string[];
  onClose?: () => void;
}

export const AIRecipeSuggestions = ({ ingredients, onClose }: AIRecipeSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    if (ingredients.length === 0) {
      toast({
        title: "No ingredients",
        description: "Please select ingredients first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const results = await getRecipeSuggestions(ingredients, 3);
      setSuggestions(results);
      if (results.length === 0) {
        toast({
          title: "No suggestions",
          description: "Could not generate recipe suggestions. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error getting recipe suggestions:", error);
      toast({
        title: "Failed to get suggestions",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (suggestions.length === 0 && !loading) {
    return (
      <section className="py-8">
        <div className="glass glass-reflection p-6 rounded-xl text-center">
          <h3 className="text-2xl font-bold text-dc-cream mb-3">
            Get AI-Powered Recipe Suggestions
          </h3>
          <p className="text-dc-cream/70 mb-6">
            Let our AI chef create personalized recipes based on your ingredients
          </p>
          <button
            onClick={handleGetSuggestions}
            disabled={loading || ingredients.length === 0}
            className="btn-gold px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Get AI Suggestions"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-dc-cream">
          AI Recipe Suggestions
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-dc-cream/60 hover:text-dc-cream transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {loading && (
        <div className="glass glass-reflection p-12 rounded-xl text-center">
          <div className="w-12 h-12 border-4 border-dc-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dc-cream/70">Generating personalized recipes...</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((recipe, index) => (
            <div
              key={index}
              className="glass glass-reflection rounded-xl overflow-hidden hover-lift"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-dc-cream flex-1">
                    {recipe.title}
                  </h3>
                  {recipe.cuisine && (
                    <span className="ml-2 px-2 py-1 text-xs rounded-full glass bg-dc-gold/10 text-dc-gold">
                      {recipe.cuisine}
                    </span>
                  )}
                </div>

                <p className="text-sm text-dc-cream/70 mb-4 line-clamp-2">
                  {recipe.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-dc-cream/60 mb-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{recipe.cookingTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{recipe.difficulty}</span>
                  </div>
                </div>

                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 text-xs rounded-full glass bg-dc-cream/5 text-dc-cream/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="w-full btn-glass text-sm py-2 mb-3"
                >
                  {expandedIndex === index ? "Hide Details" : "Show Recipe"}
                </button>

                {expandedIndex === index && (
                  <div className="space-y-4 animate-fade-up">
                    <div>
                      <h4 className="text-sm font-semibold text-dc-cream mb-2">Ingredients:</h4>
                      <ul className="text-sm text-dc-cream/70 space-y-1">
                        {recipe.ingredients.map((ing, ingIndex) => (
                          <li key={ingIndex} className="flex items-start gap-2">
                            <span className="text-dc-gold mt-1">•</span>
                            <span>{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-dc-cream mb-2">Instructions:</h4>
                      <ol className="text-sm text-dc-cream/70 space-y-2">
                        {recipe.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start gap-2">
                            <span className="text-dc-gold font-semibold min-w-[20px]">
                              {stepIndex + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

