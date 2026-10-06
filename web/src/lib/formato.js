// Formatação em português simples, pensada para baixo letramento.

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

const paraData = (v) => {
  if (!v) return null
  if (v instanceof Date) return v
  // "2026-10-03" vira data local, sem deslocar o dia pelo fuso.
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T12:00:00') : new Date(v)
}

export const nomeMes = (v) => MESES[paraData(v).getMonth()]
export const dataCurta = (v) => { const d = paraData(v); return d ? `${d.getDate()} de ${MESES[d.getMonth()]}` : '' }
export const dataComDia = (v) => { const d = paraData(v); return d ? `${DIAS[d.getDay()]}, ${dataCurta(d)}` : '' }
export const hora = (v) => { const d = paraData(v); return d ? `${d.getHours()}h${d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : ''}` : '' }

export function haQuanto(v) {
  const d = paraData(v); if (!d) return ''
  const dias = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 14) return `há ${dias} dias`
  if (dias < 60) return `há ${Math.floor(dias / 7)} semanas`
  return `há ${Math.floor(dias / 30)} meses`
}

export const idade = (anoNascimento) => new Date().getFullYear() - anoNascimento
export const reais = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export const numero = (v, casas = 0) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: casas })

// "foi em 18 de 20 dias" / "foi em 3 de 4 sábados"
export function fracaoPresenca(presentes, possiveis, cadencia) {
  const unidade = cadencia === 'diaria' ? (possiveis === 1 ? 'dia' : 'dias') : (possiveis === 1 ? 'sábado' : 'sábados')
  return `foi em ${presentes} de ${possiveis} ${unidade}`
}

// Avanço em blocos traduzido em tempo escolar (cerca de 4 blocos = 1 ano).
export function avancoEmTempo(blocos) {
  if (blocos < 0.75) return 'começou a avançar'
  if (blocos < 1.5) return 'avançou o equivalente a um bimestre'
  if (blocos < 2.5) return 'avançou o equivalente a meio ano de escola'
  if (blocos < 3.5) return 'avançou o equivalente a três quartos de ano de escola'
  return 'avançou o equivalente a um ano de escola ou mais'
}
