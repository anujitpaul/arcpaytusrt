import { useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, CreditCard, ExternalLink, Clock, Filter } from 'lucide-react'
import { formatAddress, formatUsdcAmount } from '@/utils/arcpay'
import type { Transaction } from '@/utils/arcpay'

const glass = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' } as React.CSSProperties,
}

type FilterType = 'all' | 'sent' | 'received' | 'payment'
type FilterStatus = 'all' | 'confirmed' | 'pending' | 'failed'

interface Props {
  txs: Transaction[]
}

export function TransactionsView({ txs }: Props) {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  const filtered = txs.filter(tx => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false
    return true
  })

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Filters */}
      <div className="rounded-2xl p-4 space-y-3" style={glass.card}>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: 'var(--muted)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Filters</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'sent', 'received', 'payment'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all"
              style={{
                background: typeFilter === f ? 'var(--accent)' : 'var(--surface-strong)',
                color: typeFilter === f ? '#0a1628' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'confirmed', 'pending', 'failed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all"
              style={{
                background: statusFilter === s ? 'var(--surface-strong)' : 'transparent',
                color: statusFilter === s ? 'var(--ink)' : 'var(--subtle)',
                border: `1px solid ${statusFilter === s ? 'var(--border-strong)' : 'transparent'}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="rounded-2xl overflow-hidden" style={glass.card}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {filtered.length} {filtered.length === 1 ? 'Transaction' : 'Transactions'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--surface-strong)' }}>
              <Clock className="w-6 h-6" style={{ color: 'var(--subtle)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>No transactions found</p>
            <p className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>
              {txs.length === 0 ? 'Send or receive USDC to see transactions here.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map(tx => (
              <TxDetailRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>

      {txs.length === 0 && (
        <div className="rounded-2xl p-4" style={{ ...glass.card, borderColor: 'rgba(172,198,233,0.15)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Transactions you initiate in this session appear here. For full on-chain history, view your address on the{' '}
            <a
              href="https://explorer.testnet.arc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5"
              style={{ color: 'var(--accent)' }}
            >
              Arc Testnet explorer <ExternalLink className="w-3 h-3" />
            </a>
            .
          </p>
        </div>
      )}
    </div>
  )
}

function TxDetailRow({ tx }: { tx: Transaction }) {
  const isSent = tx.type === 'sent'

  const iconColor = tx.type === 'sent' ? 'var(--danger)' : tx.type === 'received' ? 'var(--success)' : 'var(--warning)'
  const iconBg = tx.type === 'sent' ? 'rgba(240,107,122,0.12)' : tx.type === 'received' ? 'rgba(125,216,152,0.12)' : 'rgba(245,201,122,0.12)'
  const Icon = tx.type === 'sent' ? ArrowUpRight : tx.type === 'received' ? ArrowDownLeft : CreditCard

  const statusColor = tx.status === 'confirmed' ? 'var(--success)' : tx.status === 'failed' ? 'var(--danger)' : 'var(--warning)'
  const statusBg = tx.status === 'confirmed' ? 'rgba(125,216,152,0.1)' : tx.status === 'failed' ? 'rgba(240,107,122,0.1)' : 'rgba(245,201,122,0.1)'

  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: iconBg }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold capitalize" style={{ color: 'var(--ink)' }}>{tx.type}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
              style={{ background: statusBg, color: statusColor }}
            >
              {tx.status}
            </span>
          </div>
          <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: isSent ? 'var(--danger)' : 'var(--success)' }}>
            {isSent ? '-' : '+'}{formatUsdcAmount(tx.amount)} {tx.token}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="mono text-xs" style={{ color: 'var(--subtle)' }}>{formatAddress(tx.address)}</span>
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>
            {new Date(tx.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {tx.memo && (
          <p className="text-xs mt-1 italic" style={{ color: 'var(--subtle)' }}>"{tx.memo}"</p>
        )}
        {tx.hash && (
          <a
            href={`https://explorer.testnet.arc.io/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs mt-1.5"
            style={{ color: 'var(--accent)' }}
          >
            <span className="mono">{formatAddress(tx.hash)}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}
