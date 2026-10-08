import { useState } from 'react'
import { Send, Lightbulb, AlertTriangle, Heart } from 'lucide-react'
import { api } from '@api'
import { useSessao } from '../../lib/sessao'
import { useCarregar } from '../../lib/useCarregar'
import { Carregando, Erro, Caixa, Vazio } from '../../components/comuns'
import { haQuanto } from '../../lib/formato'
import { Pagina, Filtros, ehEquipe } from './comum'

const TIPOS = {
  sugestao: { nome: 'Sugestão', Icone: Lightbulb, cor: '#1F5FA8', dica: 'Uma ideia para melhorar o Instituto ou o portal.' },
  reclamacao: { nome: 'Reclamação', Icone: AlertTriangle, cor: '#B4570B', dica: 'Algo que não está bom. Conte o que aconteceu e quando.' },
  elogio: { nome: 'Elogio', Icone: Heart, cor: '#256B29', dica: 'Algo que deu certo e merece ser dito.' },
}
const PAPEL = { responsavel: 'Responsável', doador_pf: 'Doador', empresa: 'Empresa', educacao: 'Equipe', gestao: 'Diretoria' }

export default function Feedback() {
  const { perfil } = useSessao()
  const equipe = ehEquipe(perfil)
  const [tipo, setTipo] = useState('sugestao')
  const [texto, setTexto] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [filtro, setFiltro] = useState('abertas')
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.feedbacks())
  const enviar = async (e) => {
    e.preventDefault()
    await api.enviarFeedback(texto.trim(), tipo, perfil.id)
    setTexto(''); setEnviado(true); recarregar()
  }
  const lista = (dados || []).filter((f) => !equipe || filtro === 'todas' || (filtro === 'abertas' ? !f.resposta : f.tipo === filtro))
  const T = TIPOS[tipo]
  return (
    <Pagina titulo="Sugestões e reclamações" intro="Sua mensagem vai direto para a coordenação. Respondemos aqui mesmo, em até uma semana.">
      <form className="cartao pilha" onSubmit={enviar}>
        <Filtros rotulo="Tipo de mensagem" valor={tipo} mudar={(v) => { setTipo(v); setEnviado(false) }} opcoes={Object.entries(TIPOS).map(([k, t]) => [k, t.nome])} />
        <div className="campo">
          <label htmlFor="fb-texto">{T.nome}</label>
          <textarea id="fb-texto" maxLength={500} rows={4} value={texto} placeholder={T.dica} onChange={(e) => { setTexto(e.target.value); setEnviado(false) }} />
          <small>{texto.length}/500 caracteres. Não escreva dados pessoais de crianças.</small>
        </div>
        <button className="botao" disabled={!texto.trim()}><Send size={18} aria-hidden="true" />Enviar</button>
        {enviado && <Caixa titulo="Recebido. Obrigado por ajudar o Instituto a melhorar!" />}
      </form>

      <section className="pilha" aria-labelledby="fb-lista">
        <h2 id="fb-lista">{equipe ? 'Caixa de entrada' : 'Minhas mensagens'}</h2>
        {equipe && <Filtros rotulo="Filtrar" valor={filtro} mudar={setFiltro} opcoes={[['abertas', 'Sem resposta'], ['reclamacao', 'Reclamações'], ['sugestao', 'Sugestões'], ['elogio', 'Elogios'], ['todas', 'Todas']]} />}
        {carregando && <Carregando />}
        {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
        {dados && lista.length === 0 && <Vazio titulo={equipe ? 'Nada pendente. Tudo respondido!' : 'Você ainda não enviou mensagens.'} />}
        {lista.map((f) => <Mensagem key={f.id} f={f} equipe={equipe} perfil={perfil} recarregar={recarregar} />)}
      </section>
    </Pagina>
  )
}

function Mensagem({ f, equipe, perfil, recarregar }) {
  const [resposta, setResposta] = useState('')
  const t = TIPOS[f.tipo] || TIPOS.sugestao
  return (
    <article className="cartao obs" style={{ '--cor': t.cor }}>
      <t.Icone size={22} color={t.cor} aria-hidden="true" />
      <div className="pilha" style={{ flex: 1 }}>
        <p className="fonte"><strong style={{ color: t.cor }}>{t.nome}</strong>{equipe && f.autor && ` · ${f.autor.nome} (${PAPEL[f.autor.papel] || f.autor.papel})`} · {haQuanto(f.criada_em)}</p>
        <p>{f.texto}</p>
        {f.resposta
          ? <div className="resposta"><strong>Resposta do Instituto</strong><p>{f.resposta}</p></div>
          : equipe
            ? (
              <form className="pilha" onSubmit={async (e) => { e.preventDefault(); await api.responderFeedback(f.id, resposta.trim(), perfil.id); recarregar() }}>
                <div className="campo"><label htmlFor={`r-${f.id}`}>Responder</label><textarea id={`r-${f.id}`} rows={2} value={resposta} onChange={(e) => setResposta(e.target.value)} /></div>
                <button className="botao botao--claro" disabled={!resposta.trim()}>Enviar resposta</button>
              </form>
            )
            : <p className="fonte">Aguardando resposta.</p>}
      </div>
    </article>
  )
}
