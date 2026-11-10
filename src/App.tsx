import { useState } from 'react'
import { Layout, type NavView } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { WalletView } from './components/WalletView'
import { SendView } from './components/SendView'
import { ReceiveView } from './components/ReceiveView'
import { PaymentsView } from './components/PaymentsView'
import { TransactionsView } from './components/TransactionsView'
import { MerchantView } from './components/MerchantView'
import { SettingsView } from './components/SettingsView'
import { useTransactionStore } from './hooks/useTransactionStore'
import type { Transaction } from './utils/arcpay'

// Parse deep-link query params for prefilled payments
function usePaymentDeepLink() {
  const params = new URLSearchParams(window.location.search)
  return {
    to: params.get('to') ?? undefined,
    amount: params.get('amount') ?? undefined,
    memo: params.get('memo') ?? undefined,
    view: (params.get('view') as NavView | null) ?? undefined,
  }
}

export default function App() {
  const deepLink = usePaymentDeepLink()
  const [view, setView] = useState<NavView>(deepLink.view ?? 'dashboard')
  const { txs, addTx } = useTransactionStore()

  const handleTxRecorded = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    addTx(tx)
  }

  return (
    <Layout view={view} onNavigate={setView}>
      {view === 'dashboard' && (
        <Dashboard onNavigate={setView} recentTxs={txs} />
      )}
      {view === 'wallet' && (
        <WalletView />
      )}
      {view === 'send' && (
        <SendView
          onTxRecorded={handleTxRecorded}
          initialTo={deepLink.to}
          initialAmount={deepLink.amount}
          initialMemo={deepLink.memo}
        />
      )}
      {view === 'receive' && (
        <ReceiveView />
      )}
      {view === 'payments' && (
        <PaymentsView
          onTxRecorded={handleTxRecorded}
          prefillTo={deepLink.to}
          prefillAmount={deepLink.amount}
          prefillMemo={deepLink.memo}
        />
      )}
      {view === 'transactions' && (
        <TransactionsView txs={txs} />
      )}
      {view === 'merchant' && (
        <MerchantView txs={txs} />
      )}
      {view === 'settings' && (
        <SettingsView />
      )}
    </Layout>
  )
}
