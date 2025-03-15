import type { InferGetServerSidePropsType } from 'next'
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Header } from '../../components/header';
import Post, { PostInfo } from '../../components/posts'
import { config } from '../../wagmi';

import styles from '../../styles/Home.module.css';

/**
 * User profile URL parameters
 */
interface Params {
    userid: string[];
}

/**
 * Context provided to getServerSideProps
 */
interface Context {
    params?: Params;
}

/**
 * Extended PostInfo with parent topic information for answers
 */
interface AnswerInfo extends PostInfo {
    parent_topic: string;  // Add this field
}

/**
 * User profile data structure with questions and answers
 */
interface UserPosts {
    userid: number,
    username: string,
    wallet: string,
    questions: Array<PostInfo>,
    answers: Array<AnswerInfo>  // Update this type
}

/**
 * Fetches user profile data and ETH price for server-side rendering
 * @param context - Next.js context with URL parameters
 * @returns Props containing user post history and ETH price
 */
export async function getServerSideProps(context: Context) {
    const { params } = context;
    const userid = params?.userid[0];
    // Fetch data from external API
    const res = await fetch(process.env.BACKEND_URL + `/api/questions/userhistory?user=${userid}`);
    const userposts: UserPosts = await res.json();
    // Fetch eth price from alchemy
    const url = 'https://api.g.alchemy.com/prices/v1/tokens/by-symbol?symbols=ETH&symbols=USDC&symbols=BTC';
    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.ALCHEMY_API_KEY}`
    };
    const prices = await fetch(url, {
        method: 'GET',
        headers: headers
    })
    const priceinfo = await prices.json();
    const eth_price = priceinfo.data[0].prices[0].value;
    // Pass data to the page via props
    return { props: { userposts, eth_price } };
}

/**
 * User profile page component
 * Displays a user's history of questions and answers
 */
export default function Page({
    userposts,
    eth_price
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('questions');
    
    const questions = userposts?.questions || [];
    const answers = userposts?.answers || [];

    const handleNavigate = (threadId: number | undefined) => {
        if (threadId !== undefined) {
            router.push(`/thread/${threadId.toString()}`);
        }
    };

    return (
        <div className={styles.container}>
            <Header config={config} next={`/user/${userposts.userid}`} />
            <main className={styles.main}>
                <div className={styles.pageContainer}>
                    <div className={styles.userInfo}>
                        <h2>User History</h2>
                        {userposts.username ?? <a onClick={(e) => e.stopPropagation()} style={{ color: 'blue', textDecoration: 'underline' }} href={`https://basescan.org/address/${userposts?.wallet}`}>{userposts?.wallet}</a>}
                    </div>
                    
                    <div className={styles.tabs}>
                        <button 
                            className={`${styles.tab} ${activeTab === 'questions' ? styles.active : ''}`}
                            onClick={() => setActiveTab('questions')}
                        >
                            Questions ({questions.length})
                        </button>
                        <button 
                            className={`${styles.tab} ${activeTab === 'answers' ? styles.active : ''}`}
                            onClick={() => setActiveTab('answers')}
                        >
                            Answers ({answers.length})
                        </button>
                    </div>

                    <div className={styles.postsContainer}>
                        {activeTab === 'questions' ? (
                            questions.map((post, index) => (
                                <div 
                                    key={index} 
                                    className={styles.postLink}
                                    onClick={() => handleNavigate(post.thread_id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Post post={post} eth_price={eth_price} />
                                </div>
                            ))
                        ) : (
                            answers.map((post, index) => (
                                <div 
                                    key={index} 
                                    className={styles.postLink}
                                    onClick={() => handleNavigate(post.thread_id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={styles.answerContext}>
                                        <div className={styles.parentTopic}>
                                            Re: {post.thread_topic}
                                        </div>
                                        <Post post={post} eth_price={eth_price} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}