const CTASection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="glass glass-reflection p-12 md:p-16 text-center space-y-8">
          {/* Main CTA Text */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-dc-cream max-w-3xl mx-auto leading-tight">
            Ready to cook better with what you already have?
          </h2>
          
          {/* Supporting Text */}
          <p className="text-lg text-dc-cream/70 max-w-2xl mx-auto">
            Join thousands of home cooks who've discovered the joy of effortless meal planning and reduced food waste.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button className="btn-glass px-8 py-4 text-lg">
              Explore demo
            </button>
            <button className="btn-gold px-8 py-4 text-lg">
              Start cooking
            </button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-dc-cream/10">
            <div className="text-center">
              <div className="text-2xl font-bold text-dc-gold">10,000+</div>
              <div className="text-sm text-dc-cream/60">Active cooks</div>
            </div>
            <div className="w-px h-12 bg-dc-cream/10 hidden sm:block" />
            <div className="text-center">
              <div className="text-2xl font-bold text-dc-gold">50,000+</div>
              <div className="text-sm text-dc-cream/60">Recipes matched</div>
            </div>
            <div className="w-px h-12 bg-dc-cream/10 hidden sm:block" />
            <div className="text-center">
              <div className="text-2xl font-bold text-dc-gold">4.9★</div>
              <div className="text-sm text-dc-cream/60">Average rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
