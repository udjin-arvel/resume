import { useCallback, useEffect, useState, type FC } from 'react'
import { Link } from 'react-router'
import { Logo } from '../logo/Logo'
import styles from './MobilePlug.module.css'

const DEVICE_UA = /android|iphone|kindle|ipad/i
const MAX_WIDTH = 1200

function shouldShowPlug(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return DEVICE_UA.test(navigator.userAgent) && window.innerWidth <= MAX_WIDTH
}

export const MobilePlug: FC = () => {
  const [visible, setVisible] = useState(true)
  const updateVisibility = useCallback(() => {
    setVisible(shouldShowPlug())
  }, [])

  useEffect(() => {
    updateVisibility()
    window.addEventListener('resize', updateVisibility)
    return () => window.removeEventListener('resize', updateVisibility)
  }, [updateVisibility])

  useEffect(() => {
    if (!visible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [visible])

  return (
    <div
      className={visible ? styles.plug : styles.plug_hidden}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-plug-title"
    >
      <div className={styles.plug__inner}>
        <Link to="/" className={styles.plug__logoLink} aria-label="На главную — Радар Арт AI">
          <Logo />
        </Link>
        <h1 id="mobile-plug-title" className={`${styles.plug__title} title_secondary`}>
          Сервис «Радар Арт AI»
          <span className={styles.plug__titleMuted}>недоступен для телефона или планшета.</span>
        </h1>
        <div className={styles.plug__bar}>Пожалуйста, возвращайтесь к&nbsp;нам с&nbsp;компьютера</div>
      </div>
    </div>
  )
}
