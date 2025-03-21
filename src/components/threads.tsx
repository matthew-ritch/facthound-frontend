import styles from '../styles/Home.module.css';
import Link from 'next/link'
import { formatUnits } from "ethers";

/**
 * Interface representing a forum thread's information
 */
export interface ThreadInfo {
    id: number;
    topic: string;
    dt: string;
    first_poster_name: string;
    first_poster_wallet: string;
    total_bounty_available: number;
    total_bounty_claimed: number;
    tags: string[] | null;  // Add this line
}

/**
 * Props for the Thread component
 */
type ThreadProps = {
    thread: ThreadInfo;
    eth_price: number;
}

/**
 * Interface representing a list of forum threads
 */
interface ThreadList {
    threads: Array<ThreadInfo>
}

/**
 * Props for the ThreadList component
 */
export type ThreadListProps = {
    threads: ThreadList;
    eth_price: number;
}

/**
 * Renders a single forum thread with its metadata and bounty information
 * 
 * @param thread - The thread information to display
 * @param eth_price - Current ETH price in USD for bounty conversion
 * @returns A thread card component with title, metadata, tags, and bounty details
 */
export function Thread({
    thread,
    eth_price
}: ThreadProps) {
    const parsed_date = thread.dt.endsWith('Z') ?
        new Date(thread.dt) :
        new Date(thread.dt + 'Z');

    const formattedDate = parsed_date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    return (
        <Link href={`/thread/${thread.id}/${thread.topic.toLowerCase().trim().split(' ').join('+')}`} style={{ textDecoration: 'none' }}>
            <div className={styles.card} style={{ width: '100%', margin: '0' }}>
                <h2 className={styles.cardTitle}>{thread.topic}</h2>
                <div className={styles.cardMeta}>
                    Posted by {thread.first_poster_name ??
                        `${thread.first_poster_wallet.slice(0, 4)}...${thread.first_poster_wallet.slice(-4)}`
                    } • {formattedDate}
                </div>
                {thread.tags && thread.tags.length > 0 && (
                    <div className={styles.tagContainer}>
                        {thread.tags.map((tag, index) => (
                            tag != '' ? <span key={index} className={styles.tag}>{tag}</span> : null
                        ))}
                    </div>
                )}
                <div className={styles.bountyInfo}>
                    {thread.total_bounty_available > 0 && (
                        <div className={`${styles.bountyTag} ${styles.available}`}>
                            {`\$${(eth_price * parseFloat(formatUnits(thread.total_bounty_available, "ether"))).toFixed(2)} USD Available`}
                        </div>
                    )}
                    {thread.total_bounty_claimed > 0 && (
                        <div className={`${styles.bountyTag} ${styles.claimed}`}>
                            {`\$${(eth_price * parseFloat(formatUnits(thread.total_bounty_claimed, "ether"))).toFixed(2)} USD Claimed`}
                        </div>
                    )}
                    {(!thread.total_bounty_claimed && !thread.total_bounty_available) && (
                        <div className={`${styles.bountyTag}`}>
                            No Bounty
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}

/**
 * Renders a grid of forum threads
 * 
 * @param threads - The list of threads to display
 * @param eth_price - Current ETH price in USD for bounty conversion
 * @returns A grid layout containing all thread components
 */
export function ThreadList({
    threads,
    eth_price
}: ThreadListProps) {
    return (
        <main></main>
            <div className={styles.grid}>
                {threads.threads.map(k => <Thread thread={k} key={k.id} eth_price={eth_price} />)}
            </div>
        </main>
    )
}

