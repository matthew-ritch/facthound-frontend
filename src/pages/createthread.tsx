import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useWriteContract } from 'wagmi';
import { simulateContract } from '@wagmi/core'
import { encodePacked, keccak256, createPublicClient, http, parseAbiItem } from 'viem';
import { publicClient } from '../client';
import api from '../utils/api';
import styles from '../styles/Login.module.css';
import Link from 'next/link';
import { config } from '../wagmi';
import { Navbar } from '../components/navbar';
import { parseUnits } from "ethers";

const FACTORY_ABI = [
    {"type":"constructor","inputs":[{"name":"_oracle","type":"address","internalType":"address"},{"name":"_asker_fee_per_10000","type":"uint16","internalType":"uint16"}],"stateMutability":"nonpayable"},
    {"type":"function","name":"asker_fee_per_10000","inputs":[],"outputs":[{"name":"","type":"uint16","internalType":"uint16"}],"stateMutability":"view"},
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
        "outputs": [], // Changed this - function doesn't return anything
        "stateMutability": "payable"
    },
    {"type":"function","name":"getQuestion","inputs":[{"name":"","type":"bytes32","internalType":"bytes32"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
    {"type":"function","name":"oracle","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
    {"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
    {"type":"function","name":"setOwner","inputs":[{"name":"_owner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},
    {"type":"function","name":"widthdraw","inputs":[],"outputs":[],"stateMutability":"nonpayable"},
    {"type":"event","name":"QuestionCreated","inputs":[{"name":"_asker","type":"address","indexed":true,"internalType":"address"},{"name":"_questionAddress","type":"address","indexed":true,"internalType":"address"},{"name":"_bounty","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false}
] as const;

// Add new state type at the top of the component
const TransactionStates = {
    IDLE: 'idle',
    PREPARING: 'preparing',
    AWAITING_SIGNATURE: 'awaiting_signature',
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error'
} as const;

export default function CreateThread() {
    const [threadDetails, setThreadDetails] = useState({
        topic: '',
        text: '',
        tags: '',
        questionAddress: '',
        bounty: '0'
    });
    const [error, setError] = useState('');
    const [waitingForTransaction, setWaitingForTransaction] = useState(false);
    const router = useRouter();
    const { address } = useAccount();
    const { data: hash, isPending, writeContract } = useWriteContract();
    const [transactionSuccess, setTransactionSuccess] = useState(false);
    const [transactionState, setTransactionState] = useState<typeof TransactionStates[keyof typeof TransactionStates]>(TransactionStates.IDLE);
    const [transactionError, setTransactionError] = useState('');

    const createQuestionHash = () => {
        if (!address) return null;
        return keccak256(
            encodePacked(
                ['address', 'string'],
                [address, threadDetails.text]
            )
        );
    };

    const resetTransactionState = () => {
        setTransactionState(TransactionStates.IDLE);
        setTransactionError('');
        setWaitingForTransaction(false);
        setTransactionSuccess(false); // Add this line
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (localStorage.getItem('token') == null) {
            router.push(`/login/`);
            return;
        }
        e.preventDefault();
        setTransactionState(TransactionStates.PREPARING);
        setTransactionError('');

        try {
            if (parseFloat(threadDetails.bounty) > 0) {
                const questionHash = createQuestionHash();
                
                // Set awaiting signature state before simulation
                setTransactionState(TransactionStates.AWAITING_SIGNATURE);

                try {
                    const { request } = await simulateContract(config, {
                        address: process.env.NEXT_PUBLIC_SEPOLIA_QUESTION_FACTORY as `0x${string}`,
                        abi: FACTORY_ABI,
                        functionName: 'createQuestion',
                        args: [questionHash ? questionHash : "0x"],
                        value: parseUnits(threadDetails.bounty, "ether")
                    });

                    

                    const unwatch = publicClient.watchContractEvent({
                        address: process.env.NEXT_PUBLIC_SEPOLIA_QUESTION_FACTORY as `0x${string}`,
                        abi: FACTORY_ABI,
                        eventName: 'QuestionCreated',
                        onLogs: async (logs) => {
                            const log = logs[0];
                            if (log) {
                                try {
                                    await submitToApi(log.args._questionAddress as string);
                                    setTransactionSuccess(true);
                                    setTransactionState(TransactionStates.SUCCESS);
                                } catch (err) {
                                    console.error('API submission failed:', err);
                                    setError('Failed to submit question to API');
                                    setTransactionState(TransactionStates.ERROR);
                                } finally {
                                    setWaitingForTransaction(false);
                                    unwatch(); // Stop watching for events
                                }
                            }
                        },
                    });

                    setTransactionState(TransactionStates.AWAITING_SIGNATURE);
                    
                    const txHash = await writeContract(request);
                    // After signature, set to pending state
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
            await submitToApi(undefined);

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

    // New function to handle API submission
    const submitToApi = async (contractAddress: string | undefined) => {
        const response = await api.post('/questions/api/question/', {
            topic: threadDetails.topic,
            text: threadDetails.text,
            tags: threadDetails.tags.split(',').map(tag => tag.trim()),
            questionAddress: contractAddress
        });

        if (response.message === 'success') {
            router.push(`/thread/${response.thread}`);
        } else {
            setError('Thread creation failed. Please try again.');
        }
    };

    // Replace the previous useEffect with this simpler version
    useEffect(() => {
        return () => {
            resetTransactionState();
        };
    }, []);

    // Replace the existing transaction status section with this new one
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
                                Transaction Hash: <a href={`https://sepolia.basescan.org/tx/${hash}`} 
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
            <Navbar config={config} />
            <form className={styles.form} onSubmit={handleSubmit}>
                <h1>Ask a Question</h1>
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.formGroup}>
                    <label htmlFor="topic">Topic</label>
                    <input
                        type="text"
                        id="topic"
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
                        step="0.00025"
                        min="0"
                        id="bounty"
                        value={threadDetails.bounty}
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