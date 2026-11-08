import { paths } from '@/routes'

export const navItems = [
  { label: 'Home', to: paths.home, end: true },
  { label: 'Recipes', to: paths.recipes, end: false },
  { label: 'Contact', to: paths.contact, end: false },
] as const
