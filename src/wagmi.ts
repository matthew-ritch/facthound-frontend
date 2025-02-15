import { mainnet, base } from 'wagmi/chains'
import { http, createConfig } from 'wagmi'
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
  metaMaskWallet,

} from '@rainbow-me/rainbowkit/wallets';


const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, rainbowWallet, walletConnectWallet, coinbaseWallet],
    },
  ],
  {
    appName: 'Facthound',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_KEY??'',
  }
);





export const config = createConfig({
  chains: [base],
  connectors: connectors,
  transports: {
    [base.id]: http('https://base-mainnet.g.alchemy.com/v2/J5VbtLhS-VFrpXkxRWPX9XbNIOOcmI_K'),
  },
  ssr: true,
});