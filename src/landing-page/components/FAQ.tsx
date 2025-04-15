import { useState } from 'react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  href?: string;
};

export default function FAQ({ faqs }: { faqs: FAQ[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  
  const toggleFaq = (id: number) => {
    setActiveId(activeId === id ? null : id);
  };
  
  return (
    <div className="relative mt-32 mx-auto max-w-2xl px-6 pb-24 lg:max-w-5xl lg:px-8 lg:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute right-[15%] top-0 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-amber-600/10 to-transparent blur-3xl opacity-30"></div>
        <div className="absolute left-[10%] bottom-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-amber-500/10 to-transparent blur-3xl opacity-20"></div>
      </div>
      
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center px-4 py-1 mb-4 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="text-amber-500 text-sm font-semibold tracking-wide">HAVE QUESTIONS?</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
          Everything you need to know about our digital menu platform
        </p>
      </div>
      
      <div className="mt-10 max-w-3xl mx-auto">
        <ul className="space-y-4">
          {faqs.map((faq) => (
            <li 
              key={faq.id}
              className={`overflow-hidden bg-[#2a2a2a] rounded-xl border border-gray-800 transition-all duration-300 ${
                activeId === faq.id ? 'shadow-lg shadow-amber-500/5' : ''
              }`}
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-lg font-medium text-white">{faq.question}</span>
                <span className={`ml-6 flex-shrink-0 transition-transform duration-300 ${
                  activeId === faq.id ? 'rotate-180' : ''
                }`}>
                  <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  activeId === faq.id 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5">
                  <p className="text-base text-gray-300">{faq.answer}</p>
                  {faq.href && (
                    <a 
                      href={faq.href} 
                      className="mt-4 inline-flex items-center text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      Learn more
                      <svg 
                        className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-16 text-center">
        <p className="text-gray-400">Still have questions?</p>
        <a 
          href="/contact" 
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition-colors"
        >
          Contact our support team
        </a>
      </div>
    </div>
  )
}
