import { useCallback, useRef, useState } from 'react'
import { NavLink } from 'react-router'
import { Icon } from '@/components/Icon/Icon'
import { Logo } from '@/components/Logo/Logo'
import { ReserveButton } from '@/components/ReserveButton/ReserveButton'
import { MobileMenu } from './MobileMenu'
import { navItems } from './navItems'
import styles from './Header.module.scss'

const MOBILE_MENU_ID = 'mobile-menu'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const burgerRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    burgerRef.current?.focus()
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Logo />

        <nav aria-label="Main" className={styles.nav}>
          <ul className={styles.links}>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [styles.link, isActive && styles.linkActive].filter(Boolean).join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.cta}>
          <ReserveButton />
        </div>

        <button
          ref={burgerRef}
          type="button"
          className={styles.burger}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls={MOBILE_MENU_ID}
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="burger" />
        </button>
      </div>

      {menuOpen && <MobileMenu id={MOBILE_MENU_ID} onClose={closeMenu} />}
    </header>
  )
}
