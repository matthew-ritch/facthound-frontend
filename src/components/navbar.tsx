import { LoginButtons } from './loginbuttons';
import Link from 'next/link';
import styles from '../styles/Navbar.module.css';
import { Config } from 'wagmi';
import { useState } from 'react';

/**
 * Props for the Navbar component
 */
interface NavbarProps {
  config: Config;
  next?: string;
}

/**
 * Navigation bar component with responsive design
 * 
 * @param config - Wagmi configuration for web3 connectivity
 * @param next - Redirect URL after authentication
 * @returns A responsive navigation bar with logo, links, and authentication options
 */
export function Navbar({ config, next }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoSection}>
        <Link href="/" className={styles.logo}>
          Facthound
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
        <LoginButtons config={config} next={next} />
      </div>
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.active : ''}`}>
        <Link href={`/createthread`}>
          <div className={styles.buttonlink}>
            Ask a Question
          </div>
        </Link>
        <LoginButtons config={config} next={next} />
      </div>
    </nav>
  );
}
