import { useEffect } from 'react'
import {
  BarChart3, BookOpen, CalendarDays, ClipboardList, Home, LayoutGrid, Library, Link2, LogOut, MessageSquareText,
  Package, Trophy, Upload, Users, Bell, User, UserPlus,
} from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Espaco } from '../estudante/Espaco'
import { useSessao } from '../../lib/sessao'

// Seções da "Escola". Cada uma diz quem enxerga; a última palavra é sempre do banco (RLS).
export const SECOES = [
  { para: '/escola/agenda', titulo: 'Agenda', desc: 'Aulas, provas, entregas, reuniões e eventos do Instituto.', Icone: CalendarDays, cor: '#1F5FA8',
    papeis: ['estudante', 'responsavel', 'educacao', 'gestao', 'doador_pf', 'empresa'] },
  { para: '/escola/tarefas', titulo: 'Tarefas', desc: 'Lição de casa, dicas de estudo e o resumo de cada aula.', Icone: ClipboardList, cor: '#256B29',
    papeis: ['estudante', 'responsavel', 'educacao', 'gestao', 'doador_pf', 'empresa'] },
  { para: '/escola/desempenho', titulo: 'Desempenho', desc: 'Notas, presença e evolução, da criança e da turma.', Icone: BarChart3, cor: '#8C6100',
    papeis: ['estudante', 'responsavel', 'educacao', 'gestao', 'doador_pf', 'empresa'] },
  { para: '/escola/biblioteca', titulo: 'Biblioteca', desc: 'Reserve livros para levar para casa.', Icone: Library, cor: '#7A3E9D',
    papeis: ['estudante', 'responsavel', 'educacao', 'gestao', 'doador_pf', 'empresa'] },
  { para: '/escola/estudos', titulo: 'Links de estudo', desc: 'Sites e cursos gratuitos para crianças e famílias.', Icone: Link2, cor: '#0B6E74',
    papeis: ['estudante', 'responsavel', 'educacao', 'gestao', 'doador_pf', 'empresa'] },
  { para: '/escola/necessidades', titulo: 'Necessidades', desc: 'O que está faltando e quanto já foi doado.', Icone: Package, cor: '#B4570B',
    papeis: ['responsavel', 'educacao', 'gestao', 'doador_pf', 'empresa'] },
  { para: '/escola/ranking', titulo: 'Ranking de apoio', desc: 'Quem mais tem ajudado, pessoas e empresas.', Icone: Trophy, cor: '#8C6100',
    papeis: ['responsavel', 'educacao', 'gestao', 'doador_pf', 'empresa'] },
  { para: '/escola/feedback', titulo: 'Sugestões', desc: 'Mande uma sugestão, reclamação ou elogio.', Icone: MessageSquareText, cor: '#5B6660',
    papeis: ['responsavel', 'educacao', 'gestao', 'doador_pf', 'empresa'] },
  { para: '/escola/cadastro', titulo: 'Cadastro', desc: 'Famílias, alunos, professores e pedidos de acesso.', Icone: UserPlus, cor: '#0D3F20',
    papeis: ['gestao'] },
]
export const secoesDo = (papel) => SECOES.filter((s) => s.papeis.includes(papel))

const ESCOLA = { para: '/escola', rotulo: 'Escola', Icone: LayoutGrid }
export function navPorPapel(papel) {
  if (papel === 'responsavel') return [
    { para: '/familia', rotulo: 'Início', Icone: Home, fim: true }, ESCOLA,
    { para: '/familia/avisos', rotulo: 'Avisos', Icone: Bell }, { para: '/familia/conta', rotulo: 'Conta', Icone: User }]
  if (papel === 'educacao' || papel === 'gestao') return [
    { para: '/equipe', rotulo: 'Pendências', Icone: ClipboardList, fim: true }, ESCOLA,
    { para: '/equipe/importar', rotulo: 'Importar', Icone: Upload }, { para: '/equipe/turmas', rotulo: 'Turmas', Icone: Users }]
  return [
    { ...ESCOLA, fim: true }, { para: '/escola/agenda', rotulo: 'Agenda', Icone: CalendarDays },
    { para: '/escola/necessidades', rotulo: 'Necessidades', Icone: Package }, { para: '/escola/ranking', rotulo: 'Ranking', Icone: Trophy }]
}

