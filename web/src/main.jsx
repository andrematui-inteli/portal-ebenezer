import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/arimo/latin-400.css'
import '@fontsource/arimo/latin-700.css'
import '@fontsource/cooper-hewitt/latin-800.css'
import './styles/app.css'

const raiz = ReactDOM.createRoot(document.getElementById('root'))
const faltaConfig = import.meta.env.MODE !== 'mock'
  && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)

if (faltaConfig) {
  // Sem as variáveis do Supabase o app não tem como funcionar: em vez de tela branca,
  // explica o que configurar (útil no primeiro deploy na Netlify).
  raiz.render(
    <main style={{ maxWidth: 560, margin: '48px auto', padding: 16, fontFamily: 'Arimo, Arial, sans-serif', lineHeight: 1.5 }}>
      <h1 style={{ color: '#0D3F20' }}>Falta configurar o portal</h1>
      <p>As variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> não chegaram a esta versão do site.</p>
      <p>Na Netlify: Site configuration → Environment variables. Confira os dois nomes, salve e depois rode Deploys → Trigger deploy → Clear cache and deploy site.</p>
    </main>,
  )
} else {
  import('./App').then(({ default: App }) => raiz.render(<React.StrictMode><App /></React.StrictMode>))
}
