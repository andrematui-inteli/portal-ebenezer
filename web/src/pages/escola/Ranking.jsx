import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Medal, User } from 'lucide-react'
import { api } from '@api'
import { useCarregar } from '../../lib/useCarregar'
import { Carregando, Erro, Vazio } from '../../components/comuns'
import { reais, numero } from '../../lib/formato'
import { Pagina, Filtros } from './comum'

const MEDALHA = ['#C9A227', '#9AA4AE', '#B0703C']

// Ranking separado: pessoas físicas e empresas (CNPJ). Nome só aparece com autorização.
export default function Ranking() {
  const [cat, setCat] = useState('pessoa_fisica')
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.ranking())
  const lista = (dados || []).filter((r) => r.categoria === cat)
  const total = lista.reduce((s, r) => s + Number(r.total_reais), 0)
  const eu = (dados || []).find((r) => r.sou_eu)
  return (
    <Pagina titulo="Ranking de apoio" largo intro="Quem mais tem contribuído com o Instituto neste ano. Obrigado a cada um!">
      <Filtros rotulo="Categoria" valor={cat} mudar={setCat} opcoes={[['pessoa_fisica', 'Pessoas'], ['empresa', 'Empresas']]} />
      {eu && eu.categoria === cat && (
        <div className="cartao ranking-eu">
          <span>Sua posição</span><strong>{eu.posicao}º</strong>
          <span className="fonte">{reais(eu.total_reais)}{eu.itens_doados > 0 && ` e ${numero(eu.itens_doados)} itens`} em {eu.meses_de_apoio} {eu.meses_de_apoio === 1 ? 'mês' : 'meses'}</span>
        </div>
      )}
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados && lista.length === 0 && <Vazio titulo="Ainda não há doações nesta categoria." />}
      {lista.length > 0 && (
        <>
          <div className="podio" aria-label="Três primeiros">
            {[1, 0, 2].map((i) => lista[i] && (
              <div key={i} className={`podio__lugar podio__lugar--${i + 1}`}>
                <Medal size={30} color={MEDALHA[i]} aria-hidden="true" />
                <strong>{lista[i].nome}</strong>
                <span>{reais(lista[i].total_reais)}</span>
                <div className="podio__degrau">{i + 1}º</div>
              </div>
            ))}
          </div>
          <ol className="ranking cartao">
            {lista.map((r) => (
              <li key={r.posicao + r.nome} className={r.sou_eu ? 'ranking__eu' : ''}>
                <span className="ranking__pos">{r.posicao}º</span>
                {cat === 'empresa' ? <Building2 size={20} aria-hidden="true" /> : <User size={20} aria-hidden="true" />}
                <span className="ranking__nome">{r.nome}{r.sou_eu && <span className="etiqueta" style={{ marginLeft: 8 }}>você</span>}</span>
                <span className="ranking__valor">
                  <strong>{reais(r.total_reais)}</strong>
                  <small>{r.itens_doados > 0 && `+ ${numero(r.itens_doados)} itens · `}{r.meses_de_apoio} {r.meses_de_apoio === 1 ? 'mês' : 'meses'}</small>
                </span>
                <span className="ranking__barra" style={{ width: `${(Number(r.total_reais) / Number(lista[0].total_reais || 1)) * 100}%` }} aria-hidden="true" />
              </li>
            ))}
          </ol>
          <p className="fonte">Total da categoria: {reais(total)}. Conta só o que já chegou ao Instituto. Quem não autorizou aparece como “Apoiador anônimo”; para mudar, fale com a coordenação. <Link to="/escola/necessidades">Ver o que ainda falta</Link>.</p>
        </>
      )}
    </Pagina>
  )
}
