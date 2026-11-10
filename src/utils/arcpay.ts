import { isAddress } from 'viem'
import { buildTxExplorerUrl } from '@/onchain-facts'

export const ARC_TESTNET_CHAIN_ID = 5042002

export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatUsdcAmount(raw: string | number, decimals = 2): string {
  const n = typeof raw === 'string' ? parseFloat(raw) : raw
  if (isNaN(n)) return '0.00'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function isValidAddress(addr: string): boolean {
  return isAddress(addr)
}

export function getExplorerTxUrl(hash: string): string {
  return buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, hash)
}

export function getExplorerAddressUrl(addr: string): string {
  return `https://explorer.testnet.arc.io/address/${addr}`
}

export function generatePaymentLink(to: string, amount: string, memo?: string): string {
  const base = window.location.origin
  const params = new URLSearchParams({ to, amount, view: 'send' })
  if (memo) params.set('memo', memo)
  return `${base}?${params.toString()}`
}

export function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || msg.includes('user denied')) return 'Transaction cancelled.'
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) return 'Insufficient balance.'
  if (msg.includes('reverted')) {
    const m = msg.match(/reason="([^"]+)"/)
    return m ? `Transaction failed: ${m[1]}` : 'Transaction failed. Please try again.'
  }
  if (msg.includes('network') || msg.includes('timeout')) return 'Network error. Please try again.'
  return 'Something went wrong. Please try again.'
}

export type TxStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

export interface Transaction {
  id: string
  type: 'sent' | 'received' | 'payment'
  token: string
  amount: string
  address: string
  timestamp: number
  status: 'confirmed' | 'pending' | 'failed'
  hash?: string
  memo?: string
}
