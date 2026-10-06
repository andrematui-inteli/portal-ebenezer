import { useState } from 'react'
import { Lock, Sprout, Trophy, Users } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'

const NAV_ESTUDANTE = [
  { para: '/estudante', rotulo: 'Minha trilha', Icone: Sprout, fim: true, cor: 'trilha' },
  { para: '/estudante/conquistas', rotulo: 'Conquistas', Icone: Trophy, cor: 'conquistas' },
  { para: '/estudante/turma', rotulo: 'Minha turma', Icone: Users, cor: 'turma' },
]

// Espaço da criança: navegação própria, uma cor por tela, sem caminho para telas adultas.
// Sair exige o PIN que o responsável definiu (verificado no servidor).
export function Espaco({ tela, children }) {
  const [pedindoPin, setPedindoPin] = useState(false)
  return (
    <>
      <Moldura itens={NAV_ESTUDANTE} classe="app--crianca" dados={{ 'data-tela': tela }}
        acaoTopo={<button className="botao botao--texto" onClick={() => setPedindoPin(true)} aria-label="Sair, precisa do PIN do responsável"><Lock size={20} aria-hidden="true" /></button>}>
        <div className="pilha-g">{children}</div>
      </Moldura>
      {pedindoPin && <PinSaida fechar={() => setPedindoPin(false)} />}
    </>
  )
}

function PinSaida({ fechar }) {
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(false)
  const digitar = async (d) => {
    const novo = (pin + d).slice(0, 4); setPin(novo); setErro(false)
    if (novo.length === 4) {
      if (await api.verificarPin(novo)) await api.sair()
      else { setErro(true); setPin('') }
    }
  }
  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="pin-titulo">
      <div className="modal">
        <h2 id="pin-titulo" style={{ textAlign: 'center' }}>PIN do responsável</h2>
        <p className="suave" style={{ textAlign: 'center' }}>{erro ? 'PIN não confere. Peça para o adulto tentar de novo.' : 'Peça para o adulto digitar.'}</p>
        <div className="pin__mostrador" aria-live="polite" aria-label={`${pin.length} de 4 números digitados`}>
          {[0, 1, 2, 3].map((i) => <i key={i} className={i < pin.length ? 'cheio' : ''} />)}
        </div>
        <div className="pin">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <button key={n} onClick={() => digitar(String(n))}>{n}</button>)}
          <button onClick={fechar} style={{ fontSize: '1rem' }}>Voltar</button>
          <button onClick={() => digitar('0')}>0</button>
          <button onClick={() => setPin(pin.slice(0, -1))} style={{ fontSize: '1rem' }} aria-label="Apagar">Apagar</button>
        </div>
      </div>
    </div>
  )
}
