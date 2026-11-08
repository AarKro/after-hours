import { Button } from '@/components/Button/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes'
import styles from './NotFound.module.scss'

export const NOT_FOUND_TITLE = 'Page not found'

export function NotFound() {
  useDocumentTitle(NOT_FOUND_TITLE)

  return (
    <div className={styles.page}>
      <div className={styles.copy}>
        <h1 className={styles.title}>Last call.</h1>
        <p className={styles.intro}>
          This page has already gone home for the night. The bar, however, is still open.
        </p>
      </div>
      <div className={styles.actions}>
        <Button to={paths.home}>back to the bar</Button>
        <Button to={paths.recipes} variant="secondary-outlined">
          see the recipes
        </Button>
      </div>
    </div>
  )
}
