import { useState } from 'react';
import RightRecipeCard from './RightRecipeCard';

const Hero = () => {
  const [ingredients, setIngredients] = useState('');

  // Placeholder for image detection handler
  const handleImageDetection = () => {
    console.log('Image detection would trigger here - show file picker and process image');
    // Future: Open file picker, send to API, display top-3 predictions with confidence badges
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Multi-layered gradient background */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(circle at 20% 50%, hsl(165 63% 15% / 0.95) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(342 68% 18% / 0.85) 0%, transparent 50%), linear-gradient(135deg, hsl(215 49% 13%) 0%, hsl(165 63% 15%) 100%)'
        }}
      />
      
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full glass glass-reflection flex items-center justify-center border-2 border-dc-gold/30">
              <svg className="w-6 h-6 text-dc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-dc-cream">DesiCook</span>
          </div>
          
          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-dc-cream/80 hover:text-dc-cream transition-colors">Features</a>
            <a href="#how-it-works" className="text-dc-cream/80 hover:text-dc-cream transition-colors">How it Works</a>
            <a href="#pricing" className="text-dc-cream/80 hover:text-dc-cream transition-colors">Pricing</a>
            <a href="#docs" className="text-dc-cream/80 hover:text-dc-cream transition-colors">Docs</a>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:block btn-glass text-sm">Sign in</button>
            <button className="btn-gold text-sm">Get started</button>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="glass glass-reflection p-8 md:p-12 space-y-6">
              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dc-cream leading-tight">
                The refined way to turn ingredients into exceptional meals.
              </h1>
              
              {/* Bold Sub-statements */}
              <div className="space-y-2">
                <p className="text-xl md:text-2xl font-bold text-dc-gold">
                  Cook smarter. Waste less. Taste more.
                </p>
                <p className="text-lg md:text-xl font-semibold text-dc-cream/90">
                  Fast recipe ideas from what's already in your kitchen — beautifully presented.
                </p>
              </div>
              
              {/* Supporting Text */}
              <p className="text-dc-cream/70 text-lg leading-relaxed">
                Transform everyday ingredients into extraordinary dishes. Our intelligent matching system finds the perfect recipes for what you have on hand.
              </p>
              
              {/* Ingredient Input Control */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter ingredients (e.g., chicken, tomatoes, basil)"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="input-glass flex-1"
                    aria-label="Ingredient input"
                  />
                  <button 
                    onClick={handleImageDetection}
                    className="btn-glass whitespace-nowrap"
                    aria-label="Detect ingredients from photo"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Detect from photo
                  </button>
                </div>
                
                <button className="btn-gold w-full md:w-auto">
                  Get started
                </button>
              </div>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6 pt-4 border-t border-dc-cream/10">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-dc-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-dc-cream/70">Trusted nutrition data</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-dc-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  <span className="text-sm text-dc-cream/70">Smart substitutions</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-dc-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-dc-cream/70">Mobile ready UI</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Recipe Card Visual */}
          <div className="hidden md:block">
            <RightRecipeCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
