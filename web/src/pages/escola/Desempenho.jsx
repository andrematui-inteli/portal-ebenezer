import { useEffect, useMemo, useState } from 'react'
import { Plus, Smile, Meh, Frown, ThumbsUp, AlertCircle, Lightbulb, MessageSquare } from 'lucide-react'
import { api } from '@api'
import { useSessao } from '../../lib/sessao'
import { useCarregar } from '../../lib/useCarregar'
import { Carregando, Erro, Vazio, Caixa } from '../../components/comuns'
import { haQuanto } from '../../lib/formato'
import { Pagina, Filtros, Modal, Barras, mesCurto, ehEquipe, ehApoiador } from './comum'

const DISCIPLINAS = [
  { chave: 'Português', nome: 'Português', cor: '#1F5FA8' },
  { chave: 'Matemática', nome: 'Matemática', cor: '#B4570B' },
  { chave: 'Inglês', nome: 'Inglês', cor: '#7A3E9D' },
]
const PRESENCA = [{ chave: 'p', nome: 'Presença', cor: '#78A824' }]
const META_PRESENCA = 89
const OBS = {
  elogio: { nome: 'Elogio', Icone: ThumbsUp, cor: '#256B29' },
  dificuldade: { nome: 'Dificuldade', Icone: AlertCircle, cor: '#B4570B' },
  recomendacao: { nome: 'Recomendação de estudo', Icone: Lightbulb, cor: '#1F5FA8' },
  comportamento: { nome: 'Comportamento', Icone: MessageSquare, cor: '#5B6660' },
}
const media = (xs) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null)

export default function Desempenho() {
  const { perfil } = useSessao()
  // Apoiadores veem só a turma como um todo; os demais começam pela criança.
  const [aba, setAba] = useState(ehApoiador(perfil) ? 'turma' : 'aluno')
  const crianca = perfil?.papel === 'estudante'
  return (
    <Pagina titulo={crianca ? 'Como estou indo' : 'Desempenho'} largo
      intro={crianca ? 'Suas notas e sua presença, mês a mês.'
        : ehApoiador(perfil) ? 'Presença e médias de cada turma, sem dados de nenhuma criança em particular.'
          : 'Notas, presença e comentários. Os dados de cada criança só aparecem para ela, seus responsáveis, professores e diretoria.'}>
      {!ehApoiador(perfil) && <Filtros rotulo="Ver" valor={aba} mudar={setAba} opcoes={[['aluno', crianca ? 'Eu' : 'Por aluno'], ['turma', crianca ? 'Minha turma' : 'Por turma']]} />}
      {aba === 'aluno' ? <PorAluno perfil={perfil} /> : <PorTurma />}
    </Pagina>
  )
}

function PorAluno({ perfil }) {
  const { dados: criancas, erro, carregando } = useCarregar(() => api.criancasVisiveis())
  const unicas = useMemo(() => [...new Map((criancas || []).map((m) => [m.crianca.id, m.crianca])).values()], [criancas])
  const [id, setId] = useState('')
  useEffect(() => { if (!id && unicas.length) setId(unicas[0].id) }, [unicas, id])
  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} />
  if (!unicas.length) return <Vazio titulo="Nenhuma criança para mostrar.">Os dados aparecem quando houver matrícula e autorização do responsável.</Vazio>
  return (
    <>
      {unicas.length > 1 && (
        <div className="campo" style={{ maxWidth: 320 }}>
          <label htmlFor="d-crianca">Criança</label>
          <select id="d-crianca" value={id} onChange={(e) => setId(e.target.value)}>
            {unicas.map((c) => <option key={c.id} value={c.id}>{c.nome_exibicao}</option>)}
          </select>
        </div>
      )}
      {id && <Aluno key={id} criancaId={id} turmaId={criancas.find((m) => m.crianca.id === id)?.turma_id} perfil={perfil} />}
    </>
  )
}

