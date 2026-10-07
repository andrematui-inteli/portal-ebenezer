// Camada de dados. Toda leitura passa pelas regras de permissão do banco (RLS):
// o front nunca decide sozinho o que cada perfil pode ver.
import { supabase } from './supabase'

const ok = ({ data, error }) => {
  if (error) throw new Error(traduzErro(error))
  return data
}

function traduzErro(error) {
  const m = error?.message || ''
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha não conferem. Confira e tente de novo.'
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com a internet. Tente de novo em instantes.'
  if (/permission denied|row-level security/i.test(m)) return 'Este conteúdo não está disponível para o seu perfil.'
  return m.replace(/^.*?ERROR:\s*/, '') || 'Algo não saiu como esperado. Tente de novo.'
}

// ───────── Sessão ─────────
export const api = {
  async entrar(email, senha) {
    ok(await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha }))
  },
  async sair() { await supabase.auth.signOut() },
  aoMudarSessao(cb) {
    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => cb(sessao))
    return () => data.subscription.unsubscribe()
  },
  async sessaoAtual() { return (await supabase.auth.getSession()).data.session },
  async meuPerfil() {
    const sessao = await this.sessaoAtual()
    if (!sessao) return null
    const perfil = ok(await supabase.from('perfil').select('id, papel, nome, exibir_nome_publico, nome_publico').eq('id', sessao.user.id).maybeSingle())
    if (perfil) supabase.from('perfil').update({ ultimo_acesso_em: new Date().toISOString() }).eq('id', perfil.id).then(() => {})
    return perfil
  },

  // ───────── Público ─────────
  async programasPublicos() { return ok(await supabase.from('publico_programas').select('*')) },
  async carenciasPublicas() {
    return ok(await supabase.from('publico_carencias').select('*').order('prazo', { ascending: true, nullsFirst: false }))
  },
  async reconhecimento() {
    return ok(await supabase.from('publico_reconhecimento').select('*').order('meses_de_apoio', { ascending: false }).limit(12))
  },
  async indicadoresPublicos() {
    const indicadores = ok(await supabase.from('indicador').select('*').eq('publico', true))
    const valores = ok(await supabase.from('indicador_valor').select('*').order('periodo', { ascending: false }))
    return indicadores.map((i) => ({ ...i, ultimo: valores.find((v) => v.indicador_codigo === i.codigo) || null }))
  },
  async solicitarAcesso(dados) { ok(await supabase.from('solicitacao_acesso').insert(dados)) },
  async atualizacaoGeral() {
    const r = ok(await supabase.from('lote_importacao').select('importado_em').is('desfeito_em', null).order('importado_em', { ascending: false }).limit(1))
    return r[0]?.importado_em || null
  },

  // ───────── Família ─────────
  async meusVinculos() {
    return ok(await supabase.from('responsavel_crianca')
      .select('crianca_id, parentesco, consentimento_em, consentimento_revogado_em, crianca(id, nome_exibicao, ano_nascimento)')
      .order('crianca_id'))
  },
  async consentir(criancaId) {
    const { data: { user } } = await supabase.auth.getUser()
    ok(await supabase.from('responsavel_crianca')
      .update({ consentimento_em: new Date().toISOString(), consentimento_revogado_em: null })
      .eq('crianca_id', criancaId).eq('responsavel_id', user.id))
  },
  async pausarExibicao(criancaId) {
    const { data: { user } } = await supabase.auth.getUser()
    ok(await supabase.from('responsavel_crianca')
      .update({ consentimento_revogado_em: new Date().toISOString() })
      .eq('crianca_id', criancaId).eq('responsavel_id', user.id))
  },
  async matriculas(criancaId) {
    return ok(await supabase.from('matricula')
      .select('id, inicio, fim, turma(id, nome, turno, programa(id, codigo, nome, cadencia))')
      .eq('crianca_id', criancaId).is('fim', null))
  },
  async presencaMensal(criancaId) {
    return ok(await supabase.from('presenca_mensal').select('*').eq('crianca_id', criancaId).order('mes', { ascending: false }))
  },
  async presencaDias(criancaId, desde) {
    return ok(await supabase.from('presenca').select('data, presente, turma_id').eq('crianca_id', criancaId).gte('data', desde).order('data'))
  },
  async avaliacoes(criancaId) {
    return ok(await supabase.from('avaliacao_traduzida').select('*').eq('crianca_id', criancaId).order('data_avaliacao'))
  },
  async conquistas(criancaId) {
    return ok(await supabase.from('conquista')
      .select('id, referencia, obtida_em, vista_em, tipo_conquista(codigo, nome, icone, criterio)')
      .eq('crianca_id', criancaId).order('obtida_em', { ascending: false }))
  },
  async marcarConquistasVistas(criancaId) {
    ok(await supabase.from('conquista').update({ vista_em: new Date().toISOString() }).eq('crianca_id', criancaId).is('vista_em', null))
  },
  async avisos() {
    return ok(await supabase.from('aviso').select('id, titulo, corpo, data_evento, o_que_levar, criado_em, aviso_visto(perfil_id)')
      .eq('publicacao', 'publicado').order('criado_em', { ascending: false }).limit(30))
  },
  async marcarAvisoVisto(avisoId, perfilId) {
    await supabase.from('aviso_visto').upsert({ aviso_id: avisoId, perfil_id: perfilId }, { ignoreDuplicates: true })
  },
  async acessoEstudante(criancaId) {
    const r = ok(await supabase.from('acesso_estudante').select('crianca_id, liberado_em, suspenso_em').eq('crianca_id', criancaId))
    return r[0] || null
  },
  async suspenderAcesso(criancaId, suspender) {
    ok(await supabase.from('acesso_estudante').update({ suspenso_em: suspender ? new Date().toISOString() : null }).eq('crianca_id', criancaId))
  },
  async definirPin(criancaId, pin) { ok(await supabase.rpc('definir_pin_saida', { p_crianca: criancaId, p_pin: pin })) },
  async enviarSugestao(texto, autorId) { ok(await supabase.from('sugestao').insert({ texto, autor_id: autorId })) },
  async minhasSugestoes() { return ok(await supabase.from('sugestao').select('*').order('criada_em', { ascending: false })) },

  // ───────── Estudante ─────────
  async minhaCrianca() {
    const r = ok(await supabase.from('acesso_estudante').select('crianca_id, crianca(id, nome_exibicao, ano_nascimento)'))
    return r[0]?.crianca || null
  },
  async marcosDaTurma() {
    return ok(await supabase.from('marco_turma').select('id, descricao, atingido_em, turma(nome)').order('atingido_em', { ascending: false }))
  },
  async verificarPin(pin) { return ok(await supabase.rpc('verificar_pin_saida', { p_pin: pin })) },

  // ───────── Equipe ─────────
  async painelAtualizacao() { return ok(await supabase.from('painel_atualizacao').select('*')) },
  async alertasPresenca() { return ok(await supabase.from('alerta_presenca').select('*')) },
  async minhasTurmas(perfilId) {
    return ok(await supabase.from('educador_turma').select('turma(id, nome, turno, programa(codigo, nome, cadencia, sensivel))').eq('perfil_id', perfilId))
      .map((r) => r.turma)
  },
  async criancasDaTurma(turmaId) {
    return ok(await supabase.from('matricula').select('crianca(id, nome_exibicao, ano_nascimento, codigo_parceiro)').eq('turma_id', turmaId).is('fim', null))
      .map((r) => r.crianca).sort((a, b) => a.nome_exibicao.localeCompare(b.nome_exibicao))
  },
  async presencaDaTurma(turmaId, desde) {
    return ok(await supabase.from('presenca').select('crianca_id, presente').eq('turma_id', turmaId).gte('data', desde))
  },
  async importar(tipo, arquivo, linhas, confirmar) {
    return ok(await supabase.rpc('importar', { p_tipo: tipo, p_arquivo: arquivo, p_linhas: linhas, p_confirmar: confirmar }))
  },
  async desfazerLote(loteId) { ok(await supabase.rpc('desfazer_lote', { p_lote: loteId })) },
  async lotesRecentes() {
    return ok(await supabase.from('lote_importacao').select('*').order('importado_em', { ascending: false }).limit(6))
  },

  // ───────── Vida escolar (migração 6) ─────────
  // A agenda já chega filtrada pelo banco: cada perfil só recebe o que pode ver.
  async agenda(desde, ate) {
    return ok(await supabase.from('evento').select('*, turma(nome)').gte('inicio', desde).lte('inicio', ate)
      .neq('status', 'cancelado').order('inicio'))
  },
  async salvarEvento(e) { ok(await supabase.from('evento').insert(e)) },
  async atualizarEvento(id, campos) { ok(await supabase.from('evento').update(campos).eq('id', id)) },
  async removerEvento(id) { ok(await supabase.from('evento').delete().eq('id', id)) },
  async equipeContato() { return ok(await supabase.from('equipe_contato').select('*').order('nome')) },
  async todasTurmas() {
    return ok(await supabase.from('turma').select('id, nome, programa(nome, sensivel)').eq('ativo', true).order('nome'))
      .filter((t) => !t.programa.sensivel)
  },

  async tarefas() {
    return ok(await supabase.from('tarefa').select('*, turma(nome), autor:perfil(nome)').order('criado_em', { ascending: false }).limit(60))
  },
  async salvarTarefa(t) { ok(await supabase.from('tarefa').insert(t)) },
  async removerTarefa(id) { ok(await supabase.from('tarefa').delete().eq('id', id)) },

  async materiais() { return ok(await supabase.from('material').select('*').order('ordem')) },
  async salvarMaterial(m) { ok(await supabase.from('material').insert(m)) },

  async livros() { return ok(await supabase.from('livro_disponivel').select('*').order('titulo')) },
  async minhasReservas() {
    return ok(await supabase.from('reserva_livro').select('*, livro(titulo, autor)').in('status', ['reservado', 'retirado']).order('reservado_em', { ascending: false }))
  },
  async reservarLivro(livroId) { return ok(await supabase.rpc('reservar_livro', { p_livro: livroId })) },
  async cancelarReserva(id) { ok(await supabase.from('reserva_livro').update({ status: 'cancelado' }).eq('id', id)) },
  async atualizarReserva(id, status) { ok(await supabase.from('reserva_livro').update({ status }).eq('id', id)) },

  async necessidades() { return this.carenciasPublicas() },
  async presencaIndividual(criancaId) {
    const linhas = ok(await supabase.from('presenca_mensal').select('mes, presentes, possiveis').eq('crianca_id', criancaId).order('mes'))
    const porMes = {}
    for (const l of linhas) { porMes[l.mes] ||= { p: 0, t: 0 }; porMes[l.mes].p += l.presentes; porMes[l.mes].t += l.possiveis }
    return Object.entries(porMes).map(([mes, v]) => ({ mes, presenca_pct: Math.round((100 * v.p) / v.t) }))
  },
  async comprometerDoacao(c) { ok(await supabase.from('compromisso_doacao').insert(c)) },
  async compromissos() {
    return ok(await supabase.from('compromisso_doacao').select('*, carencia(titulo, unidade, vaquinha), perfil:perfil!compromisso_doacao_perfil_id_fkey(nome)').order('criado_em', { ascending: false }).limit(40))
  },
  async confirmarCompromisso(id) { ok(await supabase.rpc('confirmar_compromisso', { p_id: id })) },
  async salvarCarencia(c) { ok(await supabase.from('carencia').insert(c)) },

  async ranking() { return ok(await supabase.from('ranking_apoiadores').select('*').order('posicao')) },

  async notas(criancaId) { return ok(await supabase.from('nota').select('*').eq('crianca_id', criancaId).order('data')) },
  async observacoes(criancaId) {
    return ok(await supabase.from('observacao_aluno').select('*, autor:perfil(nome)').eq('crianca_id', criancaId).order('criado_em', { ascending: false }))
  },
  async lancarNota(n) { ok(await supabase.from('nota').insert(n)) },
  async salvarObservacao(o) { ok(await supabase.from('observacao_aluno').insert(o)) },
  async desempenhoTurmas() { return ok(await supabase.from('desempenho_turma').select('*').order('mes')) },
  // Crianças que o perfil pode acompanhar individualmente (o banco filtra).
  async criancasVisiveis() {
    return ok(await supabase.from('matricula').select('turma_id, crianca(id, nome_exibicao)').is('fim', null))
      .filter((m) => m.crianca)
  },

  async enviarFeedback(texto, tipo, autorId) { ok(await supabase.from('sugestao').insert({ texto, tipo, autor_id: autorId })) },
  async feedbacks() { return ok(await supabase.from('sugestao').select('*, autor:perfil!sugestao_autor_id_fkey(nome, papel)').order('criada_em', { ascending: false }).limit(50)) },
  async responderFeedback(id, resposta, perfilId) {
    ok(await supabase.from('sugestao').update({ resposta, respondida_por: perfilId, respondida_em: new Date().toISOString() }).eq('id', id))
  },
}
