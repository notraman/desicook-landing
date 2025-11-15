import { RecipeCard } from './RecipeCard';

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

interface RecipeGridProps {
  recipes: Recipe[];
  variant?: 'default' | 'large';
  className?: string;
}

export const RecipeGrid = ({ recipes, variant = 'default', className = '' }: RecipeGridProps) => {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-dc-cream/60 text-lg">No recipes found. Try adjusting your filters.</p>
      </div>
    );
  }

  const gridCols = variant === 'large' 
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div 
      className={`grid ${gridCols} gap-6 ${className}`}
      role="list"
      aria-label="Recipe grid"
    >
      {recipes.map((recipe) => (
        <div key={recipe.id} role="listitem">
          <RecipeCard recipe={recipe} variant={variant} />
        </div>
      ))}
    </div>
  );
};
