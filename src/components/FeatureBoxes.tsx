const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Image to Ingredients',
    description: 'Snap a photo of your pantry and instantly identify all available ingredients with AI-powered recognition.',
    link: '#'
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Smart Matching',
    description: 'Our intelligent algorithm finds recipes that maximize ingredient usage and minimize waste.',
    link: '#'
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: 'Substitution Intelligence',
    description: 'Missing an ingredient? Get smart substitution suggestions that maintain flavor and nutrition balance.',
    link: '#'
  }
];

const FeatureBoxes = () => {
  return (
    <section id="features" className="py-24 md:py-32 relative">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Section title - Origin-grade typography */}
        <div className="text-center mb-20 animate-fade-up">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-dc-cream mb-6 tracking-[-0.02em] leading-tight">
            Powerful features for modern cooking
          </h2>
          <p className="text-xl md:text-2xl text-dc-cream/60 max-w-3xl mx-auto leading-relaxed">
            Everything you need to transform your ingredients into culinary excellence
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-10 lg:gap-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass glass-hover glass-reflection p-12 space-y-6 group cursor-pointer ambient-glow relative"
              style={{
                animationDelay: `${index * 0.15}s`
              }}
            >
              {/* Subtle ambient glow behind each card */}
              <div className="absolute -inset-4 bg-gradient-to-br from-dc-gold/3 to-dc-burgundy/3 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              
              {/* Icon - Origin-style minimal thin-line */}
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center text-dc-gold/80 group-hover:scale-110 group-hover:text-dc-gold transition-all duration-300">
                <div className="[&>svg]:stroke-[1.5]">
                  {feature.icon}
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold text-dc-cream leading-tight tracking-[-0.01em]">
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-dc-cream/60 leading-relaxed text-lg">
                {feature.description}
              </p>
              
              {/* Learn More Link - Origin-style quiet */}
              <a 
                href={feature.link}
                className="inline-flex items-center gap-2 text-dc-gold/70 font-medium group-hover:gap-3 group-hover:text-dc-gold transition-all duration-300 text-sm tracking-wide pt-2"
              >
                Learn more
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureBoxes;
