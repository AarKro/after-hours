import styles from './InfoChip.module.scss'

interface InfoChipListProps {
  items: string[]
  label: string
  className?: string
}

/** Row of Figma › info-chip pills. */
export function InfoChipList({ items, label, className }: InfoChipListProps) {
  return (
    <ul className={[styles.list, className].filter(Boolean).join(' ')} aria-label={label}>
      {items.map((item) => (
        <li key={item} className={styles.chip}>
          {item}
        </li>
      ))}
    </ul>
  )
}
