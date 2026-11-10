import { useState } from 'react'
import { CreditCard, Copy, Check, Share2, AlertCircle } from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { generatePaymentLink, formatUsdcAmount } from '@/utils/arcpay'
import { SendView } from './SendView'
import type { Transaction } from '@/utils/arcpay'

const glass = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' } as React.CSSProperties,
  inner: { background: 'var(--surface-strong)', border: '1px solid var(--border)' } as React.CSSProperties,
}

type PayTab = 'pay' | 'request'

interface Props {
  onTxRecorded: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void
  prefillTo?: string
  prefillAmount?: string
  prefillMemo?: string
}

export function PaymentsView({ onTxRecorded, prefillTo, prefillAmount, prefillMemo }: Props) {
  const { isConnected } = useAccount()
  const [tab, setTab] = useState<PayTab>(prefillTo ? 'pay' : 'pay')

  // Request form state
  const [reqAmount, setReqAmount] = useState('')
  const [reqDescription, setReqDescription] = useState('')
  const [reqLink, setReqLink] = useState<string | null>(null)
  const [reqCopied, setReqCopied] = useState(false)

  const { address } = useAccount()

  const generateLink = () => {
    if (!address || !reqAmount) return
    const link = generatePaymentLink(address, reqAmount, reqDescription || undefined)
    setReqLink(link)
  }

  const copyLink = () => {
    if (!reqLink) return
    void navigator.clipboard.writeText(reqLink)
    setReqCopied(true)
    setTimeout(() => setReqCopied(false), 2000)
  }

  const shareLink = () => {
    if (!reqLink) return
    if (navigator.share) {
      void navigator.share({ title: 'Payment Request', text: `Please pay ${reqAmount} USDC: ${reqLink}` })
    } else {
      copyLink()
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Tab switcher */}
      <div className="flex rounded-xl p-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {(['pay', 'request'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
            style={{
              background: tab === t ? 'var(--surface-strong)' : 'transparent',
              color: tab === t ? 'var(--ink)' : 'var(--muted)',
            }}
          >
            {t === 'pay' ? 'Make Payment' : 'Request Payment'}
          </button>
        ))}
      </div>

      {/* Prefill banner */}
      {tab === 'pay' && prefillTo && prefillAmount && (
        <div
          className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(172,198,233,0.1)', border: '1px solid rgba(172,198,233,0.2)' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Payment request received</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {prefillMemo ? `"${prefillMemo}" · ` : ''}{formatUsdcAmount(prefillAmount)} USDC
            </p>
          </div>
        </div>
      )}

      {/* Pay tab = SendView */}
      {tab === 'pay' && (
        <SendView
          onTxRecorded={onTxRecorded}
          initialTo={prefillTo ?? ''}
          initialAmount={prefillAmount ?? ''}
          initialMemo={prefillMemo ?? ''}
        />
      )}

      {/* Request tab */}
      {tab === 'request' && (
        <>
          {!isConnected ? (
            <div className="rounded-2xl p-6 text-center" style={glass.card}>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Connect your wallet to create payment requests.</p>
              <ConnectKitButton />
            </div>
          ) : (
            <div className="rounded-2xl p-5 space-y-4" style={glass.card}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,201,122,0.15)' }}>
                  <CreditCard className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                </div>
                <div>
                  <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Request Payment</h2>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>Generate a shareable payment link</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Amount (USDC)</label>
                <div className="rounded-xl px-4 py-3" style={glass.inner}>
                  <input
                    inputMode="decimal"
                    value={reqAmount}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setReqAmount(v)
                    }}
                    placeholder="0.00"
                    className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:opacity-30"
                    style={{ color: 'var(--ink)' }}
                  />
                  <span className="text-xs mt-1 block" style={{ color: 'var(--subtle)' }}>USDC</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Description (optional)</label>
                <input
                  value={reqDescription}
                  onChange={e => setReqDescription(e.target.value)}
                  placeholder="What's this payment for?"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                />
              </div>

              <button
                onClick={generateLink}
                disabled={!reqAmount || parseFloat(reqAmount) <= 0}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'var(--accent)', color: '#0a1628' }}
              >
                Generate Payment Link
              </button>

              {reqLink && (
                <div className="space-y-3">
                  <div className="rounded-xl p-3" style={glass.inner}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Payment link</p>
                    <p className="mono text-xs break-all" style={{ color: 'var(--ink-2)' }}>{reqLink}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={copyLink}
                      className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                      style={{ background: 'var(--accent)', color: '#0a1628' }}
                    >
                      {reqCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {reqCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={shareLink}
                      className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                      style={{ background: 'var(--surface-strong)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </button>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(125,216,152,0.08)', border: '1px solid rgba(125,216,152,0.15)' }}>
                    <p className="text-xs" style={{ color: 'var(--success)' }}>
                      Requesting <span className="font-bold tabular-nums">{formatUsdcAmount(reqAmount)} USDC</span>
                      {reqDescription ? ` for "${reqDescription}"` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
