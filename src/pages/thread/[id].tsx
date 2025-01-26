import { useRouter } from 'next/router'
import { useState, useEffect } from 'react';
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import styles from '../../styles/Home.module.css';
import loginStyles from '../../styles/Login.module.css';
import Post, { PostInfo } from '../../components/posts'
import { config } from '../../wagmi';
import { Navbar } from '../../components/navbar';
import api from '../../utils/api';
import { useAccount, useWriteContract } from 'wagmi';
import { simulateContract } from '@wagmi/core'
import { encodePacked, keccak256 } from 'viem';
import { publicClient } from '../../client';

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
    }
] as const;

export default function Page({
    thread,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const [replyText, setReplyText] = useState('');
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [waitingForTransaction, setWaitingForTransaction] = useState(false);
    const [transactionSuccess, setTransactionSuccess] = useState(false);
    const [onchainAnswerProps, setOnchainAnswerProps] = useState({
        questionAddress: '' as `0x${string}`,
        answerHash: '' as `0x${string}`,
    });
    const { data: hash, isPending, writeContract } = useWriteContract();
    const router = useRouter();
    const { address } = useAccount();
    const [pendingTx, setPendingTx] = useState<`0x${string}` | null>(null);

    useEffect(() => {
        if (!pendingTx) return;
        console.log('Transaction monitoring started for hash:', pendingTx);

        const checkTransaction = async () => {
            console.log('Checking transaction status...');
            try {
                console.log('Waiting for receipt...');
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: pendingTx
                });
                console.log('Receipt received:', receipt);

                if (receipt.status === 'success') {
                    console.log('Transaction successful, submitting to API...');
                    await submitToApi(onchainAnswerProps);
                    setTransactionSuccess(true);
                    console.log('API submission complete');
                } else {
                    console.error('Transaction failed with receipt:', receipt);
                    setError('Transaction failed');
                }
            } catch (err) {
                console.error('Transaction monitoring error:', err);
                setError('Transaction failed');
            } finally {
                console.log('Transaction monitoring complete');
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
        if (localStorage.getItem('token') == null) {
            console.log('No token found, redirecting to login');
            router.push(`/login/`);
            return;
        }
        e.preventDefault();

        if (!selectedQuestionId) {
            console.log('No question selected, proceeding with regular post');
            await submitToApi();
            return;
        }

        try {
            const selectedPost = thread.posts.find(p => p.question_id === selectedQuestionId);
            if (!selectedPost) {
                console.error('Selected post not found:', selectedQuestionId);
                setError('Invalid question selected');
                return;
            }
            console.log('Selected post:', selectedPost);

            // Check if this is a question that requires on-chain verification
            if (selectedPost.question_address) {
                if (!address) {
                    setError('Please connect your wallet to answer this question');
                    return;
                }

                console.log('Preparing on-chain answer submission');
                const answerHash = createAnswerHash();
                console.log('Generated answer hash:', answerHash);

                const questionAddress = selectedPost.question_address as `0x${string}`;

                setOnchainAnswerProps({
                    answerHash: answerHash ? answerHash : "0x",
                    questionAddress
                });

                console.log('Simulating contract interaction...');
                const { request } = await simulateContract(config, {
                    address: questionAddress,
                    abi: QUESTION_ABI,
                    functionName: 'createAnswer',
                    args: [answerHash ? answerHash : "0x"]
                });
                console.log('Contract simulation successful');

                setWaitingForTransaction(true);
                console.log('Initiating contract write...');
                writeContract(request);
                return;
            }

            // If we get here, this is a regular question without blockchain verification
            console.log('Proceeding with direct API submission');
            await submitToApi();

        } catch (err: any) {
            console.error('Submission error:', err);
            setWaitingForTransaction(false);
            setError(
                err.message ||
                err.response?.data?.detail ||
                err.response?.data?.non_field_errors?.[0] ||
                'Reply failed. Please try again.'
            );
        }
    };

    useEffect(() => {
        if (hash) {
            console.log('New transaction hash received:', hash);
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

        console.log('Submitting to API with payload:', payload);

        const response = await api.post(
            selectedQuestionId ? '/questions/api/answer/' : '/questions/api/post/',
            payload
        );

        console.log('API response:', response);

        if (response.message.includes('success')) {
            console.log('API submission successful, reloading page');
            router.reload();
        } else {
            console.error('API submission failed:', response);
            setError('Reply failed. Please try again.');
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
                        {hash && <div>Transaction Hash: {hash}</div>}
                        {isPending && <div>Waiting for confirmation...</div>}
                        {transactionSuccess && <div>Transaction Confirmed!</div>}
                    </form>
                </div>
            </main>
        </div>
    )
}