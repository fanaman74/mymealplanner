// components/Toast.tsx
'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export interface ToastMessage {
  id: string
  message: string
  retryFn?: () => void
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastStack({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg max-w-sm">
      <span className="flex-1 text-sm">{toast.message}</span>
      {toast.retryFn && (
        <button
          onClick={toast.retryFn}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 shrink-0"
        >
          Retry
        </button>
      )}
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 text-gray-400 hover:text-white">
        <X size={14} />
      </button>
    </div>
  )
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (message: string, retryFn?: () => void) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, retryFn }])
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, addToast, dismissToast }
}
