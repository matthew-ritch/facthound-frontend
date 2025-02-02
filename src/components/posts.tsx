import styles from '../styles/Home.module.css';
import { formatEther } from "ethers";

export interface PostInfo {
    id: number;
    text: string;
    dt: string;
    poster_id: number;
    poster_name: number;
    poster_wallet: string;
    question_id: number;
    question_address: string;
    bounty: number | null;
    asker_address: string;
    asker_username: string;
    answer_status: string;
    answer_id: number | null;
    answer_hash: string | null;
}

type PostProps = {
    post: PostInfo;
    onAnswer?: (questionId: number) => void;
    onSelectAnswer?: (questionId: number, answerId: number, questionAddress?: string, answerHash?: string) => void;
    userAddress?: string;
    userName?: string;
}

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

export default function Post({
    post,
    onAnswer,
    onSelectAnswer,
    userAddress,
    userName
}: PostProps) {
    const isAnswerableQuestion = post.question_id && post.answer_id === null && onAnswer;
    const isAnswer = post.question_id !== null && post.answer_id !== null;
    const canSelectOnChain = post.question_id !== null && post.answer_id !== null && post.question_address && post.answer_hash && userAddress === post.asker_address;
    const canSelectOffChain = post.question_id !== null && 
                             post.answer_id !== null && 
                             !post.question_address && 
                             !post.answer_hash && 
                             userName && 
                             userName === post.asker_username;
    const handleClick = () => {
        if (isAnswerableQuestion && onAnswer) {
            onAnswer(post.question_id);
        } else if (onSelectAnswer && (canSelectOnChain || canSelectOffChain)) {
            onSelectAnswer(
                post.question_id!,
                post.answer_id!,
                post.question_address,
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
            {post.poster_name ?? `${post.poster_wallet.slice(0, 4)}...${post.poster_wallet.slice(-4)}`}: {convertUrlsToLinks(post.text)}
            {(post.question_id !== null && post.answer_id === null) && (
                <div className={styles.questionLabel}>
                    Question {post.question_id}. Click to answer
                    {post.bounty && post.bounty > 0 && (
                        <div>Bounty: {formatEther(post.bounty)} ETH</div>
                    )}
                </div>
            )}
            {(post.question_id !== null && post.answer_id !== null) && (
                <div>
                    <div className={styles.questionLabel}>
                        Answer to question {post.question_id}
                    </div>
                    {(canSelectOnChain || canSelectOffChain) && !(post.answer_status === "SE" || post.answer_status === "PO" || post.answer_status === "CE") && <div className={styles.questionLabel}>
                        Click to select answer
                    </div>}
                    {(post.answer_status === "SE" || post.answer_status === "PO" || post.answer_status === "CE") && 
                        <div className={styles.questionLabel}>
                            Selected Answer
                        </div>
                    }
                </div>
            )}
        </div>
    );
}