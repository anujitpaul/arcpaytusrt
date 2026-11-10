import { useState } from 'react'
import { Store, Plus, Copy, Check, Share2, ExternalLink, TrendingUp, DollarSign } from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { generatePaymentLink, formatUsdcAmount, formatAddress } from '@/utils/arcpay'
import type { Transaction } from '@/utils/arcpay'

const glass = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' } as React.CSSProperties,
  inner: { background: 'var(--surface-strong)', border: '1px solid var(--border)' } as React.CSSProperties,
}

interface Props {
  txs: Transaction[]
}

interface PaymentRequest {
  id: string
  amount: string
  description: string
  link: string
  created: number
  status: 'active' | 'paid'
}

export function MerchantView({ txs }: Props) {
  const { address, isConnected } = useAccount()
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const received = txs.filter(t => t.type === 'received')
  const totalReceived = received.reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const createRequest = () => {
    if (!address || !amount) return
    const link = generatePaymentLink(address, amount, description || undefined)
    const req: PaymentRequest = {
      id: Math.random().toString(36).slice(2),
      amount,
      description,
      link,
      created: Date.now(),
      status: 'active',
    }
    setRequests(prev => [req, ...prev])
    setAmount('')
    setDescription('')
  }

  const copyLink = (req: PaymentRequest) => {
    void navigator.clipboard.writeText(req.link)
    setCopiedId(req.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const shareLink = (req: PaymentRequest) => {
    if (navigator.share) {
      void navigator.share({ title: `Pay ${req.amount} USDC`, text: req.description || `Payment of ${req.amount} USDC`, url: req.link })
    } else {
      copyLink(req)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl p-8 text-center" style={glass.card}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-strong)' }}>
            <Store className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="display text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>Merchant Tools</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Connect your wallet to create payment requests and track incoming USDC payments.</p>
          <ConnectKitButton />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Received" value={`${formatUsdcAmount(totalReceived.toString())} USDC`} icon={<TrendingUp className="w-4 h-4" />} color="var(--success)" />
        <StatCard label="Requests" value={String(requests.length)} icon={<Store className="w-4 h-4" />} color="var(--accent)" />
        <StatCard label="Transactions" value={String(received.length)} icon={<DollarSign className="w-4 h-4" />} color="var(--warning)" />
      </div>

      {/* Merchant address */}
      <div className="rounded-2xl p-4" style={glass.card}>
        <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>Receiving Address</p>
        <p className="mono text-sm break-all" style={{ color: 'var(--ink-2)' }}>{address}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>
          {address ? formatAddress(address) : ''} · Arc Testnet
        </p>
      </div>

      {/* Create request */}
      <div className="rounded-2xl p-5" style={glass.card}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(172,198,233,0.12)' }}>
            <Plus className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 className="display text-base font-bold" style={{ color: 'var(--ink)' }}>New Payment Request</h2>
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>Generate a shareable link or QR code</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Amount (USDC)</label>
            <div className="rounded-xl px-4 py-3" style={glass.inner}>
              <input
                inputMode="decimal"
                value={amount}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9.]/g, '')
                  if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v)
                }}
                placeholder="0.00"
                className="display w-full bg-transparent text-2xl font-bold tabular-nums outline-none placeholder:opacity-30"
                style={{ color: 'var(--ink)' }}
              />
              <span className="text-xs" style={{ color: 'var(--subtle)' }}>USDC</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Description (optional)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Invoice #001, product name, etc."
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            />
          </div>
        </div>

        <button
          onClick={createRequest}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#0a1628' }}
        >
          Create Payment Request
        </button>
      </div>

      {/* Requests list */}
      {requests.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={glass.card}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Active Requests</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {requests.map(req => (
              <div key={req.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="display text-base font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                        {formatUsdcAmount(req.amount)} USDC
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                        style={{ background: req.status === 'paid' ? 'rgba(125,216,152,0.12)' : 'rgba(172,198,233,0.12)', color: req.status === 'paid' ? 'var(--success)' : 'var(--accent)' }}
                      >
                        {req.status}
                      </span>
                    </div>
                    {req.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{req.description}</p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>
                      {new Date(req.created).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyLink(req)}
                      className="p-2 rounded-xl transition-all hover:opacity-70"
                      style={{ background: 'var(--surface-strong)' }}
                    >
                      {copiedId === req.id ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} /> : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />}
                    </button>
                    <button
                      onClick={() => shareLink(req)}
                      className="p-2 rounded-xl transition-all hover:opacity-70"
                      style={{ background: 'var(--surface-strong)' }}
                    >
                      <Share2 className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 rounded-lg p-2" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
                  <p className="mono text-[10px] break-all" style={{ color: 'var(--subtle)' }}>{req.link}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming payments from session txs */}
      {received.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={glass.card}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Received Payments</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {received.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(125,216,152,0.12)' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--success)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Received</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--success)' }}>+{formatUsdcAmount(tx.amount)} USDC</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="mono text-xs" style={{ color: 'var(--subtle)' }}>{formatAddress(tx.address)}</span>
                    {tx.hash && (
                      <a href={`https://explorer.testnet.arc.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" style={{ color: 'var(--subtle)' }} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: 'var(--surface-strong)', color }}>
        {icon}
      </div>
      <div className="display text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}
