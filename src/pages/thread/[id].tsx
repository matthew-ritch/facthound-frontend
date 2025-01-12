import { useRouter } from 'next/router'
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import styles from '../../styles/Home.module.css';

interface Params {
    id: string;
}

interface Context {
    params: Params;
}

interface PostInfo {
    id: number;
    text: string;
    dt: string;
    thread: number;
    poster: string;
}

interface Thread {
    threadId: number,
    posts: Array<PostInfo>
}

export async function getServerSideProps(context: Context) {
    const { params } = context;
    const threadId = params?.id;
    // Fetch data from external API
    console.log(process.env.BACKEND_URL + `/questions/api/thread?threadId=${threadId}`)
    const res = await fetch(process.env.BACKEND_URL + `/questions/api/thread?threadId=${threadId}`);
    const thread: Thread = await res.json();
    // Pass data to the page via props
    return { props: { thread } };
}

export default function Page({
    thread,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    return (
        <main>
            <div className={styles.grid}>
                {thread.posts.map(k => (<p>{k.text}</p>))}
            </div>
        </main>
    )
}