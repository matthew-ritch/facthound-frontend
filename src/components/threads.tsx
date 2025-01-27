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
    const formattedDate = parsed_date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    return (
        <Link href={`/thread/${thread.id}`} style={{ textDecoration: 'none' }}>
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>{thread.topic}</h2>
                <div className={styles.cardMeta}>
                    Posted by {thread.first_poster_name ?? 
                        `${thread.first_poster_wallet.slice(0, 4)}...${thread.first_poster_wallet.slice(-4)}`
                    } • {formattedDate}
                </div>
                <div className={styles.bountyInfo}>
                    <div className={`${styles.bountyTag} ${styles.available}`}>
                        {thread.total_bounty_available ? 
                            `${formatEther((thread.total_bounty_available.toString()))} ETH Available` : 
                            'No Bounty'
                        }
                    </div>
                    {thread.total_bounty_claimed > 0 && (
                        <div className={`${styles.bountyTag} ${styles.claimed}`}>
                            {formatEther((thread.total_bounty_claimed.toString()))} ETH Claimed
                        </div>
                    )}
                </div>
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

