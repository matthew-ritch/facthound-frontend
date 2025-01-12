import { useRouter } from 'next/router'
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import styles from '../../styles/Home.module.css';
import Post, { PostInfo } from '../../components/posts'

interface Params {
    id: string;
}

interface Context {
    params: Params;
}

interface Thread {
    threadId: number,
    posts: Array<PostInfo>
}

export async function getServerSideProps(context: Context) {
    const { params } = context;
    const threadId = params?.id;
    // Fetch data from external API
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
            <div className={styles.thread}>
                {thread.posts.map(k => <Post post={k} />)}
            </div>
        </main>
    )
}