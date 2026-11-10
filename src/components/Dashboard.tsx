import { ArrowUpRight, ArrowDownLeft, CreditCard, Clock, ExternalLink, TrendingUp, Zap } from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { useUsdcBalance } from '@/hooks/useUsdcBalance'
import { formatAddress, formatUsdcAmount, getExplorerAddressUrl } from '@/utils/arcpay'
import type { NavView } from './Layout'
import type { Transaction } from '@/utils/arcpay'

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

interface Props {
  onNavigate: (v: NavView) => void
  recentTxs: Transaction[]
}

export function Dashboard({ onNavigate, recentTxs }: Props) {
  const { address, isConnected } = useAccount()
  const { formatted, isLoading } = useUsdcBalance()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Hero balance card */}
      <div className="rounded-2xl p-5" style={glass.card}>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-lg"
            style={{ background: 'rgba(125,216,152,0.15)' }}
          >
            <TrendingUp className="w-3 h-3" style={{ color: 'var(--success)' }} />
          </div>
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--muted)' }}>
            Available Balance
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="display text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
            {!isConnected ? '—' : isLoading ? (
              <span className="inline-block w-32 h-10 rounded-lg animate-pulse" style={{ background: 'var(--surface-strong)' }} />
            ) : (
              formatted ?? '0.00'
            )}
          </span>
          <span className="text-xl font-semibold" style={{ color: 'var(--subtle)' }}>USDC</span>
        </div>

        {isConnected && address ? (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs mono" style={{ color: 'var(--muted)' }}>{formatAddress(address)}</span>
            <a
              href={getExplorerAddressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-3 h-3" style={{ color: 'var(--subtle)' }} />
            </a>
          </div>
        ) : (
          <p className="text-xs mt-2" style={{ color: 'var(--subtle)' }}>Connect wallet to view live balance</p>
        )}

        {/* Network badge */}
        <div className="flex items-center gap-1.5 mt-3">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--subtle)' }}>Arc Testnet · USDC gas</span>
        </div>
      </div>

      {/* Not connected prompt */}
      {!isConnected && (
        <div className="rounded-2xl p-5 text-center" style={glass.card}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'var(--surface-strong)' }}
          >
            <Zap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: 'var(--ink)' }}>Connect your wallet to get started</p>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Send, receive, and track payments on Arc — where USDC is the native gas token.</p>
          <ConnectKitButton />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Send', icon: ArrowUpRight, view: 'send' as NavView, color: 'var(--accent)' },
          { label: 'Receive', icon: ArrowDownLeft, view: 'receive' as NavView, color: 'var(--success)' },
          { label: 'Pay', icon: CreditCard, view: 'payments' as NavView, color: 'var(--warning)' },
          { label: 'History', icon: Clock, view: 'transactions' as NavView, color: 'var(--muted)' },
        ].map(({ label, icon: Icon, view, color }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={glass.card}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface-strong)' }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl overflow-hidden" style={glass.card}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Recent Activity</span>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-medium"
            style={{ color: 'var(--accent)' }}
          >
            View all
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No transactions yet this session.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>Your transactions will appear here.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentTxs.slice(0, 5).map(tx => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>

      {/* Arc feature note */}
      <div className="rounded-2xl p-4" style={{ ...glass.card, borderColor: 'rgba(172,198,233,0.2)' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(172,198,233,0.12)' }}>
            <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>USDC-powered gas on Arc</p>
            <p className="text-xs mt-0.5 text-pretty" style={{ color: 'var(--muted)' }}>
              On Arc, gas fees are paid in USDC — no ETH or other tokens needed. One asset does everything.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TxRow({ tx }: { tx: Transaction }) {
  const isSent = tx.type === 'sent'
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isSent ? 'rgba(240,107,122,0.12)' : 'rgba(125,216,152,0.12)' }}
      >
        {isSent
          ? <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--danger)' }} />
          : <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--success)' }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {isSent ? 'Sent' : 'Received'}
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: isSent ? 'var(--danger)' : 'var(--success)' }}>
            {isSent ? '-' : '+'}{formatUsdcAmount(tx.amount)} {tx.token}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs mono" style={{ color: 'var(--subtle)' }}>{formatAddress(tx.address)}</span>
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>
            {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      {tx.hash && (
        <a href={`https://explorer.testnet.arc.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--subtle)' }} />
        </a>
      )}
    </div>
  )
}
