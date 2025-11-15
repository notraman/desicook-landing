import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { UserMenu } from './UserMenu';
import RightRecipeCard from './RightRecipeCard';

const Hero = () => {
  const [ingredients, setIngredients] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Placeholder for image detection handler
  const handleImageDetection = () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    console.log('Image detection would trigger here - show file picker and process image');
    // Future: Open file picker, send to API, display top-3 predictions with confidence badges
    // After detection, navigate to /home
    navigate('/home');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Multi-layered gradient background - Origin-style depth */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 15% 30%, hsl(165 63% 15% / 0.4) 0%, transparent 45%),
            radial-gradient(circle at 85% 70%, hsl(342 68% 18% / 0.35) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, hsl(215 49% 13% / 0.3) 0%, transparent 60%),
            linear-gradient(135deg, hsl(215 49% 13%) 0%, hsl(165 63% 15%) 100%)
          `
        }}
      />
      
      {/* Soft light halos behind hero text */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-dc-gold/5 to-transparent rounded-full blur-3xl opacity-40 -z-9" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-dc-burgundy/5 to-transparent rounded-full blur-3xl opacity-30 -z-9" />
      
      {/* Floating Navigation - Origin-inspired glassmorphic */}
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1200px] px-6 transition-all duration-300 ${scrolled ? 'top-2' : 'top-4'}`}>
        <div className={`glass glass-reflection px-6 py-3.5 flex items-center justify-between backdrop-blur-xl transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full glass flex items-center justify-center border border-dc-gold/20">
              <span className="text-lg font-semibold text-dc-gold tracking-tight">DC</span>
            </div>
            <span className="text-lg font-semibold text-dc-cream tracking-tight">DesiCook</span>
          </div>
          
          {/* Nav Links - Desktop with Origin-style spacing */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-dc-cream/70 hover:text-dc-cream transition-all duration-300 text-sm tracking-wide relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-dc-gold transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#how-it-works" className="text-dc-cream/70 hover:text-dc-cream transition-all duration-300 text-sm tracking-wide relative group">
              How it Works
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-dc-gold transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <button 
                  onClick={() => navigate('/signin')}
                  className="hidden sm:block btn-glass text-sm px-5 py-2"
                >
                  Sign in
                </button>
                <button 
                  onClick={() => navigate('/signin')}
                  className="btn-gold text-sm px-5 py-2"
                >
                  Get started
                </button>
              </>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-lg glass flex items-center justify-center text-dc-cream/70 hover:text-dc-cream transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 glass glass-reflection p-4 space-y-3 animate-fade-up">
            <a href="#features" className="block text-dc-cream/70 hover:text-dc-cream transition-colors text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#how-it-works" className="block text-dc-cream/70 hover:text-dc-cream transition-colors text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
              How it Works
            </a>
            <div className="pt-2 border-t border-dc-cream/10 space-y-2">
              {user ? (
                <div className="space-y-2">
                  <div className="text-xs text-dc-cream/50 px-2 py-1 truncate">{user.email}</div>
                  <UserMenu />
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signin');
                    }}
                    className="w-full btn-glass text-sm py-2"
                  >
                    Sign in
                  </button>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signin');
                    }}
                    className="w-full btn-gold text-sm py-2"
                  >
                    Get started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Content - Origin-grade spacing and rhythm */}
      <div className="container mx-auto px-6 max-w-[1200px] py-28 md:py-32 lg:py-40">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-24 items-center min-h-[600px]">
          {/* Left Column - Content with cinematic spacing */}
          <div className="space-y-10 animate-fade-up md:pr-4">
            {/* Main Heading - Origin-style large, elegant typography */}
            <div className="space-y-5">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-dc-cream leading-[1.08] tracking-[-0.02em] relative z-10">
                The refined way to turn ingredients into exceptional meals.
              </h1>
              
              {/* Bold Sub-statements with luxury spacing */}
              <div className="space-y-3 pt-1">
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-dc-gold leading-[1.25] tracking-[-0.01em]">
                  Cook smarter. Waste less. Taste more.
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-semibold text-dc-cream/85 leading-relaxed tracking-wide">
                  Fast recipe ideas from what's already in your kitchen — beautifully presented.
                </p>
              </div>
              
              {/* Supporting Text */}
              <p className="text-dc-cream/60 text-base md:text-lg leading-relaxed max-w-xl pt-1">
                Transform everyday ingredients into extraordinary dishes. Our intelligent matching system finds the perfect recipes for what you have on hand.
              </p>
            </div>
            
            {/* Ingredient Input Control - Origin-style luxurious layout */}
            <div className="space-y-3 pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Enter ingredients (e.g., chicken, tomatoes, basil)"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="input-glass w-full"
                    aria-label="Ingredient input"
                  />
                </div>
                <button 
                  onClick={handleImageDetection}
                  className="btn-glass whitespace-nowrap px-6"
                  aria-label="Detect ingredients from photo"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Detect from photo
                </button>
              </div>
              
              <button 
                onClick={() => {
                  if (!user) {
                    navigate('/signin');
                  } else {
                    navigate('/home');
                  }
                }}
                className="btn-gold w-full sm:w-auto px-10"
              >
                Get started
              </button>
            </div>
              
            {/* Trust Badges - Origin-style quiet luxury */}
            <div className="flex flex-wrap gap-6 md:gap-8 pt-6 border-t border-dc-cream/5">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-dc-gold/70" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-dc-cream/55 tracking-wide">Trusted nutrition data</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-dc-gold/70" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                <span className="text-sm text-dc-cream/55 tracking-wide">Smart substitutions</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-dc-gold/70" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-dc-cream/55 tracking-wide">Mobile ready UI</span>
              </div>
            </div>
          </div>
          
          {/* Right Column - Recipe Card Visual with Origin-style parallax */}
          <div className="flex items-center justify-center md:justify-end mt-12 md:mt-0">
            <div className="w-full max-w-sm lg:max-w-md animate-scale-in card-parallax">
              <RightRecipeCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
