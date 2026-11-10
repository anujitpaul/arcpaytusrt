import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { getUsdc } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'
import { ARC_TESTNET_CHAIN_ID } from '@/utils/arcpay'

const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`

export function useUsdcBalance() {
  const { address } = useAccount()

  const { data: raw, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const decimals = usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)
  const amount = raw != null ? Amount.fromRaw(raw, decimals) : null

  return {
    raw,
    amount,
    formatted: amount ? amount.toFixed(2) : null,
    isLoading,
    refetch,
  }
}
