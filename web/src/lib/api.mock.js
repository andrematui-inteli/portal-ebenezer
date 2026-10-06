// Dados de exemplo para revisar as telas sem Supabase (npm run dev:mock).
// Mesmo formato das respostas reais de api.js. Nunca entra no build de produção.

const hoje = new Date()
const iso = (d) => d.toISOString().slice(0, 10)
const diasAtras = (n) => { const d = new Date(hoje); d.setDate(d.getDate() - n); return d }
let semente = 7
const sorte = () => { semente = (semente * 9301 + 49297) % 233280; return semente / 233280 }

const PERSONAS = {
  'gestao@ebenezer.test': { id: 'p-gestao', papel: 'gestao', nome: 'Elias (gestão)' },
  'educacao@ebenezer.test': { id: 'p-beatriz', papel: 'educacao', nome: 'Beatriz (coordenação)' },
  'responsavel@ebenezer.test': { id: 'p-adriana', papel: 'responsavel', nome: 'Adriana' },
  'pendente@ebenezer.test': { id: 'p-rosa', papel: 'responsavel', nome: 'Rosa' },
  'estudante@ebenezer.test': { id: 'p-kaua', papel: 'estudante', nome: 'Kauã' },
  'doador@ebenezer.test': { id: 'p-marisa', papel: 'doador_pf', nome: 'Marisa', exibir_nome_publico: true, nome_publico: 'Marisa S.' },
  'empresa@ebenezer.test': { id: 'p-roberto', papel: 'empresa', nome: 'Roberto (TechNorte Sistemas)' },
}
const CHAVE = 'mock-persona'
let ouvintes = []
const personaAtual = () => PERSONAS[sessionStorage.getItem(CHAVE)] || null

const PROG = {
  reforco: { id: 'pr-ref', codigo: 'reforco', nome: 'Reforço Escolar', cadencia: 'diaria' },
  sonhos: { id: 'pr-son', codigo: 'sonhos', nome: 'Laboratório de Sonhos', cadencia: 'semanal' },
  infancia: { id: 'pr-inf', codigo: 'infancia', nome: 'Primeira Infância', cadencia: 'semanal' },
}
const CRIANCAS = {
  kaua: { id: 'c-kaua', nome_exibicao: 'Kauã R.', ano_nascimento: hoje.getFullYear() - 9 },
  ana: { id: 'c-ana', nome_exibicao: 'Ana R.', ano_nascimento: hoje.getFullYear() - 4 },
  heitor: { id: 'c-heitor', nome_exibicao: 'Heitor M.', ano_nascimento: hoje.getFullYear() - 8 },
}
const MATRICULAS = {
  'c-kaua': [
    { id: 'm1', inicio: '2026-02-02', fim: null, turma: { id: 't-ref-m', nome: 'Reforço Manhã', turno: 'Segunda a sexta, 8h–11h30', programa: PROG.reforco } },
    { id: 'm2', inicio: '2026-02-02', fim: null, turma: { id: 't-son-a', nome: 'Sonhos A', turno: 'Sábado, 12h–16h', programa: PROG.sonhos } },
  ],
  'c-ana': [{ id: 'm3', inicio: '2026-02-02', fim: null, turma: { id: 't-inf', nome: 'Primeira Infância', turno: 'Sábado, 12h–14h', programa: PROG.infancia } }],
}

function gerarDias(criancaId) {
  const dias = []
  for (const m of MATRICULAS[criancaId] || []) {
    const diaria = m.turma.programa.cadencia === 'diaria'
    const fim = m.turma.programa.codigo === 'infancia' ? diasAtras(28) : diasAtras(diaria ? 3 : 1)
    for (let d = new Date('2026-02-02T12:00:00'); d <= fim; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay()
      if (diaria ? dow === 0 || dow === 6 : dow !== 6) continue
      if (d.getMonth() === 6 && d.getDate() >= 13 && d.getDate() <= 24) continue
      dias.push({ data: iso(d), presente: sorte() < 0.88, turma_id: m.turma.id, programa_id: m.turma.programa.id })
    }
  }
  return dias
}
const DIAS = { 'c-kaua': gerarDias('c-kaua'), 'c-ana': gerarDias('c-ana') }

