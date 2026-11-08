import styles from './ListRow.module.scss'

interface ListRowsProps {
  rows: { label: string; value: string }[]
  className?: string
}

/** Label/value list made of Figma › list-row items. */
export function ListRows({ rows, className }: ListRowsProps) {
  return (
    <dl className={[styles.list, className].filter(Boolean).join(' ')}>
      {rows.map(({ label, value }) => (
        <div key={label} className={styles.row}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
