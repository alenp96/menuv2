interface NavigationItem {
  name: string;
  href: string;
};

export default function Footer({ footerNavigation }: {
  footerNavigation: {
    app: NavigationItem[]
    company: NavigationItem[]
  }
}) {
  return (
    <div className='w-full max-w-full px-6 lg:px-8 bg-[#1a1a1a]'>
      <footer
        aria-labelledby='footer-heading'
        className='relative border-t border-gray-700 py-16'
      >
        <h2 id='footer-heading' className='sr-only'>
          Footer
        </h2>
        <div className='flex flex-col md:flex-row items-center md:items-start justify-between mt-6 gap-10 max-w-7xl mx-auto'>
          <div className="text-center md:text-left">
            <p className="text-amber-500 font-semibold">Digital Menu Solution</p>
            <p className="text-gray-400 text-sm mt-2">© {new Date().getFullYear()} All rights reserved</p>
          </div>
          <div className="flex flex-col md:flex-row gap-10">
            <div>
              <h3 className='text-sm font-semibold leading-6 text-white'>App</h3>
              <ul role='list' className='mt-4 space-y-3'>
                {footerNavigation.app.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className='text-sm leading-6 text-gray-400 hover:text-amber-400 transition-colors'>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className='text-sm font-semibold leading-6 text-white'>Company</h3>
              <ul role='list' className='mt-4 space-y-3'>
                {footerNavigation.company.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className='text-sm leading-6 text-gray-400 hover:text-amber-400 transition-colors'>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