export const ehEquipe = (p) => p?.papel === 'educacao' || p?.papel === 'gestao'
export const ehApoiador = (p) => p?.papel === 'doador_pf' || p?.papel === 'empresa'

// Moldura certa para cada perfil: a criança fica no próprio espaço; os adultos, na navegação do perfil.
export function Pagina({ titulo, intro, children, largo, acao }) {
  const { perfil } = useSessao()
  useEffect(() => { document.title = `${titulo} · Instituto Ebenézer` }, [titulo])
  const cabeca = (
    <div className="cabeca">
      <div className="pilha" style={{ flex: 1 }}>
        <h1>{titulo}</h1>
        {intro && <p className="suave">{intro}</p>}
      </div>
      {acao}
    </div>
  )
  if (perfil?.papel === 'estudante') return <Espaco tela="escola">{cabeca}{children}</Espaco>
  return (
    <Moldura itens={navPorPapel(perfil?.papel)} largo={largo}
      acaoTopo={ehApoiador(perfil) && <button className="botao botao--texto" onClick={() => api.sair()}><LogOut size={18} aria-hidden="true" />Sair</button>}>
      <div className="pilha-g">{cabeca}{children}</div>
    </Moldura>
  )
}

// Botões em pílula para filtrar listas.
export function Filtros({ opcoes, valor, mudar, rotulo }) {
  return (
    <div className="filtros" role="group" aria-label={rotulo}>
      {opcoes.map(([v, r]) => (
        <button key={v} type="button" aria-pressed={valor === v} onClick={() => mudar(v)}>{r}</button>
      ))}
    </div>
  )
}

export function Modal({ titulo, fechar, children }) {
  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && fechar()
    window.addEventListener('keydown', tecla); return () => window.removeEventListener('keydown', tecla)
  }, [fechar])
  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal modal--form">
        <div className="cabeca"><h2 style={{ flex: 1 }}>{titulo}</h2><button className="botao botao--texto" onClick={fechar}>Fechar</button></div>
        {children}
      </div>
    </div>
  )
}

// Gráfico de barras simples, sem biblioteca: um grupo por período, uma barra por série.
// dados: [{ rotulo, valores: { serie: numero|null } }]; series: [{ chave, nome, cor }]
export function Barras({ dados, series, max, sufixo = '', titulo }) {
  const resumo = dados.map((d) => `${d.rotulo}: ${series.map((s) => `${s.nome} ${d.valores[s.chave] ?? 'sem dado'}${sufixo}`).join(', ')}`).join('; ')
  return (
    <figure className="grafico">
      {titulo && <figcaption>{titulo}</figcaption>}
      {series.length > 1 && (
        <div className="grafico__legenda" aria-hidden="true">
          {series.map((s) => <span key={s.chave}><i style={{ background: s.cor }} />{s.nome}</span>)}
        </div>
      )}
      <div className="grafico__area" role="img" aria-label={`${titulo || 'Gráfico'}. ${resumo}`}>
        {[0, 0.5, 1].map((f) => <span key={f} className="grafico__guia" style={{ bottom: `calc(26px + ${f} * (100% - 46px))` }}><b>{Math.round(max * f)}{sufixo}</b></span>)}
        {dados.map((d) => (
          <div key={d.rotulo} className="grafico__grupo">
            <div className="grafico__barras">
              {series.map((s) => {
                const v = d.valores[s.chave]
                return (
                  <div key={s.chave} className="grafico__barra" title={`${s.nome}: ${v ?? '—'}${sufixo}`}
                    style={{ height: `${v == null ? 0 : Math.max(2, (v / max) * 100)}%`, background: s.cor }}>
                    {series.length === 1 && v != null && <em>{v}</em>}
                  </div>
                )
              })}
            </div>
            <span className="grafico__rotulo">{d.rotulo}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}

export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const mesCurto = (iso) => MESES_CURTOS[Number(iso.slice(5, 7)) - 1]

export function BotaoIcone({ Icone = BookOpen, children, ...props }) {
  return <button className="botao" {...props}><Icone size={18} aria-hidden="true" />{children}</button>
}
