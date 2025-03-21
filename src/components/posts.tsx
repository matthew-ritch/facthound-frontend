import styles from '../styles/Home.module.css';
import { formatUnits } from "ethers";

/**
 * Interface representing a forum post's information
 */
export interface PostInfo {
    id: number;
    text: string;
    dt: string;
    poster_id: number;
    poster_name: number;
    poster_wallet: string;
    question_id: number;
    contract_address: string;
    question_status: string;
    question_hash: string;
    bounty: number | null;
    asker_address: string;
    asker_username: string;
    answer_status: string;
    answer_id: number | null;
    answer_hash: string | null;
    thread_id?: number;
    thread_topic?: string;
}

/**
 * Props for the Post component
 */
type PostProps = {
    post: PostInfo;
    eth_price: number;
    onAnswer?: (questionId: number) => void;
    onSelectAnswer?: (questionId: number, answerId: number, questionHash?: string, answerHash?: string) => void;
    userAddress?: string;
    userName?: string;
}

/**
 * Converts URLs in text to clickable links
 * 
 * @param text - Text content that may contain URLs
 * @returns An array of elements with URLs converted to anchor tags
 */
function convertUrlsToLinks(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            return <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
            >{part}</a>;
        }
        return part;
    });
}

/**
 * Formats a date string into a human-readable format
 * 
 * @param dateStr - Date string to format
 * @returns Formatted date and time string
 */
function formatDateTime(dateStr: string) {
    try {
        // Handle ISO string or fall back to direct parsing
        const date = dateStr.endsWith('Z') ? new Date(dateStr) : new Date(dateStr + 'Z');

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        }).format(date);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

/**
 * Renders a post with its content, metadata, and associated actions
 * 
 * @param post - The post information to display
 * @param eth_price - Current ETH price in USD for bounty conversion
 * @param onAnswer - Callback function when user wants to answer a question
 * @param onSelectAnswer - Callback function when user selects an answer
 * @param userAddress - Current user's wallet address
 * @param userName - Current user's username
 * @returns A post component with content, metadata, and action options
 */
export default function Post({
    post,
    eth_price,
    onAnswer,
    onSelectAnswer,
    userAddress,
    userName
}: PostProps) {
    const isAnswerableQuestion = post.question_id && post.answer_id === null && onAnswer;
    const isAnswer = post.question_id !== null && post.answer_id !== null;
    const canSelectOnChain = post.question_id !== null && post.answer_id !== null && post.question_hash && post.answer_hash && userAddress === post.asker_address;
    const canSelectOffChain = post.question_id !== null &&
        post.answer_id !== null &&
        !post.question_hash &&
        !post.answer_hash &&
        ((userName &&
            userName === post.asker_username) ||
            (userAddress &&
                userAddress === post.asker_address));
    const handleClick = () => {
        if (isAnswerableQuestion && onAnswer) {
            onAnswer(post.question_id);
        } else if (onSelectAnswer && (canSelectOnChain || canSelectOffChain)) {
            onSelectAnswer(
                post.question_id!,
                post.answer_id!,
                post.question_hash,
                post.answer_hash ?? undefined
            );
        }
    };

    return (
        <div
            className={`${styles.card} 
                ${isAnswerableQuestion ? styles.clickable : ''} 
                ${isAnswer ? styles.answerPost : ''} 
                ${post.answer_status && ['SE', 'PO', 'CE'].includes(post.answer_status) ? styles.selectedAnswer : ''}`}
            onClick={handleClick}
            style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}
        >
            <div>
                {(onAnswer || onSelectAnswer) && (<a onClick={(e) => e.stopPropagation()} href={`/user/${post.poster_id}`}> {post.poster_name ?? `${post.poster_wallet.slice(0, 4)}...${post.poster_wallet.slice(-4)}`}</a>)}
                {(!onAnswer && !onSelectAnswer) && (post.poster_name ?? `${post.poster_wallet.slice(0, 4)}...${post.poster_wallet.slice(-4)}`)}
                <span className={styles.dateTime}>({formatDateTime(post.dt)})</span>:
            </div>

            <div style={{ marginTop: '1rem' }}>
                {convertUrlsToLinks(post.text)}
            </div>

            {(post.question_id !== null && post.answer_id === null) && (
                <div className={styles.questionLabel}>
                    {onAnswer && `Click to answer`}
                    {post.bounty && post.bounty > 0 && (
                        <div>Bounty: ${(eth_price * parseFloat(formatUnits(post.bounty, "ether"))).toFixed(2)} USD. <a onClick={(e) => e.stopPropagation()} href={`https://basescan.org/address/${post.contract_address}`}>Contract</a></div>
                    )}
                </div>
            )}
            {(post.question_id !== null && post.answer_id !== null) && (
                <div>
                    <div className={styles.questionLabel}>
                        {(post.answer_status === "SE" || post.answer_status === "PO" || post.answer_status === "CE") ?
                            'Selected Answer' : 'Answer'
                        }
                    </div>
                    {onSelectAnswer && (canSelectOnChain || canSelectOffChain) && (post.question_status === "OP") && <div className={styles.questionLabel}>
                        Click to select answer
                    </div>}
                </div>
            )}
        </div>
    );
}