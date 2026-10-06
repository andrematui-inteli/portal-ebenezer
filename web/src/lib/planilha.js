// Leitura de planilhas da equipe (.xlsx ou .csv) e normalização das colunas.
import { readSheet } from 'read-excel-file/browser'
import Papa from 'papaparse'

export const TIPOS_IMPORTACAO = {
  presenca: {
    titulo: 'Presença das crianças',
    descricao: 'Reforço, Laboratório de Sonhos e Primeira Infância. Uma linha por criança e dia.',
    colunas: ['codigo', 'turma', 'data', 'presente'],
    exemplo: [['EBZ0021', 'Reforço Manhã', '01/10/2026', 'sim'], ['EBZ0022', 'Reforço Manhã', '01/10/2026', 'não']],
  },
  presenca_agregada: {
    titulo: 'Total de presentes nas Vivências',
    descricao: 'Só o número de crianças presentes por turma e dia, sem nomes.',
    colunas: ['turma', 'data', 'presentes', 'possiveis'],
    exemplo: [['Vivências A', '03/10/2026', '10', '12']],
  },
  avaliacao: {
    titulo: 'Avanço na leitura (Alicerce)',
    descricao: 'Relatório de evolução da Alicerce Educação. Uma linha por criança.',
    colunas: ['codigo', 'disciplina', 'data', 'nivel', 'blocos'],
    exemplo: [['EBZ0021', 'leitura', '02/10/2026', 'Mochileiro', '8,5']],
  },
}

const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
const APELIDOS = {
  'codigo da crianca': 'codigo', código: 'codigo', crianca: 'codigo', aluno: 'codigo',
  dia: 'data', presenca: 'presente', 'presente?': 'presente', 'nivel de leitura': 'nivel',
  'blocos acumulados': 'blocos', 'possiveis': 'possiveis', 'total': 'possiveis', 'presentes': 'presentes',
}
const nomeColuna = (h) => { const n = semAcento(h); return APELIDOS[n] || n.replace(/\s+/g, '_') }

function paraISO(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  const s = String(v ?? '').trim()
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) { const ano = m[3].length === 2 ? '20' + m[3] : m[3]; return `${ano}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` }
  m = s.match(/^\d{4}-\d{2}-\d{2}/)
  return m ? m[0] : s
}
function paraBool(v) {
  const s = semAcento(v)
  if (['sim', 's', '1', 'p', 'presente', 'true', 'x', 'veio'].includes(s)) return true
  if (['nao', 'n', '0', 'f', 'falta', 'false', 'faltou', ''].includes(s)) return false
  return s
}
const paraNumero = (v) => (typeof v === 'number' ? v : String(v ?? '').trim().replace(',', '.'))

export async function lerPlanilha(arquivo, tipo) {
  let linhas
  if (/\.csv$/i.test(arquivo.name)) {
    const texto = await arquivo.text()
    linhas = Papa.parse(texto, { skipEmptyLines: true, delimiter: '' }).data
  } else if (/\.xlsx$/i.test(arquivo.name)) {
    linhas = await readSheet(arquivo)
  } else {
    throw new Error('Use um arquivo .xlsx (Excel) ou .csv.')
  }
  if (linhas.length < 2) throw new Error('A planilha está vazia. Confira se as linhas estão na primeira aba.')
  const cabecalho = linhas[0].map(nomeColuna)
  const faltando = TIPOS_IMPORTACAO[tipo].colunas.filter((c) => !cabecalho.includes(c))
  if (faltando.length) throw new Error(`Faltam as colunas: ${faltando.join(', ')}. Baixe o modelo para ver o formato.`)

  return linhas.slice(1).map((l) => {
    const o = Object.fromEntries(cabecalho.map((c, i) => [c, l[i]]))
    const r = { data: paraISO(o.data) }
    if (o.codigo != null) r.codigo = String(o.codigo).trim().toUpperCase()
    if (o.turma != null) r.turma = String(o.turma).trim()
    if (tipo === 'presenca') r.presente = paraBool(o.presente)
    if (tipo === 'presenca_agregada') { r.presentes = paraNumero(o.presentes); r.possiveis = paraNumero(o.possiveis) }
    if (tipo === 'avaliacao') { r.disciplina = semAcento(o.disciplina) || 'leitura'; r.nivel = String(o.nivel ?? '').trim(); r.blocos = paraNumero(o.blocos) }
    return r
  })
}

export function baixarModelo(tipo) {
  const t = TIPOS_IMPORTACAO[tipo]
  const csv = [t.colunas, ...t.exemplo].map((l) => l.map((c) => `"${c}"`).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `modelo-${tipo}.csv` })
  a.click(); URL.revokeObjectURL(url)
}