function Aluno({ criancaId, turmaId, perfil }) {
  const [form, setForm] = useState(null)
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [notas, obs, presenca] = await Promise.all([api.notas(criancaId), api.observacoes(criancaId), api.presencaIndividual(criancaId)])
    return { notas, obs, presenca }
  }, [criancaId])
  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} tentarDeNovo={recarregar} />
  const meses = [...new Set([...dados.notas.map((n) => n.data.slice(0, 7)), ...dados.presenca.map((p) => p.mes.slice(0, 7))])].sort()
  const notasMes = meses.map((m) => ({
    rotulo: mesCurto(m), valores: Object.fromEntries(DISCIPLINAS.map((d) => [d.chave, media(dados.notas.filter((n) => n.disciplina === d.chave && n.data.startsWith(m)).map((n) => Number(n.valor)))])),
  }))
  const presencaMes = meses.map((m) => ({ rotulo: mesCurto(m), valores: { p: dados.presenca.find((p) => p.mes.startsWith(m))?.presenca_pct ?? null } }))
  const ultimaPresenca = dados.presenca.at(-1)?.presenca_pct
  const ultimas = DISCIPLINAS.map((d) => ({ ...d, v: notasMes.at(-1)?.valores[d.chave], antes: notasMes.at(-2)?.valores[d.chave] }))
  const Carinha = ultimaPresenca >= 85 ? Smile : ultimaPresenca >= 70 ? Meh : Frown
  const editar = ehEquipe(perfil)
  return (
    <>
      <div className="grade-numeros">
        {ultimaPresenca != null && (
          <div className={`cartao numero ${ultimaPresenca < 75 ? 'numero--alerta' : ''}`}>
            <span className="numero__valor"><Carinha size={34} aria-hidden="true" style={{ verticalAlign: '-4px' }} /> {ultimaPresenca}%</span>
            <span className="numero__rotulo">Presença no último mês</span>
            <span className="suave">{ultimaPresenca >= META_PRESENCA ? 'Acima da média do Instituto (89%).' : ultimaPresenca >= 75 ? 'Perto da média do Instituto (89%).' : 'Abaixo do esperado. Vamos conversar?'}</span>
          </div>
        )}
        {ultimas.filter((d) => d.v != null).map((d) => (
          <div key={d.chave} className="cartao numero">
            <span className="numero__valor" style={{ color: d.cor }}>{String(d.v).replace('.', ',')}</span>
            <span className="numero__rotulo">{d.nome}</span>
            {d.antes != null && <span className="suave">{d.v > d.antes ? `Subiu ${String(Math.round((d.v - d.antes) * 10) / 10).replace('.', ',')} desde o mês anterior` : d.v < d.antes ? 'Caiu um pouco desde o mês anterior' : 'Igual ao mês anterior'}</span>}
          </div>
        ))}
      </div>
      {dados.notas.length > 0
        ? <div className="cartao"><Barras titulo="Notas por mês (0 a 10)" dados={notasMes} series={DISCIPLINAS} max={10} /></div>
        : <Vazio titulo="Ainda não há notas lançadas." />}
      {dados.presenca.length > 0 && <div className="cartao"><Barras titulo="Presença por mês" dados={presencaMes} series={PRESENCA} max={100} sufixo="%" /></div>}

      <section className="pilha" aria-labelledby="obs">
        <div className="cabeca">
          <h2 id="obs" style={{ flex: 1 }}>Comentários dos professores</h2>
          {editar && <>
            <button className="botao botao--claro" onClick={() => setForm('nota')}><Plus size={16} aria-hidden="true" />Nota</button>
            <button className="botao botao--claro" onClick={() => setForm('obs')}><Plus size={16} aria-hidden="true" />Comentário</button>
          </>}
        </div>
        {dados.obs.length === 0 && <p className="suave">Nenhum comentário ainda.</p>}
        {dados.obs.map((o) => {
          const t = OBS[o.tipo]
          return (
            <div key={o.id} className="cartao obs" style={{ '--cor': t.cor }}>
              <t.Icone size={22} aria-hidden="true" color={t.cor} />
              <div>
                <strong>{t.nome}</strong>
                <p>{o.texto}</p>
                <p className="fonte">{haQuanto(o.criado_em)}{o.autor?.nome && `, ${o.autor.nome}`}</p>
              </div>
            </div>
          )
        })}
      </section>
      {form && <FormAluno tipo={form} criancaId={criancaId} turmaId={turmaId} perfil={perfil} fechar={() => setForm(null)} salvo={() => { setForm(null); recarregar() }} />}
    </>
  )
}

