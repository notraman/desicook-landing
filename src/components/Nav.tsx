import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { UserMenu } from './UserMenu';
import { useState, useEffect } from 'react';

export const Nav = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1200px] px-4 sm:px-6 transition-all duration-300 ${scrolled ? 'top-2' : 'top-4'}`}>
      <div className={`glass glass-reflection px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between backdrop-blur-xl transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 sm:gap-3"
            aria-label="Go to home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass flex items-center justify-center border border-dc-gold/20 flex-shrink-0">
              <span className="text-base sm:text-lg font-semibold text-dc-gold tracking-tight">DC</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-dc-cream tracking-tight whitespace-nowrap">DesiCook</span>
          </button>
        </div>
        
        {/* Nav Links - Desktop */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 flex-1 justify-center">
          <button 
            onClick={() => navigate('/home')}
            className="text-dc-cream/70 hover:text-dc-cream transition-all duration-300 text-sm tracking-wide relative group"
          >
            Browse Recipes
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-dc-gold transition-all duration-300 group-hover:w-full"></span>
          </button>
          {user && (
            <>
              <button 
                onClick={() => navigate('/saved')}
                className="text-dc-cream/70 hover:text-dc-cream transition-all duration-300 text-sm tracking-wide relative group"
              >
                Saved
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-dc-gold transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => navigate('/history')}
                className="text-dc-cream/70 hover:text-dc-cream transition-all duration-300 text-sm tracking-wide relative group"
              >
                History
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-dc-gold transition-all duration-300 group-hover:w-full"></span>
              </button>
            </>
          )}
          <a href="#collections" className="text-dc-cream/70 hover:text-dc-cream transition-all duration-300 text-sm tracking-wide relative group">
            Collections
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-dc-gold transition-all duration-300 group-hover:w-full"></span>
          </a>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user ? (
            <UserMenu />
          ) : (
            <>
              <button 
                onClick={() => navigate('/signin')}
                className="hidden sm:block btn-glass text-xs sm:text-sm px-4 sm:px-5 py-2"
              >
                Sign in
              </button>
              <button 
                onClick={() => navigate('/signin')}
                className="btn-gold text-xs sm:text-sm px-4 sm:px-5 py-2"
              >
                Get started
              </button>
            </>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-lg glass flex items-center justify-center text-dc-cream/70 hover:text-dc-cream transition-colors flex-shrink-0"
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
        <div className="md:hidden mt-2 glass glass-reflection p-4 space-y-2.5 sm:space-y-3 animate-fade-up">
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/home');
            }}
            className="block w-full text-left text-dc-cream/70 hover:text-dc-cream transition-colors text-sm py-2"
          >
            Browse Recipes
          </button>
          {user && (
            <>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/saved');
                }}
                className="block w-full text-left text-dc-cream/70 hover:text-dc-cream transition-colors text-sm py-2"
              >
                Saved
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/history');
                }}
                className="block w-full text-left text-dc-cream/70 hover:text-dc-cream transition-colors text-sm py-2"
              >
                History
              </button>
            </>
          )}
          <a href="#collections" className="block text-dc-cream/70 hover:text-dc-cream transition-colors text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
            Collections
          </a>
          <div className="pt-2 border-t border-dc-cream/10 space-y-2">
            {user ? (
              <div className="space-y-2">
                <div className="text-xs text-dc-cream/50 px-2 py-1 truncate">{user.email}</div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full btn-glass text-xs sm:text-sm py-2 text-left"
                >
                  Settings
                </button>
                <UserMenu />
              </div>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/signin');
                  }}
                  className="w-full btn-glass text-xs sm:text-sm py-2"
                >
                  Sign in
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/signin');
                  }}
                  className="w-full btn-gold text-xs sm:text-sm py-2"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

