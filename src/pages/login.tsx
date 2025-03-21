import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import styles from '../styles/Login.module.css';
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Header } from '../components/header';

/**
 * Login page component
 * Allows users to authenticate with username/password
 * Also provides options to create an account or connect with Ethereum wallet
 */
export default function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();
  const { isConnected } = useAccount();
  const next_page = typeof router.query.next === 'string' ? router.query.next : '/';

  /**
   * Redirect to home if user connects wallet
   */
  useEffect(() => {
    if (isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  /**
   * Handle login form submission
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/auth/token/', {
        username: credentials.username,
        password: credentials.password,
      });

      // Django typically returns a token in response.data.token or response.data.access
      const token = response.access;
      const refresh = response.refresh;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh', refresh);
        localStorage.setItem('username', credentials.username);
        router.push(next_page)
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Login failed. Please try again.'
      );
    }
  };

  return (
    <main>
      <div className={styles.container}>
        <meta name="description" content="Facthound is a truth-seeking missile."></meta>
        <Header />
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1>Login</h1>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials({
                ...credentials,
                username: e.target.value
              })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials({
                ...credentials,
                password: e.target.value
              })}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Log In
          </button>
        </form>
        <div className={styles.buttonContainer}>
          <ConnectButton />
          <Link href={`/createuser`} className={styles.buttonlink}>
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
