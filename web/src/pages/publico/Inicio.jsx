import { Link } from 'react-router-dom'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { ArvoreCapa } from '../../components/Arvore'
import { Atualizacao, Carregando, Erro, Numero, Progresso } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { numero } from '../../lib/formato'
import { NAV_PUBLICA } from './navPublica'
import { BotaoEntrar } from './BotaoEntrar'

const QUANDO = {
  reforco: 'Segunda a sexta, de manhã ou à tarde',
  sonhos: 'Sábados, das 12h às 16h',
  infancia: 'Sábados, das 12h às 14h',
  vivencias: 'Sábados, das 9h às 12h',
}

export default function Inicio() {
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [indicadores, programas, carencias] = await Promise.all([
      api.indicadoresPublicos(), api.programasPublicos(), api.carenciasPublicas()])
    return { ind: Object.fromEntries(indicadores.map((i) => [i.codigo, i])), programas, carencias }
  })

  return (
    <Moldura itens={NAV_PUBLICA} acaoTopo={<BotaoEntrar />}>
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados && <Conteudo {...dados} />}
    </Moldura>
  )
}

function Conteudo({ ind, programas, carencias }) {
  const criancas = ind.criancas_atendidas?.ultimo
  const abertas = carencias.filter((c) => c.status !== 'atendida').slice(0, 3)
  return (
    <div className="pilha-g">
      <section className="capa" aria-labelledby="capa-titulo">
        <div className="pilha">
          <div className="capa__numero">{criancas ? numero(criancas.valor) : '—'}</div>
          <h1 id="capa-titulo" className="capa__frase">crianças do Jardim Ângela aprendem e criam com a gente este ano</h1>
          {criancas && <Atualizacao quando={criancas.atualizado_em} fonte={ind.criancas_atendidas.fonte} />}
        </div>
        <ArvoreCapa className="capa__arvore" />
      </section>

      <section className="pilha" aria-labelledby="mudou">
        <h2 id="mudou">O que já mudou</h2>
        <div className="grade-numeros">
          {ind.taxa_presenca?.ultimo && (
            <Numero valor={`${numero(ind.taxa_presenca.ultimo.valor)}%`} rotulo="das aulas com a criança presente"
              quando={ind.taxa_presenca.ultimo.atualizado_em} fonte={ind.taxa_presenca.fonte} />
          )}
          {ind.criancas_com_avanco?.ultimo && (
            <Numero valor={`${numero(ind.criancas_com_avanco.ultimo.valor)}%`} rotulo="das crianças do reforço já avançaram na leitura"
              quando={ind.criancas_com_avanco.ultimo.atualizado_em} fonte={ind.criancas_com_avanco.fonte} />
          )}
          {ind.experiencias_culturais?.ultimo && (
            <Numero valor={numero(ind.experiencias_culturais.ultimo.valor)} rotulo="idas a museu, teatro e concerto"
              quando={ind.experiencias_culturais.ultimo.atualizado_em} fonte={ind.experiencias_culturais.fonte} />
          )}
          {ind.sroi?.ultimo && (
            <Numero valor={`R$ ${numero(ind.sroi.ultimo.valor, 2)}`} rotulo="de valor social para cada R$ 1 investido em 2025"
              fonte={ind.sroi.fonte} />
          )}
        </div>
      </section>

      <section className="pilha" aria-labelledby="programas">
        <h2 id="programas">Nossos programas</h2>
        <ul className="lista-simples cartao" style={{ padding: '0 16px' }}>
          {programas.map((p) => (
            <li key={p.codigo}>
              <h3>{p.nome}</h3>
              <p>{p.descricao}</p>
              <p className="fonte">
                {QUANDO[p.codigo] || ''}. De {p.idade_min} a {p.idade_max} anos.
                {p.criancas_atendidas ? ` ${p.criancas_atendidas} crianças.` : ''}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {abertas.length > 0 && (
        <section className="pilha" aria-labelledby="precisamos">
          <h2 id="precisamos">Do que precisamos agora</h2>
          {abertas.map((c) => (
            <div key={c.id} className="cartao pilha">
              <h3>{c.titulo}</h3>
              {c.progresso_pct != null && <Progresso pct={c.progresso_pct} rotulo={`${c.progresso_pct}% atendido`} />}
              <p className="fonte">{c.quantidade_atendida} de {c.quantidade_necessaria} já garantidos.</p>
            </div>
          ))}
          <Link to="/carencias" className="botao botao--largo">Ver todas as carências</Link>
        </section>
      )}
    </div>
  )
}
