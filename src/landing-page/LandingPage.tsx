import { useEffect } from 'react';
import { footerNavigation, faqs, features } from './contentSections';
import Hero from './components/Hero';
import Footer from './components/Footer';
import FAQ from './components/FAQ';
import Features from './components/Features';

export default function LandingPage() {
  // Add smooth scroll functionality for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (!anchor) return;
      
      // Check if it's an internal hash link
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      
      // Prevent default anchor behavior
      e.preventDefault();
      
      // Get the target element
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // Smooth scroll to the element
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Add offset for header
          behavior: 'smooth'
        });
        
        // Update URL without page jump
        window.history.pushState(null, '', href);
      }
    };
    
    // Add event listener to document
    document.addEventListener('click', handleAnchorClick);
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  return (
    <>
      {/* Custom animation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slide-down {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes expand {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        @keyframes pulse-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float-random {
          0% { transform: translate(0, 0); }
          25% { transform: translate(10px, -10px); }
          50% { transform: translate(-5px, -20px); }
          75% { transform: translate(-10px, -5px); }
          100% { transform: translate(0, 0); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        
        .animate-slide-down {
          animation: slide-down 0.8s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 1.2s ease-out forwards;
        }
        
        .animate-expand {
          animation: expand 0.5s ease-out forwards;
        }
        
        .animate-pulse-x {
          animation: pulse-x 1.5s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-rotate-slow {
          animation: rotate-slow 40s linear infinite;
        }
        
        .animate-reverse {
          animation-direction: reverse;
        }
        
        .animate-float-random {
          animation: float-random 20s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}} />
      
      <div className="fixed inset-0 w-screen overflow-auto bg-[#1a1a1a] text-white">
        <main className="isolate bg-[#1a1a1a] w-full">
          <Hero />
          <div id="features" className="scroll-mt-20">
            <Features features={features} />
          </div>
          <div id="faq" className="scroll-mt-20">
            <FAQ faqs={faqs} />
          </div>
        </main>
        <Footer footerNavigation={footerNavigation} />
      </div>
    </>
  );
}
