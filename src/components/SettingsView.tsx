import { useAccount, useDisconnect } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { Shield, Network, Wallet, ExternalLink, Unplug, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { formatAddress, getExplorerAddressUrl } from '@/utils/arcpay'

const glass = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' } as React.CSSProperties,
  inner: { background: 'var(--surface-strong)', border: '1px solid var(--border)' } as React.CSSProperties,
}

export function SettingsView() {
  const { address, isConnected, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!address) return
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Wallet */}
      <SettingsSection icon={<Wallet className="w-4 h-4" />} title="Wallet" color="var(--accent)">
        {isConnected && address ? (
          <div className="space-y-3">
            <SettingRow label="Status" value={<span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--success)' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />Connected</span>} />
            <div className="rounded-xl p-3" style={glass.inner}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Address</p>
              <div className="flex items-center justify-between gap-2">
                <span className="mono text-xs break-all" style={{ color: 'var(--ink-2)' }}>{address}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={handleCopy} className="p-1.5 rounded-lg" style={{ background: 'var(--surface)' }}>
                    {copied ? <Check className="w-3 h-3" style={{ color: 'var(--success)' }} /> : <Copy className="w-3 h-3" style={{ color: 'var(--muted)' }} />}
                  </button>
                  <a href={getExplorerAddressUrl(address)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg" style={{ background: 'var(--surface)' }}>
                    <ExternalLink className="w-3 h-3" style={{ color: 'var(--muted)' }} />
                  </a>
                </div>
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--subtle)' }}>Short: {formatAddress(address)}</p>
            </div>
            <button
              onClick={() => disconnect()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(240,107,122,0.1)', color: 'var(--danger)', border: '1px solid rgba(240,107,122,0.2)' }}
            >
              <Unplug className="w-4 h-4" />
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No wallet connected.</p>
            <ConnectKitButton />
          </div>
        )}
      </SettingsSection>

      {/* Network */}
      <SettingsSection icon={<Network className="w-4 h-4" />} title="Network" color="var(--success)">
        <div className="space-y-2">
          <SettingRow label="Active Network" value={
            <span className="text-xs font-semibold" style={{ color: chainId === 5042002 ? 'var(--success)' : 'var(--warning)' }}>
              {chainId === 5042002 ? 'Arc Testnet' : `Chain ${chainId ?? 'unknown'}`}
            </span>
          } />
          <SettingRow label="Chain ID" value={<span className="mono text-xs" style={{ color: 'var(--muted)' }}>{chainId ?? '—'}</span>} />
          <SettingRow label="Gas Token" value={<span className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>USDC (native)</span>} />
          <SettingRow label="Explorer" value={
            <a
              href="https://explorer.testnet.arc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--accent)' }}
            >
              ArcScan <ExternalLink className="w-3 h-3" />
            </a>
          } />
          {chainId !== 5042002 && (
            <div className="mt-2 rounded-xl p-3" style={{ background: 'rgba(245,201,122,0.1)', border: '1px solid rgba(245,201,122,0.2)' }}>
              <p className="text-xs" style={{ color: 'var(--warning)' }}>
                Your wallet is on the wrong network. Switch to Arc Testnet (Chain ID: 5042002) to use ArcPay.
              </p>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Security */}
      <SettingsSection icon={<Shield className="w-4 h-4" />} title="Security" color="var(--warning)">
        <div className="space-y-3">
          <SecurityItem
            title="Address validation"
            description="All recipient addresses are validated using EVM checksum format before enabling transactions."
            status="enabled"
          />
          <SecurityItem
            title="Transaction confirmation"
            description="Every payment shows a confirmation screen before your wallet signs the transaction."
            status="enabled"
          />
          <SecurityItem
            title="Private key protection"
            description="ArcPay never requests, stores, or transmits your private keys or seed phrases."
            status="enabled"
          />
          <SecurityItem
            title="Duplicate prevention"
            description="Transaction buttons are disabled during signing and confirmation to prevent duplicate submissions."
            status="enabled"
          />
        </div>
      </SettingsSection>

      {/* App info */}
      <div className="rounded-2xl p-4" style={{ ...glass.card, borderColor: 'rgba(172,198,233,0.12)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>ArcPay</p>
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>Pay. Send. Receive. All on Arc.</p>
          </div>
          <div className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--surface-strong)', color: 'var(--muted)' }}>
            Testnet
          </div>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--subtle)' }}>
          Built on{' '}
          <a href="https://arc.io" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5" style={{ color: 'var(--accent)' }}>
            Arc <ExternalLink className="w-2.5 h-2.5" />
          </a>
          {' '}— the blockchain where USDC is the native gas token.
        </p>
      </div>
    </div>
  )
}

function SettingsSection({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-strong)', color }}>
          {icon}
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{title}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs" style={{ color: 'var(--subtle)' }}>{label}</span>
      <div>{value}</div>
    </div>
  )
}

function SecurityItem({ title, description, status }: { title: string; description: string; status: 'enabled' | 'disabled' }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: status === 'enabled' ? 'rgba(125,216,152,0.15)' : 'rgba(240,107,122,0.12)' }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: status === 'enabled' ? 'var(--success)' : 'var(--danger)' }} />
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{title}</p>
        <p className="text-xs mt-0.5 text-pretty" style={{ color: 'var(--subtle)' }}>{description}</p>
      </div>
    </div>
  )
}
