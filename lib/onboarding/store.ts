"use client"

import { useCallback, useEffect, useState } from "react"
import { DEFAULT_STATE, type OnboardingState } from "./types"

const STORAGE_KEY = "syncpost.onboarding.v1"

function readStorage(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<OnboardingState>
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return DEFAULT_STATE
  }
}

function writeStorage(state: OnboardingState) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

export function useOnboardingState() {
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(readStorage())
    setHydrated(true)
  }, [])

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      writeStorage(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setState(DEFAULT_STATE)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return { state, hydrated, update, reset }
}

export function clearOnboardingStorage() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}
