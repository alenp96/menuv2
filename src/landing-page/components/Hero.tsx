import menuBannerWebp from '../../client/static/open-saas-banner.webp';

export default function Hero() {
  return (
    <div className='relative pt-14 w-full'>
      <TopGradient />
      <BottomGradient />
      <div className='py-24 sm:py-32'>
        <div className='w-full max-w-full px-6 lg:px-8'>
          <div className='lg:mb-18 mx-auto max-w-3xl text-center'>
            <h1 className='text-4xl font-bold text-white sm:text-6xl'>
              Digital <span className='text-amber-500'>Menu</span> Made Simple
            </h1>
            <p className='mt-6 mx-auto max-w-2xl text-lg leading-8 text-gray-300'>
              Create beautiful digital menus that delight your customers and showcase your culinary creations
            </p>
            <div className='mt-10 flex items-center justify-center gap-x-6'>
              <a
                href="/menus"
                className='rounded-md px-3.5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-amber-500 hover:ring-2 hover:ring-amber-400 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600'
              >
                Get Started <span aria-hidden='true'>→</span>
              </a>
            </div>
          </div>
          <div className='mt-14 flow-root sm:mt-14'>
            <div className='-m-2 flex justify-center rounded-xl lg:-m-4 lg:rounded-2xl lg:p-4'>
              <img
                src={menuBannerWebp}
                alt='Digital menu preview'
                width={1000}
                height={530}
                loading='lazy'
                className='rounded-md shadow-2xl ring-1 ring-gray-900/10'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopGradient() {
  return (
    <div
      className='absolute top-0 right-0 -z-10 transform-gpu overflow-hidden w-full blur-3xl sm:top-0'
      aria-hidden='true'
    >
      <div
        className='aspect-[1020/880] w-[55rem] flex-none sm:right-1/4 sm:translate-x-1/2 bg-gradient-to-tr from-amber-600 to-amber-300 opacity-30'
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
      className='absolute inset-x-0 top-[calc(100%-40rem)] sm:top-[calc(100%-65rem)] -z-10 transform-gpu overflow-hidden blur-3xl'
      aria-hidden='true'
    >
      <div
        className='relative aspect-[1020/880] sm:-left-3/4 sm:translate-x-1/4 bg-gradient-to-br from-amber-600 to-amber-300 opacity-30 w-[72.1875rem]'
        style={{
          clipPath: 'ellipse(80% 30% at 80% 50%)',
        }}
      />
    </div>
  );
}