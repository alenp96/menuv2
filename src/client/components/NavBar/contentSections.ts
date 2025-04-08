import type { NavigationItem } from '../NavBar/NavBar';
import { routes } from 'wasp/client/router';
import { BlogUrl, DocsUrl } from '../../../shared/common';

export const appNavigationItems: NavigationItem[] = [
  { name: 'Digital Menu Creator', to: routes.MenusRoute.to },
  { name: 'Pricing', to: routes.PricingPageRoute.to },
];

export const userNavigationItems = [
  { name: 'Your Account', to: routes.AccountRoute.to },
];
