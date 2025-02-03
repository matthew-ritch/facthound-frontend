import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import {
  createAuthenticationAdapter,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { config } from '../wagmi';
import { createSiweMessage } from 'viem/siwe';
import api from '../utils/api'
type AuthenticationStatus = 'loading' | 'unauthenticated' | 'authenticated';

const client = new QueryClient();

function App({ Component, pageProps }: AppProps) {
  const [AUTHENTICATION_STATUS, SET_AUTHENTICATION_STATUS] = useState<AuthenticationStatus>("loading")
  const authenticationAdapter = createAuthenticationAdapter({
    getNonce: async () => {
      const response = await api.get('/api/auth/get_nonce/');
      return await response.nonce;
    },
    createMessage: ({ nonce, address, chainId }) => {
      return createSiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });
    },
    verify: async ({ message, signature }) => {
      const data = { message, signed_message: signature }
      const verifyRes = await api.post('/api/auth/siwetoken/', data)
      localStorage.setItem('token', verifyRes.access)
      localStorage.setItem('refresh', verifyRes.refresh)
      SET_AUTHENTICATION_STATUS('authenticated')
      return Boolean(verifyRes.access ? true : false);
    },
    signOut: async () => {
      localStorage.removeItem('token')
      localStorage.removeItem('refresh')
      SET_AUTHENTICATION_STATUS('unauthenticated')
    },
  });

  useEffect(() => {
    localStorage.getItem('token') ? SET_AUTHENTICATION_STATUS('authenticated') : SET_AUTHENTICATION_STATUS('unauthenticated');
  }, []);
  return (
    <WagmiProvider config={config}>
        <QueryClientProvider client={client}>
          <RainbowKitAuthenticationProvider adapter={authenticationAdapter} status={AUTHENTICATION_STATUS}>
            <RainbowKitProvider>
              <Component {...pageProps} />
            </RainbowKitProvider>
          </RainbowKitAuthenticationProvider>
        </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
