import Head from 'next/head';
import { Navbar } from '../components/navbar';
import { Config } from '@wagmi/core';

/**
 * Props for the Header component
 */
interface HeaderContext {
    config?: Config,
    next?: string
}

/**
 * Page header component that includes SEO metadata and navigation
 * 
 * @param config - Wagmi configuration for web3 connectivity
 * @param next - Redirect URL after authentication
 * @returns Header component with meta tags and navigation bar
 */
export function Header({config, next}: HeaderContext) {
    return (
        <>
            <Head>
                <title>Facthound</title>
                <meta name="title" property="og:title" content="Facthound"></meta>
                <link href="/static/favicon.ico" rel="icon" />
                <link href="/static/icon.png" rel="icon" />
                <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
                <meta property="og:site_name" content="Facthound" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://facthound.xyz" />
                <meta property="og:image" content="https://facthound.xyz/static/og-image.jpg" />
            </Head>
            {config? <Navbar config={config} next={next}/>: null}
        </>
    )
}