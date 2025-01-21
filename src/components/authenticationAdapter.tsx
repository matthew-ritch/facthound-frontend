import { createAuthenticationAdapter } from '@rainbow-me/rainbowkit';
import { createSiweMessage } from 'viem/siwe';
import api from '../utils/api'

export const authenticationAdapter = createAuthenticationAdapter({
    getNonce: async () => {
        const response = await api.get('/auth/api/get_nonce/');
        console.log(response.nonce)
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
        const data = { message, signed_message:signature }
        const verifyRes = await api.post('/auth/api/siwetoken/', data)
        localStorage.setItem('token',verifyRes.access)
        return Boolean(verifyRes.access ? true : false);
    },
    signOut: async () => {
        localStorage.removeItem('token')
    },
});
