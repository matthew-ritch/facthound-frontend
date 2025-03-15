import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from '../styles/Home.module.css';
import Link from 'next/link'
import { Config } from '@wagmi/core';
import { useEffect, useState } from 'react';

/**
 * Props for the LoginButtons component
 */
interface LoginButtonContext {
    config: Config,
    username?: string | null
    next?: string
}

/**
 * Component shown when user is logged in
 * 
 * @param username - Current user's username
 * @param setUsername - Function to update username state
 * @returns UI for logged-in state with logout option
 */
const LoggedInView = ({ username, setUsername }: { username: string, setUsername: (username: string | null) => void }) => (
    <div className={styles.loginContainer}>
        <p className={styles.series}>{username}</p>
        <div className={styles.buttonlink} onClick={() => {
            localStorage.removeItem('username');
            localStorage.removeItem('token');
            setUsername(null);
        }}>
            Logout
        </div>
    </div>
);

/**
 * Component shown when user is not logged in
 * 
 * @param isConnected - Whether user's wallet is connected
 * @param next - Redirect URL after authentication
 * @returns UI for logged-out state with login options
 */
const LoggedOutView = ({ isConnected, next }: { isConnected: boolean, next?: string }) => (
    <div className={styles.loginContainer}>
        <div>
            <ConnectButton />
        </div>
        {!isConnected && (
            <Link href={`/login${next ? `?next=${next}` : ''}`}>
                <div className={styles.buttonlink}>Login</div>
            </Link>
        )}
    </div>
);

/**
 * Authentication component that shows different views based on login state
 * 
 * @param config - Wagmi configuration for web3 connectivity
 * @param next - Redirect URL after authentication
 * @returns Authentication UI component with wallet connection and login options
 */
export function LoginButtons({ config, next }: LoginButtonContext) {
    const { address, isConnected } = useAccount();
    const [username, setUsername] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setUsername(localStorage.getItem('username'));
    }, []);

    if (!mounted) return null;

    return username
        ? <LoggedInView username={username} setUsername={setUsername} />
        : <LoggedOutView isConnected={isConnected} next={next}/>;
}
