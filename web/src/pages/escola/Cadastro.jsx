import { useMemo, useState } from 'react'
import { Baby, Check, KeyRound, Link2, Plus, Search, UserPlus, X } from 'lucide-react'
import { api } from '@api'
import { useSessao } from '../../lib/sessao'
import { useCarregar } from '../../lib/useCarregar'
import { Carregando, Erro, Caixa, Vazio } from '../../components/comuns'
import { haQuanto } from '../../lib/formato'
import { Pagina, Filtros, Modal } from './comum'

const PAPEL = { responsavel: 'Responsável', educacao: 'Professor(a)', gestao: 'Diretoria', doador_pf: 'Doador(a)', empresa: 'Empresa' }

// Cadastro da diretoria: pedidos de acesso, pessoas (com login) e crianças (com matrícula, responsável e acesso).
// Toda gravação passa por funções do banco que conferem se quem pede é da diretoria.
export default function Cadastro() {
  const { perfil } = useSessao()
  const [aba, setAba] = useState('pedidos')
  const [form, setForm] = useState(null)   // { tipo: 'pessoa' | 'crianca' | 'vinculo' | 'acesso', ... }
  const [ok, setOk] = useState(null)
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [solicitacoes, pessoas, criancas, turmas] = await Promise.all([api.solicitacoes(), api.pessoas(), api.criancasCadastro(), api.todasTurmas()])
    return { solicitacoes, pessoas, criancas, turmas }
  })
  const feito = (msg) => { setForm(null); setOk(msg); recarregar() }
  return (
    <Pagina titulo="Cadastro" largo intro="Cadastre famílias, alunos, professores e apoiadores. Cada pessoa recebe um login com senha provisória, que você entrega pessoalmente ou por WhatsApp.">
      <Filtros rotulo="Seção" valor={aba} mudar={(v) => { setAba(v); setOk(null) }}
        opcoes={[['pedidos', `Pedidos de acesso${dados?.solicitacoes.length ? ` (${dados.solicitacoes.length})` : ''}`], ['pessoas', 'Pessoas'], ['criancas', 'Crianças']]} />
      {ok && <Caixa titulo={ok} />}
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados && aba === 'pedidos' && <Pedidos dados={dados} perfil={perfil} setForm={setForm} recarregar={recarregar} />}
      {dados && aba === 'pessoas' && <Pessoas dados={dados} setForm={setForm} />}
      {dados && aba === 'criancas' && <Criancas dados={dados} setForm={setForm} />}
      {form?.tipo === 'pessoa' && <FormPessoa inicial={form} turmas={dados.turmas} fechar={() => setForm(null)} feito={feito} perfil={perfil} />}
      {form?.tipo === 'crianca' && <FormCrianca dados={dados} fechar={() => setForm(null)} feito={feito} />}
      {form?.tipo === 'vinculo' && <FormVinculo crianca={form.crianca} dados={dados} fechar={() => setForm(null)} feito={feito} />}
      {form?.tipo === 'acesso' && <FormAcesso crianca={form.crianca} fechar={() => setForm(null)} feito={feito} />}
    </Pagina>
  )
}

