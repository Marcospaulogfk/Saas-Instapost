"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

/**
 * Diz se o elemento está na viewport. Os mockups animados da landing usam isso
 * pra não ficar queimando timer e re-render enquanto estão fora da tela — numa
 * página longa, quase todos estão fora quase o tempo todo.
 */
export function useNaTela<T extends HTMLElement>(
  margem = "120px"
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [naTela, setNaTela] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(([entry]) => setNaTela(entry.isIntersecting), {
      rootMargin: margem,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [margem])

  return [ref, naTela]
}
