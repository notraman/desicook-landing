import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Zap, Leaf, ChefHat } from 'lucide-react';

const CTASection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <section className="py-20 md:py-28 relative">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Spotlight effect behind CTA */}
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-[600px] h-[600px] bg-gradient-to-br from-dc-gold/8 to-dc-burgundy/8 rounded-full blur-3xl opacity-50"></div>
        </div>
        
        <div className="glass glass-reflection p-16 md:p-24 text-center space-y-12 relative spotlight animate-fade-up">
          {/* Main CTA Text - Origin-grade bold statement */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-dc-cream max-w-5xl mx-auto leading-[1.1] tracking-[-0.02em]">
            Ready to cook better with what you already have?
          </h2>
          
          {/* Supporting Text */}
          <p className="text-xl md:text-2xl text-dc-cream/60 max-w-3xl mx-auto leading-relaxed">
            Join thousands of home cooks who've discovered the joy of effortless meal planning and reduced food waste.
          </p>
          
          {/* CTA Buttons - Origin-grade spacing */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => navigate('/home')}
              className="btn-glass px-12 py-5 text-lg"
            >
              Explore demo
            </button>
            <button 
              onClick={() => {
                if (!user) {
                  navigate('/signin');
                } else {
                  navigate('/home');
                }
              }}
              className="btn-gold px-12 py-5 text-lg"
            >
              Start cooking
            </button>
          </div>
          
          {/* Feature Highlights - More engaging than numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pt-16 border-t border-dc-cream/5">
            <div className="group text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl glass glass-reflection flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-dc-gold" />
              </div>
              <h3 className="text-xl font-bold text-dc-cream">Instant Matching</h3>
              <p className="text-sm text-dc-cream/60 leading-relaxed max-w-xs mx-auto">
                Get personalized recipe suggestions in seconds based on your available ingredients
              </p>
            </div>
            
            <div className="group text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl glass glass-reflection flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Leaf className="w-8 h-8 text-dc-gold" />
              </div>
              <h3 className="text-xl font-bold text-dc-cream">Zero Waste</h3>
              <p className="text-sm text-dc-cream/60 leading-relaxed max-w-xs mx-auto">
                Transform forgotten ingredients into delicious meals and reduce food waste effortlessly
              </p>
            </div>
            
            <div className="group text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl glass glass-reflection flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <ChefHat className="w-8 h-8 text-dc-gold" />
              </div>
              <h3 className="text-xl font-bold text-dc-cream">Expert Recipes</h3>
              <p className="text-sm text-dc-cream/60 leading-relaxed max-w-xs mx-auto">
                Access curated recipes from diverse cuisines with step-by-step instructions and nutrition info
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
