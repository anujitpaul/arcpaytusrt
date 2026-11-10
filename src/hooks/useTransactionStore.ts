import { useState, useCallback } from 'react'
import type { Transaction } from '@/utils/arcpay'

// In-memory transaction log for the session — real txs are pulled from chain via explorer links
// The store only records transactions the user initiates in this session
let _txs: Transaction[] = []

export function useTransactionStore() {
  const [txs, setTxs] = useState<Transaction[]>(_txs)

  const addTx = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const entry: Transaction = {
      ...tx,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    }
    _txs = [entry, ..._txs].slice(0, 100)
    setTxs([..._txs])
    return entry
  }, [])

  const updateTxStatus = useCallback((id: string, status: Transaction['status'], hash?: string) => {
    _txs = _txs.map(t => t.id === id ? { ...t, status, ...(hash ? { hash } : {}) } : t)
    setTxs([..._txs])
  }, [])

  return { txs, addTx, updateTxStatus }
}
