import { Users } from 'lucide-react'
import { api } from '@api'
import { Espaco } from './Espaco'
import { Carregando, Erro, Vazio } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { dataCurta } from '../../lib/formato'

export default function Turma() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.marcosDaTurma())
  return (
    <Espaco tela="turma">
      <div>
        <h1>Minha turma</h1>
        <p>O que a turma conquistou junta.</p>
      </div>
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados?.length === 0 && <Vazio titulo="Ainda não há marcos da turma.">Quando a turma alcançar uma meta junta, ela aparece aqui.</Vazio>}
      {dados?.map((m) => (
        <div key={m.id} className="cartao" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--turma-suave)', borderColor: 'transparent' }}>
          <Users size={32} color="var(--turma)" aria-hidden="true" style={{ flex: 'none' }} />
          <div>
            <p><strong>{m.descricao}</strong></p>
            <p className="fonte">{m.turma.nome}, {dataCurta(m.atingido_em)}</p>
          </div>
        </div>
      ))}
    </Espaco>
  )
}
