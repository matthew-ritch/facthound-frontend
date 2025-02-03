import { useRouter } from 'next/router'
import { useState, useEffect } from 'react';
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import styles from '../../styles/Home.module.css';
import loginStyles from '../../styles/Login.module.css';
import Post, { PostInfo } from '../../components/posts'
import { config } from '../../wagmi';
import { Navbar } from '../../components/navbar';
import api from '../../utils/api';
import { useAccount, useWriteContract, useDisconnect } from 'wagmi';
import { simulateContract } from '@wagmi/core'
import { encodePacked, keccak256 } from 'viem';
import { publicClient } from '../../client';
import Head from 'next/head';

interface Params {
    id: string;
}

interface Context {
    params: Params;
}

interface Thread {
    threadId: number,
    threadTopic: string,
    posts: Array<PostInfo>
}

export async function getServerSideProps(context: Context) {
    const { params } = context;
    const threadId = params?.id;
    // Fetch data from external API
    const res = await fetch(process.env.BACKEND_URL + `/api/questions/thread?threadId=${threadId}`);
    const thread: Thread = await res.json();
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
    return { props: { thread, eth_price } };
}

const QUESTION_ABI = [
    {
        "type": "function",
        "name": "createAnswer",
        "inputs": [
            {
                "name": "answerHash",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "event",
        "name": "AnswerCreated",
        "inputs": [
            {
                "name": "_answerer",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "_answerHash",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            }
        ],
        "anonymous": false
    },
    {
        "type": "function",
        "name": "selectAnswer",
        "inputs": [
            {
                "name": "answerHash",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "payoutAnswer",
        "inputs": [
            {
                "name": "answerHash",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
] as const;

export default function Page({
    thread,
    eth_price
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const [replyText, setReplyText] = useState('');
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [username, setUsername] = useState<string | undefined>(undefined);
    const [waitingForTransaction, setWaitingForTransaction] = useState(false);
    const { disconnect } = useDisconnect();
    const [transactionType, setTransactionType] = useState<'answer' | 'select' | 'payout' | null>(null);
    const [transactionComplete, setTransactionComplete] = useState(false);
    const [onchainAnswerProps, setOnchainAnswerProps] = useState({
        questionAddress: '' as `0x${string}`,
        answerHash: '' as `0x${string}`,
    });
    const [selectedAnswerProps, setSelectedAnswerProps] = useState({
        questionId: 0,
        answerId: 0,
        questionAddress: '' as `0x${string}`,
        answerHash: '' as `0x${string}`,
    });
    const { data: hash, isPending, writeContract } = useWriteContract();
    const router = useRouter();
    const { address } = useAccount();
    const [pendingTx, setPendingTx] = useState<`0x${string}` | null>(null);

    useEffect(() => {
        // Only access localStorage on the client side
        setUsername(window.localStorage?.getItem('username') ?? undefined);
    }, []);

    useEffect(() => {
        if (!pendingTx) return;

        const checkTransaction = async () => {
            try {
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: pendingTx
                });

                if (receipt.status === 'success') {
                    if (transactionType === 'answer') {
                        await submitToApi(onchainAnswerProps);
                    }
                    setTransactionComplete(true);
                } else {
                    setError('Transaction failed');
                }
            } catch (err) {
                setError('Transaction failed');
            } finally {
                setWaitingForTransaction(false);
                setPendingTx(null);
            }
        };

        checkTransaction();
    }, [pendingTx]);

    const createAnswerHash = () => {
        if (!address) return null;
        return keccak256(
            encodePacked(
                ['address', 'string'],
                [address, replyText]
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Check if user is logged in
            if (window.localStorage?.getItem('token') == null) {
                router.push(`/login/`);
                return;
            }

            // Check API availability + token validity
            try {
                const check = await api.get('/api/auth/who_am_i/');
                console.log(check)
                if (check.code == 'token_not_valid') { 
                    localStorage.removeItem('token')
                    localStorage.removeItem('refresh')
                    disconnect();
                    setError('Authentication error. Your session has expired. Please log back in.');
                    return; }
            } catch (authError) {
                console.error('Authentication check failed:', authError);
                localStorage.removeItem('token')
                localStorage.removeItem('refresh')
                disconnect();
                setError('Authentication error. Your session has expired. Please log back in.');
                return;
            }

            if (!selectedQuestionId) {
                await submitToApi();
                return;
            }

            const selectedPost = thread.posts.find(p => p.question_id === selectedQuestionId);
            if (!selectedPost) {
                setError('Invalid question selected');
                return;
            }

            // Check if this is a question that requires on-chain verification
            if (selectedPost.question_address) {
                if (!address) {
                    setError('Please connect your wallet to answer this question');
                    return;
                }

                const answerHash = createAnswerHash();
                const questionAddress = selectedPost.question_address as `0x${string}`;

                try {
                    setOnchainAnswerProps({
                        answerHash: answerHash ? answerHash : "0x",
                        questionAddress
                    });

                    const { request } = await simulateContract(config, {
                        address: questionAddress,
                        abi: QUESTION_ABI,
                        functionName: 'createAnswer',
                        args: [answerHash ? answerHash : "0x"]
                    });

                    setTransactionType('answer');
                    setWaitingForTransaction(true);
                    writeContract(request);
                } catch (contractError: any) {
                    console.error('Contract interaction failed:', contractError);
                    setError(contractError.message || 'Failed to interact with smart contract');
                    setWaitingForTransaction(false);
                }
                return;
            }

            // If we get here, this is a regular question without blockchain verification
            await submitToApi();

        } catch (err: any) {
            console.error('Submission error:', err);
            setWaitingForTransaction(false);
            setError(
                err.message ||
                err.response?.data?.detail ||
                err.response?.data?.non_field_errors?.[0] ||
                'Network error. Please check your connection and try again.'
            );
        }
    };

    useEffect(() => {
        if (hash) {
            setPendingTx(hash);
        }
    }, [hash]);

    const submitToApi = async (props?: {
        answerHash: `0x${string}`,
        questionAddress: `0x${string}`
    }) => {
        const basePayload = {
            thread: thread.threadId,
            text: replyText,
            question: selectedQuestionId
        };

        const payload = props
            ? { ...basePayload, answerHash: props.answerHash, questionAddress: props.questionAddress }
            : basePayload;


        const response = await api.post(
            selectedQuestionId ? '/api/questions/answer/' : '/api/questions/post/',
            payload
        );


        if (response.message.includes('success')) {
            router.reload();
        } else {
            console.error('API submission failed:', response);
            setError('Reply failed. Please try again.');
        }
    };

    const handleAnswer = (questionId: number) => {
        setSelectedQuestionId(questionId);
        window.scrollTo(0, document.body.scrollHeight);
    };

    const handleSelectAnswer = async (questionId: number, answerId: number, questionAddress?: string, answerHash?: string) => {
        // For blockchain questions, require wallet connection
        if (questionAddress && answerHash) {
            if (!address) {
                setError('Please connect your wallet');
                return;
            }

            try {
                const formattedHash = `0x${answerHash.replace('0x', '').padStart(64, '0')}` as `0x${string}`;

                const contract = {
                    address: questionAddress as `0x${string}`,
                    abi: QUESTION_ABI
                };

                const { request } = await simulateContract(config, {
                    ...contract,
                    functionName: 'selectAnswer',
                    args: [formattedHash]
                });

                setSelectedAnswerProps({
                    questionId,
                    answerId,
                    questionAddress: questionAddress as `0x${string}`,
                    answerHash: formattedHash
                });

                setTransactionType('select');
                setWaitingForTransaction(true);
                writeContract(request);
            } catch (err: any) {
                console.error('Select answer error:', err);
                setError(err.message || 'Failed to select answer');
            }
        } else {
            // For non-blockchain questions, just check if user is logged in
            if (!window.localStorage?.getItem('token')) {
                router.push('/login/');
                return;
            }

            try {
                await api.post('/api/questions/selection/', {
                    question: questionId,
                    answer: answerId
                });
                router.reload();
            } catch (err: any) {
                console.error('Select answer error:', err);
                setError(err.message || 'Failed to select answer');
            }
        }
    };

    // Add effect to handle successful transactions
    useEffect(() => {
        const handleTransactionSuccess = async () => {
            if (!transactionComplete) return;

            try {
                switch (transactionType) {
                    case 'select':
                        if (selectedAnswerProps.questionId) {
                            await api.post('/api/questions/selection/', {
                                question: selectedAnswerProps.questionId,
                                answer: selectedAnswerProps.answerId
                            });
                        }
                        break;
                }

                // Reset states
                setTransactionType(null);
                setTransactionComplete(false);
                router.reload();
            } catch (err) {
                console.error('Failed to submit to API:', err);
                setError('Failed to record transaction');
            }
        };

        handleTransactionSuccess();
    }, [transactionComplete]);

    return (
        <div className={styles.container}>
            <Head>
                <title>FactHound</title>
                <meta
                    content="FactHound"
                    name="FactHound"
                />
                <link href="static/favicon.ico" rel="icon" />
            </Head>
            <Navbar config={config} />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.threadTitle}>
                        <h1>{thread.threadTopic}</h1>
                        <hr className={styles.divider} />
                    </div>
                    <div className={styles.thread}>
                        {thread.posts.map(k => (
                            <Post
                                post={k}
                                eth_price={eth_price}
                                key={k.id}
                                onAnswer={handleAnswer}
                                onSelectAnswer={handleSelectAnswer}
                                userAddress={address}
                                userName={username}
                            />
                        ))}
                    </div>
                    <div className={styles.replyContainer}>
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
                                <button type="button" onClick={() => {
                                    setSelectedQuestionId(null);
                                }}>
                                    Cancel Answer
                                </button>
                            )}
                        </form>
                    </div>
                    <div className={styles.transactionStatus}>
                        {hash && (
                            <div className={styles.statusItem}>
                                <span className={styles.statusLabel}>Transaction Hash:</span>
                                <span className={styles.statusValue}>{hash}</span>
                            </div>
                        )}
                        {isPending && (
                            <div className={styles.statusItem}>
                                <span className={styles.statusPending}>Waiting for confirmation...</span>
                            </div>
                        )}
                        {transactionComplete && (
                            <div className={styles.statusItem}>
                                <span className={styles.statusSuccess}>Transaction Confirmed! ✓</span>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}