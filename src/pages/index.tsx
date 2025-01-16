import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getAccount } from '@wagmi/core';
import { config } from '../wagmi';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { ThreadList, ThreadListProps } from '../components/threads'
import Link from 'next/link'

export default function Home({
  threads,
}: ThreadListProps) {
  const { address, isConnected } = getAccount(config);
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


        <h1 className={styles.title}>
          Welcome to FactHound!
        </h1>

        <div className={styles.grid}>
          <div>
            <ConnectButton />
          </div>

          {(~isConnected) &&
            <div className={styles.card}>
              <Link href={`/login`}>Or login with username and password</Link>
            </div>}
          
        </div>

        <div className={styles.grid}>
          <ThreadList threads={threads} />
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            Post new thread
          </div>
        </div>
      </main>
    </div>
  );
}

interface Params {
  id: string;
}

interface Context {
  params: Params;
}

export async function getServerSideProps() {
  // Fetch data from external API
  const res = await fetch(process.env.BACKEND_URL + `/questions/api/threadlist`);
  const threads: ThreadListProps = await res.json();
  // Pass data to the page via props
  return { props: { threads } };
}