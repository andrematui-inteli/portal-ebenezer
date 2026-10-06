import { Link } from 'react-router-dom'
import { BookOpen, Bus, Sandwich, Wrench } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Carregando, Erro, Progresso, Vazio } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { dataCurta } from '../../lib/formato'
import { NAV_PUBLICA } from './navPublica'
import { BotaoEntrar } from './BotaoEntrar'

const CATEGORIA = {
  material_pedagogico: { nome: 'Material pedagógico', Icone: BookOpen },
  alimentacao: { nome: 'Alimentação', Icone: Sandwich },
  infraestrutura: { nome: 'Estrutura', Icone: Wrench },
  experiencias: { nome: 'Passeios e cultura', Icone: Bus },
}

export default function Carencias() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.carenciasPublicas())
  const abertas = dados?.filter((c) => c.status !== 'atendida') || []
  const atendidas = dados?.filter((c) => c.status === 'atendida') || []
  return (
    <Moldura itens={NAV_PUBLICA} acaoTopo={<BotaoEntrar />}>
      <div className="pilha-g">
        <div className="pilha">
          <h1>Carências</h1>
          <p>O que falta hoje para as atividades com as crianças. Cada item mostra quanto já foi garantido.</p>
        </div>
        {carregando && <Carregando />}
        {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
        {dados && abertas.length === 0 && <Vazio titulo="Nenhuma carência em aberto agora.">Volte em alguns dias ou veja abaixo o que já foi atendido.</Vazio>}
        {abertas.length > 0 && <div className="pilha">{abertas.map((c) => <Item key={c.id} c={c} />)}</div>}
        {abertas.length > 0 && <Link to="/apoiar" className="botao botao--largo">Quero ajudar</Link>}
        {atendidas.length > 0 && (
          <section className="pilha">
            <h2>Já atendidas</h2>
            {atendidas.map((c) => <Item key={c.id} c={c} />)}
          </section>
        )}
      </div>
    </Moldura>
  )
}

function Item({ c }) {
  const cat = CATEGORIA[c.categoria]
  return (
    <article className="cartao pilha">
      <span className="etiqueta etiqueta--neutra"><cat.Icone size={16} aria-hidden="true" />{cat.nome}</span>
      <h3>{c.titulo}</h3>
      {c.descricao && <p>{c.descricao}</p>}
      {c.progresso_pct != null && <Progresso pct={c.progresso_pct} rotulo={`${c.progresso_pct}% atendido`} />}
      <p className="fonte">
        {c.status === 'atendida' ? 'Atendida. Obrigado a quem ajudou.' : `${c.quantidade_atendida} de ${c.quantidade_necessaria} já garantidos.`}
        {c.prazo && c.status !== 'atendida' && ` Precisamos até ${dataCurta(c.prazo)}.`}
      </p>
    </article>
  )
}
