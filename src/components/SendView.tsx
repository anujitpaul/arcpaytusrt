import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowUpRight, Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi, isAddress } from 'viem'
import { ConnectKitButton } from 'connectkit'
import { getUsdc } from '@/onchain-facts'
import { parseAmount, Amount, usdcDecimalsFor } from '@/onchain-money'
import {
  ARC_TESTNET_CHAIN_ID, formatAddress, formatUsdcAmount,
  parseOnchainError, getExplorerTxUrl
} from '@/utils/arcpay'
import { useUsdcBalance } from '@/hooks/useUsdcBalance'
import type { Transaction } from '@/utils/arcpay'

const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`

const glass = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' } as React.CSSProperties,
  inner: { background: 'var(--surface-strong)', border: '1px solid var(--border)' } as React.CSSProperties,
}

interface Props {
  onTxRecorded: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void
  initialTo?: string
  initialAmount?: string
  initialMemo?: string
}

type Step = 'form' | 'confirm' | 'done'

export function SendView({ onTxRecorded, initialTo = '', initialAmount = '', initialMemo = '' }: Props) {
  const { isConnected, chainId } = useAccount()
  const { formatted: balanceFormatted, amount: balanceAmount } = useUsdcBalance()
  const { switchChain } = useSwitchChain()
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [to, setTo] = useState(initialTo)
  const [amount, setAmount] = useState(initialAmount)
  const [memo, setMemo] = useState(initialMemo)
  const [step, setStep] = useState<Step>('form')
  const [txError, setTxError] = useState<string | null>(null)
  const [_txId, setTxId] = useState<string | null>(null)

  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID
  const validAddress = isAddress(to)
  const validAmount = !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0
  const hasEnoughBalance = (() => {
    if (balanceAmount == null || !validAmount) return true
    try { return balanceAmount.gte(Amount.parse(amount, usdcDecimalsFor(ARC_TESTNET_CHAIN_ID))) }
    catch { return false }
  })()
  const canProceed = validAddress && validAmount && hasEnoughBalance && isConnected

  const handleReview = () => { setTxError(null); setStep('confirm') }
  const handleBack = () => setStep('form')

  const handleSend = useCallback(() => {
    if (!to || !amount) return
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }
    setTxError(null)
    try {
      const parsed = parseAmount(ARC_TESTNET_CHAIN_ID, amount)
      writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [to as `0x${string}`, parsed.raw],
        chainId: ARC_TESTNET_CHAIN_ID,
      })
    } catch (err) {
      setTxError(parseOnchainError(err))
    }
  }, [to, amount, wrongChain, switchChain, writeContract])

  // When confirmed, record tx and go to done
  const recordedRef = useRef(false)
  useEffect(() => {
    if (isSuccess && hash && step === 'confirm' && !recordedRef.current) {
      recordedRef.current = true
      setTxId(hash)
      setStep('done')
      onTxRecorded({ type: 'sent', token: 'USDC', amount, address: to, status: 'confirmed', hash, memo })
    }
  }, [isSuccess, hash, step, amount, to, memo, onTxRecorded])

  const handleReset = () => {
    setTo(''); setAmount(''); setMemo(''); setStep('form')
    setTxError(null); setTxId(null); reset()
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Done state */}
      {step === 'done' && (
        <div className="rounded-2xl p-6 text-center" style={glass.card}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(125,216,152,0.15)' }}>
            <Check className="w-7 h-7" style={{ color: 'var(--success)' }} />
          </div>
          <h2 className="display text-xl font-bold mb-1" style={{ color: 'var(--ink)' }}>Payment Sent</h2>
          <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>
            <span className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>{formatUsdcAmount(amount)} USDC</span> sent to {formatAddress(to)}
          </p>
          {hash && (
            <a
              href={getExplorerTxUrl(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs mt-3"
              style={{ color: 'var(--accent)' }}
            >
              View on ArcScan <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={handleReset}
            className="w-full mt-5 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: 'var(--surface-strong)', color: 'var(--ink)', border: '1px solid var(--border)' }}
          >
            Send Another
          </button>
        </div>
      )}

      {/* Confirm step */}
      {step === 'confirm' && (
        <div className="rounded-2xl p-5" style={glass.card}>
          <h2 className="display text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Confirm Payment</h2>

          <div className="space-y-3 mb-5">
            <PreviewRow label="Sending" value={`${formatUsdcAmount(amount)} USDC`} highlight />
            <PreviewRow label="To" value={formatAddress(to)} mono />
            <PreviewRow label="Full address" value={to} mono small />
            {memo && <PreviewRow label="Memo" value={memo} />}
            <PreviewRow label="Network" value="Arc Testnet" />
            <PreviewRow label="Gas fee" value="Paid in USDC (auto)" />
          </div>

          {(writeError || txError) && (
            <div className="flex items-start gap-2 p-3 rounded-xl mb-3" style={{ background: 'rgba(240,107,122,0.1)', border: '1px solid rgba(240,107,122,0.2)' }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {txError ?? parseOnchainError(writeError)}
              </p>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={isPending || isConfirming}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#0a1628' }}
          >
            {wrongChain ? 'Switch to Arc Testnet'
              : isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Confirm in wallet...</span>
              : isConfirming ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Confirming on-chain...</span>
              : 'Sign & Send'}
          </button>

          <button onClick={handleBack} className="w-full mt-2 py-3 text-sm font-medium" style={{ color: 'var(--muted)' }}>
            Back
          </button>
        </div>
      )}

      {/* Form step */}
      {step === 'form' && (
        <>
          {!isConnected ? (
            <div className="rounded-2xl p-6 text-center" style={glass.card}>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Connect your wallet to send USDC.</p>
              <ConnectKitButton />
            </div>
          ) : (
            <div className="rounded-2xl p-5" style={glass.card}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(172,198,233,0.15)' }}>
                  <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Send USDC</h2>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>Balance: <span className="tabular-nums font-medium">{balanceFormatted ?? '—'} USDC</span></p>
                </div>
              </div>

              {/* To address */}
              <div className="mb-3">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Recipient Address</label>
                <input
                  value={to}
                  onChange={e => setTo(e.target.value.trim())}
                  placeholder="0x..."
                  className="w-full rounded-xl px-4 py-3 mono text-sm outline-none transition-all"
                  style={{
                    background: 'var(--surface-strong)',
                    border: `1px solid ${to && !validAddress ? 'var(--danger)' : 'var(--border)'}`,
                    color: 'var(--ink)',
                  }}
                  spellCheck={false}
                />
                {to && !validAddress && (
                  <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>Invalid address format</p>
                )}
              </div>

              {/* Amount */}
              <div className="mb-3">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Amount (USDC)</label>
                <div className="rounded-xl px-4 py-3" style={glass.inner}>
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v)
                    }}
                    placeholder="0.00"
                    className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:opacity-30"
                    style={{ color: 'var(--ink)' }}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs" style={{ color: 'var(--subtle)' }}>USDC</span>
                    {balanceFormatted && (
                      <button
                        onClick={() => setAmount(balanceFormatted)}
                        className="text-xs font-semibold"
                        style={{ color: 'var(--accent)' }}
                      >
                        Max: {balanceFormatted}
                      </button>
                    )}
                  </div>
                </div>
                {!hasEnoughBalance && amount && (
                  <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>Insufficient balance</p>
                )}
              </div>

              {/* Memo */}
              <div className="mb-5">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Memo (optional)</label>
                <input
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  placeholder="What's this for?"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                />
              </div>

              <button
                onClick={handleReview}
                disabled={!canProceed}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'var(--accent)', color: '#0a1628' }}
              >
                {wrongChain ? 'Switch to Arc Testnet' : 'Review Payment'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PreviewRow({ label, value, highlight, mono, small }: { label: string; value: string; highlight?: boolean; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs shrink-0" style={{ color: 'var(--subtle)' }}>{label}</span>
      <span
        className={`text-right ${mono ? 'mono' : ''} ${small ? 'text-xs' : 'text-sm'} font-medium break-all`}
        style={{ color: highlight ? 'var(--ink)' : 'var(--ink-2)', fontWeight: highlight ? 700 : 500 }}
      >
        {value}
      </span>
    </div>
  )
}