const AVALIACOES = { 'c-kaua': [] }
;[6.2, 6.5, 6.9, 7.2, 7.4, 7.8, 8.3, 8.9].forEach((b, i) => {
  const d = new Date('2026-02-02T12:00:00'); d.setMonth(1 + i)
  const n = b < 8 ? ['Desbravador', '1º e 2º ano', 1] : ['Mochileiro', '3º ano', 2]
  AVALIACOES['c-kaua'].push({ id: 'a' + i, crianca_id: 'c-kaua', disciplina: 'leitura', data_avaliacao: iso(d), blocos_acumulados: b, nivel: n[0], serie_equivalente: n[1], nivel_ordem: n[2] })
})
const TIPOS = {
  bloco: { codigo: 'bloco', nome: 'Bloco concluído', icone: 'leaf', criterio: 'Completar um bloco pedagógico' },
  nivel: { codigo: 'nivel', nome: 'Novo nível de leitura', icone: 'tree-pine', criterio: 'Subir de nível na leitura' },
  cultural: { codigo: 'cultural', nome: 'Vivência cultural', icone: 'ticket', criterio: 'Participar de uma saída cultural' },
}
let CONQUISTAS = {
  'c-kaua': [
    { id: 'q1', referencia: 'leitura-bloco-8', obtida_em: diasAtras(33).toISOString(), vista_em: diasAtras(30).toISOString(), tipo_conquista: TIPOS.bloco },
    { id: 'q2', referencia: 'nivel-mochileiro', obtida_em: diasAtras(33).toISOString(), vista_em: diasAtras(30).toISOString(), tipo_conquista: TIPOS.nivel },
    { id: 'q3', referencia: 'saida-pinacoteca', obtida_em: diasAtras(120).toISOString(), vista_em: diasAtras(118).toISOString(), tipo_conquista: TIPOS.cultural },
    { id: 'q4', referencia: 'saida-museu-catavento', obtida_em: diasAtras(4).toISOString(), vista_em: null, tipo_conquista: TIPOS.cultural },
    { id: 'q5', referencia: 'leitura-bloco-7', obtida_em: diasAtras(120).toISOString(), vista_em: diasAtras(118).toISOString(), tipo_conquista: TIPOS.bloco },
  ],
}
const VINCULOS = {
  'p-adriana': [
    { crianca_id: 'c-ana', parentesco: 'mãe', consentimento_em: '2026-02-05', consentimento_revogado_em: null, crianca: CRIANCAS.ana },
    { crianca_id: 'c-kaua', parentesco: 'mãe', consentimento_em: '2026-02-05', consentimento_revogado_em: null, crianca: CRIANCAS.kaua },
  ],
  'p-rosa': [{ crianca_id: 'c-heitor', parentesco: 'avó', consentimento_em: null, consentimento_revogado_em: null, crianca: CRIANCAS.heitor }],
}
const daqui = (dias, h) => { const d = new Date(hoje); d.setDate(d.getDate() + dias); d.setHours(h, 0, 0, 0); return d.toISOString() }
const AVISOS = [
  { id: 'v1', titulo: 'Saída ao Museu Catavento', corpo: 'Vamos ao museu com as turmas do Laboratório de Sonhos. Saída às 9h do Instituto, volta às 15h.', data_evento: daqui(11, 9), o_que_levar: 'Lanche, garrafa de água e a camiseta do Instituto', criado_em: diasAtras(3).toISOString(), aviso_visto: [] },
  { id: 'v2', titulo: 'Reunião de famílias do reforço', corpo: 'Conversa sobre o avanço da turma no semestre, com a equipe da Alicerce.', data_evento: daqui(6, 18), o_que_levar: null, criado_em: diasAtras(5).toISOString(), aviso_visto: [{ perfil_id: 'p-adriana' }] },
  { id: 'v3', titulo: 'Não haverá reforço na sexta', corpo: 'A sexta-feira é ponto facultativo. O reforço volta na segunda.', data_evento: daqui(4, 8), o_que_levar: null, criado_em: diasAtras(1).toISOString(), aviso_visto: [] },
  { id: 'v4', titulo: 'Vacinação na UBS', corpo: 'A UBS do bairro faz campanha de vacinação no sábado. Leve a carteirinha.', data_evento: daqui(-20, 9), o_que_levar: 'Carteirinha de vacinação', criado_em: diasAtras(26).toISOString(), aviso_visto: [{ perfil_id: 'p-adriana' }] },
]
const ACESSO = { 'c-kaua': { crianca_id: 'c-kaua', liberado_em: '2026-02-12', suspenso_em: null } }
const NOMES = ['Davi', 'Alice', 'Theo', 'Helena', 'Gael', 'Laura', 'Miguel', 'Lívia', 'Samuel', 'Cecília', 'Ravi', 'Clara', 'Bento', 'Isis', 'Lucas', 'Luna', 'Caio', 'Yasmin', 'Joaquim']
const INI = ['A.', 'B.', 'C.', 'D.', 'F.', 'G.', 'L.', 'M.', 'N.', 'P.', 'R.', 'S.']

