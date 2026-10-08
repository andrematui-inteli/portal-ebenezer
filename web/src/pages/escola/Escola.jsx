import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { api } from '@api'
import { useSessao } from '../../lib/sessao'
import { useCarregar } from '../../lib/useCarregar'
import { dataComDia, hora } from '../../lib/formato'
import { Pagina, secoesDo } from './comum'
import { corDoTipo } from './Agenda'

// Porta de entrada da vida escolar: um cartão grande por seção, mais o que vem pela frente.
export default function Escola() {
  const { perfil } = useSessao()
  const crianca = perfil?.papel === 'estudante'
  const { dados } = useCarregar(async () => {
    const hoje = new Date(); const fim = new Date(); fim.setDate(fim.getDate() + 21)
    return api.agenda(hoje.toISOString(), fim.toISOString())
  })
  return (
    <Pagina titulo={crianca ? 'Minha escola' : 'Escola'} intro={crianca ? 'Tudo o que você precisa para estudar.' : `Olá, ${perfil?.nome.split(' ')[0]}. O que você quer ver?`} largo>
      <nav className="grade-secoes" aria-label="Seções da escola">
        {secoesDo(perfil?.papel).map(({ para, titulo, desc, Icone, cor }) => (
          <Link key={para} to={para} className="secao" style={{ '--cor': cor }}>
            <span className="secao__icone"><Icone size={26} aria-hidden="true" /></span>
            <span><strong>{titulo}</strong><small>{desc}</small></span>
          </Link>
        ))}
      </nav>
      {dados?.length > 0 && (
        <section className="pilha" aria-labelledby="em-breve">
          <h2 id="em-breve">Nos próximos dias</h2>
          {dados.slice(0, 3).map((e) => (
            <Link key={e.id} to="/escola/agenda" className="cartao cartao--link evento" style={{ '--cor': corDoTipo(e.tipo) }}>
              <CalendarDays size={20} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <strong>{e.titulo}</strong>
                <p className="fonte">{dataComDia(e.inicio)}, {hora(e.inicio)}{e.local && ` · ${e.local}`}</p>
              </div>
              <ChevronRight aria-hidden="true" />
            </Link>
          ))}
        </section>
      )}
    </Pagina>
  )
}
