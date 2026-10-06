import { AlertTriangle, CircleAlert, Info } from 'lucide-react'
import { dataCurta, haQuanto } from '../lib/formato'

export const Carregando = ({ texto = 'Carregando…' }) => <p className="carregando" role="status">{texto}</p>

export function Caixa({ tipo = 'info', titulo, children, acao }) {
  const Icone = tipo === 'erro' ? CircleAlert : tipo === 'alerta' ? AlertTriangle : Info
  return (
    <div className={`aviso-caixa aviso-caixa--${tipo}`} role={tipo === 'erro' ? 'alert' : undefined}>
      <Icone size={22} aria-hidden="true" />
      <div className="pilha" style={{ flex: 1 }}>
        {titulo && <strong>{titulo}</strong>}
        {children && <div>{children}</div>}
        {acao}
      </div>
    </div>
  )
}

export const Erro = ({ mensagem, tentarDeNovo }) => (
  <Caixa tipo="erro" titulo={mensagem}
    acao={tentarDeNovo && <button className="botao botao--claro" onClick={tentarDeNovo}>Tentar de novo</button>} />
)

// Estado padrão de "ainda não há dados": convida a agir, não lamenta.
export const Vazio = ({ titulo, children }) => <Caixa titulo={titulo}>{children}</Caixa>

// Linha de atualização: todo número mostra de onde vem e de quando é.
export function Atualizacao({ quando, fonte, prefixo = 'Atualizado' }) {
  if (!quando && !fonte) return null
  return (
    <p className="fonte">
      {quando && <>{prefixo} {haQuanto(quando)} ({dataCurta(quando)}).</>}
      {fonte && <> Fonte: {fonte}.</>}
    </p>
  )
}

export function Numero({ valor, rotulo, detalhe, fonte, quando }) {
  return (
    <div className="cartao numero">
      <span className="numero__valor">{valor}</span>
      <span className="numero__rotulo">{rotulo}</span>
      {detalhe && <span className="suave">{detalhe}</span>}
      <Atualizacao quando={quando} fonte={fonte} />
    </div>
  )
}

export function Progresso({ pct, rotulo }) {
  return (
    <div className="progresso" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" aria-label={rotulo}>
      <span style={{ width: `${Math.max(pct, 2)}%` }} />
    </div>
  )
}

// Fileira de pontos: um ponto por dia possível, cheio quando a criança foi.
export function Pontos({ dias }) {
  return (
    <div className="pontos" aria-hidden="true">
      {dias.map((d, i) => <i key={i} className={d.presente ? '' : 'falta'} title={d.data} />)}
    </div>
  )
}
