import { getAccount } from '@wagmi/core';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from '../styles/Home.module.css';
import Link from 'next/link'
import { Config } from '@wagmi/core';

interface LoginButtonContext {
    config: Config
}

export function LoginButtons({
    config
}: LoginButtonContext) {
    const { address, isConnected } = getAccount(config);
    return (
        <div className={styles.grid}>
            <div>
                <ConnectButton />
            </div>
            {(~isConnected) &&
                <div className={styles.card}>
                    <Link href={`/login`}>Or login with username and password</Link>
                </div>}
        </div>
    )
}