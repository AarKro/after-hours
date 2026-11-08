export const RESERVATION_INTENT = 'reservation'

export const paths = {
  home: '/',
  recipes: '/recipes',
  recipe: (slug: string) => `/recipes/${slug}`,
  contact: '/contact',
  reserve: `/contact?intent=${RESERVATION_INTENT}`,
} as const
