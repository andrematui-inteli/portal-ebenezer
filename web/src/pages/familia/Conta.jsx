import { useState } from 'react'
import { KeyRound, LogOut, Pause, Play, Send } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Caixa, Carregando, Erro } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { useSessao } from '../../lib/sessao'
import { dataCurta } from '../../lib/formato'
import { NAV_FAMILIA, consentimentoAtivo } from './comum'

export default function Conta() {
  const { perfil } = useSessao()
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const vinculos = await api.meusVinculos()
    const acessos = await Promise.all(vinculos.map((v) => api.acessoEstudante(v.crianca_id)))
    return { vinculos, acessos, sugestoes: await api.minhasSugestoes() }
  })

  return (
    <Moldura itens={NAV_FAMILIA}>
      <div className="pilha-g">
        <h1>Minha conta</h1>
        {carregando && <Carregando />}
        {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
        {dados && (
          <>
            <section className="pilha" aria-labelledby="aut">
              <h2 id="aut">Autorizações</h2>
              {dados.vinculos.map((v) => <Autorizacao key={v.crianca_id} v={v} aoMudar={recarregar} />)}
            </section>
            <section className="pilha" aria-labelledby="est">
              <h2 id="est">Acesso das crianças</h2>
              <p className="suave">A criança entra no próprio espaço com o seu celular. Para sair dele, ela precisa do PIN que você definir.</p>
              {dados.vinculos.map((v, i) => <AcessoCrianca key={v.crianca_id} v={v} acesso={dados.acessos[i]} aoMudar={recarregar} />)}
            </section>
            <Sugestoes perfilId={perfil.id} anteriores={dados.sugestoes} aoEnviar={recarregar} />
          </>
        )}
        <button className="botao botao--claro botao--largo" onClick={() => api.sair()}><LogOut size={20} aria-hidden="true" />Sair da conta</button>
      </div>
    </Moldura>
  )
}

function Autorizacao({ v, aoMudar }) {
  const [ocupado, setOcupado] = useState(false)
  const ativo = consentimentoAtivo(v)
  const nome = v.crianca.nome_exibicao.split(' ')[0]
  const trocar = async () => { setOcupado(true); try { ativo ? await api.pausarExibicao(v.crianca_id) : await api.consentir(v.crianca_id); await aoMudar() } finally { setOcupado(false) } }
  return (
    <div className="cartao pilha">
      <h3>{nome}</h3>
      <p>{ativo ? `Autorizado desde ${dataCurta(v.consentimento_em)}. Você vê a presença, a leitura e as conquistas.` : 'Exibição pausada. Nada sobre a criança aparece no portal.'}</p>
      <button className={`botao ${ativo ? 'botao--claro' : ''}`} disabled={ocupado} onClick={trocar}>
        {ativo ? <><Pause size={18} aria-hidden="true" />Pausar exibição</> : <><Play size={18} aria-hidden="true" />Retomar exibição</>}
      </button>
    </div>
  )
}

function AcessoCrianca({ v, acesso, aoMudar }) {
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState(null)
  const nome = v.crianca.nome_exibicao.split(' ')[0]
  if (!acesso) {
    return <Caixa titulo={`${nome} ainda não tem acesso próprio.`}>Quando a criança já souber ler, peça à coordenação para criar o acesso dela.</Caixa>
  }
  const suspenso = Boolean(acesso.suspenso_em)
  const salvarPin = async (e) => {
    e.preventDefault(); setMsg(null)
    try { await api.definirPin(v.crianca_id, pin); setPin(''); setMsg({ tipo: 'info', texto: 'PIN salvo.' }) }
    catch (err) { setMsg({ tipo: 'erro', texto: err.message }) }
  }
  return (
    <div className="cartao pilha">
      <h3>{nome}</h3>
      <p>{suspenso ? `Acesso suspenso desde ${dataCurta(acesso.suspenso_em)}.` : `Acesso liberado desde ${dataCurta(acesso.liberado_em)}.`}</p>
      <button className={`botao ${suspenso ? '' : 'botao--perigo'}`} onClick={async () => { await api.suspenderAcesso(v.crianca_id, !suspenso); aoMudar() }}>
        {suspenso ? 'Liberar de novo' : 'Suspender acesso'}
      </button>
      {!suspenso && (
        <form className="pilha" onSubmit={salvarPin}>
          <div className="campo">
            <label htmlFor={`pin-${v.crianca_id}`}>PIN para sair do espaço da criança</label>
            <input id={`pin-${v.crianca_id}`} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="off"
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4 números" />
          </div>
          <button className="botao botao--claro" disabled={pin.length !== 4}><KeyRound size={18} aria-hidden="true" />Salvar PIN</button>
          {msg && <Caixa tipo={msg.tipo} titulo={msg.texto} />}
        </form>
      )}
    </div>
  )
}

function Sugestoes({ perfilId, anteriores, aoEnviar }) {
  const [texto, setTexto] = useState('')
  const [enviado, setEnviado] = useState(false)
  const enviar = async (e) => { e.preventDefault(); await api.enviarSugestao(texto.trim(), perfilId); setTexto(''); setEnviado(true); aoEnviar() }
  return (
    <section className="pilha" aria-labelledby="sug">
      <h2 id="sug">Sugestões para o Instituto</h2>
      <form className="pilha" onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="sugestao">Sua sugestão</label>
          <textarea id="sugestao" maxLength={1000} value={texto} onChange={(e) => { setTexto(e.target.value); setEnviado(false) }} />
          <small>A equipe lê toda semana. Não escreva dados de saúde nem documentos.</small>
        </div>
        <button className="botao" disabled={!texto.trim()}><Send size={18} aria-hidden="true" />Enviar sugestão</button>
        {enviado && <Caixa titulo="Sugestão enviada. Obrigado!" />}
      </form>
      {anteriores.length > 0 && (
        <ul className="lista-simples">
          {anteriores.map((s) => (
            <li key={s.id} className="pilha">
              <p>{s.texto}</p>
              <p className="fonte">{s.resposta ? `Resposta do Instituto: ${s.resposta}` : 'Aguardando resposta.'}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
