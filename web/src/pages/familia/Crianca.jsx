import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Carregando, Erro, Pontos, Vazio } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { idade, fracaoPresenca, nomeMes, dataCurta, avancoEmTempo } from '../../lib/formato'
import { tituloConquista, ICONE_CONQUISTA } from '../../lib/conquistas'
import { NAV_FAMILIA, resumoDaCrianca } from './comum'

export default function Crianca() {
  const { id } = useParams()
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const vinculos = await api.meusVinculos()
    const vinculo = vinculos.find((v) => v.crianca_id === id)
    if (!vinculo) throw new Error('Esta criança não está ligada à sua conta.')
    const desde = new Date(); desde.setMonth(desde.getMonth() - 2); desde.setDate(1)
    const [resumo, dias] = await Promise.all([resumoDaCrianca(id), api.presencaDias(id, desde.toISOString().slice(0, 10))])
    return { crianca: vinculo.crianca, resumo, dias }
  }, [id])

  return (
    <Moldura itens={NAV_FAMILIA}>
      <div className="pilha-g">
        <Link to="/familia" className="botao botao--texto"><ArrowLeft size={18} aria-hidden="true" />Voltar</Link>
        {carregando && <Carregando />}
        {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
        {dados && <Conteudo {...dados} />}
      </div>
    </Moldura>
  )
}

function Conteudo({ crianca, resumo, dias }) {
  const nome = crianca.nome_exibicao.split(' ')[0]
  return (
    <>
      <div>
        <h1>{nome}</h1>
        <p className="suave">{idade(crianca.ano_nascimento)} anos</p>
      </div>

      <section className="pilha" aria-labelledby="presenca">
        <h2 id="presenca">Presença</h2>
        {resumo.programas.map((p) => <PresencaPrograma key={p.id} programa={p} dias={dias.filter((d) => d.turma_id === p.turma.id)} />)}
      </section>

      {resumo.leitura.length > 0 && <Leitura avaliacoes={resumo.leitura} nome={nome} />}

      <section className="pilha" aria-labelledby="conq">
        <h2 id="conq">Conquistas</h2>
        {resumo.conquistas.length === 0
          ? <Vazio titulo="Ainda sem conquistas registradas.">Elas aparecem quando a criança completa um bloco de leitura, sobe de nível ou vai a uma saída cultural.</Vazio>
          : (
            <ul className="lista-simples cartao" style={{ padding: '0 16px' }}>
              {resumo.conquistas.slice(0, 6).map((q) => {
                const Icone = ICONE_CONQUISTA[q.tipo_conquista.icone]
                return (
                  <li key={q.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Icone size={22} color="var(--conquista)" aria-hidden="true" />
                    <span style={{ flex: 1 }}>{tituloConquista(q)}</span>
                    <span className="fonte">{dataCurta(q.obtida_em)}</span>
                  </li>
                )
              })}
            </ul>
          )}
      </section>
    </>
  )
}

function PresencaPrograma({ programa, dias }) {
  const meses = {}
  dias.forEach((d) => { (meses[d.data.slice(0, 7)] ||= []).push(d) })
  const chaves = Object.keys(meses).sort().reverse()
  return (
    <div className="cartao pilha">
      <div>
        <h3>{programa.nome}</h3>
        <p className="fonte">{programa.turma.turno}</p>
      </div>
      {chaves.length === 0 && <p className="suave">Ainda não há presença registrada nos últimos meses.</p>}
      {chaves.map((k) => {
        const lista = meses[k]
        const presentes = lista.filter((d) => d.presente).length
        return (
          <div key={k}>
            <p><strong>{nomeMes(k + '-01').replace(/^./, (c) => c.toUpperCase())}:</strong> {fracaoPresenca(presentes, lista.length, programa.cadencia)}</p>
            <Pontos dias={lista} />
          </div>
        )
      })}
      {chaves.length > 0 && <p className="fonte">Cada bolinha é um dia de atividade. Cheia: foi. Vazia: faltou. Registrado até {dataCurta(dias.at(-1).data)}.</p>}
    </div>
  )
}

function Leitura({ avaliacoes, nome }) {
  const primeira = avaliacoes[0], ultima = avaliacoes.at(-1)
  const avanco = ultima.blocos_acumulados - primeira.blocos_acumulados
  const mudancas = avaliacoes.filter((a, i) => i === 0 || a.nivel !== avaliacoes[i - 1].nivel)
  return (
    <section className="pilha" aria-labelledby="leitura">
      <h2 id="leitura">Leitura</h2>
      <div className="cartao pilha">
        <p style={{ fontSize: '1.25rem' }}>{nome} lê como uma criança do <strong>{ultima.serie_equivalente}</strong>.</p>
        {avaliacoes.length > 1 && <p>Desde {nomeMes(primeira.data_avaliacao)}, {avancoEmTempo(avanco)}.</p>}
        <ul className="lista-simples">
          {mudancas.map((a) => (
            <li key={a.id}><strong>{dataCurta(a.data_avaliacao)}:</strong> nível {a.nivel} ({a.serie_equivalente})</li>
          ))}
        </ul>
        <p className="fonte">Avaliação feita pela Alicerce Educação no reforço. Última em {dataCurta(ultima.data_avaliacao)}.</p>
      </div>
    </section>
  )
}
