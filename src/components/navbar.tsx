import { LoginButtons } from './loginbuttons';
import Link from 'next/link';
import styles from '../styles/Navbar.module.css';
import { Config } from 'wagmi';
import { useState } from 'react';

interface NavbarProps {
  config: Config;
}

export function Navbar({ config }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoSection}>
        <Link href="/" className={styles.logo}>
          FactHound
        </Link>
      </div>
      <button className={styles.hamburger} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div className={styles.navLinks}>
        <Link href={`/createthread`}>
          <div className={styles.buttonlink}>
            Ask a Question
          </div>
        </Link>
      </div>
      <div className={styles.authSection}>
        <LoginButtons config={config} />
      </div>
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.active : ''}`}>
        <Link href={`/createthread`}>
          <div className={styles.buttonlink}>
            Ask a Question
          </div>
        </Link>
        <LoginButtons config={config} />
      </div>
    </nav>
  );
}
