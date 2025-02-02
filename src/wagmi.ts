import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
  baseSepolia
} from 'wagmi/chains'
import { http, createConfig } from 'wagmi'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'


export const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    baseSepolia,
  ],
  transports: {
    // [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/J5VbtLhS-VFrpXkxRWPX9XbNIOOcmI_K'),
    // [base.id]: http("https://base-mainnet.g.alchemy.com/v2/J5VbtLhS-VFrpXkxRWPX9XbNIOOcmI_K"),
    [baseSepolia.id]: http("https://base-sepolia.g.alchemy.com/v2/J5VbtLhS-VFrpXkxRWPX9XbNIOOcmI_K"),
},
  ssr: true,
});