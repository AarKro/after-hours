import { Logo } from '@/components/Logo/Logo'
import { venue } from '@/data/venue'
import styles from './Footer.module.scss'

export function Footer() {
  const copyright = `© ${new Date().getFullYear()} ${venue.name}`

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo />
          <p className={`${styles.copyright} ${styles.copyrightDesktop}`}>{copyright}</p>
        </div>

        <address className={styles.details}>
          <p className={styles.address}>{venue.address}</p>
          <a className={styles.secondary} href={`mailto:${venue.email}`}>
            {venue.email}
          </a>
          <p className={styles.secondary}>{venue.hoursSummary}</p>
        </address>

        <p className={`${styles.copyright} ${styles.copyrightMobile}`}>{copyright}</p>
      </div>
    </footer>
  )
}
