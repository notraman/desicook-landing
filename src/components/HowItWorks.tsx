const steps = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Snap or type ingredients',
    description: 'Upload a photo or enter what you have in your kitchen',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Get matched recipes',
    description: 'Our algorithm finds perfect recipes for your ingredients',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'Save & cook',
    description: 'Save favorites and start cooking with step-by-step guidance',
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 md:py-28" aria-label="How it works">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-dc-cream mb-4 tracking-tight">
          How it Works
        </h2>
        <p className="text-lg text-dc-cream/60 max-w-2xl mx-auto">
          Three simple steps to transform your ingredients into exceptional meals
        </p>
      </div>

      <div className="glass glass-reflection p-8 md:p-12 rounded-2xl">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="text-center space-y-4"
              role="article"
              aria-label={`Step ${index + 1}: ${step.title}`}
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center text-dc-gold">
                  {step.icon}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-semibold text-dc-gold/70">Step {index + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-dc-cream">{step.title}</h3>
                <p className="text-dc-cream/60 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
