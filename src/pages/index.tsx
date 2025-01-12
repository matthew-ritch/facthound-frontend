import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const Home: NextPage = () => {
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

      <main className={styles.main}>
        <ConnectButton />

        <h1 className={styles.title}>
          Welcome to FactHound!
        </h1>

        <div className={styles.grid}>
          <p className={styles.description}>
            Post new thread
          </p>
        </div>

        <div className={styles.grid}>
          <p className={styles.description}>
            Threads
          </p>
        </div>
      </main>
    </div>
  );
};

export default Home;
