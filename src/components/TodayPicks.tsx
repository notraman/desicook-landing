import { RecipeGrid } from './RecipeGrid';

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

interface TodayPicksProps {
  recipes: Recipe[];
  className?: string;
  title?: string;
  description?: string;
}

export const TodayPicks = ({ 
  recipes, 
  className = '',
  title = "Today's Picks",
  description = "Handpicked recipes to inspire your next meal"
}: TodayPicksProps) => {
  return (
    <section className={`py-16 md:py-20 ${className}`} aria-label={title}>
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-dc-cream mb-4 tracking-tight">
          {title}
        </h2>
        <p className="text-lg text-dc-cream/60 max-w-2xl">
          {description}
        </p>
      </div>
      <RecipeGrid recipes={recipes} />
    </section>
  );
};
