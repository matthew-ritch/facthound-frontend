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
    answer_id: number;
    answer_hash: string
}

type PostProps = {
    post: PostInfo;
    onAnswer?: (questionId: number) => void;
}

export default function Post({
    post,
    onAnswer,
}: PostProps) {
    const isAnswerableQuestion = post.question_id && post.answer_id === null && onAnswer;
    const isAnswer = post.question_id !== null && post.answer_id !== null

    return (
        <div
            className={`${styles.card} ${isAnswerableQuestion ? styles.clickable : ''} ${isAnswer ? styles.answerPost : ''
                }`}
            onClick={() => isAnswerableQuestion ? onAnswer(post.question_id) : undefined}
        >
            {post.poster_name ?? post.poster_wallet}: {post.text}
            {(post.question_id !== null && post.answer_id === null) && (
                <div className={styles.questionLabel}>
                    Click to answer this question
                </div>
            )}
            {(post.question_id !== null && post.answer_id !== null) && (
                <div className={styles.questionLabel}>
                    Answer
                </div>
            )}
        </div>
    )
}