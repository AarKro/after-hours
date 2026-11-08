import { useEffect } from 'react'

const SITE_NAME = 'After Hours'

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Cocktail bar in Zürich`
  }, [title])
}
