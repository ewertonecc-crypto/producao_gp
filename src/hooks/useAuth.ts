import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

type SignUpPayload = {
  email: string
  password: string
  nome: string
  empresa: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async ({ email, password, nome, empresa }: SignUpPayload) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          empresa,
        },
      },
    })
  }

  const signOut = async () => {
    return supabase.auth.signOut()
  }

  return { user, session, loading, signIn, signUp, signOut }
}
