import { Link } from 'react-router-dom'
import { MessageCircle, Mail } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Carregando } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { CONTATO } from '../../lib/config'
import { NAV_PUBLICA } from './navPublica'
import { BotaoEntrar } from './BotaoEntrar'

export default function Apoiar() {
  const { dados } = useCarregar(() => api.reconhecimento())
  return (
    <Moldura itens={NAV_PUBLICA} acaoTopo={<BotaoEntrar />}>
      <div className="pilha-g">
        <div className="pilha">
          <h1>Como apoiar</h1>
          <p>Você pode doar uma vez, todo mês, ou ajudar com um item da lista de carências. Fale com a gestão do Instituto para combinar.</p>
        </div>
        <div className="pilha">
          <a className="botao botao--largo" href={`https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent('Olá! Quero apoiar o Instituto Ebenézer.')}`}>
            <MessageCircle size={20} aria-hidden="true" />Conversar pelo WhatsApp
          </a>
          <a className="botao botao--claro botao--largo" href={`mailto:${CONTATO.email}`}>
            <Mail size={20} aria-hidden="true" />Escrever um e-mail
          </a>
          <p className="fonte">Já apoia o Instituto? <Link to="/pedir-acesso">Peça seu acesso</Link> para acompanhar o que sua doação ajudou a fazer.</p>
        </div>

        <section className="pilha" aria-labelledby="quem-apoia">
          <h2 id="quem-apoia">Quem apoia com constância</h2>
          <p className="suave">Aparece aqui quem autorizou. Mostramos há quantos meses cada pessoa apoia, nunca quanto doou.</p>
          {!dados && <Carregando />}
          {dados && (
            <ul className="lista-simples cartao" style={{ padding: '0 16px' }}>
              {dados.map((r) => (
                <li key={r.nome_publico} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{r.nome_publico}</strong>
                  <span className="suave">{r.meses_de_apoio} {r.meses_de_apoio === 1 ? 'mês' : 'meses'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Moldura>
  )
}
