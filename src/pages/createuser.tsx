import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import styles from '../styles/Login.module.css';
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Header } from '../components/header';

/**
 * Create User page component
 * Allows new users to register with username, email, and password
 */
export default function CreateUser() {
    const [credentials, setCredentials] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const router = useRouter();

    /**
     * Handle user registration form submission
     * @param e - Form submission event
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/auth/register/', {
                username: credentials.username,
                email: credentials.email,
                password: credentials.password,
            });

        } catch (err: any) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.non_field_errors?.[0] ||
                'User creation failed. Please try again.'
            );
        }

        router.push("/login")

    };

    return (
        <div className={styles.container}>
            <meta name="description" content="Facthound is a truth-seeking missile."></meta>
            <Header />
            <form className={styles.form} onSubmit={handleSubmit}>
                <h1>Create User</h1>
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
                    <label htmlFor="email">Email</label>
                    <input
                        type="text"
                        id="email"
                        value={credentials.email}
                        onChange={(e) => setCredentials({
                            ...credentials,
                            email: e.target.value
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
                    Create user
                </button>
            </form>
            <div className={styles.linkdiv}>
                <Link href={`/login`} className={styles.buttonlink}>
                    Login with existing account
                </Link>
            </div>
        </div>
    );
}
