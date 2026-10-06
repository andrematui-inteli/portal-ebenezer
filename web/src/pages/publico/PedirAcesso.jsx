import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Caixa, Erro } from '../../components/comuns'

const PAPEIS = [
  ['responsavel', 'Sou mãe, pai ou responsável por uma criança do Instituto'],
  ['doador_pf', 'Faço ou quero fazer doações'],
  ['empresa', 'Represento uma empresa apoiadora'],
]

export default function PedirAcesso() {
  const [form, setForm] = useState({ nome: '', contato: '', papel_pretendido: 'responsavel', mensagem: '' })
  const [estado, setEstado] = useState({ enviado: false, erro: null, enviando: false })
  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault(); setEstado({ ...estado, enviando: true, erro: null })
    try { await api.solicitarAcesso({ ...form, mensagem: form.mensagem || null }); setEstado({ enviado: true }) }
    catch (err) { setEstado({ enviado: false, enviando: false, erro: err.message }) }
  }

  return (
    <Moldura>
      <div style={{ maxWidth: 480, margin: '0 auto' }} className="pilha">
        <h1>Pedir acesso</h1>
        {estado.enviado ? (
          <>
            <Caixa titulo="Pedido enviado.">A gestão do Instituto confere os pedidos toda semana e responde pelo contato que você deixou.</Caixa>
            <Link to="/" className="botao botao--claro botao--largo">Voltar para o início</Link>
          </>
        ) : (
          <form className="pilha" onSubmit={enviar}>
            <p>Conte quem você é. A gestão confere e envia seu acesso.</p>
            {estado.erro && <Erro mensagem={estado.erro} />}
            <fieldset className="pilha" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 700, marginBottom: 8 }}>Você é</legend>
              {PAPEIS.map(([valor, rotulo]) => (
                <button type="button" key={valor} className="opcao" aria-pressed={form.papel_pretendido === valor}
                  onClick={() => setForm({ ...form, papel_pretendido: valor })}>{rotulo}</button>
              ))}
            </fieldset>
            <div className="campo"><label htmlFor="nome">Seu nome</label>
              <input id="nome" required value={form.nome} onChange={mudar('nome')} autoComplete="name" /></div>
            <div className="campo"><label htmlFor="contato">WhatsApp ou e-mail</label>
              <input id="contato" required value={form.contato} onChange={mudar('contato')} /></div>
            <div className="campo"><label htmlFor="msg">Quer contar mais alguma coisa? (opcional)</label>
              <textarea id="msg" maxLength={500} value={form.mensagem} onChange={mudar('mensagem')} />
              <small>Não escreva dados de saúde nem documentos.</small></div>
            <button className="botao botao--largo" disabled={estado.enviando}>Enviar pedido</button>
          </form>
        )}
      </div>
    </Moldura>
  )
}
