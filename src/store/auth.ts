import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type User = {
  id: string
  email: string
  name: string
  role: string
  avatar_color: string
}

type AuthStore = {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

function setCookie(value: string) {
  if (typeof window === 'undefined') return
  document.cookie = value
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => {
        if (user) {
          setCookie(`auth-store=1; path=/; max-age=604800; SameSite=Lax`)
        } else {
          setCookie(`auth-store=; path=/; max-age=0`)
        }
        set({ user })
      },
      logout: () => {
        setCookie(`auth-store=; path=/; max-age=0`)
        set({ user: null })
      },
    }),
    { name: 'auth-store' }
  )
)