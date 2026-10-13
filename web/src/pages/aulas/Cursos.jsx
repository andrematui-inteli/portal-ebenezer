import { Link } from 'react-router-dom'
import { CalendarDays, Gift, HeartHandshake, UsersRound } from 'lucide-react'
import { api } from '@api'
import { Carregando, Erro, Vazio } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { MolduraAulas, TEMA, Vagas, quando, comecaEm } from './comum'

export default function Cursos() {
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [cursos, minhas] = await Promise.all([api.cursosFamilia(), api.minhasInscricoesFamilia()])
    return { cursos, minhas }
  })
  return (
    <MolduraAulas>
      <section className="pilha">
        <span className="etiqueta" style={{ alignSelf: 'flex-start' }}>Novo</span>
        <h1>Aulas em família</h1>
        <p style={{ fontSize: '1.15rem' }}>Cursos curtos para fazer <strong>junto com seu filho ou filha de 12 a 17 anos</strong>. Os dois aprendem ao mesmo tempo, na mesma mesa.</p>
      </section>

      <ul className="lista-simples cartao" style={{ padding: '0 16px' }} aria-label="Como funciona">
        <li style={{ display: 'flex', gap: 12 }}><UsersRound size={22} color="var(--verde-escuro)" aria-hidden="true" style={{ flex: 'none' }} />
          <span>Cada inscrição é de <strong>uma família</strong>: um ou dois adultos e até três jovens.</span></li>
        <li style={{ display: 'flex', gap: 12 }}><Gift size={22} color="var(--verde-escuro)" aria-hidden="true" style={{ flex: 'none' }} />
          <span><strong>Gratuito</strong>, no Instituto. Não precisa ter filho matriculado nos outros programas.</span></li>
        <li style={{ display: 'flex', gap: 12 }}><HeartHandshake size={22} color="var(--verde-escuro)" aria-hidden="true" style={{ flex: 'none' }} />
          <span>Sem prova e sem nota. A ideia é conversar, testar e combinar coisas juntos.</span></li>
      </ul>

      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados?.cursos.length === 0 && <Vazio titulo="Nenhum curso com inscrições abertas agora.">Volte em breve: novas turmas são divulgadas aqui e nos avisos.</Vazio>}
      {dados?.cursos.length > 0 && (
        <section className="pilha" aria-labelledby="cursos">
          <h2 id="cursos">Cursos</h2>
          {dados.cursos.map((c) => {
            const t = TEMA[c.tema] || TEMA.outro
            const inscrito = dados.minhas.find((m) => m.curso_id === c.id)
            return (
              <Link key={c.id} to={`/aulas-em-familia/${c.slug}`} className="cartao cartao--link pilha" style={{ borderTop: `6px solid ${t.cor}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ background: t.fundo, color: t.cor, borderRadius: 14, padding: 10, display: 'flex' }}><t.Icone size={28} aria-hidden="true" /></span>
                  <div>
                    <h3 style={{ fontSize: '1.3rem' }}>{c.titulo}</h3>
                    <span className="fonte">{c.encontros} encontros. Jovens de {c.idade_min} a {c.idade_max} anos.</span>
                  </div>
                </div>
                <p>{c.chamada}</p>
                <p className="suave"><CalendarDays size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> {quando(c.primeiro_encontro)}. {comecaEm(c.primeiro_encontro)}.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  {inscrito ? <span className="etiqueta">{inscrito.status === 'lista_espera' ? 'Você está na lista de espera' : 'Sua família está inscrita'}</span> : <Vagas curso={c} />}
                  <span className="botao" aria-hidden="true">Ver e se inscrever</span>
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </MolduraAulas>
  )
}
