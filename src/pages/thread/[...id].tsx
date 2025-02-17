import { useRouter } from 'next/router'
import Link from 'next/link';
import type { InferGetServerSidePropsType } from 'next'
import { useState, useEffect } from 'react';

import { useAccount, useWriteContract, useDisconnect } from 'wagmi';
import { simulateContract } from '@wagmi/core'
import { encodePacked, keccak256 } from 'viem';

import { Header } from '../../components/header';
import Post, { PostInfo } from '../../components/posts'
import api from '../../utils/api';
import { config } from '../../wagmi';
import { publicClient } from '../../client';

import styles from '../../styles/Home.module.css';
import loginStyles from '../../styles/Login.module.css';
import { Contract } from 'ethers';

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
    const threadId = params?.id[0];
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

const FACTHOUND_ABI = [
    {
        "type": "function",
        "name": "createAnswer",
        "inputs": [
            {
                "name": "questionHash",
                "type": "bytes32",
                "internalType": "bytes32"
            },
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
        "name": "selectAnswer",
        "inputs": [
            {
                "name": "questionHash",
                "type": "bytes32",
                "internalType": "bytes32"
            },
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
        "name": "redeemAnswer",
        "inputs": [
            {
                "name": "questionHash",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
] as const;

// Add this utility function after the ABI definition
const convertToBytes32 = (hexString: string): `0x${string}` => {
    // Remove '0x' if present and ensure the string is 64 characters
    const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    if (cleanHex.length !== 64) {
        throw new Error('Invalid hex string length');
    }
    return `0x${cleanHex}` as `0x${string}`;
};

export default function Page({
    thread,
    eth_price
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(thread.posts[0].question_id);
    const [error, setError] = useState('');
    const [username, setUsername] = useState<string | undefined>(undefined);
    const [waitingForTransaction, setWaitingForTransaction] = useState(false);
    const { disconnect } = useDisconnect();
    const [transactionType, setTransactionType] = useState<'answer' | 'select' | 'payout' | null>(null);
    const [transactionComplete, setTransactionComplete] = useState(false);
    const [onchainAnswerProps, setOnchainAnswerProps] = useState({
        contractAddress: '' as `0x${string}`,
        questionHash: '' as `0x${string}`,
        answerHash: '' as `0x${string}`,
    });
    const [selectedAnswerProps, setSelectedAnswerProps] = useState({
        questionId: 0,
        answerId: 0,
        questionHash: '' as `0x${string}`,
        answerHash: '' as `0x${string}`,
    });
    const { data: hash, isPending, writeContract } = useWriteContract();
    const router = useRouter();
    const { address, status } = useAccount();
    const [pendingTx, setPendingTx] = useState<`0x${string}` | null>(null);
    const is_onchain = thread.posts.find(p => p.question_hash) ? true : false;
    const wallet_disconnected = status === 'disconnected';

    // monitor tx state
    useEffect(() => {
        if (!pendingTx) return;

        const checkTransaction = async () => {
            try {
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: pendingTx
                });

                if (receipt.status === 'success') {
                    setTransactionComplete(true);
                } else {
                    console.error('Transaction failed:', receipt);
                    setError('Transaction failed');
                }
            } catch (err) {
                console.error('Transaction check failed:', err);
                setError('Transaction failed');
            } finally {
                setWaitingForTransaction(false);
                setPendingTx(null);
            }
        };

        checkTransaction();
    }, [pendingTx]);

    // are we authenticated?
    useEffect(() => {
        setIsAuthenticated(localStorage.getItem('token') != null);
        setUsername(localStorage.getItem('username')?? undefined);
    }, [address, typeof window !== 'undefined' && localStorage.getItem('token')]);

    const createAnswerHash = () => {
        if (!address) return null;
        // Pack and hash the data to ensure bytes32 output
        const packed = encodePacked(
            ['address', 'string'],
            [address, replyText]
        );
        // Hash the packed data to get bytes32
        const hash = keccak256(packed);
        return hash;
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
                if (check.code == 'token_not_valid') {
                    localStorage.removeItem('token')
                    localStorage.removeItem('refresh')
                    disconnect();
                    setError('Authentication error. Your session has expired. Please log back in.');
                    return;
                }
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
            if (selectedPost.question_hash) {
                if (!address) {
                    setError('Please connect your wallet');
                    return;
                }

                const answerHash = createAnswerHash();
                const questionHashBytes32 = convertToBytes32(selectedPost.question_hash);

                try {
                    setOnchainAnswerProps({
                        contractAddress: process.env.NEXT_PUBLIC_BASE_MAINNET_FACTHOUND as `0x${string}`,
                        answerHash: answerHash ? answerHash : "0x",
                        questionHash: questionHashBytes32
                    });

                    const { request } = await simulateContract(config, {
                        address: process.env.NEXT_PUBLIC_BASE_MAINNET_FACTHOUND as `0x${string}`,
                        abi: FACTHOUND_ABI,
                        functionName: 'createAnswer',
                        args: [questionHashBytes32, answerHash ? answerHash as `0x${string}` : "0x" as `0x${string}`]
                    });

                    setTransactionType('answer');
                    setWaitingForTransaction(true);
                    writeContract(request);
                    const response = await submitToApi({
                        contractAddress: process.env.NEXT_PUBLIC_BASE_MAINNET_FACTHOUND as `0x${string}`,
                        questionHash: questionHashBytes32,
                        answerHash: answerHash ? answerHash : "0x",
                    });
                } catch (contractError: any) {
                    console.error('Contract simulation failed:', {
                        error: contractError,
                        message: contractError.message,
                        details: contractError.details,
                        code: contractError.code
                    });
                    setError(contractError.message || 'Failed to interact with smart contract');
                    setWaitingForTransaction(false);
                }
                return;
            }

            // If we get here, this is a regular question without blockchain verification
            await submitToApi();

        } catch (err: any) {
            console.error('Submission error details:', {
                error: err,
                message: err.message,
                response: err.response?.data,
                stack: err.stack
            });
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
        contractAddress: `0x${string}`,
        answerHash: `0x${string}`,
        questionHash: `0x${string}`
    }) => {
        const basePayload = {
            thread: thread.threadId,
            text: replyText,
            question: selectedQuestionId
        };

        const payload = props
            ? { ...basePayload, answerHash: props.answerHash, questionHash: props.questionHash, contractAddress: props.contractAddress }
            : basePayload;


        const response = await api.post(
            selectedQuestionId ? '/api/questions/answer/' : '/api/questions/post/',
            payload
        );


        if (!response.message.includes('success')) {
            console.error('API submission failed:', response);
            setError('Reply failed. Please try again.');
        }
        if ((props ? false : true) && response.message.includes('success')) {
            router.reload();
        }
    };

    const handleAnswer = (questionId: number) => {
        setSelectedQuestionId(questionId);
        window.scrollTo(0, document.body.scrollHeight);
    };

    const handleSelectAnswer = async (questionId: number, answerId: number, questionHash?: string, answerHash?: string) => {
        // For blockchain questions, require wallet connection
        if (questionHash && answerHash) {
            if (!address) {
                setError('Please connect your wallet');
                return;
            }

            try {
                const formattedAnswerHash = convertToBytes32(answerHash);
                const formattedQuestionHash = convertToBytes32(questionHash);

                const { request } = await simulateContract(config, {
                    address: process.env.NEXT_PUBLIC_BASE_MAINNET_FACTHOUND as `0x${string}`,
                    abi: FACTHOUND_ABI,
                    functionName: 'selectAnswer',
                    args: [formattedQuestionHash, formattedAnswerHash]
                });

                setSelectedAnswerProps({
                    questionId,
                    answerId,
                    questionHash: formattedQuestionHash,
                    answerHash: formattedAnswerHash
                });

                setTransactionType('select');
                setWaitingForTransaction(true);
                writeContract(request);

                // API call to record selection
                await api.post('/api/questions/selection/', {
                    question: questionId,
                    answer: answerId
                });
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
                            await api.post('/api/questions/confirm/', {
                                contractAddress: process.env.NEXT_PUBLIC_BASE_MAINNET_FACTHOUND as `0x${string}`,
                                questionHash: selectedAnswerProps.questionHash,
                                answerHash: selectedAnswerProps.answerHash,
                                confirmType: 'selection'
                            });
                        }
                        break;
                    case 'answer':
                        await api.post('/api/questions/confirm/', {
                            contractAddress: onchainAnswerProps.contractAddress,
                            questionHash: onchainAnswerProps.questionHash,
                            answerHash: onchainAnswerProps.answerHash,
                            confirmType: 'answer'
                        });
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
    }, [transactionComplete, transactionType, selectedAnswerProps, onchainAnswerProps]);

    return (
        <div className={styles.container}>
            <Header config={config} next={`/thread/${thread.threadId}`} />
            <main className={styles.main}>
                <div className={styles.container} style={{ paddingTop: '30px' }}>
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

                            {(!is_onchain && !isAuthenticated) && (
                                <div className={loginStyles.loginMessage}>
                                    Please <Link href={`/login?next=/thread/${thread.threadId}`}>log in</Link> to answer
                                </div>
                            )}
                            {(wallet_disconnected && is_onchain && !isAuthenticated) && (
                                <div className={loginStyles.loginMessage}>
                                    Please connect your wallet to answer a question with a bounty
                                </div>
                            )}

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
                                    disabled={!isAuthenticated || (address == null && is_onchain)}
                                    title={!isAuthenticated ? "Please log in to answer" : ""}
                                />
                            </div>
                            <button type="submit" disabled={!isAuthenticated || (address == null && is_onchain)}>
                                {selectedQuestionId ? 'Submit Answer' : 'Reply'}
                            </button>
                            {selectedQuestionId && (
                                <button
                                    type="button"
                                    disabled={!isAuthenticated || (address == null && is_onchain)}
                                    onClick={() => {
                                        setSelectedQuestionId(null);
                                    }}
                                >
                                    Post a reply instead
                                </button>
                            )}
                        </form>
                    </div>
                    {(hash || isPending || transactionComplete) && (<div className={styles.transactionStatus}>
                        {hash && (
                            <div className={styles.statusItem}>
                                <span className={styles.statusLabel}>Transaction Hash: <a href={`https://basescan.org/tx/${hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    {`${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`}
                                </a></span>
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
                    </div>)}
                </div>
            </main>
        </div>
    )
}