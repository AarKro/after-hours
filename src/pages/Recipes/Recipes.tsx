import { CocktailCard } from '@/components/CocktailCard/CocktailCard'
import { drinks } from '@/data/drinks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './Recipes.module.scss'

export function Recipes() {
  useDocumentTitle('Recipes')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Recipes</h1>
        <p className={styles.intro}>
          Everything on tonight’s menu, written down so you can shake it up at home. Or let us do
          the work.
        </p>
      </header>

      <ul className={styles.grid}>
        {drinks.map((drink) => (
          <li key={drink.slug}>
            <CocktailCard drink={drink} layout="horizontal" headingLevel="h2" />
          </li>
        ))}
      </ul>
    </div>
  )
}
