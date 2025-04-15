import { useEffect, useState, useRef } from 'react';
import menuBannerWebp from '../../client/static/open-saas-banner.webp';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Calculate parallax and opacity effects based on scroll
  const parallaxOffset = scrollY * 0.4;
  const titleOpacity = Math.max(1 - scrollY / 700, 0.2);
  const imageScale = Math.max(1 - scrollY / 2000, 0.95);
  
  return (
    <div ref={heroRef} className="relative pt-14 w-full overflow-hidden">
      <AnimatedGradient />
      <FloatingParticles />
      
      <div className="py-24 sm:py-32">
        <div className="w-full max-w-full px-6 lg:px-8">
          <div 
            className="lg:mb-18 mx-auto max-w-3xl text-center"
            style={{ 
              transform: `translateY(${-parallaxOffset * 0.2}px)`,
              opacity: titleOpacity
            }}
          >
            <div className="animate-slide-down opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <h1 className="text-4xl font-bold text-white sm:text-6xl">
                Digital <span className="relative text-amber-500 inline-block">
                  Menu
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-amber-500 transform scale-x-0 animate-expand origin-left" style={{ animationDelay: '1s' }}></span>
                </span> Made Simple
              </h1>
            </div>
            
            <div className="animate-slide-down opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              <p className="mt-6 mx-auto max-w-2xl text-lg leading-8 text-gray-300">
                Create beautiful digital menus that delight your customers and showcase your culinary creations
              </p>
            </div>
            
            <div className="mt-10 flex items-center justify-center gap-x-6 animate-slide-up opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              <a
                href="/menus"
                className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 transition-all duration-300 shadow-lg hover:shadow-amber-500/40"
              >
                Get Started <span aria-hidden="true" className="animate-pulse-x inline-block ml-1">→</span>
              </a>
              
              <a
                href="#features"
                className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-amber-500 hover:ring-2 hover:ring-amber-400 hover:bg-amber-500/10 transition-all duration-300 shadow-sm"
              >
                Learn More
              </a>
            </div>
          </div>
          
          <div className="mt-14 flow-root sm:mt-14 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1a1a] z-10 pointer-events-none h-full"></div>
            <div 
              className="-m-2 flex justify-center rounded-xl lg:-m-4 lg:rounded-2xl lg:p-4 transition-all"
              style={{ 
                transform: `translateY(${parallaxOffset * 0.3}px) scale(${imageScale})`,
              }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-amber-300 rounded-xl opacity-30 blur-lg animate-pulse-slow"></div>
                <img
                  ref={imageRef}
                  src={menuBannerWebp}
                  alt="Digital menu preview"
                  width={1000}
                  height={530}
                  loading="lazy"
                  className="relative rounded-md shadow-2xl ring-1 ring-gray-900/10 z-10 animate-fade-in opacity-0"
                  style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ScrollIndicator />
    </div>
  );
}

function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce-slow">
      <span className="text-amber-500 text-sm font-medium mb-2">Scroll Down</span>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-amber-500"
      >
        <path d="M12 5v14"></path>
        <path d="m19 12-7 7-7-7"></path>
      </svg>
    </div>
  );
}

function AnimatedGradient() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Top left gradient */}
      <div
        className="absolute top-0 left-0 -z-10 transform-gpu overflow-hidden w-1/2 animate-pulse-slow"
        aria-hidden="true"
      >
        <div
          className="aspect-[1020/880] w-[35rem] bg-gradient-to-tr from-amber-600 to-amber-300 opacity-30"
          style={{
            clipPath: 'polygon(80% 20%, 90% 55%, 50% 100%, 70% 30%, 20% 50%, 50% 0)',
            animationDelay: '0.2s'
          }}
        />
      </div>
      
      {/* Bottom right gradient */}
      <div
        className="absolute bottom-0 right-0 -z-10 transform-gpu overflow-hidden w-1/2 animate-float"
        aria-hidden="true"
      >
        <div
          className="aspect-[1020/880] w-[45rem] bg-gradient-to-bl from-amber-600 to-amber-300 opacity-20"
          style={{
            clipPath: 'ellipse(50% 50% at 70% 50%)',
          }}
        />
      </div>
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 -z-5 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => {
        const size = Math.random() * 6 + 2;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const animDuration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        
        return (
          <div 
            key={i}
            className="absolute rounded-full bg-amber-500 opacity-30 animate-float-random"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              top: `${top}%`,
              animationDuration: `${animDuration}s`,
              animationDelay: `${delay}s`
            }}
          />
        );
      })}
    </div>
  );
}

function TopGradient() {
  return (
    <div
      className="absolute top-0 right-0 -z-10 transform-gpu overflow-hidden w-full blur-3xl sm:top-0"
      aria-hidden="true"
    >
      <div
        className="aspect-[1020/880] w-[55rem] flex-none sm:right-1/4 sm:translate-x-1/2 bg-gradient-to-tr from-amber-600 to-amber-300 opacity-30"
        style={{
          clipPath: 'polygon(80% 20%, 90% 55%, 50% 100%, 70% 30%, 20% 50%, 50% 0)',
        }}
      />
    </div>
  );
}

function BottomGradient() {
  return (
    <div
      className="absolute inset-x-0 top-[calc(100%-40rem)] sm:top-[calc(100%-65rem)] -z-10 transform-gpu overflow-hidden blur-3xl"
      aria-hidden="true"
    >
      <div
        className="relative aspect-[1020/880] sm:-left-3/4 sm:translate-x-1/4 bg-gradient-to-br from-amber-600 to-amber-300 opacity-30 w-[72.1875rem]"
        style={{
          clipPath: 'ellipse(80% 30% at 80% 50%)',
        }}
      />
    </div>
  );
}