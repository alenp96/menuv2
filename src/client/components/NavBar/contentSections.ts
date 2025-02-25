import type { NavigationItem } from '../NavBar/NavBar';
import { routes } from 'wasp/client/router';
import { BlogUrl, DocsUrl } from '../../../shared/common';

export const appNavigationItems: NavigationItem[] = [
  { name: 'AI Scheduler (Demo App)', to: routes.DemoAppRoute.to },
  { name: 'Digital Menu Creator', to: routes.MenusRoute.to },
  { name: 'File Upload (AWS S3)', to: routes.FileUploadRoute.to },
  { name: 'Pricing', to: routes.PricingPageRoute.to },
  { name: 'Documentation', to: DocsUrl },
  { name: 'Blog', to: BlogUrl },
];

export const userNavigationItems = [
  { name: 'Your Account', to: routes.AccountRoute.to },
];
