import { Link } from 'react-router'
import { Illustration } from '@/components/Illustration/Illustration'
import { formatPrice, type Drink } from '@/data/drinks'
import { paths } from '@/routes'
import styles from './CocktailCard.module.scss'

interface CocktailCardProps {
  drink: Drink
  /** Figma › cocktail-card: `vertical` for the menu row, `horizontal` for the recipes list. */
  layout?: 'vertical' | 'horizontal'
  headingLevel?: 'h2' | 'h3'
}

export function CocktailCard({
  drink,
  layout = 'vertical',
  headingLevel = 'h3',
}: CocktailCardProps) {
  const Heading = headingLevel

  return (
    <article className={`${styles.card} ${styles[layout]}`}>
      <div className={styles.body}>
        <Illustration name={drink.illustration} className={styles.illustration} />
        <div className={styles.text}>
          <Heading className={styles.name}>
            <Link to={paths.recipe(drink.slug)} className={styles.link}>
              {drink.name}
            </Link>
          </Heading>
          <p className={styles.summary}>{drink.summary}</p>
        </div>
      </div>
      <p className={styles.price}>
        <span className={styles.currency}>CHF </span>
        {formatPrice(drink.price)}
      </p>
    </article>
  )
}
