import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useWriteContract, useDisconnect } from 'wagmi';
import { simulateContract } from '@wagmi/core'
import { encodePacked, keccak256, createPublicClient, http, parseAbiItem } from 'viem';
import { publicClient } from '../client';
import api from '../utils/api';
import styles from '../styles/Login.module.css';
import Link from 'next/link';
import { config } from '../wagmi';
import { parseUnits } from "ethers";
import { Header } from '../components/header';

/**
 * Facthound smart contract ABI for creating questions with bounties
 */
const FACTHOUND_ABI = [
    {
        "type": "function",
        "name": "createQuestion",
        "inputs": [
            {
                "name": "questionHash",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [],
        "stateMutability": "payable"
    }
] as const;

/**
 * Transaction state enum to track the lifecycle of on-chain transactions
 */
const TransactionStates = {
    IDLE: 'idle',
    PREPARING: 'preparing',
    AWAITING_SIGNATURE: 'awaiting_signature',
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error'
} as const;

/**
 * Thread creation page component
 * Allows users to create new questions with optional ETH bounties
 * Handles on-chain interactions for bounty creation
 */
export default function CreateThread() {
    const [threadDetails, setThreadDetails] = useState({
        topic: '',
        text: '',
        tags: '',
        contractAddress: '',
        bounty: '0'
    });
    const [error, setError] = useState('');
    const [waitingForTransaction, setWaitingForTransaction] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const router = useRouter();
    const { address } = useAccount();
    const { data: hash, isPending, writeContract } = useWriteContract();
    const { disconnect } = useDisconnect();
    const [transactionSuccess, setTransactionSuccess] = useState(false);
    const [transactionState, setTransactionState] = useState<typeof TransactionStates[keyof typeof TransactionStates]>(TransactionStates.IDLE);
    const [transactionError, setTransactionError] = useState('');
    const [pendingTx, setPendingTx] = useState<`0x${string}` | null>(null);

    /**
     * Creates a unique hash for the question to be stored on-chain
     * @returns bytes32 hash of address and question text
     */
    const createQuestionHash = () => {
        if (!address) return null;
        return keccak256(
            encodePacked(
                ['address', 'string'],
                [address, threadDetails.text]
            )
        );
    };

    /**
     * Resets transaction state and error messages
     */
    const resetTransactionState = () => {
        setTransactionState(TransactionStates.IDLE);
        setTransactionError('');
        setWaitingForTransaction(false);
        setTransactionSuccess(false); // Add this line
    };

    /**
     * Handles question submission
     * Routes to appropriate flow based on whether there's a bounty
     * @param e - Form submission event
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (localStorage.getItem('token') == null) {
            router.push(`/login/`);
            return;
        }
        // Check API availability y + token validity
        try {
            const check = await api.get('/api/auth/who_am_i/');
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

        setTransactionState(TransactionStates.PREPARING);
        setTransactionError('');

        try {
            if (parseFloat(threadDetails.bounty) > 0) {
                const questionHash = createQuestionHash();

                // Set awaiting signature state before simulation
                setTransactionState(TransactionStates.AWAITING_SIGNATURE);

                try {
                    const contractAddress = process.env.NEXT_PUBLIC_BASE_MAINNET_FACTHOUND as `0x${string}`;
                    const { request } = await simulateContract(config, {
                        address: contractAddress,
                        abi: FACTHOUND_ABI,
                        functionName: 'createQuestion',
                        args: [questionHash ? questionHash : "0x"],
                        value: parseUnits(threadDetails.bounty, "ether")
                    });

                    setTransactionState(TransactionStates.AWAITING_SIGNATURE);
                    await writeContract(request);
                    if (hash) setPendingTx(hash); // Set pending transaction hash
                    const response = await submitToApi(contractAddress);
                    setTransactionState(TransactionStates.PENDING);

                } catch (err: any) {
                    // Handle user rejection or other wallet errors
                    console.error('Transaction error:', err);
                    if (err.message.includes('User rejected') || err.code === 'ACTION_REJECTED') {
                        setTransactionError('Transaction was rejected');
                        resetTransactionState();
                    } else {
                        setTransactionState(TransactionStates.ERROR);
                        setTransactionError(err.message || 'Transaction failed');
                    }
                    return;
                }
                return;
            }

            // If no bounty, proceed directly with API call
            const response = await submitToApi(undefined);
            if (response.message === 'success') {
                router.push(`/thread/${response.thread}`);
            } else {
                setError('Thread creation failed. Please try again.');
            }

        } catch (err: any) {
            setWaitingForTransaction(false); // Reset waiting state on error
            setTransactionState(TransactionStates.ERROR);
            setTransactionError(err.message || 'Transaction failed');
            setError(
                err.message ||
                err.response?.data?.detail ||
                err.response?.data?.non_field_errors?.[0] ||
                'Thread creation failed. Please try again.'
            );
        }
    };

    /**
     * Submits question data to the API
     * @param contractAddress - Optional address of contract if using bounty
     * @returns API response
     */
    const submitToApi = async (contractAddress: string | undefined) => {
        const response = await api.post('/api/questions/question/', {
            topic: threadDetails.topic,
            text: threadDetails.text,
            tags: threadDetails.tags.split(',').map(tag => tag.trim()),
            contractAddress: contractAddress??'',
            questionHash: contractAddress?createQuestionHash():'',
        });

        return response
    };

    // Add effect to monitor transaction status
    useEffect(() => {
        if (!pendingTx) return;

        const checkTransaction = async () => {
            try {
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: pendingTx
                });

                if (receipt.status === 'success') {
                    try {
                        // Submit confirmation to API after successful transaction
                        const response = await api.post('/api/questions/confirm/', {
                            transactionHash: pendingTx,
                            confirmType: 'question',
                            questionHash: createQuestionHash()
                        });
                        if (response.message === 'Success') {
                            setTransactionSuccess(true);
                            setTransactionState(TransactionStates.SUCCESS);
                            router.push(`/thread/${response.thread}`);
                        } else {
                            setError('Thread creation failed. Please try again.');
                        }
                        
                    } catch (err) {
                        console.error('Confirm submission failed:', err);
                        setError('Failed to submit question to API');
                        setTransactionState(TransactionStates.ERROR);
                    }
                } else {
                    setTransactionState(TransactionStates.ERROR);
                    setTransactionError('Transaction failed');
                }
            } catch (err) {
                setTransactionState(TransactionStates.ERROR);
                setTransactionError('Failed to confirm transaction');
            } finally {
                setWaitingForTransaction(false);
                setPendingTx(null);
            }
        };

        checkTransaction();
    }, [pendingTx]);

    useEffect(() => {
        return () => {
            resetTransactionState();
        };
    }, []);

    useEffect(() => {
        if (hash) {
            setPendingTx(hash);
        }
    }, [hash]);

    // are we authenticated?
    useEffect(() => {
        setIsAuthenticated(localStorage.getItem('token') != null );
    }, [address, typeof window !== 'undefined' && localStorage.getItem('token')]);

    /**
     * Renders transaction status UI based on current state
     * @returns Transaction status component
     */
    const renderTransactionStatus = () => {
        switch (transactionState) {
            case TransactionStates.PREPARING:
                return (
                    <div className={styles.transactionStatus}>
                        <div className={styles.statusMessage}>
                            Preparing your transaction...
                        </div>
                    </div>
                );
            case TransactionStates.AWAITING_SIGNATURE:
                return (
                    <div className={styles.transactionStatus}>
                        <div className={styles.statusMessage}>
                            Please sign the transaction in your wallet...
                        </div>
                    </div>
                );
            case TransactionStates.PENDING:
                return (
                    <div className={styles.transactionStatus}>
                        <div className={styles.statusMessage}>
                            Transaction in progress...
                            {hash && <div className={styles.hashDisplay}>
                                Transaction Hash: <a href={`https://basescan.org/tx/${hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    {`${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`}
                                </a>
                            </div>}
                        </div>
                    </div>
                );
            case TransactionStates.SUCCESS:
                return (
                    <div className={`${styles.transactionStatus} ${styles.success}`}>
                        <div className={styles.statusMessage}>
                            Transaction Successful! ✓
                        </div>
                    </div>
                );
            case TransactionStates.ERROR:
                return (
                    <div className={`${styles.transactionStatus} ${styles.error}`}>
                        <div className={styles.statusMessage}>
                            Transaction Failed: {transactionError}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    return (
        <div className={styles.container}>
            <meta name="description" content="Facthound is a truth-seeking missile."></meta>
            <Header config={config} next={"/createthread"} />
            <form className={styles.form} onSubmit={handleSubmit}>
                <h1>Ask a Question</h1>
                {!isAuthenticated && (
                    <div className={styles.loginMessage}>
                        Please <Link href={`/login?next=/createthread`}>log in</Link> to ask a question
                    </div>
                )}
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.formGroup}>
                    <label htmlFor="topic">Topic</label>
                    <input
                        type="text"
                        id="topic"
                        disabled={!isAuthenticated}
                        title={!isAuthenticated ? "Please log in to ask a question" : ""}
                        value={threadDetails.topic}
                        onChange={(e) => setThreadDetails({
                            ...threadDetails,
                            topic: e.target.value
                        })}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="text">Text</label>
                    <textarea
                        className={styles.postText}
                        id="text"
                        disabled={!isAuthenticated}
                        title={!isAuthenticated ? "Please log in to ask a question" : ""}
                        value={threadDetails.text}
                        onChange={(e) => setThreadDetails({
                            ...threadDetails,
                            text: e.target.value
                        })}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="tags">Tags (comma separated)</label>
                    <input
                        type="text"
                        id="tags"
                        disabled={!isAuthenticated}
                        title={!isAuthenticated ? "Please log in to ask a question" : ""}
                        value={threadDetails.tags}
                        onChange={(e) => setThreadDetails({
                            ...threadDetails,
                            tags: e.target.value
                        })}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="bounty">Bounty (ETH)</label>
                    <input
                        type="number"
                        step="0.00001"
                        min="0"
                        id="bounty"
                        value={threadDetails.bounty}
                        disabled={address == null}
                        title={address == null ? "Connect a wallet to post a bounty" : ""}
                        onChange={(e) => setThreadDetails({
                            ...threadDetails,
                            bounty: e.target.value
                        })}
                    />
                </div>
                <button type="submit" disabled={transactionState !== TransactionStates.IDLE}>
                    {transactionState === TransactionStates.IDLE ? 'Create Thread' : 'Processing...'}
                </button>
            </form>

            {renderTransactionStatus()}

            <div className={styles.linkdiv}>
                <Link href={`..`} className={styles.buttonlink}>
                    Home
                </Link>
            </div>
        </div>

    );
}