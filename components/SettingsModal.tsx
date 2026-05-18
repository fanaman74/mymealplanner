// components/SettingsModal.tsx
'use client'

import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { usePlanner } from '@/lib/planner-context'

const SUGGESTED_MODELS = [
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-sonnet-4-6',
  'openai/gpt-4o-mini',
  'google/gemini-flash-1.5',
  'mistralai/mistral-7b-instruct',
]

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { apiKey, model, apifyToken, setApiKey, setModel, setApifyToken } = usePlanner()
  const [localKey, setLocalKey] = useState(apiKey)
  const [localModel, setLocalModel] = useState(model)
  const [localApify, setLocalApify] = useState(apifyToken)
  const [showKey, setShowKey] = useState(false)
  const [showApify, setShowApify] = useState(false)

  if (!open) return null

  function handleSave() {
    setApiKey(localKey.trim())
    setModel(localModel.trim())
    setApifyToken(localApify.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mmp-modal-box w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder="sk-or-..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your key is stored only in your browser&apos;s localStorage.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              value={localModel}
              onChange={e => setLocalModel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {SUGGESTED_MODELS.map(m => (
                <button
                  key={m}
                  onClick={() => setLocalModel(m)}
                  className={`rounded px-2 py-0.5 text-xs ${
                    localModel === m
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.split('/')[1]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apify API Token{' '}
              <span className="font-normal text-gray-400">(AH Belgium price search)</span>
            </label>
            <div className="relative">
              <input
                type={showApify ? 'text' : 'password'}
                value={localApify}
                onChange={e => setLocalApify(e.target.value)}
                placeholder="apify_api_..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApify(v => !v)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showApify ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enables AH Belgium price lookup. Get a free token at{' '}
              <a href="https://console.apify.com" target="_blank" rel="noopener noreferrer" className="underline">console.apify.com</a>.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