function Pedidos({ dados, perfil, setForm, recarregar }) {
  if (dados.solicitacoes.length === 0) return <Vazio titulo="Nenhum pedido de acesso esperando.">Quem pede acesso pela página do Instituto aparece aqui.</Vazio>
  return (
    <div className="pilha">
      {dados.solicitacoes.map((s) => (
        <article key={s.id} className="cartao pilha">
          <div className="linha-etiquetas"><span className="etiqueta">{PAPEL[s.papel_pretendido]}</span><span className="etiqueta etiqueta--neutra">{haQuanto(s.criada_em)}</span></div>
          <h3>{s.nome}</h3>
          <p className="fonte">Contato: {s.contato}</p>
          {s.mensagem && <p>{s.mensagem}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="botao" onClick={() => setForm({ tipo: 'pessoa', nome: s.nome, papel: s.papel_pretendido,
              email: s.contato.includes('@') ? s.contato : '', telefone: s.contato.includes('@') ? '' : s.contato, solicitacao: s.id })}>
              <Check size={18} aria-hidden="true" />Aprovar e cadastrar
            </button>
            <button className="botao botao--claro" onClick={async () => { if (confirm(`Recusar o pedido de ${s.nome}?`)) { await api.tratarSolicitacao(s.id, 'recusada', perfil.id); recarregar() } }}>
              <X size={18} aria-hidden="true" />Recusar
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function Pessoas({ dados, setForm }) {
  const [papel, setPapel] = useState('todos')
  const [busca, setBusca] = useState('')
  const lista = dados.pessoas.filter((p) => (papel === 'todos' || p.papel === papel) && p.nome.toLowerCase().includes(busca.trim().toLowerCase()))
  return (
    <div className="pilha">
      <div className="cabeca">
        <div className="campo busca" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="b-p" className="so-leitor">Buscar pessoa</label><Search size={18} aria-hidden="true" />
          <input id="b-p" type="search" placeholder="Buscar pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <button className="botao" onClick={() => setForm({ tipo: 'pessoa' })}><UserPlus size={18} aria-hidden="true" />Nova pessoa</button>
      </div>
      <Filtros rotulo="Perfil" valor={papel} mudar={setPapel} opcoes={[['todos', 'Todos'], ...Object.entries(PAPEL)]} />
      <ul className="lista-simples cartao">
        {lista.slice(0, 80).map((p) => (
          <li key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ flex: 1 }}><strong>{p.nome}</strong>{p.telefone && <span className="fonte"> · {p.telefone}</span>}</span>
            <span className="etiqueta etiqueta--neutra">{PAPEL[p.papel]}</span>
          </li>
        ))}
      </ul>
      {lista.length > 80 && <p className="fonte">Mostrando 80 de {lista.length}. Use a busca para achar alguém.</p>}
    </div>
  )
}

function Criancas({ dados, setForm }) {
  const [busca, setBusca] = useState('')
  const lista = dados.criancas.filter((c) => c.nome_exibicao.toLowerCase().includes(busca.trim().toLowerCase()))
  return (
    <div className="pilha">
      <div className="cabeca">
        <div className="campo busca" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="b-c" className="so-leitor">Buscar criança</label><Search size={18} aria-hidden="true" />
          <input id="b-c" type="search" placeholder="Buscar pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <button className="botao" onClick={() => setForm({ tipo: 'crianca' })}><Baby size={18} aria-hidden="true" />Nova criança</button>
      </div>
      {lista.slice(0, 60).map((c) => {
        const turmas = (c.matricula || []).filter((m) => !m.fim).map((m) => m.turma?.nome).filter(Boolean)
        const acesso = Array.isArray(c.acesso_estudante) ? c.acesso_estudante[0] : c.acesso_estudante
        return (
          <article key={c.id} className="cartao pilha">
            <div className="cabeca">
              <h3 style={{ flex: 1 }}>{c.nome_exibicao} <span className="fonte">· {new Date().getFullYear() - c.ano_nascimento} anos{c.codigo_parceiro && ` · código ${c.codigo_parceiro}`}</span></h3>
            </div>
            <p className="fonte">{turmas.length ? turmas.join(', ') : 'Sem turma'}</p>
            <p>{(c.responsavel_crianca || []).length
              ? c.responsavel_crianca.map((r) => `${r.perfil?.nome || 'Responsável'}${r.parentesco ? ` (${r.parentesco})` : ''}${r.consentimento_em ? '' : ' — aguardando autorização'}`).join('; ')
              : <span className="etiqueta etiqueta--alerta">Sem responsável no portal</span>}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="botao botao--claro" onClick={() => setForm({ tipo: 'vinculo', crianca: c })}><Link2 size={16} aria-hidden="true" />Ligar responsável</button>
              {acesso ? <span className="etiqueta">{acesso.suspenso_em ? 'Acesso do aluno suspenso' : 'Aluno tem acesso'}</span>
                : <button className="botao botao--claro" onClick={() => setForm({ tipo: 'acesso', crianca: c })}><KeyRound size={16} aria-hidden="true" />Liberar acesso do aluno</button>}
            </div>
          </article>
        )
      })}
      {lista.length === 0 && <Vazio titulo="Nenhuma criança encontrada." />}
    </div>
  )
}

// Senha provisória legível: fácil de ditar por telefone.
const senhaProvisoria = () => {
  const palavras = ['arvore', 'livro', 'sonho', 'futuro', 'escola', 'amigo', 'sorriso', 'janela']
  return `${palavras[Math.floor(Math.random() * palavras.length)]}${Math.floor(1000 + Math.random() * 9000)}`
}

function Credencial({ email, senha }) {
  return <Caixa titulo="Anote e entregue à pessoa:">Login: <strong>{email}</strong><br />Senha provisória: <strong>{senha}</strong><br /><span className="fonte">Ela não aparece de novo depois que você fechar.</span></Caixa>
}

function FormPessoa({ inicial, turmas, fechar, feito, perfil }) {
  const [f, setF] = useState({ nome: inicial.nome || '', email: inicial.email || '', telefone: inicial.telefone || '', papel: inicial.papel || 'responsavel', senha: senhaProvisoria(), turmas: [] })
  const [erro, setErro] = useState(null)
  const [pronto, setPronto] = useState(false)
  const enviar = async (e) => {
    e.preventDefault(); setErro(null)
    try {
      await api.cadastrarPessoa({ ...f, email: f.email.trim().toLowerCase(), nome: f.nome.trim() })
      if (inicial.solicitacao) await api.tratarSolicitacao(inicial.solicitacao, 'aprovada', perfil.id)
      setPronto(true)
    } catch (x) { setErro(x.message) }
  }
  if (pronto) return (
    <Modal titulo="Pessoa cadastrada" fechar={() => feito(`${f.nome} foi cadastrado(a).`)}>
      <div className="pilha">
        <Credencial email={f.email.trim().toLowerCase()} senha={f.senha} />
        {f.papel === 'responsavel' && <p>Agora vá em <strong>Crianças</strong> e use <strong>Ligar responsável</strong> para conectar esta pessoa aos filhos. No primeiro acesso ela autoriza a exibição dos dados.</p>}
        <button className="botao botao--largo" onClick={() => feito(`${f.nome} foi cadastrado(a).`)}>Pronto</button>
      </div>
    </Modal>
  )
  return (
    <Modal titulo={inicial.solicitacao ? 'Aprovar pedido de acesso' : 'Nova pessoa'} fechar={fechar}>
      <form className="pilha" onSubmit={enviar}>
        <Filtros rotulo="Perfil" valor={f.papel} mudar={(v) => setF({ ...f, papel: v })} opcoes={Object.entries(PAPEL)} />
        <div className="campo"><label htmlFor="cp-n">Nome {f.papel === 'empresa' && '(pessoa de contato e empresa)'}</label>
          <input id="cp-n" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder={f.papel === 'empresa' ? 'Roberto (TechNorte Sistemas)' : ''} /></div>
        <div className="campos-linha">
          <div className="campo"><label htmlFor="cp-e">E-mail (login)</label><input id="cp-e" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="campo"><label htmlFor="cp-t">Telefone</label><input id="cp-t" inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
        </div>
        {f.papel === 'educacao' && (
          <fieldset className="campo"><legend><strong>Turmas que acompanha</strong></legend>
            <div className="filtros" style={{ flexWrap: 'wrap' }}>
              {turmas.map((t) => <button type="button" key={t.id} aria-pressed={f.turmas.includes(t.id)}
                onClick={() => setF({ ...f, turmas: f.turmas.includes(t.id) ? f.turmas.filter((x) => x !== t.id) : [...f.turmas, t.id] })}>{t.nome}</button>)}
            </div>
          </fieldset>
        )}
        <div className="campo"><label htmlFor="cp-s">Senha provisória</label><input id="cp-s" required minLength={8} value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
          <small>Gerada automaticamente. Peça para a pessoa trocar depois.</small></div>
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo"><Plus size={18} aria-hidden="true" />Cadastrar</button>
      </form>
    </Modal>
  )
}

function FormCrianca({ dados, fechar, feito }) {
  const responsaveis = useMemo(() => dados.pessoas.filter((p) => p.papel === 'responsavel'), [dados])
  const [f, setF] = useState({ nome: '', ano: String(new Date().getFullYear() - 8), turma: '', codigo: '', responsavel: '', parentesco: 'mãe' })
  const [erro, setErro] = useState(null)
  const enviar = async (e) => {
    e.preventDefault(); setErro(null)
    try { await api.cadastrarCrianca({ ...f, nome: f.nome.trim() }); feito(`${f.nome} foi cadastrada.`) } catch (x) { setErro(x.message) }
  }
  return (
    <Modal titulo="Nova criança" fechar={fechar}>
      <form className="pilha" onSubmit={enviar}>
        <div className="campos-linha">
          <div className="campo"><label htmlFor="cc-n">Nome de exibição</label><input id="cc-n" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Kauã R." />
            <small>Primeiro nome e inicial. O portal não guarda nome completo (LGPD).</small></div>
          <div className="campo"><label htmlFor="cc-a">Ano de nascimento</label><input id="cc-a" type="number" required min={new Date().getFullYear() - 18} max={new Date().getFullYear()} value={f.ano} onChange={(e) => setF({ ...f, ano: e.target.value })} /></div>
        </div>
        <div className="campos-linha">
          <div className="campo"><label htmlFor="cc-t">Turma</label>
            <select id="cc-t" value={f.turma} onChange={(e) => setF({ ...f, turma: e.target.value })}>
              <option value="">Sem turma por enquanto</option>
              {dados.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select></div>
          <div className="campo"><label htmlFor="cc-c">Código da Alicerce (opcional)</label><input id="cc-c" value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} /></div>
        </div>
        <div className="campos-linha">
          <div className="campo"><label htmlFor="cc-r">Responsável</label>
            <select id="cc-r" value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })}>
              <option value="">Ligar depois</option>
              {responsaveis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <small>Não achou? Cadastre a pessoa antes em Pessoas.</small></div>
          <div className="campo"><label htmlFor="cc-p">Parentesco</label><input id="cc-p" value={f.parentesco} onChange={(e) => setF({ ...f, parentesco: e.target.value })} /></div>
        </div>
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo">Cadastrar criança</button>
      </form>
    </Modal>
  )
}

function FormVinculo({ crianca, dados, fechar, feito }) {
  const [resp, setResp] = useState('')
  const [parentesco, setParentesco] = useState('mãe')
  const [erro, setErro] = useState(null)
  return (
    <Modal titulo={`Ligar responsável a ${crianca.nome_exibicao}`} fechar={fechar}>
      <form className="pilha" onSubmit={async (e) => { e.preventDefault(); try { await api.vincularResponsavel(resp, crianca.id, parentesco); feito('Responsável ligado. No primeiro acesso, ele autoriza a exibição dos dados.') } catch (x) { setErro(x.message) } }}>
        <div className="campo"><label htmlFor="v-r">Responsável</label>
          <select id="v-r" required value={resp} onChange={(e) => setResp(e.target.value)}>
            <option value="">Escolha…</option>
            {dados.pessoas.filter((p) => p.papel === 'responsavel').map((p) => <option key={p.id} value={p.id}>{p.nome}{p.telefone ? ` · ${p.telefone}` : ''}</option>)}
          </select></div>
        <div className="campo"><label htmlFor="v-p">Parentesco</label><input id="v-p" value={parentesco} onChange={(e) => setParentesco(e.target.value)} /></div>
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo" disabled={!resp}>Ligar</button>
      </form>
    </Modal>
  )
}

function FormAcesso({ crianca, fechar, feito }) {
  const sugestao = `${crianca.nome_exibicao.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()}.${Math.floor(100 + Math.random() * 900)}@aluno.ebenezer.local`
  const [email, setEmail] = useState(sugestao)
  const [senha, setSenha] = useState(senhaProvisoria())
  const [erro, setErro] = useState(null)
  const [pronto, setPronto] = useState(false)
  if (pronto) return (
    <Modal titulo="Acesso liberado" fechar={() => feito(`${crianca.nome_exibicao} já pode entrar no espaço do aluno.`)}>
      <div className="pilha">
        <Credencial email={email} senha={senha} />
        <p>Entregue ao responsável. Ele define o PIN de saída em <strong>Minha conta</strong>.</p>
        <button className="botao botao--largo" onClick={() => feito(`${crianca.nome_exibicao} já pode entrar no espaço do aluno.`)}>Pronto</button>
      </div>
    </Modal>
  )
  return (
    <Modal titulo={`Acesso de ${crianca.nome_exibicao}`} fechar={fechar}>
      <form className="pilha" onSubmit={async (e) => { e.preventDefault(); try { await api.liberarAcessoEstudante(crianca.id, email.trim().toLowerCase(), senha); setPronto(true) } catch (x) { setErro(x.message) } }}>
        <p className="suave">A criança entra com este login no celular da família. Ela só vê o próprio espaço e não sai sem o PIN do responsável.</p>
        <div className="campo"><label htmlFor="a-e">Login</label><input id="a-e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <small>Não precisa ser um e-mail de verdade; é só o nome de usuário.</small></div>
        <div className="campo"><label htmlFor="a-s">Senha provisória</label><input id="a-s" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo">Liberar acesso</button>
      </form>
    </Modal>
  )
}
