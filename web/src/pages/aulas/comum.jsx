import { PiggyBank, Sparkles, Users } from 'lucide-react'
import { Moldura } from '../../components/Moldura'
import { useSessao } from '../../lib/sessao'
import { navPorPapel } from '../escola/comum'
import { NAV_PUBLICA } from '../publico/navPublica'
import { BotaoEntrar } from '../publico/BotaoEntrar'
import { dataComDia, hora } from '../../lib/formato'

// Vitrine aberta: visitantes navegam pela barra pública; quem está logado, pela barra do próprio perfil.
export function MolduraAulas({ children }) {
  const { perfil } = useSessao()
  return (
    <Moldura itens={perfil ? navPorPapel(perfil.papel) : NAV_PUBLICA} acaoTopo={!perfil && <BotaoEntrar />}>
      <div className="pilha-g">{children}</div>
    </Moldura>
  )
}

export const TEMA = {
  ia: { Icone: Sparkles, cor: '#1F5FA8', fundo: '#E3EEFB', rotulo: 'Tecnologia' },
  financas: { Icone: PiggyBank, cor: '#8C6100', fundo: '#FFF4D6', rotulo: 'Dinheiro' },
  outro: { Icone: Users, cor: '#256B29', fundo: '#E6F2E3', rotulo: 'Família' },
}

const DIA_SEMANA = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados']
// "Sábados, das 9h às 11h": resumo do horário a partir do primeiro encontro.
export function quando(inicio, duracaoMin = 120) {
  if (!inicio) return ''
  const d = new Date(inicio); const fim = new Date(d.getTime() + duracaoMin * 60000)
  const nome = DIA_SEMANA[d.getDay()]
  return `${nome[0].toUpperCase() + nome.slice(1)}, das ${hora(d)} às ${hora(fim)}`
}
export const comecaEm = (inicio) => (inicio ? `Começa ${dataComDia(inicio)}` : '')

export function Vagas({ curso }) {
  if (curso.status !== 'inscricoes_abertas') return <span className="etiqueta etiqueta--neutra">Inscrições encerradas</span>
  if (curso.vagas_restantes === 0) return <span className="etiqueta etiqueta--alerta">Vagas esgotadas: lista de espera aberta</span>
  return <span className="etiqueta">{curso.vagas_restantes === 1 ? 'Última vaga' : `${curso.vagas_restantes} vagas para famílias`}</span>
}
