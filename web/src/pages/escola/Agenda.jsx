import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, MessageCircle, Users, Lock } from 'lucide-react'
import { api } from '@api'
import { useSessao } from '../../lib/sessao'
import { useCarregar } from '../../lib/useCarregar'
import { Carregando, Erro, Vazio, Caixa } from '../../components/comuns'
import { dataComDia, hora } from '../../lib/formato'
import { Pagina, Filtros, Modal, ehEquipe } from './comum'

// Tipos de evento: rótulo, grupo do filtro, cor e quem vê por padrão.
const FAMILIA = ['estudante', 'responsavel', 'educacao', 'gestao']
export const TIPOS = {
  aula: { nome: 'Aula', grupo: 'escola', cor: '#256B29', publico: FAMILIA },
  prova: { nome: 'Prova', grupo: 'escola', cor: '#B3261E', publico: FAMILIA },
  entrega: { nome: 'Entrega', grupo: 'escola', cor: '#B4570B', publico: FAMILIA },
  esportiva: { nome: 'Esporte', grupo: 'escola', cor: '#0B6E74', publico: FAMILIA },
  reuniao_pais: { nome: 'Reunião de pais', grupo: 'reuniao', cor: '#7A3E9D', publico: ['responsavel', 'educacao', 'gestao'] },
  reuniao_individual: { nome: 'Conversa', grupo: 'reuniao', cor: '#7A3E9D', publico: null },
  visita_empresa: { nome: 'Visita a empresa', grupo: 'instituto', cor: '#1F5FA8', publico: null, gestao: true },
  workshop_responsaveis: { nome: 'Sábado das famílias', grupo: 'instituto', cor: '#8C6100', publico: ['responsavel', 'educacao', 'gestao'], gestao: true },
  passeio: { nome: 'Passeio', grupo: 'instituto', cor: '#1F5FA8', publico: null, gestao: true },
  encontro_patrocinadores: { nome: 'Encontro de apoiadores', grupo: 'instituto', cor: '#0D3F20', publico: ['doador_pf', 'empresa', 'gestao'], gestao: true },
  institucional: { nome: 'Evento do Instituto', grupo: 'instituto', cor: '#0D3F20', publico: null, gestao: true },
}
export const corDoTipo = (t) => TIPOS[t]?.cor || '#5B6660'
const PAPEIS = [['estudante', 'Alunos'], ['responsavel', 'Responsáveis'], ['educacao', 'Professores'], ['doador_pf', 'Doadores'], ['empresa', 'Empresas'], ['gestao', 'Diretoria']]
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const chaveDia = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}` }

export default function Agenda() {
  const { perfil } = useSessao()
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [filtro, setFiltro] = useState('todos')
  const [dia, setDia] = useState(null)
  const [form, setForm] = useState(null) // 'evento' | 'conversa'
  const { dados, erro, carregando, recarregar } = useCarregar(() => {
    const fim = new Date(mes.getFullYear(), mes.getMonth() + 1, 0, 23, 59)
    return api.agenda(mes.toISOString(), fim.toISOString())
  }, [mes.getTime()])

  const eventos = useMemo(() => (dados || []).filter((e) => filtro === 'todos' || TIPOS[e.tipo]?.grupo === filtro), [dados, filtro])
  const porDia = useMemo(() => eventos.reduce((m, e) => { (m[chaveDia(e.inicio)] ||= []).push(e); return m }, {}), [eventos])
  const visiveis = dia ? porDia[dia] || [] : eventos
  const pendentes = (dados || []).filter((e) => e.status === 'solicitado')
  const andar = (n) => { setMes(new Date(mes.getFullYear(), mes.getMonth() + n, 1)); setDia(null) }
  const podeEditar = ehEquipe(perfil)
  const podePedir = ['responsavel', 'doador_pf', 'empresa'].includes(perfil?.papel)

  return (
    <Pagina titulo="Agenda" largo
      intro={perfil?.papel === 'estudante' ? 'Suas aulas, provas e passeios.' : 'Cada pessoa vê só o que é para ela. Conversas individuais aparecem só para quem participa.'}
      acao={podeEditar ? <button className="botao" onClick={() => setForm('evento')}><Plus size={18} aria-hidden="true" />Novo evento</button>
        : podePedir ? <button className="botao" onClick={() => setForm('conversa')}><MessageCircle size={18} aria-hidden="true" />Pedir conversa</button> : null}>
      <Filtros rotulo="Filtrar eventos" valor={filtro} mudar={setFiltro}
        opcoes={[['todos', 'Tudo'], ['escola', 'Aulas e provas'], ['reuniao', 'Reuniões'], ['instituto', 'Eventos do Instituto']]} />

      {pendentes.length > 0 && <Pendentes eventos={pendentes} perfil={perfil} recarregar={recarregar} />}

      <div className="agenda">
        <section className="cartao calendario" aria-label={`Calendário de ${MESES[mes.getMonth()]}`}>
          <div className="calendario__topo">
            <button className="botao botao--texto" onClick={() => andar(-1)} aria-label="Mês anterior"><ChevronLeft /></button>
            <h2>{MESES[mes.getMonth()]} {mes.getFullYear()}</h2>
            <button className="botao botao--texto" onClick={() => andar(1)} aria-label="Próximo mês"><ChevronRight /></button>
          </div>
          <Grade mes={mes} porDia={porDia} dia={dia} setDia={setDia} />
          {dia && <button className="botao botao--texto" onClick={() => setDia(null)}>Ver o mês inteiro</button>}
        </section>

        <section className="pilha" aria-live="polite">
          {carregando && <Carregando />}
          {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
          {dados && visiveis.length === 0 && <Vazio titulo={dia ? 'Nada marcado neste dia.' : 'Nada marcado neste mês.'}>Escolha outro dia ou mude o filtro.</Vazio>}
          {visiveis.map((e) => <Evento key={e.id} e={e} perfil={perfil} recarregar={recarregar} />)}
        </section>
      </div>

      {form === 'evento' && <FormEvento perfil={perfil} fechar={() => setForm(null)} salvo={() => { setForm(null); recarregar() }} />}
      {form === 'conversa' && <FormConversa perfil={perfil} fechar={() => setForm(null)} salvo={() => { setForm(null); recarregar() }} />}
    </Pagina>
  )
}

function Grade({ mes, porDia, dia, setDia }) {
  const primeiro = mes.getDay()
  const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const hoje = chaveDia(new Date())
  const celulas = [...Array(primeiro).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
  return (
    <div className="calendario__grade">
      {DIAS_SEMANA.map((d, i) => <span key={i} className="calendario__sem" aria-hidden="true">{d}</span>)}
      {celulas.map((n, i) => {
        if (!n) return <span key={i} />
        const k = `${mes.getFullYear()}-${mes.getMonth()}-${n}`
        const evs = porDia[k] || []
        return (
          <button key={i} className={`calendario__dia ${k === hoje ? 'hoje' : ''}`} aria-pressed={dia === k}
            onClick={() => setDia(dia === k ? null : k)} aria-label={`Dia ${n}${evs.length ? `, ${evs.length} evento${evs.length > 1 ? 's' : ''}` : ''}`}>
            {n}
            <span className="calendario__pontos">{evs.slice(0, 3).map((e) => <i key={e.id} style={{ background: corDoTipo(e.tipo) }} />)}</span>
          </button>
        )
      })}
    </div>
  )
}

function Evento({ e, perfil, recarregar }) {
  const t = TIPOS[e.tipo] || { nome: e.tipo }
  const privado = !!e.participantes
  const podeRemover = perfil?.papel === 'gestao' || (e.criado_por === perfil?.id && ehEquipe(perfil))
  return (
    <article className="cartao evento-cartao" style={{ '--cor': corDoTipo(e.tipo) }}>
      <div className="evento-cartao__data">
        <strong>{new Date(e.inicio).getDate()}</strong>
        <span>{MESES[new Date(e.inicio).getMonth()].slice(0, 3)}</span>
      </div>
      <div className="pilha" style={{ flex: 1, minWidth: 0 }}>
        <div className="linha-etiquetas">
          <span className="etiqueta" style={{ background: 'color-mix(in srgb, var(--cor) 14%, white)', color: 'var(--cor)' }}>{t.nome}</span>
          {e.turma && <span className="etiqueta etiqueta--neutra"><Users size={14} aria-hidden="true" />{e.turma.nome}</span>}
          {privado && <span className="etiqueta etiqueta--neutra"><Lock size={14} aria-hidden="true" />Só participantes</span>}
          {e.status === 'solicitado' && <span className="etiqueta etiqueta--alerta">Aguardando confirmação</span>}
        </div>
        <h3>{e.titulo}</h3>
        {e.descricao && <p>{e.descricao}</p>}
        <p className="fonte">
          <Clock size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {dataComDia(e.inicio)}, {hora(e.inicio)}{e.fim && ` às ${hora(e.fim)}`}
          {e.local && <><br /><MapPin size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {e.local}</>}
        </p>
        {podeRemover && (
          <button className="botao botao--texto" style={{ alignSelf: 'flex-start', color: 'var(--erro)' }}
            onClick={async () => { if (confirm(`Cancelar "${e.titulo}"?`)) { await api.atualizarEvento(e.id, { status: 'cancelado' }); recarregar() } }}>
            Cancelar evento
          </button>
        )}
      </div>
    </article>
  )
}

// Pedidos de conversa: a equipe confirma ou recusa; quem pediu acompanha.
function Pendentes({ eventos, perfil, recarregar }) {
  const responder = async (id, status) => { await api.atualizarEvento(id, { status }); recarregar() }
  return (
    <Caixa tipo="alerta" titulo={ehEquipe(perfil) ? `${eventos.length} pedido(s) de conversa para responder` : 'Seu pedido de conversa foi enviado'}>
      <ul className="lista-simples">
        {eventos.map((e) => (
          <li key={e.id}>
            <strong>{e.titulo}</strong> — {dataComDia(e.inicio)}, {hora(e.inicio)}
            {ehEquipe(perfil) && e.criado_por !== perfil.id && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="botao" onClick={() => responder(e.id, 'confirmado')}>Confirmar</button>
                <button className="botao botao--claro" onClick={() => responder(e.id, 'recusado')}>Recusar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Caixa>
  )
}

const juntar = (data, h) => new Date(`${data}T${h}:00`).toISOString()
const hojeISO = () => new Date().toISOString().slice(0, 10)

function FormEvento({ perfil, fechar, salvo }) {
  const gestao = perfil.papel === 'gestao'
  const tipos = Object.entries(TIPOS).filter(([k, t]) => k !== 'reuniao_individual' && (gestao || !t.gestao))
  const [f, setF] = useState({ titulo: '', tipo: 'aula', data: hojeISO(), inicio: '09:00', fim: '10:00', local: '', descricao: '', turma_id: '', publico: TIPOS.aula.publico })
  const [erro, setErro] = useState(null)
  const { dados: turmas } = useCarregar(() => api.todasTurmas())
  const mudar = (k, v) => setF((x) => ({ ...x, [k]: v, ...(k === 'tipo' ? { publico: TIPOS[v].publico } : {}) }))
  const alternar = (p) => mudar('publico', (f.publico || PAPEIS.map(([v]) => v)).includes(p)
    ? (f.publico || PAPEIS.map(([v]) => v)).filter((x) => x !== p) : [...(f.publico || []), p])
  const enviar = async (ev) => {
    ev.preventDefault(); setErro(null)
    try {
      await api.salvarEvento({
        titulo: f.titulo.trim(), tipo: f.tipo, descricao: f.descricao.trim() || null, local: f.local.trim() || null,
        inicio: juntar(f.data, f.inicio), fim: f.fim ? juntar(f.data, f.fim) : null, turma_id: f.turma_id || null,
        publico: f.publico && f.publico.length < PAPEIS.length ? f.publico : null, criado_por: perfil.id,
      })
      salvo()
    } catch (e) { setErro(e.message) }
  }
  const todos = !f.publico
  return (
    <Modal titulo="Novo evento" fechar={fechar}>
      <form className="pilha" onSubmit={enviar}>
        {!gestao && <p className="fonte">Passeios, visitas a empresas, workshops e encontros com apoiadores são marcados pela diretoria.</p>}
        <div className="campo"><label htmlFor="ev-tipo">Tipo</label>
          <select id="ev-tipo" value={f.tipo} onChange={(e) => mudar('tipo', e.target.value)}>
            {tipos.map(([k, t]) => <option key={k} value={k}>{t.nome}</option>)}
          </select></div>
        <div className="campo"><label htmlFor="ev-titulo">Título</label>
          <input id="ev-titulo" required value={f.titulo} onChange={(e) => mudar('titulo', e.target.value)} placeholder="Ex.: Prova de português" /></div>
        <div className="campos-linha">
          <div className="campo"><label htmlFor="ev-data">Dia</label><input id="ev-data" type="date" required value={f.data} onChange={(e) => mudar('data', e.target.value)} /></div>
          <div className="campo"><label htmlFor="ev-ini">Começa</label><input id="ev-ini" type="time" required value={f.inicio} onChange={(e) => mudar('inicio', e.target.value)} /></div>
          <div className="campo"><label htmlFor="ev-fim">Termina</label><input id="ev-fim" type="time" value={f.fim} onChange={(e) => mudar('fim', e.target.value)} /></div>
        </div>
        <div className="campo"><label htmlFor="ev-turma">Turma</label>
          <select id="ev-turma" value={f.turma_id} onChange={(e) => mudar('turma_id', e.target.value)}>
            <option value="">Todas / não se aplica</option>
            {turmas?.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select></div>
        <div className="campo"><label htmlFor="ev-local">Local</label><input id="ev-local" value={f.local} onChange={(e) => mudar('local', e.target.value)} /></div>
        <div className="campo"><label htmlFor="ev-desc">Detalhes</label><textarea id="ev-desc" value={f.descricao} onChange={(e) => mudar('descricao', e.target.value)} placeholder="O que levar, como chegar…" /></div>
        <fieldset className="campo">
          <legend><strong>Quem vê na agenda</strong></legend>
          <div className="filtros">
            {PAPEIS.map(([p, r]) => <button type="button" key={p} aria-pressed={todos || f.publico.includes(p)} onClick={() => alternar(p)}>{r}</button>)}
          </div>
          <small>Ex.: reunião de pais não aparece para apoiadores; prova não aparece para empresas.</small>
        </fieldset>
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo" disabled={!f.titulo.trim()}>Salvar na agenda</button>
      </form>
    </Modal>
  )
}

function FormConversa({ perfil, fechar, salvo }) {
  const { dados: equipe } = useCarregar(() => api.equipeContato())
  const [f, setF] = useState({ com: '', data: hojeISO(), hora: '17:00', assunto: '' })
  const [erro, setErro] = useState(null)
  const enviar = async (ev) => {
    ev.preventDefault(); setErro(null)
    const pessoa = equipe.find((p) => p.id === f.com)
    try {
      await api.salvarEvento({
        titulo: `Conversa com ${pessoa.nome.split(' (')[0]}: ${f.assunto.trim()}`, tipo: 'reuniao_individual', status: 'solicitado',
        inicio: juntar(f.data, f.hora), fim: new Date(new Date(juntar(f.data, f.hora)).getTime() + 30 * 60000).toISOString(),
        participantes: [perfil.id, f.com], criado_por: perfil.id, local: 'Instituto Ebenézer',
      })
      salvo()
    } catch (e) { setErro(e.message) }
  }
  return (
    <Modal titulo="Pedir conversa" fechar={fechar}>
      <form className="pilha" onSubmit={enviar}>
        <p className="suave">Escolha com quem quer falar e um horário. A pessoa confirma e a conversa aparece só na agenda de vocês dois (e da diretoria).</p>
        <div className="campo"><label htmlFor="cv-com">Com quem</label>
          <select id="cv-com" required value={f.com} onChange={(e) => setF({ ...f, com: e.target.value })}>
            <option value="">Escolha…</option>
            {equipe?.map((p) => <option key={p.id} value={p.id}>{p.nome} — {p.papel === 'gestao' ? 'diretoria' : 'professor(a)'}</option>)}
          </select></div>
        <div className="campos-linha">
          <div className="campo"><label htmlFor="cv-data">Dia</label><input id="cv-data" type="date" min={hojeISO()} required value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
          <div className="campo"><label htmlFor="cv-hora">Horário</label><input id="cv-hora" type="time" required value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} /></div>
        </div>
        <div className="campo"><label htmlFor="cv-assunto">Assunto</label>
          <input id="cv-assunto" required maxLength={80} value={f.assunto} onChange={(e) => setF({ ...f, assunto: e.target.value })} placeholder="Ex.: notas de matemática do meu filho" /></div>
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo" disabled={!f.com || !f.assunto.trim()}>Enviar pedido</button>
      </form>
    </Modal>
  )
}
