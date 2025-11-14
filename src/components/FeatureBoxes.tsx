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
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass glass-hover glass-reflection p-8 space-y-4 group cursor-pointer"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl glass flex items-center justify-center text-dc-gold group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-dc-cream">
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-dc-cream/70 leading-relaxed">
                {feature.description}
              </p>
              
              {/* Learn More Link */}
              <a 
                href={feature.link}
                className="inline-flex items-center gap-2 text-dc-gold font-medium group-hover:gap-3 transition-all"
              >
                Learn more
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
