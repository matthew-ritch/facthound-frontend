import { config } from '../wagmi';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { ThreadList, ThreadListProps } from '../components/threads';
import { Navbar } from '../components/navbar';
import Link from 'next/link';
import { useState } from 'react';

const factHoundSlogans = [
  "FactHound is a truth-seeking missile.",
  "Information wants to be free, but somebody needs to pay its bail.",
  "Light, in the absence of eyes, illuminates nothing.",
  "FactHound is your zoomer brother's favorite information broker.",
  "FactHound is an information clearinghouse.",
  "FactHound is an information bounty hunter.",
  "FactHound is the world's most profitable bulletin board.",
  "Total information awareness; equal opportunity enforcement.",
  "FactHound was originally bred to hunt badgers.",
  "The truth is out there, and it's for hire.",
  "Tear down the Pareto Front.",
  "FactHound is the way out.",
  "If ideas are viruses, then truth is an inoculation.",
  "Facts grow on trees.",
  "FactHound is an information market.",
  "FactHound is the only forum that matters.",
  "FactHound is a truth-seeking missile.",
];
const marqueeText = factHoundSlogans.join('       ');

export default function Home({
  threads,
  eth_price,
}: ThreadListProps) {
  const [searchResults, setSearchResults] = useState(threads.threads);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults(threads.threads);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/questions/search/?search_string=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      setSearchResults(data.threads);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

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
      <Navbar config={config} />
      <main className={styles.main} >
        <div className={styles.marquee}>
            <p>{marqueeText}</p>
        </div>
        <div className={styles.searchContainer}>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className={styles.searchInput}
            />
            <button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
        <div className={styles.grid}>
          {searchResults.length === 0 ? (
            <p>No results found</p>
          ) : (
            <ThreadList threads={{ threads: searchResults }} eth_price={eth_price} />
          )}
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  // Fetch thread data from external API
  const res = await fetch(process.env.BACKEND_URL + `/api/questions/threadlist`);
  const data = await res.json();
  // Fetch eth price from alchemy
  const url = 'https://api.g.alchemy.com/prices/v1/tokens/by-symbol?symbols=ETH&symbols=USDC&symbols=BTC';
  const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.ALCHEMY_API_KEY}`
  };
  const prices = await fetch(url, {
      method: 'GET',
      headers: headers
  })
  const priceinfo = await prices.json();
  const eth_price = priceinfo.data[0].prices[0].value;
  // Pass data to the page via props
  return { props: { threads: data, eth_price: eth_price } };
}