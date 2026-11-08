import { Link } from 'react-router'
import logoSvg from '@/assets/animations/logo.svg?raw'
import { AnimatedSvg } from '@/components/AnimatedSvg/AnimatedSvg'
import { venue } from '@/data/venue'
import { paths } from '@/routes'
import styles from './Logo.module.scss'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link
      to={paths.home}
      className={[styles.logo, className].filter(Boolean).join(' ')}
      aria-label={`${venue.name} — home`}
    >
      <AnimatedSvg markup={logoSvg} className={styles.svg} />
    </Link>
  )
}
