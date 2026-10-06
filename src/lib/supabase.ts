import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** False until .env.local has the Supabase URL and key; the app shows setup help instead. */
export const isConfigured = Boolean(url && key)

// Placeholders keep createClient from throwing before setup; nothing calls it in that state.
export const supabase = createClient(url ?? 'http://localhost', key ?? 'not-configured')
