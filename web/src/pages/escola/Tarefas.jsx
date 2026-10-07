import { useState } from 'react'
import { ExternalLink, Lightbulb, NotebookPen, Plus, ScrollText, Trash2 } from 'lucide-react'
import { api } from '@api'
import { useSessao } from '../../lib/sessao'
import { useCarregar } from '../../lib/useCarregar'
import { Carregando, Erro, Vazio, Caixa } from '../../components/comuns'
import { dataComDia, haQuanto } from '../../lib/formato'
import { Pagina, Filtros, Modal, ehEquipe } from './comum'

const TIPO = {
  tarefa: { nome: 'Tarefa', Icone: NotebookPen, cor: '#256B29' },
  dica: { nome: 'Dica de estudo', Icone: Lightbulb, cor: '#8C6100' },
  resumo: { nome: 'Resumo da aula', Icone: ScrollText, cor: '#1F5FA8' },
}

export default function Tarefas() {
  const { perfil } = useSessao()
  const [tipo, setTipo] = useState('todos')
  const [turma, setTurma] = useState('')
  const [novo, setNovo] = useState(false)
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.tarefas())
  const turmas = [...new Map((dados || []).map((t) => [t.turma_id, t.turma?.nome])).entries()]
  const lista = (dados || []).filter((t) => (tipo === 'todos' || t.tipo === tipo) && (!turma || t.turma_id === turma))
  const crianca = perfil?.papel === 'estudante'
  return (
    <Pagina titulo={crianca ? 'Minhas tarefas' : 'Tarefas e resumos'}
      intro={crianca ? 'O que fazer em casa e o que a gente aprendeu na aula.' : 'O que os professores passaram para casa, dicas de estudo e o resumo de cada aula.'}
      acao={ehEquipe(perfil) && <button className="botao" onClick={() => setNovo(true)}><Plus size={18} aria-hidden="true" />Publicar</button>}>
      <div className="pilha">
        <Filtros rotulo="Tipo" valor={tipo} mudar={setTipo} opcoes={[['todos', 'Tudo'], ['tarefa', 'Tarefas'], ['dica', 'Dicas'], ['resumo', 'Resumos']]} />
        {turmas.length > 1 && (
          <div className="campo" style={{ maxWidth: 280 }}>
            <label htmlFor="tf-turma">Turma</label>
            <select id="tf-turma" value={turma} onChange={(e) => setTurma(e.target.value)}>
              <option value="">Todas as turmas</option>
              {turmas.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
            </select>
          </div>
        )}
      </div>
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados && lista.length === 0 && <Vazio titulo="Nada por aqui ainda.">Quando o professor publicar, aparece nesta tela.</Vazio>}
      <div className="pilha">
        {lista.map((t) => {
          const { nome, Icone, cor } = TIPO[t.tipo]
          const atrasada = t.entrega && t.entrega < new Date().toISOString().slice(0, 10)
          return (
            <article key={t.id} className="cartao tarefa" style={{ '--cor': cor }}>
              <span className="tarefa__icone"><Icone size={22} aria-hidden="true" /></span>
              <div className="pilha" style={{ flex: 1, minWidth: 0 }}>
                <div className="linha-etiquetas">
                  <span className="etiqueta" style={{ background: 'color-mix(in srgb, var(--cor) 14%, white)', color: 'var(--cor)' }}>{nome}</span>
                  <span className="etiqueta etiqueta--neutra">{t.turma?.nome}</span>
                </div>
                <h3>{t.titulo}</h3>
                <p>{t.corpo}</p>
                {t.link && <a href={t.link} target="_blank" rel="noreferrer" className="link-externo">Abrir material <ExternalLink size={14} aria-hidden="true" /></a>}
                {t.entrega && <p className={atrasada ? 'etiqueta etiqueta--neutra' : 'etiqueta etiqueta--alerta'}>{atrasada ? 'Entrega foi' : 'Entregar até'} {dataComDia(t.entrega)}</p>}
                <p className="fonte">Publicado {haQuanto(t.criado_em)}{t.autor?.nome && ` por ${t.autor.nome}`}.</p>
                {(perfil?.papel === 'gestao' || t.criado_por === perfil?.id) && (
                  <button className="botao botao--texto" style={{ alignSelf: 'flex-start', color: 'var(--erro)' }}
                    onClick={async () => { if (confirm('Apagar esta publicação?')) { await api.removerTarefa(t.id); recarregar() } }}>
                    <Trash2 size={16} aria-hidden="true" />Apagar
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
      {novo && <FormTarefa perfil={perfil} fechar={() => setNovo(false)} salvo={() => { setNovo(false); recarregar() }} />}
    </Pagina>
  )
}

function FormTarefa({ perfil, fechar, salvo }) {
  const { dados: turmas } = useCarregar(() => api.todasTurmas())
  const [f, setF] = useState({ tipo: 'tarefa', turma_id: '', titulo: '', corpo: '', link: '', entrega: '' })
  const [erro, setErro] = useState(null)
  const enviar = async (e) => {
    e.preventDefault(); setErro(null)
    try {
      await api.salvarTarefa({ ...f, titulo: f.titulo.trim(), corpo: f.corpo.trim(), link: f.link.trim() || null, entrega: f.tipo === 'tarefa' && f.entrega ? f.entrega : null, criado_por: perfil.id })
      salvo()
    } catch (x) { setErro(x.message) }
  }
  return (
    <Modal titulo="Publicar para a turma" fechar={fechar}>
      <form className="pilha" onSubmit={enviar}>
        <Filtros rotulo="Tipo" valor={f.tipo} mudar={(v) => setF({ ...f, tipo: v })} opcoes={[['tarefa', 'Tarefa'], ['dica', 'Dica de estudo'], ['resumo', 'Resumo da aula']]} />
        <div className="campo"><label htmlFor="t-turma">Turma</label>
          <select id="t-turma" required value={f.turma_id} onChange={(e) => setF({ ...f, turma_id: e.target.value })}>
            <option value="">Escolha…</option>
            {turmas?.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select></div>
        <div className="campo"><label htmlFor="t-titulo">Título</label><input id="t-titulo" required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
        <div className="campo"><label htmlFor="t-corpo">{f.tipo === 'resumo' ? 'O que vimos na aula' : 'Explicação'}</label>
          <textarea id="t-corpo" required value={f.corpo} onChange={(e) => setF({ ...f, corpo: e.target.value })} placeholder="Escreva em frases curtas, como se falasse com a criança e a família." /></div>
        {f.tipo === 'tarefa' && <div className="campo"><label htmlFor="t-entrega">Entregar até</label><input id="t-entrega" type="date" value={f.entrega} onChange={(e) => setF({ ...f, entrega: e.target.value })} /></div>}
        <div className="campo"><label htmlFor="t-link">Link de apoio (opcional)</label><input id="t-link" type="url" placeholder="https://" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} /></div>
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo" disabled={!f.turma_id || !f.titulo.trim() || !f.corpo.trim()}>Publicar</button>
      </form>
    </Modal>
  )
}
