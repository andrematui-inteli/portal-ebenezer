import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '@api'

const Sessao = createContext({ perfil: null, carregando: true, recarregar: () => {} })

export function ProvedorSessao({ children }) {
  const [estado, setEstado] = useState({ perfil: null, carregando: true })

  const recarregar = async () => {
    try { setEstado({ perfil: await api.meuPerfil(), carregando: false }) }
    catch { setEstado({ perfil: null, carregando: false }) }
  }

  useEffect(() => {
    recarregar()
    return api.aoMudarSessao(() => recarregar())
  }, [])

  return <Sessao.Provider value={{ ...estado, recarregar }}>{children}</Sessao.Provider>
}

export const useSessao = () => useContext(Sessao)

// Tela inicial de cada perfil depois do login.
export const INICIO_POR_PAPEL = {
  responsavel: '/familia',
  estudante: '/estudante',
  educacao: '/equipe',
  gestao: '/equipe',
  doador_pf: '/escola',
  empresa: '/escola',
}
