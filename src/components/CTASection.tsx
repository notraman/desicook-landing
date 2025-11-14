const CTASection = () => {
  return (
    <section className="py-32 md:py-40 relative">
      <div className="container mx-auto px-6">
        {/* Ambient glow background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 bg-gradient-to-br from-dc-gold/10 to-dc-burgundy/10 rounded-full blur-3xl opacity-40"></div>
        </div>
        
        <div className="glass glass-reflection p-16 md:p-20 text-center space-y-10 relative animate-fade-in-up">
          {/* Main CTA Text - Origin-inspired bold statement */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dc-cream max-w-4xl mx-auto leading-[1.15] tracking-tight">
            Ready to cook better with what you already have?
          </h2>
          
          {/* Supporting Text */}
          <p className="text-xl md:text-2xl text-dc-cream/60 max-w-3xl mx-auto leading-relaxed">
            Join thousands of home cooks who've discovered the joy of effortless meal planning and reduced food waste.
          </p>
          
          {/* CTA Buttons - Origin-inspired spacing */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
            <button className="btn-glass px-10 py-4 text-lg">
              Explore demo
            </button>
            <button className="btn-gold px-10 py-4 text-lg">
              Start cooking
            </button>
          </div>
          
          {/* Trust Indicators - Origin-inspired refined */}
          <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-16 pt-12 border-t border-dc-cream/5">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-dc-gold mb-2">10,000+</div>
              <div className="text-sm text-dc-cream/50 tracking-wide">Active cooks</div>
            </div>
            <div className="w-px h-16 bg-dc-cream/10 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-dc-gold mb-2">50,000+</div>
              <div className="text-sm text-dc-cream/50 tracking-wide">Recipes matched</div>
            </div>
            <div className="w-px h-16 bg-dc-cream/10 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-dc-gold mb-2">4.9★</div>
              <div className="text-sm text-dc-cream/50 tracking-wide">Average rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
