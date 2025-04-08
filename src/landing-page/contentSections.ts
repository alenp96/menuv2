import type { NavigationItem } from '../client/components/NavBar/NavBar';
import daBoiAvatar from '../client/static/da-boi.webp';
import avatarPlaceholder from '../client/static/avatar-placeholder.webp';

// Routes for the landing page navigation
const PricingPageRoute = { to: '/pricing' };

export const landingPageNavigationItems: NavigationItem[] = [
  { name: 'Features', to: '#features' },
  { name: 'Pricing', to: PricingPageRoute.to },
  { name: 'FAQ', to: '#faq' },
];

export const features = [
  {
    name: 'Easy Menu Creation',
    description: 'Create beautiful digital menus in minutes with our intuitive editor.',
    icon: '🍽️',
    href: '#',
  },
  {
    name: 'QR Code Generation',
    description: 'Generate QR codes for your menus that customers can scan with their phones.',
    icon: '📱',
    href: '#',
  },
  {
    name: 'Real-time Updates',
    description: 'Update your menu instantly - perfect for daily specials or price changes.',
    icon: '⚡',
    href: '#',
  },
  {
    name: 'Analytics & Insights',
    description: 'Track which menu items get the most views and optimize your offerings.',
    icon: '📊',
    href: '#',
  },
];

export const testimonials = [
  {
    name: 'Da Boi',
    role: 'Wasp Mascot',
    avatarSrc: daBoiAvatar,
    socialUrl: 'https://twitter.com/wasplang',
    quote: "I don't even know how to code. I'm just a plushie.",
  },
  {
    name: 'Mr. Foobar',
    role: 'Founder @ Cool Startup',
    avatarSrc: avatarPlaceholder,
    socialUrl: '',
    quote: 'This product makes me cooler than I already am.',
  },
  {
    name: 'Jamie',
    role: 'Happy Customer',
    avatarSrc: avatarPlaceholder,
    socialUrl: '#',
    quote: 'My cats love it!',
  },
];

export const faqs = [
  {
    id: 1,
    question: 'How do I create my first digital menu?',
    answer: 'Simply sign up, click "Create Menu" and follow the guided steps to add your items, organize sections, and customize the appearance.',
  },
  {
    id: 2,
    question: 'Can I update my menu in real time?',
    answer: 'Yes! Any changes you make to your menu are published instantly, allowing you to update prices, add specials, or modify dishes on the fly.',
  },
  {
    id: 3,
    question: 'How do customers access my digital menu?',
    answer: 'Your menu gets a unique URL and QR code that you can share with customers. They can scan it with their phones or visit the link directly.',
  },
  {
    id: 4,
    question: 'Do you support multiple languages?',
    answer: 'Yes, our platform supports multiple languages so you can create menus that cater to diverse customer bases.',
  },
  {
    id: 5,
    question: 'Is there a limit to how many items I can add?',
    answer: 'No, you can add as many items and sections as you need for your restaurant or café menu.',
  }
];

export const footerNavigation = {
  app: [
    { name: 'Features', href: '#features' },
    { name: 'FAQ', href: '#faq' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Privacy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ],
};
