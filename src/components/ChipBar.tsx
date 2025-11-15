import { useState, useEffect } from 'react';

interface ChipBarProps {
  availableIngredients: string[];
  selectedChips: string[];
  onChipToggle: (ingredient: string) => void;
  onClear: () => void;
}

export const ChipBar = ({ availableIngredients, selectedChips, onChipToggle, onClear }: ChipBarProps) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, ingredient: string, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChipToggle(ingredient);
    } else if (e.key === 'ArrowRight' && index < availableIngredients.length - 1) {
      e.preventDefault();
      setFocusedIndex(index + 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      setFocusedIndex(index - 1);
    }
  };

  useEffect(() => {
    if (focusedIndex !== null) {
      const chipElement = document.querySelector(`[data-chip-index="${focusedIndex}"]`) as HTMLElement;
      chipElement?.focus();
    }
  }, [focusedIndex]);

  if (availableIngredients.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8 px-4 sm:px-0" aria-label="Filter by ingredients">
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex-shrink-0">
          <h3 className="text-xs sm:text-sm font-semibold text-dc-cream/80 whitespace-nowrap">
            Cook with what you have:
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {availableIngredients.map((ingredient, index) => {
            const isSelected = selectedChips.includes(ingredient);
            return (
              <button
                key={ingredient}
                data-chip-index={index}
                onClick={() => onChipToggle(ingredient)}
                onKeyDown={(e) => handleKeyDown(e, ingredient, index)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass cursor-pointer focus:outline-none focus:ring-2 focus:ring-dc-gold focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 whitespace-nowrap flex-shrink-0 text-xs sm:text-sm ${
                  isSelected
                    ? 'bg-dc-gold/20 border border-dc-gold/40 text-dc-gold font-medium'
                    : 'text-dc-cream/70 hover:text-dc-cream hover:bg-dc-cream/5'
                }`}
                aria-pressed={isSelected}
                aria-label={`Filter by ${ingredient}`}
              >
                {ingredient}
              </button>
            );
          })}
        </div>
        {selectedChips.length > 0 && (
          <button
            onClick={onClear}
            className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-dc-cream/60 hover:text-dc-cream transition-colors focus:outline-none focus:ring-2 focus:ring-dc-gold rounded-lg whitespace-nowrap"
            aria-label="Clear all filters"
          >
            Clear
          </button>
        )}
      </div>
    </section>
  );
};
