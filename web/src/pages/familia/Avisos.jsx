import { useEffect } from 'react'
import { CalendarDays, Backpack } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Carregando, Erro, Vazio } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { useSessao } from '../../lib/sessao'
import { dataComDia, hora, haQuanto } from '../../lib/formato'
import { NAV_FAMILIA } from './comum'

export default function Avisos() {
  const { perfil } = useSessao()
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.avisos())

  useEffect(() => {
    if (!dados || !perfil) return
    dados.filter((a) => !a.aviso_visto?.some((v) => v.perfil_id === perfil.id))
      .forEach((a) => api.marcarAvisoVisto(a.id, perfil.id))
  }, [dados, perfil])

  const agora = new Date()
  const proximos = dados?.filter((a) => !a.data_evento || new Date(a.data_evento) >= agora)
    .sort((a, b) => new Date(a.data_evento || 0) - new Date(b.data_evento || 0)) || []
  const passados = dados?.filter((a) => a.data_evento && new Date(a.data_evento) < agora) || []

  return (
    <Moldura itens={NAV_FAMILIA}>
      <div className="pilha-g">
        <h1>Avisos</h1>
        {carregando && <Carregando />}
        {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
        {dados && dados.length === 0 && <Vazio titulo="Nenhum aviso por enquanto.">Quando o Instituto publicar um aviso, ele aparece aqui.</Vazio>}
        {proximos.length > 0 && <div className="pilha">{proximos.map((a) => <Aviso key={a.id} a={a} novo={!a.aviso_visto?.some((v) => v.perfil_id === perfil?.id)} />)}</div>}
        {passados.length > 0 && (
          <section className="pilha"><h2>Já aconteceram</h2>{passados.map((a) => <Aviso key={a.id} a={a} passado />)}</section>
        )}
      </div>
    </Moldura>
  )
}

function Aviso({ a, novo, passado }) {
  return (
    <article className="cartao pilha" style={passado ? { opacity: 0.75 } : undefined}>
      {novo && <span className="etiqueta">Novo</span>}
      <h2 style={{ fontSize: '1.15rem' }}>{a.titulo}</h2>
      {a.data_evento && <p><CalendarDays size={18} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> <strong>{dataComDia(a.data_evento)}, {hora(a.data_evento)}</strong></p>}
      <p>{a.corpo}</p>
      {a.o_que_levar && <p><Backpack size={18} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> <strong>Levar:</strong> {a.o_que_levar}</p>}
      <p className="fonte">Publicado {haQuanto(a.criado_em)}.</p>
    </article>
  )
}
