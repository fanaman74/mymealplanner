// lib/i18n-context.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Lang } from './i18n'

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en'
    return (localStorage.getItem('mmp.lang') as Lang) || 'en'
  })

  function handleSetLang(l: Lang) {
    setLang(l)
    if (typeof window !== 'undefined') localStorage.setItem('mmp.lang', l)
  }

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useLang() {
  return useContext(I18nContext)
}
