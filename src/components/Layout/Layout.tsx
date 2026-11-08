import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Footer } from '@/components/Footer/Footer'
import { Header } from '@/components/Header/Header'
import styles from './Layout.module.scss'

const MAIN_ID = 'main'

export function Layout() {
  const { pathname } = useLocation()

  // New page → start at the top (query-string changes, e.g. the reservation prefill, don't count).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <>
      <a href={`#${MAIN_ID}`} className={styles.skipLink}>
        Skip to content
      </a>
      <Header />
      <main id={MAIN_ID} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
