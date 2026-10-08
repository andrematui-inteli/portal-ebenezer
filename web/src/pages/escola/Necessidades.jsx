import { useState } from 'react'
import { Copy, HandHeart, Pencil, Plus, PiggyBank, Package, QrCode } from 'lucide-react'
import { api } from '@api'
import { useSessao } from '../../lib/sessao'
import { useCarregar } from '../../lib/useCarregar'
import { Carregando, Erro, Caixa, Progresso } from '../../components/comuns'
import { dataCurta, reais, numero } from '../../lib/formato'
import { Pagina, Filtros, Modal, ehEquipe } from './comum'
import { pixCopiaECola, normalizarChave } from '../../lib/pix'

const qtd = (n, v) => (n.vaquinha ? reais(v) : `${numero(v)} ${n.unidade || ''}`.trim())

// Tabela de necessidades: o que falta, em que estado, e quanto já foi suprido.
export default function Necessidades() {
  const { perfil } = useSessao()
  const [filtro, setFiltro] = useState('abertas')
  const [doando, setDoando] = useState(null)
  const [nova, setNova] = useState(false)
  const [ok, setOk] = useState(null)
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [itens, compromissos, pix] = await Promise.all([api.necessidades(), api.compromissos(), api.pix()])
    return { itens, compromissos, pix }
  })
  const [editandoPix, setEditandoPix] = useState(false)
  const itens = (dados?.itens || []).filter((n) => filtro === 'todas' ? true : filtro === 'vaquinhas' ? n.vaquinha && n.status !== 'atendida'
    : filtro === 'itens' ? !n.vaquinha && n.status !== 'atendida' : n.status !== 'atendida')
  const podeDoar = ['responsavel', 'doador_pf', 'empresa', 'gestao'].includes(perfil?.papel)
  const pendentes = (dados?.compromissos || []).filter((c) => c.status === 'pendente')

  return (
    <Pagina titulo="Necessidades" largo
      intro="O que está faltando para as crianças. Doe itens ou contribua com uma vaquinha; a barra mostra quanto já chegou."
      acao={ehEquipe(perfil) && <button className="botao" onClick={() => setNova(true)}><Plus size={18} aria-hidden="true" />Nova necessidade</button>}>
      {ok && <Caixa titulo={ok} />}
      {dados && (dados.pix || perfil?.papel === 'gestao') && (
        <CaixaPix pix={dados.pix} editar={perfil?.papel === 'gestao' ? () => setEditandoPix(true) : null} />
      )}
      {perfil?.papel === 'gestao' && pendentes.length > 0 && (
        <Caixa tipo="alerta" titulo={`${pendentes.length} doação(ões) prometida(s) esperando chegar`}>
          <ul className="lista-simples">
            {pendentes.map((c) => (
              <li key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ flex: 1 }}><strong>{c.perfil?.nome}</strong>: {c.valor ? reais(c.valor) : `${c.quantidade} ${c.carencia?.unidade || 'itens'}`} para “{c.carencia?.titulo}”{c.mensagem && ` — ${c.mensagem}`}</span>
                <button className="botao botao--claro" onClick={async () => { await api.confirmarCompromisso(c.id); recarregar() }}>Chegou, confirmar</button>
              </li>
            ))}
          </ul>
        </Caixa>
      )}
      <Filtros rotulo="Mostrar" valor={filtro} mudar={setFiltro} opcoes={[['abertas', 'Em aberto'], ['itens', 'Itens'], ['vaquinhas', 'Vaquinhas'], ['todas', 'Tudo, inclusive atendidas']]} />
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados && (
        <div className="tabela-rolagem cartao" style={{ padding: 0 }}>
          <table className="tabela tabela--necessidades">
            <thead><tr><th>O que precisa</th><th>Quanto</th><th>Estado</th><th style={{ minWidth: 160 }}>Já suprido</th><th><span className="so-leitor">Ação</span></th></tr></thead>
            <tbody>
              {itens.map((n) => (
                <tr key={n.id}>
                  <td data-rotulo="O que precisa">
                    <strong>{n.vaquinha ? <PiggyBank size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> : <Package size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} />} {n.titulo}</strong>
                    {n.descricao && <p className="fonte">{n.descricao}</p>}
                    {n.prazo && n.status !== 'atendida' && <p className="fonte">Até {dataCurta(n.prazo)}</p>}
                  </td>
                  <td data-rotulo="Quanto">{qtd(n, n.quantidade_necessaria)}</td>
                  <td data-rotulo="Estado">{n.vaquinha ? 'Vaquinha' : n.condicao || '—'}</td>
                  <td data-rotulo="Já suprido">
                    <Progresso pct={n.progresso_pct ?? 0} rotulo={`${n.progresso_pct}% suprido`} />
                    <span className="fonte">{qtd(n, n.quantidade_atendida)} de {qtd(n, n.quantidade_necessaria)} ({n.progresso_pct}%)</span>
                  </td>
                  <td>
                    {n.status === 'atendida' ? <span className="etiqueta">Atendida</span>
                      : podeDoar && <button className="botao botao--claro" onClick={() => setDoando(n)}><HandHeart size={16} aria-hidden="true" />Quero doar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dados?.compromissos.filter((c) => c.perfil_id === perfil?.id).length > 0 && (
        <section className="pilha">
          <h2>Minhas doações prometidas</h2>
          <ul className="lista-simples">
            {dados.compromissos.filter((c) => c.perfil_id === perfil.id).map((c) => (
              <li key={c.id}>{c.valor ? reais(c.valor) : `${c.quantidade} ${c.carencia?.unidade || 'itens'}`} para “{c.carencia?.titulo}” — <span className={`etiqueta ${c.status === 'pendente' ? 'etiqueta--alerta' : ''}`}>{c.status === 'pendente' ? 'esperando chegar' : 'recebida, obrigado!'}</span></li>
            ))}
          </ul>
        </section>
      )}
      {editandoPix && <FormPix pix={dados.pix} perfil={perfil} fechar={() => setEditandoPix(false)} salvo={() => { setEditandoPix(false); recarregar() }} />}
      {doando && <FormDoar n={doando} pix={dados.pix} fechar={() => setDoando(null)} feito={(t) => { setDoando(null); setOk(t); recarregar() }} />}
      {nova && <FormNecessidade perfil={perfil} fechar={() => setNova(false)} salvo={() => { setNova(false); recarregar() }} />}
    </Pagina>
  )
}

// Chave PIX do Instituto, com botão de copiar. A diretoria edita por aqui.
function CaixaPix({ pix, editar }) {
  const [copiado, setCopiado] = useState(false)
  if (!pix) return <Caixa tipo="alerta" titulo="O PIX do Instituto ainda não foi cadastrado." acao={<button className="botao botao--claro" onClick={editar}>Cadastrar PIX</button>}>Sem ele, quem quer doar dinheiro não tem para onde mandar.</Caixa>
  return (
    <div className="cartao pix">
      <QrCode size={28} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong>PIX do Instituto</strong>
        <p className="pix__chave">{pix.chave}</p>
        <p className="fonte">{pix.titular} · chave {TIPO_CHAVE[pix.tipo_chave]}{pix.instrucoes && `. ${pix.instrucoes}`}</p>
      </div>
      <button className="botao botao--claro" onClick={async () => { await copiar(normalizarChave(pix.chave, pix.tipo_chave)); setCopiado(true) }}>
        <Copy size={16} aria-hidden="true" />{copiado ? 'Copiado!' : 'Copiar'}
      </button>
      {editar && <button className="botao botao--texto" onClick={editar}><Pencil size={16} aria-hidden="true" />Editar</button>}
    </div>
  )
}
const TIPO_CHAVE = { cnpj: 'CNPJ', email: 'e-mail', telefone: 'celular', aleatoria: 'aleatória' }
const copiar = async (t) => { try { await navigator.clipboard.writeText(t) } catch { window.prompt('Copie o texto:', t) } }

function FormPix({ pix, perfil, fechar, salvo }) {
  const [f, setF] = useState({ chave: pix?.chave || '', tipo_chave: pix?.tipo_chave || 'cnpj', titular: pix?.titular || 'Instituto Ebenezer', cidade: pix?.cidade || 'SAO PAULO', instrucoes: pix?.instrucoes || '' })
  const [erro, setErro] = useState(null)
  const valido = { cnpj: /^\d{14}$/, telefone: /^\d{10,13}$/, email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, aleatoria: /^[0-9a-f-]{32,36}$/i }[f.tipo_chave]
    .test(f.tipo_chave === 'cnpj' || f.tipo_chave === 'telefone' ? f.chave.replace(/\D/g, '') : f.chave.trim())
  const enviar = async (e) => {
    e.preventDefault()
    try { await api.salvarPix({ ...f, chave: f.chave.trim(), instrucoes: f.instrucoes.trim() || null }, perfil.id); salvo() } catch (x) { setErro(x.message) }
  }
  return (
    <Modal titulo="PIX do Instituto" fechar={fechar}>
      <form className="pilha" onSubmit={enviar}>
        <p className="suave">Aparece para responsáveis, doadores e empresas na hora de doar. Confira com o banco antes de salvar: um erro aqui manda o dinheiro para outra conta.</p>
        <Filtros rotulo="Tipo de chave" valor={f.tipo_chave} mudar={(v) => setF({ ...f, tipo_chave: v })} opcoes={Object.entries(TIPO_CHAVE).map(([k, r]) => [k, r === 'CNPJ' ? r : r[0].toUpperCase() + r.slice(1)])} />
        <div className="campo"><label htmlFor="px-c">Chave</label><input id="px-c" required value={f.chave} onChange={(e) => setF({ ...f, chave: e.target.value })} />
          {f.chave && !valido && <small style={{ color: 'var(--erro)' }}>Esta chave não parece um {TIPO_CHAVE[f.tipo_chave]} válido.</small>}</div>
        <div className="campos-linha">
          <div className="campo"><label htmlFor="px-t">Nome do titular</label><input id="px-t" required maxLength={60} value={f.titular} onChange={(e) => setF({ ...f, titular: e.target.value })} /></div>
          <div className="campo"><label htmlFor="px-ci">Cidade</label><input id="px-ci" required value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></div>
        </div>
        <div className="campo"><label htmlFor="px-i">Recado para quem doa (opcional)</label><input id="px-i" maxLength={200} value={f.instrucoes} onChange={(e) => setF({ ...f, instrucoes: e.target.value })} placeholder="Ex.: mande o comprovante no WhatsApp da secretaria" /></div>
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo" disabled={!valido}>Salvar PIX</button>
      </form>
    </Modal>
  )
}

function FormDoar({ n, pix, fechar, feito }) {
  const { perfil } = useSessao()
  const [v, setV] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState(null)
  const [codigo, setCodigo] = useState(null)   // PIX copia e cola, depois de registrar a intenção
  const [copiado, setCopiado] = useState(false)
  const falta = n.quantidade_necessaria - n.quantidade_atendida
  const fimDinheiro = 'Obrigado! Quando o PIX cair, a diretoria confirma e o valor entra na barra e no ranking.'
  const enviar = async (e) => {
    e.preventDefault()
    try {
      await api.comprometerDoacao({ carencia_id: n.id, perfil_id: perfil.id, mensagem: mensagem.trim() || null, ...(n.vaquinha ? { valor: Number(v) } : { quantidade: Number(v) }) })
      if (n.vaquinha && pix) { setCodigo(pixCopiaECola(pix, Number(v))); return }
      feito(n.vaquinha
        ? 'Obrigado! A equipe vai te mandar a chave PIX do Instituto. Quando o valor cair, ele entra na barra e no ranking.'
        : 'Obrigado! Leve a doação ao Instituto de segunda a sexta, das 8h às 17h. Quando chegar, ela entra na barra e no ranking.')
    } catch (x) { setErro(x.message) }
  }
  if (codigo) return (
    <Modal titulo="Pague com PIX" fechar={() => feito(fimDinheiro)}>
      <div className="pilha">
        <p>Copie o código abaixo, abra o app do seu banco e escolha <strong>PIX → Copia e cola</strong>. O valor de <strong>{reais(v)}</strong> já vem preenchido.</p>
        <textarea className="pix__codigo" readOnly value={codigo} rows={4} onFocus={(e) => e.target.select()} aria-label="Código PIX copia e cola" />
        <button className="botao botao--largo" onClick={async () => { await copiar(codigo); setCopiado(true) }}><Copy size={18} aria-hidden="true" />{copiado ? 'Código copiado!' : 'Copiar código PIX'}</button>
        <p className="fonte">Ou use a chave {TIPO_CHAVE[pix.tipo_chave]}: <strong>{pix.chave}</strong> ({pix.titular}).{pix.instrucoes && ` ${pix.instrucoes}`}</p>
        <button className="botao botao--claro botao--largo" onClick={() => feito(fimDinheiro)}>Já paguei</button>
      </div>
    </Modal>
  )
  return (
    <Modal titulo={n.titulo} fechar={fechar}>
      <form className="pilha" onSubmit={enviar}>
        <p>Ainda faltam <strong>{qtd(n, falta)}</strong>{n.condicao && ` (${n.condicao})`}.</p>
        <div className="campo">
          <label htmlFor="d-v">{n.vaquinha ? 'Quanto quer doar (R$)' : `Quantos ${n.unidade || 'itens'}`}</label>
          <input id="d-v" type="number" min="1" max={n.vaquinha ? undefined : falta} required inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} />
          {n.vaquinha && <div className="filtros">{[20, 50, 100, 200].map((x) => <button type="button" key={x} aria-pressed={Number(v) === x} onClick={() => setV(String(x))}>{reais(x)}</button>)}</div>}
        </div>
        <div className="campo"><label htmlFor="d-m">Recado (opcional)</label><input id="d-m" maxLength={500} value={mensagem} onChange={(e) => setMensagem(e.target.value)} /></div>
        <p className="fonte">Nenhum pagamento é feito pelo portal. Você registra a intenção e a equipe confirma quando a doação chegar.</p>
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo" disabled={!Number(v)}>Confirmar intenção de doar</button>
      </form>
    </Modal>
  )
}

