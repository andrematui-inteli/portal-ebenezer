import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !chave) {
  // Falha cedo e com instrução clara: sem isso, nada no app funciona.
  throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja web/.env.example).')
}

export const supabase = createClient(url, chave, {
  auth: { persistSession: true, autoRefreshToken: true, flowType: 'pkce' },
})
