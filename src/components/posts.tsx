import styles from '../styles/Home.module.css';

export interface PostInfo {
    id: number;
    text: string;
    dt: string;
    poster_id: number;
    poster_name: number;
    poster_wallet: string;
    question_id: number;
    question_address: string;
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
    const canSelectOffChain = post.question_id !== null && post.answer_id !== null && post.question_address && post.answer_hash && userName === post.asker_username;
    console.log(post)
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
            className={`${styles.card} ${isAnswerableQuestion ? styles.clickable : ''} ${isAnswer ? styles.answerPost : ''}`}
            onClick={handleClick}
        >
            {post.poster_name ?? `${post.poster_wallet.slice(0, 4)}...${post.poster_wallet.slice(-4)}`}: {post.text}
            {(post.question_id !== null && post.answer_id === null) && (
                <div className={styles.questionLabel}>
                    Question {post.question_id}. Click to answer
                </div>
            )}
            {(post.question_id !== null && post.answer_id !== null) && (
                <div>
                    <div className={styles.questionLabel}>
                        Answer to question {post.question_id}
                    </div>
                    <div className={styles.questionLabel}>
                        {(canSelectOnChain || canSelectOffChain) ? 'Click to select answer' : ''}
                    </div>
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