import {
  mainnet, base
} from 'wagmi/chains'
import { http, createConfig } from 'wagmi'


export const config = createConfig({
  chains: [
    base,
  ],
  transports: {
    [base.id]: http('https://base-mainnet.g.alchemy.com/v2/J5VbtLhS-VFrpXkxRWPX9XbNIOOcmI_K'),
},
  ssr: true,
});
