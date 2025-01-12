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
}

export default function Post({
    post,
}: PostProps) {
    return (
        <div className={styles.card}>
            {post.poster_name ?? post.poster_wallet}: {post.text}
        </div>
    )
}