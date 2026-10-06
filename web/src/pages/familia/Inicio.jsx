import { Link, Navigate } from 'react-router-dom'
import { ChevronRight, Star, CalendarDays } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Carregando, Erro, Caixa } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { useSessao } from '../../lib/sessao'
import { idade, fracaoPresenca, nomeMes, dataComDia, dataCurta, hora } from '../../lib/formato'
import { NAV_FAMILIA, consentimentoAtivo, resumoDaCrianca } from './comum'

export default function InicioFamilia() {
  const { perfil } = useSessao()
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const vinculos = await api.meusVinculos()
    const resumos = await Promise.all(vinculos.filter(consentimentoAtivo).map((v) => resumoDaCrianca(v.crianca_id)))
    const avisos = await api.avisos()
    return { vinculos, resumos, avisos }
  })

  if (dados && dados.vinculos.some((v) => !v.consentimento_em && !v.consentimento_revogado_em)) return <Navigate to="/familia/autorizar" replace />

  return (
    <Moldura itens={NAV_FAMILIA}>
      <div className="pilha-g">
        <h1>Olá, {perfil?.nome}</h1>
        {carregando && <Carregando />}
        {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
        {dados && <Conteudo {...dados} perfilId={perfil.id} />}
      </div>
    </Moldura>
  )
}

function Conteudo({ vinculos, resumos, avisos, perfilId }) {
  const ativos = vinculos.filter(consentimentoAtivo)
  const pausados = vinculos.filter((v) => v.consentimento_revogado_em)
  const proximos = avisos.filter((a) => a.data_evento && new Date(a.data_evento) > new Date())
    .sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento)).slice(0, 2)
  return (
    <>
      {ativos.length === 0 && pausados.length === 0 && (
        <Caixa titulo="Nenhuma criança ligada à sua conta ainda.">Fale com a coordenação do Instituto para fazer a ligação.</Caixa>
      )}
      {ativos.map((v, i) => <CartaoCrianca key={v.crianca_id} vinculo={v} resumo={resumos[i]} />)}
      {pausados.map((v) => (
        <Caixa key={v.crianca_id} titulo={`A exibição dos dados de ${v.crianca.nome_exibicao} está pausada.`}
          acao={<Link to="/familia/conta" className="botao botao--claro">Retomar exibição</Link>}>
          Você pausou em Minha conta. Nada sobre a criança aparece no portal enquanto estiver pausado.
        </Caixa>
      ))}
      {proximos.length > 0 && (
        <section className="pilha" aria-labelledby="prox">
          <h2 id="prox">Próximos avisos</h2>
          {proximos.map((a) => {
            const novo = !a.aviso_visto?.some((x) => x.perfil_id === perfilId)
            return (
              <Link key={a.id} to="/familia/avisos" className="cartao cartao--link pilha">
                {novo && <span className="etiqueta">Novo</span>}
                <h3>{a.titulo}</h3>
                <p className="suave"><CalendarDays size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> {dataComDia(a.data_evento)}, {hora(a.data_evento)}</p>
              </Link>
            )
          })}
        </section>
      )}
    </>
  )
}

function CartaoCrianca({ vinculo, resumo }) {
  const c = vinculo.crianca
  const novas = resumo.conquistas.filter((q) => !q.vista_em).length
  const ultima = resumo.leitura.at(-1)
  const ultimoDia = resumo.presenca.map((p) => p.ultimoDia).filter(Boolean).sort().at(-1)
  return (
    <Link to={`/familia/crianca/${c.id}`} className="cartao cartao--link pilha" aria-label={`Ver tudo sobre ${c.nome_exibicao}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <h2>{c.nome_exibicao.split(' ')[0]}</h2>
          <p className="suave">{idade(c.ano_nascimento)} anos. {resumo.programas.map((p) => p.nome).join(' e ')}.</p>
        </div>
        <ChevronRight aria-hidden="true" />
      </div>
      {resumo.presenca.map(({ programa, mes }) => mes && (
        <p key={programa.id}><strong>{programa.nome}:</strong> {fracaoPresenca(mes.presentes, mes.possiveis, programa.cadencia)} em {nomeMes(mes.mes)}.</p>
      ))}
      {resumo.presenca.every((p) => !p.mes) && <p className="suave">A presença deste mês ainda não foi registrada.</p>}
      {ultima && <p>Na leitura, está no nível do <strong>{ultima.serie_equivalente}</strong>.</p>}
      {novas > 0 && <p className="etiqueta" style={{ background: 'var(--conquista-suave)', color: 'var(--conquista)' }}><Star size={16} aria-hidden="true" />{novas === 1 ? '1 conquista nova' : `${novas} conquistas novas`}</p>}
      {ultimoDia && <p className="fonte">Presença registrada até {dataCurta(ultimoDia)}.</p>}
    </Link>
  )
}
