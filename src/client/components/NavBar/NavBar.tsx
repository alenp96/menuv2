import { Link as ReactRouterLink } from 'react-router-dom';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { useAuth } from 'wasp/client/auth';
import { useState, Dispatch, SetStateAction } from 'react';
import { Dialog } from '@headlessui/react';
import { BiLogIn } from 'react-icons/bi';
import { AiFillCloseCircle } from 'react-icons/ai';
import { HiBars3 } from 'react-icons/hi2';
import logo from '../../static/logo.webp';
import DropdownUser from '../../../user/DropdownUser';
import { UserMenuItems } from '../../../user/UserMenuItems';
import { useIsLandingPage } from '../../hooks/useIsLandingPage';
import { cn } from '../../cn';

export interface NavigationItem {
  name: string;
  to: string;
}

const NavLogo = () => <img className='h-8 w-8' src={logo} alt='Your SaaS App' />;

export default function AppNavBar({ navigationItems }: { navigationItems: NavigationItem[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLandingPage = useIsLandingPage();

  const { data: user, isLoading: isUserLoading } = useAuth();
  return (
    <header
      className={cn('absolute inset-x-0 top-0 z-50 w-full', {
        'bg-[#1a1a1a] shadow sticky bg-opacity-90 backdrop-blur-lg backdrop-filter border-b border-gray-800': isLandingPage,
        'shadow sticky bg-white bg-opacity-50 backdrop-blur-lg backdrop-filter border-b border-gray-200': !isLandingPage,
      })}
    >
      <nav className='flex items-center justify-between p-6 lg:px-8' aria-label='Global'>
        <div className='flex items-center lg:flex-1'>
          <WaspRouterLink
            to={routes.LandingPageRoute.to}
            className={cn('flex items-center -m-1.5 p-1.5 duration-300 ease-in-out', {
              'text-white hover:text-amber-500': isLandingPage,
              'text-gray-900 hover:text-yellow-500': !isLandingPage
            })}
          >
            <NavLogo />
            {isLandingPage && (
              <span className='ml-2 text-sm font-semibold leading-6 text-white'>Digital Menu</span>
            )}
          </WaspRouterLink>
        </div>
        <div className='flex lg:hidden'>
          <button
            type='button'
            className={cn('-m-2.5 inline-flex items-center justify-center rounded-md p-2.5', {
              'text-white': isLandingPage,
              'text-gray-700': !isLandingPage
            })}
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className='sr-only'>Open main menu</span>
            <HiBars3 className='h-6 w-6' aria-hidden='true' />
          </button>
        </div>
        <div className='hidden lg:flex lg:gap-x-12'>{renderNavigationItems(navigationItems, undefined, isLandingPage)}</div>
        <div className='hidden lg:flex lg:flex-1 gap-3 justify-end items-center'>
          {isUserLoading ? null : !user ? (
            <WaspRouterLink to={routes.LoginRoute.to} className='text-sm font-semibold leading-6 ml-3'>
              <div className={cn('flex items-center duration-300 ease-in-out', {
                'text-white hover:text-amber-500': isLandingPage,
                'text-gray-900 hover:text-yellow-500': !isLandingPage
              })}>
                Log in <BiLogIn size='1.1rem' className='ml-1 mt-[0.1rem]' />
              </div>
            </WaspRouterLink>
          ) : (
            <div className={cn('ml-3', { 'text-white': isLandingPage })}>
              <DropdownUser user={user} isLandingPage={isLandingPage} />
            </div>
          )}
        </div>
      </nav>
      <Dialog as='div' className='lg:hidden' open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className='fixed inset-0 z-50' />
        <Dialog.Panel className={cn('fixed inset-y-0 right-0 z-50 w-full overflow-y-auto px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10', {
          'bg-[#1a1a1a] text-white': isLandingPage,
          'bg-white': !isLandingPage
        })}>
          <div className='flex items-center justify-between'>
            <WaspRouterLink to={routes.LandingPageRoute.to} className='-m-1.5 p-1.5'>
              <span className='sr-only'>Digital Menu</span>
              <NavLogo />
            </WaspRouterLink>
            <button
              type='button'
              className={cn('-m-2.5 rounded-md p-2.5', {
                'text-gray-300': isLandingPage,
                'text-gray-700': !isLandingPage
              })}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className='sr-only'>Close menu</span>
              <AiFillCloseCircle className='h-6 w-6' aria-hidden='true' />
            </button>
          </div>
          <div className='mt-6 flow-root'>
            <div className='-my-6 divide-y divide-gray-500/10'>
              <div className='space-y-2 py-6'>{renderNavigationItems(navigationItems, setMobileMenuOpen, isLandingPage)}</div>
              <div className='py-6'>
                {isUserLoading ? null : !user ? (
                  <WaspRouterLink to={routes.LoginRoute.to}>
                    <div className={cn('flex justify-end items-center duration-300 ease-in-out', {
                      'text-white hover:text-amber-500': isLandingPage,
                      'text-gray-900 hover:text-yellow-500': !isLandingPage
                    })}>
                      Log in <BiLogIn size='1.1rem' className='ml-1' />
                    </div>
                  </WaspRouterLink>
                ) : (
                  <UserMenuItems user={user} setMobileMenuOpen={setMobileMenuOpen} isLandingPage={isLandingPage} />
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}

function renderNavigationItems(
  navigationItems: NavigationItem[],
  setMobileMenuOpen?: Dispatch<SetStateAction<boolean>>,
  isLandingPage?: boolean
) {
  const menuStyles = cn({
    '-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7': true,
    'text-white hover:bg-gray-800 hover:text-amber-500': !!setMobileMenuOpen && isLandingPage,
    'text-gray-900 hover:bg-gray-50 hover:text-yellow-500': !!setMobileMenuOpen && !isLandingPage,
    'text-white duration-300 ease-in-out hover:text-amber-500': !setMobileMenuOpen && isLandingPage,
    'text-gray-900 duration-300 ease-in-out hover:text-yellow-500': !setMobileMenuOpen && !isLandingPage,
  });

  return navigationItems.map((item) => {
    return (
      <ReactRouterLink
        to={item.to}
        key={item.name}
        className={menuStyles}
        onClick={setMobileMenuOpen && (() => setMobileMenuOpen(false))}
      >
        {item.name}
      </ReactRouterLink>
    );
  });
}
