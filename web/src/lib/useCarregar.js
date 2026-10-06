import { useCallback, useEffect, useState } from 'react'

// Carrega dados assíncronos e expõe os três estados que toda tela desenha.
export function useCarregar(funcao, deps = []) {
  const [estado, setEstado] = useState({ dados: null, erro: null, carregando: true })
  const carregar = useCallback(async () => {
    setEstado((e) => ({ ...e, carregando: true, erro: null }))
    try { setEstado({ dados: await funcao(), erro: null, carregando: false }) }
    catch (erro) { setEstado({ dados: null, erro: erro.message, carregando: false }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { carregar() }, [carregar])
  return { ...estado, recarregar: carregar }
}
