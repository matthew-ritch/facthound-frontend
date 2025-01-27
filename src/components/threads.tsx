import styles from '../styles/Home.module.css';
import Link from 'next/link'
import { formatEther } from "ethers";

export interface ThreadInfo {
    id: number;
    topic: string;
    dt: string;
    first_poster_name: string;
    first_poster_wallet: string;
    total_bounty_available: number;
    total_bounty_claimed: number;
}

type ThreadProps = {
    thread: ThreadInfo;
}

interface ThreadList {
    threads: Array<ThreadInfo>
}

export type ThreadListProps = {
    threads: ThreadList;
}

export function Thread({
    thread,
}: ThreadProps) {
    const parsed_date = new Date(thread.dt);
    return (
        <Link href={`/thread/${thread.id}`}>
            <div className={styles.card}>
                <h4 className={styles.cardtitle}>{thread.topic}</h4>
                <h5>{thread.first_poster_name ?? `${thread.first_poster_wallet.slice(0, 4)}...${thread.first_poster_wallet.slice(-4)}`} {parsed_date.toLocaleDateString()}</h5>
                <h5>{thread.total_bounty_available ? `${formatEther((thread.total_bounty_available.toString()))} eth in` : 'No'} bounties available</h5>
                <h5>{thread.total_bounty_claimed ? `${formatEther((thread.total_bounty_claimed.toString()))} eth in` : 'No'} bounties claimed</h5>
            </div>
        </Link>
    )
}

export function ThreadList({
    threads,
}: ThreadListProps) {
    return (
        <main>
            <div className={styles.threads}>
                {threads.threads.map(k => <Thread thread={k} key={k.id}/>)}
            </div>
        </main>
    )
}

