import { useRouter } from 'next/router'
import { useState } from 'react';
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import styles from '../../styles/Home.module.css';
import loginStyles from '../../styles/Login.module.css';
import Post, { PostInfo } from '../../components/posts'
import { config } from '../../wagmi';
import { Navbar } from '../../components/navbar';
import api from '../../utils/api';

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
    const [replyText, setReplyText] = useState('');
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        if (localStorage.getItem('token') == null) {
            router.push(`/login/`);
        }
        e.preventDefault();
        try {
            const response = await api.post(selectedQuestionId ? '/questions/api/answer/' : '/questions/api/post/', {
                thread: thread.threadId,
                text: replyText,
                question: selectedQuestionId
            });

            if (response.message.includes('success')) {
                router.reload();
            } else {
                setError('Reply failed. Please try again.');
            }
        } catch (err: any) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.non_field_errors?.[0] ||
                'Reply failed. Please try again.'
            );
        }
    };

    const handleAnswer = (questionId: number) => {
        setSelectedQuestionId(questionId);
    };

    return (
        <div className={styles.container}>
            <Navbar config={config} />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.thread}>
                        {thread.posts.map(k => (
                            <Post 
                                post={k} 
                                key={k.id} 
                                onAnswer={handleAnswer}
                            />
                        ))}
                    </div>
                    <form className={loginStyles.form} onSubmit={handleSubmit}>
                        {error && <div className={loginStyles.error}>{error}</div>}
                        <div className={loginStyles.formGroup}>
                            <label htmlFor="reply">
                                {selectedQuestionId ? 'Answer Question' : 'Reply'}
                            </label>
                            <textarea
                                className={loginStyles.postText}
                                id="reply"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit">
                            {selectedQuestionId ? 'Submit Answer' : 'Reply'}
                        </button>
                        {selectedQuestionId && (
                            <button type="button" onClick={() => setSelectedQuestionId(null)}>
                                Cancel Answer
                            </button>
                        )}
                    </form>
                </div>
            </main>
        </div>
    )
}