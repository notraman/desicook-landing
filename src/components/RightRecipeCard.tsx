const RightRecipeCard = () => {
  return (
    <div className="relative">
      {/* Faint reflection below */}
      <div 
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-4/5 h-4 rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--dc-gold) / 0.15) 0%, transparent 70%)',
          filter: 'blur(10px)'
        }}
      />
      
      {/* Main Recipe Card */}
      <div className="glass glass-reflection p-8 space-y-6 transform hover:scale-105 transition-transform duration-500">
        {/* Recipe Header */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-dc-cream">Spiced Chickpea Curry</h3>
          
          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-dc-cream/70">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>25 min</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1 text-dc-gold font-semibold">
              <svg className="w-4 h-4 fill-dc-gold" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>4.8</span>
            </div>
          </div>
        </div>
        
        {/* Calories Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
          <svg className="w-4 h-4 text-dc-gold" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-dc-cream">342 cal</span>
        </div>
        
        {/* Ingredients Snippet */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-dc-cream/70 uppercase tracking-wide">Key Ingredients</h4>
          <div className="flex flex-wrap gap-2">
            {['Chickpeas', 'Tomatoes', 'Coconut milk', 'Garam masala', 'Ginger'].map((ingredient) => (
              <span 
                key={ingredient}
                className="px-3 py-1 text-sm rounded-full glass text-dc-cream/80"
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>
        
        {/* Match Percentage */}
        <div className="pt-4 border-t border-dc-cream/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dc-cream/70">Ingredient match</span>
            <span className="text-sm font-semibold text-dc-gold">92%</span>
          </div>
          <div className="w-full h-2 rounded-full glass overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-dc-gold to-dc-gold/80 rounded-full transition-all duration-1000"
              style={{ width: '92%' }}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button className="flex-1 btn-gold text-sm py-3">
            <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Cook
          </button>
          <button className="btn-glass px-6 py-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightRecipeCard;
