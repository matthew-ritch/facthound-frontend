import styles from '../styles/Home.module.css';
import Link from 'next/link'

export interface ThreadInfo {
    id: number;
    topic: string;
    dt: string;
    first_poster_name: string;
    first_poster_wallet: string;
    total_bounty: number;
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
                <p>{thread.first_poster_name ?? thread.first_poster_wallet} {parsed_date.toLocaleDateString()}:</p>
                <p>{thread.topic}</p>
            </div>
        </Link>
    )
}

export function ThreadList({
    threads,
}: ThreadListProps) {
    return (
        <main>
            <div className={styles.thread}>
                {threads.threads.map(k => <Thread thread={k} />)}
            </div>
        </main>
    )
}

