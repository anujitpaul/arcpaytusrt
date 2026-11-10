import { useState } from 'react'
import { Copy, Check, ExternalLink, Wallet, RefreshCw, Unplug } from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { TokenUSDC } from '@web3icons/react'
import { useUsdcBalance } from '@/hooks/useUsdcBalance'
import { formatAddress, formatUsdcAmount, getExplorerAddressUrl } from '@/utils/arcpay'

const glass = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    backdropFilter: 'blur(20px)',
  } as React.CSSProperties,
  inner: {
    background: 'var(--surface-strong)',
    border: '1px solid var(--border)',
  } as React.CSSProperties,
}

export function WalletView() {
  const { address, isConnected, chainId } = useAccount()
  const { formatted, isLoading, refetch } = useUsdcBalance()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!address) return
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl p-8 text-center" style={glass.card}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-strong)' }}>
            <Wallet className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="display text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>Connect Your Wallet</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Connect an Arc-compatible wallet to view balances, send and receive USDC.</p>
          <ConnectKitButton />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Wallet address card */}
      <div className="rounded-2xl p-5" style={glass.card}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Connected</span>
          </div>
          <button
            onClick={() => disconnect()}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all hover:opacity-70"
            style={{ color: 'var(--danger)', background: 'rgba(240,107,122,0.1)', border: '1px solid rgba(240,107,122,0.2)' }}
          >
            <Unplug className="w-3 h-3" />
            Disconnect
          </button>
        </div>

        <p className="text-xs font-medium mb-2" style={{ color: 'var(--subtle)' }}>Wallet Address</p>
        <div className="rounded-xl p-3 flex items-center justify-between gap-2" style={glass.inner}>
          <span className="mono text-sm truncate" style={{ color: 'var(--ink-2)' }}>{address}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={handleCopy} className="p-1.5 rounded-lg transition-all hover:opacity-70" style={{ background: 'var(--surface)' }}>
              {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} /> : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />}
            </button>
            <a href={getExplorerAddressUrl(address!)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg transition-all hover:opacity-70" style={{ background: 'var(--surface)' }}>
              <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
            </a>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>Short:</span>
          <span className="mono text-xs" style={{ color: 'var(--muted)' }}>{address ? formatAddress(address) : '—'}</span>
        </div>
      </div>

      {/* Network info */}
      <div className="rounded-2xl p-5" style={glass.card}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Network</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: chainId === 5042002 ? 'var(--success)' : 'var(--warning)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
              {chainId === 5042002 ? 'Arc Testnet' : `Chain ${chainId ?? 'unknown'}`}
            </span>
          </div>
          {chainId !== 5042002 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,201,122,0.15)', color: 'var(--warning)' }}>
              Wrong network
            </span>
          )}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--subtle)' }}>Chain ID: {chainId ?? '—'}</p>
      </div>

      {/* Tokens */}
      <div className="rounded-2xl overflow-hidden" style={glass.card}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Token Balances</span>
          <button onClick={() => { void refetch() }} className="p-1.5 rounded-lg transition-all hover:opacity-70" style={{ background: 'var(--surface-strong)' }}>
            <RefreshCw className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        {/* USDC row */}
        <div className="flex items-center gap-3 px-5 py-4">
          <TokenUSDC variant="branded" size={36} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>USDC</span>
              <span className="display text-base font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                {isLoading ? (
                  <span className="inline-block w-16 h-5 rounded animate-pulse" style={{ background: 'var(--surface-strong)' }} />
                ) : (
                  formatUsdcAmount(formatted ?? '0')
                )}
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs" style={{ color: 'var(--subtle)' }}>USD Coin · Arc Testnet</span>
              <span className="text-xs" style={{ color: 'var(--subtle)' }}>Native gas token</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-4">
          <div className="rounded-xl p-3" style={{ background: 'rgba(172,198,233,0.06)', border: '1px solid rgba(172,198,233,0.12)' }}>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              On Arc, USDC is the native gas token. Your USDC balance covers both token transfers and network fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
