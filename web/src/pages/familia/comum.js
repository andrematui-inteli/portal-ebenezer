import { api } from '@api'

import { navPorPapel } from '../escola/comum'
export const NAV_FAMILIA = navPorPapel('responsavel')

export const consentimentoAtivo = (v) => v.consentimento_em && !v.consentimento_revogado_em

// Junta tudo o que o responsável vê sobre uma criança.
export async function resumoDaCrianca(criancaId) {
  const [matriculas, mensal, avaliacoes, conquistas] = await Promise.all([
    api.matriculas(criancaId), api.presencaMensal(criancaId), api.avaliacoes(criancaId), api.conquistas(criancaId)])
  const programas = matriculas.map((m) => ({ ...m.turma.programa, turma: m.turma }))
  const presenca = programas.map((p) => {
    const meses = mensal.filter((m) => m.programa_id === p.id)
    // Mês atual só conta depois de 4 registros; antes disso, mostra o anterior.
    const mes = meses.find((m) => m.possiveis >= 4) || meses[0] || null
    return { programa: p, mes, ultimoDia: meses[0]?.ultimo_dia || null }
  })
  const leitura = avaliacoes.filter((a) => a.disciplina === 'leitura')
  return { programas, presenca, leitura, conquistas }
}
