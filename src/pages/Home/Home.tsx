import { BarScene } from '@/components/BarScene/BarScene'
import { CocktailCard } from '@/components/CocktailCard/CocktailCard'
import { ListRows } from '@/components/ListRow/ListRow'
import { ReserveButton } from '@/components/ReserveButton/ReserveButton'
import { drinks } from '@/data/drinks'
import { openingHours } from '@/data/venue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './Home.module.scss'

export function Home() {
  useDocumentTitle()

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroText}>
          <div className={styles.heroCopy}>
            <h1 id="hero-title" className={styles.headline}>
              Cocktails after&nbsp;hours.
            </h1>
            <p className={styles.intro}>
              Seasonal drinks, low light and a bar team that remembers your order. Walk in or book a
              table.
            </p>
          </div>
          <ReserveButton fullWidthOnMobile />
        </div>
        <BarScene className={styles.illustration} />
      </section>

      <section className={styles.menu} aria-labelledby="menu-title">
        <h2 id="menu-title" className={styles.sectionTitle}>
          Tonight’s menu
        </h2>
        <ul className={styles.carousel}>
          {drinks.map((drink) => (
            <li key={drink.slug} className={styles.carouselItem}>
              <CocktailCard drink={drink} />
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.hours} aria-labelledby="hours-title">
        <h2 id="hours-title" className={styles.sectionTitle}>
          Opening hours
        </h2>
        <ListRows rows={openingHours.map(({ days, hours }) => ({ label: days, value: hours }))} />
      </section>
    </div>
  )
}
