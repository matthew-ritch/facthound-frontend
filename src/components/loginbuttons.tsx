import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from '../styles/Home.module.css';
import Link from 'next/link'
import { Config } from '@wagmi/core';
import { useEffect, useState } from 'react';

interface LoginButtonContext {
    config: Config,
    username: string | null
}

export function LoginButtons({
    config
}: LoginButtonContext) {
    const { address, isConnected } = useAccount();
    const [username, setUsername] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        setUsername(localStorage.getItem('username'));
    }, []);
    // Don't render anything until mounted to prevent SSR mismatch
    if (!mounted) return null;
    if (username) {
        return (
            <div className={styles.grid}>
                <p className={styles.series}>{username}</p>
                <button className={styles.buttonlink} onClick={async () => { localStorage.removeItem('username'); localStorage.removeItem('token'); setUsername(null) }}>Logout</button>
            </div>
        )
    }
    return (
        <div className={styles.grid}>
            <div>
                <ConnectButton />
            </div>
            {!isConnected && (
                <Link href={`/login`}>
                    <div className={styles.card}>
                        Login
                    </div>
                </Link>
            )}
        </div>
    )
}