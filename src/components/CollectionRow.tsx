import { useRef, useState, useEffect } from 'react';
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

interface CollectionRowProps {
  title: string;
  recipes: Recipe[];
  variant?: 'default' | 'large';
  className?: string;
}

export const CollectionRow = ({ title, recipes, variant = 'default', className = '' }: CollectionRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [recipes]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (recipes.length === 0) {
    return null;
  }

  const cardWidth = variant === 'large' ? 'w-80 md:w-96' : 'w-64 md:w-72';

  return (
    <section className={`py-8 ${className}`} aria-label={title}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-dc-cream tracking-tight">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            onKeyDown={(e) => e.key === 'Enter' && scroll('left')}
            disabled={!showLeftArrow}
            className={`w-10 h-10 rounded-lg glass flex items-center justify-center transition-all ${
              showLeftArrow
                ? 'text-dc-cream/70 hover:text-dc-cream hover:bg-dc-cream/5 cursor-pointer'
                : 'text-dc-cream/20 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-dc-gold`}
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            onKeyDown={(e) => e.key === 'Enter' && scroll('right')}
            disabled={!showRightArrow}
            className={`w-10 h-10 rounded-lg glass flex items-center justify-center transition-all ${
              showRightArrow
                ? 'text-dc-cream/70 hover:text-dc-cream hover:bg-dc-cream/5 cursor-pointer'
                : 'text-dc-cream/20 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-dc-gold`}
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        role="list"
        aria-label={`${title} recipes`}
      >
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className={`${cardWidth} flex-shrink-0 snap-start`}
            role="listitem"
          >
            <RecipeCard recipe={recipe} variant={variant} />
          </div>
        ))}
      </div>
    </section>
  );
};
