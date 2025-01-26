import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
 
export const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http('https://base-sepolia.g.alchemy.com/v2/J5VbtLhS-VFrpXkxRWPX9XbNIOOcmI_K')
})