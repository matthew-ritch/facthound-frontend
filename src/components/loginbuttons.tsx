import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from '../styles/Home.module.css';
import Link from 'next/link'
import { Config } from '@wagmi/core';
import { useEffect, useState } from 'react';

interface LoginButtonContext {
    config: Config,
    username?: string | null
    next?: string
}

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