const espera = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 150))

export const api = {
  async entrar(email, senha) {
    const e = email.trim().toLowerCase()
    if (!PERSONAS[e] || senha !== 'Ebenezer#2026') throw new Error('E-mail ou senha não conferem. Confira e tente de novo.')
    sessionStorage.setItem(CHAVE, e); ouvintes.forEach((cb) => cb({ user: PERSONAS[e] }))
  },
  async sair() { sessionStorage.removeItem(CHAVE); ouvintes.forEach((cb) => cb(null)) },
  aoMudarSessao(cb) { ouvintes.push(cb); return () => { ouvintes = ouvintes.filter((o) => o !== cb) } },
  async sessaoAtual() { const p = personaAtual(); return p ? { user: p } : null },
  async meuPerfil() { return espera(personaAtual()) },

  async programasPublicos() {
    return espera([
      { codigo: 'reforco', nome: 'Reforço Escolar', descricao: 'Leitura, escrita, matemática e inglês com a Alicerce Educação, no contraturno.', cadencia: 'diaria', idade_min: 6, idade_max: 12, turmas: 2, criancas_atendidas: 40, taxa_presenca_90d: 86.1 },
      { codigo: 'sonhos', nome: 'Laboratório de Sonhos', descricao: 'Oficinas temáticas, atividades criativas, rodas de conversa e vivências culturais.', cadencia: 'semanal', idade_min: 6, idade_max: 11, turmas: 2, criancas_atendidas: 60, taxa_presenca_90d: 83.6 },
      { codigo: 'infancia', nome: 'Primeira Infância', descricao: 'Atividades lúdicas, brincadeiras dirigidas e estímulos sensoriais e motores.', cadencia: 'semanal', idade_min: 3, idade_max: 5, turmas: 1, criancas_atendidas: 20, taxa_presenca_90d: 83.1 },
      { codigo: 'vivencias', nome: 'Vivências Terapêuticas', descricao: 'Encontros em grupo para trabalhar emoções, convivência e autoestima.', cadencia: 'semanal', idade_min: 3, idade_max: 12, turmas: 2, criancas_atendidas: 24, taxa_presenca_90d: 80.2 },
    ])
  },
  async carenciasPublicas() {
    return espera([
      { id: 'k1', titulo: 'Cadernos para o segundo semestre', descricao: '120 cadernos de 96 folhas para o reforço e o Laboratório de Sonhos.', categoria: 'material_pedagogico', quantidade_necessaria: 120, quantidade_atendida: 84, prazo: iso(diasAtras(-20)), status: 'parcial', progresso_pct: 70 },
      { id: 'k2', titulo: 'Transporte para a saída ao museu', descricao: 'Ônibus para 60 crianças e 8 acompanhantes.', categoria: 'experiencias', quantidade_necessaria: 1, quantidade_atendida: 0, prazo: iso(diasAtras(-18)), status: 'aberta', progresso_pct: 0 },
      { id: 'k3', titulo: 'Tintas e pincéis para as oficinas', descricao: 'Material das oficinas de artes visuais do semestre.', categoria: 'material_pedagogico', quantidade_necessaria: 30, quantidade_atendida: 12, prazo: iso(diasAtras(-25)), status: 'parcial', progresso_pct: 40 },
      { id: 'k4', titulo: 'Lanche dos sábados de novembro', descricao: 'Lanche para 140 crianças em 4 sábados.', categoria: 'alimentacao', quantidade_necessaria: 4, quantidade_atendida: 1, prazo: iso(diasAtras(-30)), status: 'parcial', progresso_pct: 25 },
      { id: 'k5', titulo: 'Ventiladores para a sala de leitura', descricao: 'A sala passa de 32 °C à tarde. Precisamos de 4 ventiladores de parede.', categoria: 'infraestrutura', quantidade_necessaria: 4, quantidade_atendida: 0, prazo: iso(diasAtras(-45)), status: 'aberta', progresso_pct: 0 },
      { id: 'k6', titulo: 'Ingressos para o teatro infantil', descricao: '60 ingressos para a turma do Laboratório de Sonhos.', categoria: 'experiencias', quantidade_necessaria: 60, quantidade_atendida: 60, prazo: iso(diasAtras(10)), status: 'atendida', progresso_pct: 100 },
    ])
  },
  async reconhecimento() {
    return espera([['Marisa S.', 9], ['Elaine A.', 9], ['TechNorte Sistemas', 8], ['Simone D.', 8], ['Juliana A.', 8], ['Construtora Horizonte', 6], ['Gisele B.', 7], ['Rogério T.', 5]]
      .map(([nome_publico, meses_de_apoio]) => ({ nome_publico, meses_de_apoio, carencias_apoiadas: 1 })))
  },
  async indicadoresPublicos() {
    const v = (valor, dias, periodo) => ({ valor, atualizado_em: diasAtras(dias).toISOString(), periodo })
    return espera([
      { codigo: 'criancas_atendidas', nome: 'Crianças atendidas', fonte: 'Cadastro do portal', frequencia: 'Semanal', ultimo: v(129, 4, iso(diasAtras(30))) },
      { codigo: 'taxa_presenca', nome: 'Taxa de presença', fonte: 'Planilhas de presença importadas', frequencia: 'Semanal', ultimo: v(86.1, 4, '2026-09-01') },
      { codigo: 'criancas_com_avanco', nome: 'Crianças com avanço pedagógico', fonte: 'Relatório de evolução da Alicerce', frequencia: 'Quinzenal', ultimo: v(85, 30, '2026-09-02') },
      { codigo: 'avanco_medio_blocos', nome: 'Avanço médio em blocos', fonte: 'Relatório de evolução da Alicerce', frequencia: 'Quinzenal', ultimo: v(1.86, 30, '2026-09-02') },
      { codigo: 'experiencias_culturais', nome: 'Acessos culturais', fonte: 'Registro da equipe de ações externas', frequencia: 'Mensal', ultimo: v(158, 6, '2026-10-01') },
      { codigo: 'carencias_atendidas', nome: 'Carências atendidas', fonte: 'Cadastro de carências do portal', frequencia: 'Semanal', ultimo: v(2, 6, '2026-10-01') },
      { codigo: 'sroi', nome: 'Retorno social (SROI)', fonte: 'Relatório SROI 2025', frequencia: 'Anual', ultimo: v(4.18, 200, '2025-12-31') },
    ])
  },
  async solicitarAcesso() { return espera(null) },
  async atualizacaoGeral() { return diasAtras(4).toISOString() },

  async meusVinculos() { return espera(VINCULOS[personaAtual()?.id] || []) },
  async consentir(id) { for (const l of Object.values(VINCULOS)) for (const v of l) if (v.crianca_id === id) { v.consentimento_em = iso(hoje); v.consentimento_revogado_em = null } },
  async pausarExibicao(id) { for (const l of Object.values(VINCULOS)) for (const v of l) if (v.crianca_id === id) v.consentimento_revogado_em = iso(hoje) },
  async matriculas(id) { return espera(MATRICULAS[id] || []) },
  async presencaMensal(id) {
    const m = {}
    for (const d of DIAS[id] || []) {
      const k = d.programa_id + d.data.slice(0, 7)
      m[k] ||= { crianca_id: id, programa_id: d.programa_id, mes: d.data.slice(0, 7) + '-01', presentes: 0, possiveis: 0, ultimo_dia: d.data }
      m[k].possiveis++; if (d.presente) m[k].presentes++; m[k].ultimo_dia = d.data
    }
    return espera(Object.values(m).sort((a, b) => b.mes.localeCompare(a.mes)))
  },
  async presencaDias(id, desde) { return espera((DIAS[id] || []).filter((d) => d.data >= desde)) },
  async avaliacoes(id) { return espera(AVALIACOES[id] || []) },
  async conquistas(id) { return espera(CONQUISTAS[id] || []) },
  async marcarConquistasVistas(id) { (CONQUISTAS[id] || []).forEach((c) => { c.vista_em ||= hoje.toISOString() }) },
  async avisos() { return espera(personaAtual()?.papel === 'estudante' ? [] : AVISOS) },
  async marcarAvisoVisto(avisoId, perfilId) { AVISOS.find((a) => a.id === avisoId)?.aviso_visto.push({ perfil_id: perfilId }) },
  async acessoEstudante(id) { return espera(ACESSO[id] || null) },
  async suspenderAcesso(id, s) { if (ACESSO[id]) ACESSO[id].suspenso_em = s ? hoje.toISOString() : null },
  async definirPin(_id, pin) { if (!/^\d{4}$/.test(pin)) throw new Error('O PIN precisa ter 4 números') },
  async enviarSugestao() { return espera(null) },
  async minhasSugestoes() { return espera([{ id: 's1', texto: 'Seria bom ter o horário do reforço no aplicativo.', criada_em: diasAtras(30).toISOString(), resposta: 'Boa ideia! O horário já aparece na tela de cada programa.', respondida_em: diasAtras(28).toISOString() }]) },

  async minhaCrianca() { return espera(CRIANCAS.kaua) },
  async marcosDaTurma() {
    return espera([
      { id: 'mt1', descricao: 'A turma da manhã teve 85% de presença em agosto', atingido_em: '2026-09-02', turma: { nome: 'Reforço Manhã' } },
      { id: 'mt2', descricao: 'A turma A esteve presente em peso na saída à Pinacoteca', atingido_em: '2026-03-14', turma: { nome: 'Sonhos A' } },
    ])
  },
  async verificarPin(pin) { return espera(pin === '1234') },

  async painelAtualizacao() {
    return espera([
      { codigo: 'reforco', nome: 'Reforço Escolar', cadencia: 'diaria', ultima_presenca: iso(diasAtras(4)), estado: 'atualizado' },
      { codigo: 'sonhos', nome: 'Laboratório de Sonhos', cadencia: 'semanal', ultima_presenca: iso(diasAtras(3)), estado: 'atualizado' },
      { codigo: 'infancia', nome: 'Primeira Infância', cadencia: 'semanal', ultima_presenca: iso(diasAtras(31)), estado: 'desatualizado' },
      { codigo: 'vivencias', nome: 'Vivências Terapêuticas', cadencia: 'semanal', ultima_presenca: iso(diasAtras(3)), estado: 'atualizado' },
    ])
  },
  async alertasPresenca() {
    return espera([
      { crianca_id: 'x1', nome_exibicao: 'Yasmin T.', turma: 'Reforço Tarde', presenca_recente: 31, presenca_anterior: 91 },
      { crianca_id: 'x2', nome_exibicao: 'Maria F.', turma: 'Reforço Tarde', presenca_recente: 15, presenca_anterior: 86 },
      { crianca_id: 'x3', nome_exibicao: 'Erick L.', turma: 'Reforço Manhã', presenca_recente: 46, presenca_anterior: 82 },
    ])
  },
  async minhasTurmas() {
    return espera([MATRICULAS['c-kaua'][0].turma, { id: 't-ref-t', nome: 'Reforço Tarde', turno: 'Segunda a sexta, 13h30–17h', programa: PROG.reforco },
      MATRICULAS['c-kaua'][1].turma, { id: 't-son-b', nome: 'Sonhos B', turno: 'Sábado, 12h–16h', programa: PROG.sonhos }, MATRICULAS['c-ana'][0].turma]
      .map((t) => ({ ...t, programa: { ...t.programa, sensivel: false } })))
  },
  async criancasDaTurma(turmaId) {
    return espera(NOMES.map((n, i) => ({ id: turmaId + i, nome_exibicao: `${n} ${INI[i % INI.length]}`, ano_nascimento: 2016, codigo_parceiro: 'EBZ' + String(21 + i).padStart(4, '0') })))
  },
  async presencaDaTurma(turmaId) {
    const r = []
    NOMES.forEach((_, i) => { for (let k = 0; k < 20; k++) r.push({ crianca_id: turmaId + i, presente: sorte() < (i === 3 ? 0.4 : 0.88) }) })
    return espera(r)
  },
  async importar(tipo, arquivo, linhas, confirmar) {
    const erros = []
    linhas.forEach((l, i) => {
      if (tipo !== 'presenca_agregada' && !/^EBZ\d{4}$/.test(l.codigo || '')) erros.push({ linha: i + 1, mensagem: `Código "${l.codigo ?? ''}" não corresponde a nenhuma criança cadastrada.` })
      if (tipo !== 'avaliacao' && !['Reforço Manhã', 'Reforço Tarde', 'Sonhos A', 'Sonhos B', 'Primeira Infância', 'Vivências A', 'Vivências B'].includes(l.turma)) erros.push({ linha: i + 1, mensagem: `Turma "${l.turma ?? ''}" não encontrada. Confira o nome na planilha.` })
    })
    if (confirmar && erros.length) throw new Error(`Importação cancelada: ${erros.length} linha(s) com erro. Nada foi gravado.`)
    const n = linhas.length - erros.length
    return espera({ lote: confirmar ? 'lote-novo' : null, criadas: Math.ceil(n * 0.8), alteradas: Math.floor(n * 0.1), ignoradas: n - Math.ceil(n * 0.8) - Math.floor(n * 0.1), erros })
  },
  async desfazerLote() { return espera(null) },
  async lotesRecentes() {
    return espera([
      { id: 'l1', tipo: 'presenca', arquivo_nome: 'presenca-reforco-2026-10.xlsx', importado_em: diasAtras(2).toISOString(), criadas: 80, alteradas: 0, ignoradas: 0, desfeito_em: null },
      { id: 'l2', tipo: 'presenca', arquivo_nome: 'presenca-sonhos-2026-10.xlsx', importado_em: diasAtras(2).toISOString(), criadas: 60, alteradas: 2, ignoradas: 0, desfeito_em: null },
      { id: 'l3', tipo: 'avaliacao', arquivo_nome: 'alicerce-evolucao-2026-09.csv', importado_em: diasAtras(31).toISOString(), criadas: 40, alteradas: 0, ignoradas: 0, desfeito_em: null },
    ])
  },
}
