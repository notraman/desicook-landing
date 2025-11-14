import Hero from '@/components/Hero';
import FeatureBoxes from '@/components/FeatureBoxes';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <FeatureBoxes />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
