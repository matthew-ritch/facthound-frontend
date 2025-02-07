import Head from 'next/head';
import { Navbar } from '../components/navbar';
import { Config } from '@wagmi/core';

interface HeaderContext {
    config?: Config,
    next?: string
}

export function Header({config, next}: HeaderContext) {
    console.log(next)
    return (
        <>
            <Head>
                <title>Facthound</title>
                <meta
                    content="Facthound"
                    name="Facthound"
                />
                <link href="/static/favicon.ico" rel="icon" />
                <link href="/static/icon.png" rel="icon" />
                <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
            </Head>
            {config? <Navbar config={config} next={next}/>: null}
        </>
    )
}