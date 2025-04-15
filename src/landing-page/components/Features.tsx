import { useEffect, useRef, useState } from 'react';

interface Feature {
  name: string;
  description: string;
  icon: string;
  href: string;
};

export default function Features({ features }: { features: Feature[] }) {
  const [activeFeatures, setActiveFeatures] = useState<string[]>([]);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-feature-id');
            if (id) {
              setActiveFeatures((prev) => [...prev, id]);
            }
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );
    
    const featureElements = document.querySelectorAll('[data-feature-id]');
    featureElements.forEach((el) => {
      observer.observe(el);
    });
    
    return () => {
      featureElements.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }, []);
  
  return (
    <div ref={featuresRef} className="mx-auto mt-32 max-w-7xl px-6 lg:px-8 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-[10%] top-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-600/20 to-amber-300/5 blur-3xl opacity-30 animate-rotate-slow"></div>
        <div className="absolute -right-[5%] bottom-0 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-300/5 blur-3xl opacity-20 animate-rotate-slow animate-reverse"></div>
      </div>
      
      <div className="relative">
        <div 
          className="mx-auto max-w-2xl text-center mb-16"
          data-aos="fade-up"
        >
          <div className="inline-flex items-center justify-center px-4 py-1 mb-4 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-500 text-sm font-semibold tracking-wide">WHY CHOOSE US</span>
          </div>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            The <span className="text-amber-500 relative inline-block">
              Best
              <svg className="absolute -bottom-1 w-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" className="text-amber-500"/>
              </svg>
            </span> Features
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Don't work harder.
            <br /> Work smarter.
          </p>
        </div>
      </div>
      
      <div className="mx-auto mt-4 max-w-2xl sm:mt-20 lg:mt-12 lg:max-w-5xl relative">
        {/* Connecting line between feature cards */}
        <div className="absolute left-1/2 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-amber-500/30 to-transparent lg:block hidden"></div>
        
        <dl className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-24">
          {features.map((feature, index) => (
            <div 
              key={feature.name} 
              className={`relative pl-16 transition-all duration-700 transform ${
                activeFeatures.includes(feature.name) 
                  ? 'opacity-100 translate-y-0' 
                  : index % 2 === 0 
                    ? 'opacity-0 -translate-x-12' 
                    : 'opacity-0 translate-x-12'
              }`}
              data-feature-id={feature.name}
            >
              <dt className="text-base font-semibold leading-7 text-white group">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center border border-amber-500 bg-[#2d2d2d] rounded-lg shadow-md shadow-amber-500/10 group-hover:shadow-amber-500/30 transition-all duration-300 overflow-hidden">
                  <div className="text-2xl relative z-10 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-400 opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                {feature.name}
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-300 relative">
                <div className="absolute -left-8 top-1/2 w-4 h-[2px] bg-amber-500/30 lg:block hidden"></div>
                {feature.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      
      <div className="mt-20 flex justify-center">
        <a
          href="/menus"
          className="group relative px-6 py-3 text-sm font-medium text-white rounded-md overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-300 group-hover:opacity-90"></span>
          <span className="relative flex items-center gap-x-2">
            Create your menu now
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="transform transition-transform duration-300 group-hover:translate-x-1"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </a>
      </div>
    </div>
  )
}
