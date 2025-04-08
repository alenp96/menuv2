import { footerNavigation, faqs, features } from './contentSections';
import Hero from './components/Hero';
import Footer from './components/Footer';
import FAQ from './components/FAQ';
import Features from './components/Features';

export default function LandingPage() {
  return (
    <div className='fixed inset-0 w-screen overflow-auto bg-[#1a1a1a] text-white'>
      <main className='isolate bg-[#1a1a1a] w-full'>
        <Hero />
        <div id="features">
          <Features features={features} />
        </div>
        <div id="faq">
          <FAQ faqs={faqs} />
        </div>
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}