function FormAluno({ tipo, criancaId, turmaId, perfil, fechar, salvo }) {
  const [f, setF] = useState({ disciplina: 'Português', avaliacao: 'Prova', valor: '', data: new Date().toISOString().slice(0, 10), tipo: 'recomendacao', texto: '' })
  const [erro, setErro] = useState(null)
  const enviar = async (e) => {
    e.preventDefault()
    try {
      if (tipo === 'nota') await api.lancarNota({ crianca_id: criancaId, turma_id: turmaId, disciplina: f.disciplina, avaliacao: f.avaliacao, valor: Number(String(f.valor).replace(',', '.')), data: f.data, lancado_por: perfil.id })
      else await api.salvarObservacao({ crianca_id: criancaId, tipo: f.tipo, texto: f.texto.trim(), autor_id: perfil.id })
      salvo()
    } catch (x) { setErro(x.message) }
  }
  return (
    <Modal titulo={tipo === 'nota' ? 'Lançar nota' : 'Novo comentário'} fechar={fechar}>
      <form className="pilha" onSubmit={enviar}>
        {tipo === 'nota' ? (
          <>
            <div className="campos-linha">
              <div className="campo"><label htmlFor="n-d">Matéria</label>
                <select id="n-d" value={f.disciplina} onChange={(e) => setF({ ...f, disciplina: e.target.value })}>{DISCIPLINAS.map((d) => <option key={d.chave}>{d.chave}</option>)}<option>Leitura</option><option>Projeto</option></select></div>
              <div className="campo"><label htmlFor="n-v">Nota (0 a 10)</label><input id="n-v" required inputMode="decimal" pattern="^(10([.,]0)?|[0-9]([.,][0-9])?)$" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></div>
            </div>
            <div className="campos-linha">
              <div className="campo"><label htmlFor="n-a">Avaliação</label><input id="n-a" required value={f.avaliacao} onChange={(e) => setF({ ...f, avaliacao: e.target.value })} /></div>
              <div className="campo"><label htmlFor="n-dt">Data</label><input id="n-dt" type="date" required value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
            </div>
          </>
        ) : (
          <>
            <Filtros rotulo="Tipo" valor={f.tipo} mudar={(v) => setF({ ...f, tipo: v })} opcoes={Object.entries(OBS).map(([k, o]) => [k, o.nome])} />
            <div className="campo"><label htmlFor="o-t">Comentário</label>
              <textarea id="o-t" required maxLength={1000} value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} placeholder="Descreva o fato e o que recomenda, sem rótulos. A família e a criança leem este texto." /></div>
          </>
        )}
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo">Salvar</button>
      </form>
    </Modal>
  )
}

function PorTurma() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.desempenhoTurmas())
  const turmas = useMemo(() => [...new Map((dados || []).map((l) => [l.turma_id, l])).values()], [dados])
  const [id, setId] = useState('')
  useEffect(() => { if (!id && turmas.length) setId(turmas[0].turma_id) }, [turmas, id])
  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} tentarDeNovo={recarregar} />
  if (!turmas.length) return <Vazio titulo="Ainda não há dados de turma." />
  const linhas = dados.filter((l) => l.turma_id === id)
  const meses = [...new Set(linhas.map((l) => l.mes))].sort()
  const presenca = meses.map((m) => ({ rotulo: mesCurto(m), valores: { p: linhas.find((l) => l.mes === m)?.presenca_pct ?? null } }))
  const notas = meses.map((m) => ({ rotulo: mesCurto(m), valores: Object.fromEntries(DISCIPLINAS.map((d) => [d.chave, linhas.find((l) => l.mes === m && l.disciplina === d.chave)?.media ?? null])) }))
  const temNotas = linhas.some((l) => l.media != null)
  const ultP = presenca.at(-1)?.valores.p
  const mediaGeral = media(DISCIPLINAS.map((d) => notas.at(-1)?.valores[d.chave]).filter((v) => v != null))
  return (
    <>
      <Filtros rotulo="Turma" valor={id} mudar={setId} opcoes={turmas.map((t) => [t.turma_id, t.turma])} />
      <div className="grade-numeros">
        {ultP != null && <div className="cartao numero"><span className="numero__valor">{ultP}%</span><span className="numero__rotulo">Presença da turma no último mês</span><span className="suave">Meta do Instituto: {META_PRESENCA}%</span></div>}
        {mediaGeral != null && <div className="cartao numero"><span className="numero__valor">{String(mediaGeral).replace('.', ',')}</span><span className="numero__rotulo">Média geral da turma</span><span className="suave">Português, Matemática e Inglês</span></div>}
      </div>
      <div className="cartao"><Barras titulo="Presença da turma por mês" dados={presenca} series={PRESENCA} max={100} sufixo="%" /></div>
      {temNotas
        ? <div className="cartao"><Barras titulo="Média da turma por matéria (0 a 10)" dados={notas} series={DISCIPLINAS} max={10} /></div>
        : <p className="suave">Esta turma não tem notas por matéria (programa sem provas).</p>}
      <p className="fonte">Números agregados. Turmas com menos de 5 crianças avaliadas ficam sem número, para ninguém ser identificado.</p>
    </>
  )
}
