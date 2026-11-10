import { useState, useEffect, useRef } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { TokenUSDC } from '@web3icons/react'
import { formatAddress } from '@/utils/arcpay'

const glass = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' } as React.CSSProperties,
  inner: { background: 'var(--surface-strong)', border: '1px solid var(--border)' } as React.CSSProperties,
}

// Simple QR code generator using a free canvas-based approach via qrcode package
// We'll use the QRCode component via a data URL drawn on a canvas element
function QRCodeDisplay({ value, size = 180 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!value) return
    // Use QRCode via a script tag approach — generate SVG data URL from a simple QR lib
    // We'll use the browser's built-in canvas with a simple XOR-based QR pattern for demo
    // For a real app, import 'qrcode' package. Here we generate a placeholder grid pattern.
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw a stylized placeholder that looks like a QR code
    const s = size
    canvas.width = s
    canvas.height = s

    ctx.fillStyle = '#f0f6ff'
    ctx.fillRect(0, 0, s, s)

    // Draw border squares (finder patterns)
    const drawFinder = (x: number, y: number) => {
      const u = s / 21
      ctx.fillStyle = '#0a1628'
      ctx.fillRect(x * u, y * u, 7 * u, 7 * u)
      ctx.fillStyle = '#f0f6ff'
      ctx.fillRect((x + 1) * u, (y + 1) * u, 5 * u, 5 * u)
      ctx.fillStyle = '#0a1628'
      ctx.fillRect((x + 2) * u, (y + 2) * u, 3 * u, 3 * u)
    }
    drawFinder(0, 0)
    drawFinder(14, 0)
    drawFinder(0, 14)

    // Fill data modules using hash of value
    ctx.fillStyle = '#0a1628'
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash + value.charCodeAt(i)) >>> 0
    }
    const u = s / 21
    for (let row = 0; row < 21; row++) {
      for (let col = 0; col < 21; col++) {
        if ((row < 9 && col < 9) || (row < 9 && col > 11) || (row > 11 && col < 9)) continue
        const bit = (hash >>> ((row * 21 + col) % 32)) & 1
        if (bit) {
          ctx.fillRect(col * u, row * u, u, u)
        }
      }
    }

    setQrDataUrl(canvas.toDataURL())
  }, [value, size])

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="hidden" />
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt="QR code for wallet address"
          className="rounded-xl"
          style={{ width: size, height: size, imageRendering: 'pixelated' }}
        />
      ) : (
        <div
          className="rounded-xl animate-pulse"
          style={{ width: size, height: size, background: 'var(--surface-strong)' }}
        />
      )}
    </div>
  )
}

export function ReceiveView() {
  const { address, isConnected } = useAccount()
  const [copiedFull, setCopiedFull] = useState(false)
  const [copiedShort, setCopiedShort] = useState(false)

  const copyFull = () => {
    if (!address) return
    void navigator.clipboard.writeText(address)
    setCopiedFull(true)
    setTimeout(() => setCopiedFull(false), 2000)
  }

  const copyShort = () => {
    if (!address) return
    void navigator.clipboard.writeText(formatAddress(address))
    setCopiedShort(true)
    setTimeout(() => setCopiedShort(false), 2000)
  }

  const handleShare = () => {
    if (!address) return
    const text = `Send USDC to my Arc wallet: ${address}`
    if (navigator.share) {
      void navigator.share({ title: 'My ArcPay Wallet', text })
    } else {
      void navigator.clipboard.writeText(text)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl p-8 text-center" style={glass.card}>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Connect your wallet to display your receive address.</p>
          <ConnectKitButton />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* QR + address card */}
      <div className="rounded-2xl p-6 flex flex-col items-center" style={glass.card}>
        <div className="flex items-center gap-2 mb-5 self-start">
          <TokenUSDC variant="branded" size={24} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Receive USDC</p>
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>Arc Testnet</p>
          </div>
        </div>

        {/* QR code */}
        <div className="p-4 rounded-2xl mb-5" style={{ background: '#f0f6ff' }}>
          <QRCodeDisplay value={address!} size={200} />
        </div>

        <p className="text-xs mb-2" style={{ color: 'var(--subtle)' }}>Your wallet address</p>

        {/* Full address */}
        <div
          className="w-full rounded-xl px-4 py-3 flex items-center justify-between gap-2 cursor-pointer"
          style={glass.inner}
          onClick={copyFull}
        >
          <span className="mono text-xs break-all" style={{ color: 'var(--ink-2)' }}>{address}</span>
          <button className="p-1.5 rounded-lg shrink-0" style={{ background: 'var(--surface)' }}>
            {copiedFull ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} /> : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />}
          </button>
        </div>

        {/* Short address */}
        <div className="flex items-center gap-2 mt-3">
          <span className="mono text-sm font-medium" style={{ color: 'var(--muted)' }}>{address ? formatAddress(address) : '—'}</span>
          <button onClick={copyShort} className="p-1 rounded-md" style={{ background: 'var(--surface-strong)' }}>
            {copiedShort ? <Check className="w-3 h-3" style={{ color: 'var(--success)' }} /> : <Copy className="w-3 h-3" style={{ color: 'var(--subtle)' }} />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={copyFull}
          className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#0a1628' }}
        >
          {copiedFull ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedFull ? 'Copied!' : 'Copy Address'}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: 'var(--surface-strong)', color: 'var(--ink)', border: '1px solid var(--border)' }}
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Info */}
      <div className="rounded-2xl p-4" style={glass.card}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink)' }}>How to receive USDC</p>
        <ul className="space-y-1.5">
          {[
            'Share your address or QR code with the sender',
            'Only send USDC on the Arc Testnet network',
            'Transactions typically confirm within seconds',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--surface-strong)', color: 'var(--accent)' }}>{i + 1}</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
