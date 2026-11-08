import type { IllustrationName } from '@/components/Illustration/Illustration'

export interface Ingredient {
  name: string
  amount: string
}

export interface Drink {
  slug: string
  name: string
  /** Short ingredient line shown on menu cards. */
  summary: string
  /** Price in CHF. */
  price: number
  illustration: IllustrationName
  /** Intro paragraph on the recipe page. */
  intro: string
  /** Quick facts shown as chips: prep time, glass, strength, servings. */
  facts: string[]
  ingredients: Ingredient[]
  method: string[]
}

export const drinks: Drink[] = [
  {
    slug: 'old-fashioned',
    name: 'After Hours Old Fashioned',
    summary: 'bourbon, maple, bitters, cherry-wood smoke',
    price: 18,
    illustration: 'rocks-glass',
    intro:
      'Our house signature: bourbon and maple, stirred slow and finished under a curl of cherry-wood smoke.',
    facts: ['3 min', 'rocks glass', 'strong', 'serves 1'],
    ingredients: [
      { name: 'Bourbon', amount: '60 ml' },
      { name: 'Maple syrup', amount: '10 ml' },
      { name: 'Angostura bitters', amount: '2 dashes' },
      { name: 'Orange bitters', amount: '1 dash' },
      { name: 'Large ice cube', amount: '1' },
      { name: 'Cherry-wood chips', amount: 'for smoking' },
      { name: 'Orange peel', amount: 'to garnish' },
    ],
    method: [
      'Light the cherry-wood chips and trap the smoke under an upturned rocks glass for 30 seconds.',
      'Add bourbon, maple syrup and both bitters to a mixing glass filled with ice.',
      'Stir for about 30 seconds until well chilled and slightly diluted.',
      'Turn the smoked glass over, add the large ice cube and strain the drink over it.',
      'Express the orange peel over the glass, run it along the rim and drop it in.',
    ],
  },
  {
    slug: 'amaretto-sour',
    name: 'Amaretto Sour',
    summary: 'amaretto, lemon, sugar syrup, egg white',
    price: 16,
    illustration: 'orange',
    intro:
      'Sweet almond, sharp lemon and a silky foam cap. The drink that converts people who say they don’t like amaretto.',
    facts: ['4 min', 'coupe', 'medium', 'serves 1'],
    ingredients: [
      { name: 'Amaretto', amount: '45 ml' },
      { name: 'Cask-strength bourbon', amount: '15 ml' },
      { name: 'Fresh lemon juice', amount: '30 ml' },
      { name: 'Sugar syrup', amount: '10 ml' },
      { name: 'Egg white', amount: '1' },
      { name: 'Lemon twist', amount: 'to garnish' },
    ],
    method: [
      'Add amaretto, bourbon, lemon juice, sugar syrup and egg white to a shaker.',
      'Dry shake without ice for 15 seconds to build the foam.',
      'Fill the shaker with ice and shake hard for another 15 seconds.',
      'Double strain into a chilled coupe and let the foam settle for a moment.',
      'Express the lemon twist over the foam and rest it on the rim.',
    ],
  },
  {
    slug: 'espresso-martini',
    name: 'Espresso Martini',
    summary: 'vodka, fresh espresso, coffee liqueur',
    price: 18,
    illustration: 'shaker',
    intro:
      'A shot of espresso pulled to order, shaken hard with vodka and coffee liqueur until it wears a thick crema.',
    facts: ['3 min', 'martini glass', 'medium', 'serves 1'],
    ingredients: [
      { name: 'Vodka', amount: '45 ml' },
      { name: 'Fresh espresso', amount: '30 ml' },
      { name: 'Coffee liqueur', amount: '20 ml' },
      { name: 'Vanilla syrup', amount: '5 ml' },
      { name: 'Coffee beans', amount: '3, to garnish' },
    ],
    method: [
      'Pull a fresh shot of espresso and let it cool for a minute.',
      'Add vodka, espresso, coffee liqueur and vanilla syrup to a shaker.',
      'Fill with ice and shake as hard as you can for 15 seconds.',
      'Double strain into a chilled martini glass so the crema stays smooth.',
      'Float three coffee beans on top: health, wealth and happiness.',
    ],
  },
  {
    slug: 'negroni',
    name: 'Negroni',
    summary: 'gin, Campari, sweet vermouth, orange peel',
    price: 16,
    illustration: 'rocks-glass',
    intro:
      'Equal parts, no shortcuts. Bitter, sweet and botanical, built over one big cube and stirred until it’s just right.',
    facts: ['2 min', 'rocks glass', 'strong', 'serves 1'],
    ingredients: [
      { name: 'Gin', amount: '30 ml' },
      { name: 'Campari', amount: '30 ml' },
      { name: 'Sweet vermouth', amount: '30 ml' },
      { name: 'Large ice cube', amount: '1' },
      { name: 'Orange peel', amount: 'to garnish' },
    ],
    method: [
      'Add gin, Campari and sweet vermouth to a mixing glass filled with ice.',
      'Stir for 20 to 30 seconds until chilled and silky.',
      'Place the large ice cube in a rocks glass and strain the drink over it.',
      'Express the orange peel over the glass and drop it in.',
    ],
  },
  {
    slug: 'aperol-spritz',
    name: 'Aperol Spritz',
    summary: 'Aperol, prosecco, soda, orange slice',
    price: 15,
    illustration: 'orange',
    intro:
      'Bright, bitter-orange and barely trying. The easiest way to ease from work mode into after hours.',
    facts: ['1 min', 'wine glass', 'light', 'serves 1'],
    ingredients: [
      { name: 'Prosecco', amount: '90 ml' },
      { name: 'Aperol', amount: '60 ml' },
      { name: 'Soda water', amount: '30 ml' },
      { name: 'Ice cubes', amount: 'a handful' },
      { name: 'Orange slice', amount: 'to garnish' },
    ],
    method: [
      'Fill a large wine glass with ice.',
      'Pour in the prosecco first, then the Aperol, so they mix on their own.',
      'Top with a splash of soda water.',
      'Give it one gentle stir and tuck the orange slice into the glass.',
    ],
  },
]

export function getDrink(slug: string | undefined): Drink | undefined {
  return drinks.find((drink) => drink.slug === slug)
}

/** Swiss menu style: 18 → "18.–" */
export function formatPrice(price: number): string {
  return `${price}.–`
}
