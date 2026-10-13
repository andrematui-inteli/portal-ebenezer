import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CalendarHeart, User } from 'lucide-react'
import { api } from '@api'
import { useCarregar } from '../../lib/useCarregar'
import { Carregando, Erro, Vazio } from '../../components/comuns'
import { reais, numero } from '../../lib/formato'
import { Pagina, Filtros } from './comum'

// Quadro de apoiadores por constância (princípio 2, RF-06): mostra há quantos meses
// cada um apoia, nunca quanto doou. O valor aparece só para o próprio apoiador
// (no cartão "Sua contribuição") e para a gestão. O banco já entrega assim.
export default function Ranking() {
  const [cat, setCat] = useState('pessoa_fisica')
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.ranking())
  const lista = (dados || []).filter((r) => r.categoria === cat)
    .sort((a, b) => b.meses_de_apoio - a.meses_de_apoio || a.nome.localeCompare(b.nome))
  const eu = (dados || []).find((r) => r.sou_eu)
  const veValores = (dados || []).some((r) => !r.sou_eu && r.total_reais != null)   // só a gestão
  const plural = (n) => `${n} ${n === 1 ? 'mês' : 'meses'}`
  return (
    <Pagina titulo="Quem apoia com constância" largo intro="Cada mês de apoio conta. Aqui ninguém compete por valor: mostramos há quanto tempo cada pessoa e empresa caminha com o Instituto.">
      {eu && (
        <div className="cartao pilha">
          <strong>Sua contribuição</strong>
          <p>Você apoia há <strong>{plural(eu.meses_de_apoio)}</strong>
            {eu.total_reais != null && <>, somando {reais(eu.total_reais)}{eu.itens_doados > 0 && ` e ${numero(eu.itens_doados)} itens`}</>}.</p>
          <p className="fonte">Só você vê o seu valor. Para os outros, aparecem apenas os meses de apoio.</p>
        </div>
      )}
      <Filtros rotulo="Categoria" valor={cat} mudar={setCat} opcoes={[['pessoa_fisica', 'Pessoas'], ['empresa', 'Empresas']]} />
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados && lista.length === 0 && <Vazio titulo="Ainda não há apoiadores nesta categoria." />}
      {lista.length > 0 && (
        <>
          <ul className="lista-simples cartao" style={{ padding: '0 16px' }}>
            {lista.map((r, i) => (
              <li key={i + r.nome} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {cat === 'empresa' ? <Building2 size={20} aria-hidden="true" /> : <User size={20} aria-hidden="true" />}
                <span style={{ flex: 1 }}>
                  <strong>{r.nome}</strong>{r.sou_eu && <span className="etiqueta" style={{ marginLeft: 8 }}>você</span>}
                  {veValores && r.total_reais != null && <span className="fonte" style={{ display: 'block' }}>{reais(r.total_reais)} (visível só para a gestão)</span>}
                </span>
                <span className="suave" style={{ whiteSpace: 'nowrap' }}><CalendarHeart size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> {plural(r.meses_de_apoio)}</span>
              </li>
            ))}
          </ul>
          <p className="fonte">Quem não autorizou aparece como “Apoiador anônimo”; para mudar, fale com a coordenação. <Link to="/escola/necessidades">Ver o que ainda falta</Link>.</p>
        </>
      )}
    </Pagina>
  )
}
