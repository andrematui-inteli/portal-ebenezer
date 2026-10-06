import { Leaf, TreePine, Ticket, Users, Sprout } from 'lucide-react'

export const ICONE_CONQUISTA = { leaf: Leaf, 'tree-pine': TreePine, ticket: Ticket, users: Users, sprout: Sprout }

const SAIDAS = {
  'saida-pinacoteca': 'Pinacoteca', 'saida-teatro': 'teatro infantil',
  'saida-museu-catavento': 'Museu Catavento', 'saida-concerto': 'concerto',
}
const NIVEIS = { desbravador: 'Desbravador', mochileiro: 'Mochileiro', navegador: 'Navegador', mergulhador: 'Mergulhador' }

// Título legível de uma conquista, a partir do tipo e da referência.
export function tituloConquista(q) {
  const ref = q.referencia || ''
  if (q.tipo_conquista.codigo === 'bloco') return `Bloco ${ref.split('-').pop()} de leitura completo`
  if (q.tipo_conquista.codigo === 'nivel') return `Chegou ao nível ${NIVEIS[ref.replace('nivel-', '')] || ''}`
  if (q.tipo_conquista.codigo === 'cultural') return `Foi ao ${SAIDAS[ref] || 'passeio cultural'}`.replace('ao Pinacoteca', 'à Pinacoteca')
  return q.tipo_conquista.nome
}
