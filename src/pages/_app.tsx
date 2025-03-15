import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

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

/**
 * Authentication status type
 */
type AuthenticationStatus = 'loading' | 'unauthenticated' | 'authenticated';

/**
 * Query client for React Query
 */
const client = new QueryClient();

/**
 * Main application component
 * Sets up authentication, wagmi, and Rainbow Kit providers
 */
function App({ Component, pageProps }: AppProps) {
  const [AUTHENTICATION_STATUS, SET_AUTHENTICATION_STATUS] = useState<AuthenticationStatus>("loading")
  
  /**
   * Authentication adapter for Rainbow Kit
   * Configures Sign-In with Ethereum (SIWE) flow
   */
  const authenticationAdapter = createAuthenticationAdapter({
    /**
     * Fetches nonce for SIWE message
     */
    getNonce: async () => {
      const response = await api.get('/api/auth/get_nonce/');
      return await response.nonce;
    },
    
    /**
     * Creates SIWE message for signing
     */
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
    
    /**
     * Verifies signed message and stores authentication tokens
     */
    verify: async ({ message, signature }) => {
      const data = { message, signed_message: signature }
      const verifyRes = await api.post('/api/auth/siwetoken/', data)
      localStorage.setItem('token', verifyRes.access)
      localStorage.setItem('refresh', verifyRes.refresh)
      SET_AUTHENTICATION_STATUS('authenticated')
      return Boolean(verifyRes.access ? true : false);
    },
    
    /**
     * Handles sign out by clearing tokens
     */
    signOut: async () => {
      localStorage.removeItem('token')
      localStorage.removeItem('refresh')
      SET_AUTHENTICATION_STATUS('unauthenticated')
    },
  });

  /**
   * Check for existing token on initial load
   */
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
