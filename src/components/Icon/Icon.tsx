import burger from '@/assets/icons/burger.svg'
import corner from '@/assets/icons/corner.svg'
import cross from '@/assets/icons/cross.svg'
import styles from './Icon.module.scss'

const icons = { burger, corner, cross }

export type IconName = keyof typeof icons

interface IconProps {
  name: IconName
  className?: string
}

/** Decorative UI icon (Figma › icons). Always pair with an accessible label on the control. */
export function Icon({ name, className }: IconProps) {
  return (
    <img
      src={icons[name]}
      alt=""
      aria-hidden="true"
      className={[styles.icon, className].filter(Boolean).join(' ')}
    />
  )
}
