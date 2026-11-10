import { useState } from 'react'
import {
  LayoutDashboard, Wallet, ArrowUpRight, ArrowDownLeft,
  CreditCard, Clock, Store, Settings, Menu, X, Zap
} from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { formatAddress } from '@/utils/arcpay'

export type NavView = 'dashboard' | 'wallet' | 'send' | 'receive' | 'payments' | 'transactions' | 'merchant' | 'settings'

const NAV_ITEMS: { id: NavView; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'send', label: 'Send', icon: ArrowUpRight },
  { id: 'receive', label: 'Receive', icon: ArrowDownLeft },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'transactions', label: 'Transactions', icon: Clock },
  { id: 'merchant', label: 'Merchant Tools', icon: Store },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface LayoutProps {
  view: NavView
  onNavigate: (v: NavView) => void
  children: React.ReactNode
}

export function Layout({ view, onNavigate, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { address } = useAccount()

  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      {/* Sidebar — desktop */}
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 border-r"
        style={{ borderColor: 'var(--border)', background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(24px)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: 'var(--accent)', color: '#0a1628' }}
          >
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="display text-base font-bold leading-tight" style={{ color: 'var(--ink)' }}>ArcPay</div>
            <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--subtle)' }}>Arc Testnet</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                color: view === id ? 'var(--ink)' : 'var(--muted)',
                background: view === id ? 'var(--surface-strong)' : 'transparent',
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Wallet address pill */}
        {address && (
          <div className="px-3 pb-5">
            <div
              className="rounded-xl px-3 py-2 text-xs mono"
              style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              {formatAddress(address)}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside
            className="relative flex flex-col w-64 h-full border-r"
            style={{ borderColor: 'var(--border)', background: '#0a1628' }}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: 'var(--accent)', color: '#0a1628' }}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="display text-base font-bold" style={{ color: 'var(--ink)' }}>ArcPay</div>
              </div>
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5" style={{ color: 'var(--muted)' }} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { onNavigate(id); setMobileOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: view === id ? 'var(--ink)' : 'var(--muted)',
                    background: view === id ? 'var(--surface-strong)' : 'transparent',
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-4 lg:px-6 py-3.5 border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'rgba(10,22,40,0.60)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" style={{ color: 'var(--muted)' }} />
            </button>
            <span className="display text-base font-semibold" style={{ color: 'var(--ink)' }}>
              {NAV_ITEMS.find(n => n.id === view)?.label ?? 'ArcPay'}
            </span>
          </div>
          <ConnectKitButton.Custom>
            {({ isConnected, show, address: addr }) => (
              <button
                onClick={show}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: isConnected ? 'var(--surface-strong)' : 'var(--accent)', color: isConnected ? 'var(--ink)' : '#0a1628', border: '1px solid var(--border)' }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: isConnected ? 'var(--success)' : 'var(--danger)' }} />
                {isConnected && addr ? formatAddress(addr) : 'Connect Wallet'}
              </button>
            )}
          </ConnectKitButton.Custom>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
