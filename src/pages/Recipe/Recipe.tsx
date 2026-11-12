import { useParams } from 'react-router'
import { Illustration } from '@/components/Illustration/Illustration'
import { InfoChipList } from '@/components/InfoChip/InfoChip'
import { ListRows } from '@/components/ListRow/ListRow'
import { RecipeSteps } from '@/components/RecipeStep/RecipeStep'
import { ReserveButton } from '@/components/ReserveButton/ReserveButton'
import { getDrink } from '@/data/drinks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { NOT_FOUND_TITLE, NotFound } from '@/pages/NotFound/NotFound'
import styles from './Recipe.module.scss'

export function Recipe() {
  const { slug } = useParams()
  const drink = getDrink(slug)
  // NotFound sets the same title; the parent effect runs last, so it must agree.
  useDocumentTitle(drink?.name ?? NOT_FOUND_TITLE)

  if (!drink) return <NotFound />

  return (
    <article className={styles.page}>
      <div className={styles.hero}>
        <header className={styles.header}>
          <h1 className={styles.title}>{drink.name}</h1>
          <p className={styles.intro}>{drink.intro}</p>
        </header>
        <div className={styles.stage}>
          {/* key: replay the illustration when navigating between recipes */}
          <Illustration
            key={drink.slug}
            name={drink.illustration}
            animated
            className={styles.glass}
          />
        </div>
        <InfoChipList items={drink.facts} label="At a glance" className={styles.facts} />
      </div>

      <div className={styles.details}>
        <section className={styles.section} aria-labelledby="ingredients-title">
          <h2 id="ingredients-title" className={styles.sectionTitle}>
            Ingredients
          </h2>
          <ListRows
            rows={drink.ingredients.map(({ name, amount }) => ({ label: name, value: amount }))}
          />
        </section>

        <section className={styles.section} aria-labelledby="method-title">
          <h2 id="method-title" className={styles.sectionTitle}>
            Method
          </h2>
          <RecipeSteps steps={drink.method} />
        </section>
      </div>

      <div>
        <ReserveButton fullWidthOnMobile />
      </div>
    </article>
  )
}
