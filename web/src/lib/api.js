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
}