function FormNecessidade({ perfil, fechar, salvo }) {
  const gestao = perfil.papel === 'gestao'
  const [f, setF] = useState({ titulo: '', descricao: '', vaquinha: false, quantidade_necessaria: '', unidade: '', condicao: 'novos', categoria: 'material_pedagogico', prazo: '' })
  const [erro, setErro] = useState(null)
  const enviar = async (e) => {
    e.preventDefault()
    try {
      await api.salvarCarencia({
        titulo: f.titulo.trim(), descricao: f.descricao.trim() || null, categoria: f.categoria, vaquinha: f.vaquinha,
        quantidade_necessaria: Number(f.quantidade_necessaria), unidade: f.vaquinha ? 'reais' : f.unidade.trim() || 'itens',
        condicao: f.vaquinha ? null : f.condicao, prazo: f.prazo || null, criado_por: perfil.id,
        publicacao: gestao ? 'publicado' : 'aguardando_aprovacao', status: 'aberta',
      })
      salvo()
    } catch (x) { setErro(x.message) }
  }
  return (
    <Modal titulo="Nova necessidade" fechar={fechar}>
      <form className="pilha" onSubmit={enviar}>
        {!gestao && <p className="fonte">Vai para a aprovação da diretoria antes de aparecer.</p>}
        <Filtros rotulo="Tipo" valor={f.vaquinha ? 'v' : 'i'} mudar={(x) => setF({ ...f, vaquinha: x === 'v' })} opcoes={[['i', 'Itens'], ['v', 'Vaquinha (R$)']]} />
        <div className="campo"><label htmlFor="n-t">O que precisa</label><input id="n-t" required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder={f.vaquinha ? 'Vaquinha para…' : 'Bolas de futebol'} /></div>
        <div className="campos-linha">
          <div className="campo"><label htmlFor="n-q">{f.vaquinha ? 'Meta (R$)' : 'Quantidade'}</label><input id="n-q" type="number" min="1" required value={f.quantidade_necessaria} onChange={(e) => setF({ ...f, quantidade_necessaria: e.target.value })} /></div>
          {!f.vaquinha && <div className="campo"><label htmlFor="n-u">Unidade</label><input id="n-u" placeholder="bolas, cadernos…" value={f.unidade} onChange={(e) => setF({ ...f, unidade: e.target.value })} /></div>}
          {!f.vaquinha && <div className="campo"><label htmlFor="n-c">Estado</label>
            <select id="n-c" value={f.condicao} onChange={(e) => setF({ ...f, condicao: e.target.value })}>
              <option>novos</option><option>semiusados</option><option>novos ou semiusados</option></select></div>}
        </div>
        <div className="campo"><label htmlFor="n-cat">Categoria</label>
          <select id="n-cat" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
            <option value="material_pedagogico">Material pedagógico</option><option value="alimentacao">Alimentação</option>
            <option value="infraestrutura">Estrutura</option><option value="experiencias">Passeios e cultura</option></select></div>
        <div className="campo"><label htmlFor="n-p">Precisamos até</label><input id="n-p" type="date" value={f.prazo} onChange={(e) => setF({ ...f, prazo: e.target.value })} /></div>
        <div className="campo"><label htmlFor="n-d">Por que precisa</label><textarea id="n-d" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo">{gestao ? 'Publicar' : 'Enviar para aprovação'}</button>
      </form>
    </Modal>
  )
}
