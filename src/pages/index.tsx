import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { ThreadList, ThreadListProps } from '../components/threads'

// const Home: NextPage = () => {
//   return (
//     <div className={styles.container}>
//       <Head>
//         <title>FactHound</title>
//         <meta
//           content="FactHound"
//           name="FactHound"
//         />
//         <link href="static/favicon.ico" rel="icon" />
//       </Head>

//       <main className={styles.main}>
//         <ConnectButton />

//         <h1 className={styles.title}>
//           Welcome to FactHound!
//         </h1>

//         <div className={styles.grid}>
//           <p className={styles.description}>
//             Post new thread
//           </p>
//         </div>

//         <div className={styles.grid}>
//           <ThreadList />
//         </div>
//       </main>
//     </div>
//   );
// };
// export default Home;

export default function Home({
  threads,
}: ThreadListProps) {
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
          <ThreadList threads={threads}/>
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