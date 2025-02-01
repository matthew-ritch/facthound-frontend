import { LoginButtons } from './loginbuttons';
import Link from 'next/link';
import styles from '../styles/Navbar.module.css';
import { Config } from 'wagmi';

interface NavbarProps {
  config: Config;
}

export function Navbar({ config }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logoSection}>
        <Link href="/" className={styles.logo}>
          FactHound
        </Link>
      </div>
      <div className={styles.navLinks}>
        <Link href="/createthread" className={`${styles.navLink} ${styles.actionLink}`}>
          Ask a Question
        </Link>
      </div>
      <div className={styles.authSection}>
        <LoginButtons config={config} />
      </div>
    </nav>
  );
}
