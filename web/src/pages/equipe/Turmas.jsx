import { useState } from 'react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Carregando, Erro, Caixa } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { useSessao } from '../../lib/sessao'
import { idade } from '../../lib/formato'
import { NAV_EQUIPE } from './comum'

export default function Turmas() {
  const { perfil } = useSessao()
  const turmas = useCarregar(() => api.minhasTurmas(perfil.id), [perfil?.id])
  const [turmaId, setTurmaId] = useState(null)
  const escolhida = turmas.dados?.find((t) => t.id === turmaId) || turmas.dados?.[0]

  return (
    <Moldura itens={NAV_EQUIPE} largo>
      <div className="pilha-g">
        <h1>Turmas</h1>
        {turmas.carregando && <Carregando />}
        {turmas.erro && <Erro mensagem={turmas.erro} tentarDeNovo={turmas.recarregar} />}
        {turmas.dados?.length === 0 && <Caixa titulo="Nenhuma turma ligada à sua conta.">Peça à gestão para ligar suas turmas.</Caixa>}
        {escolhida && (
          <>
            <div className="campo" style={{ maxWidth: 360 }}>
              <label htmlFor="turma">Turma</label>
              <select id="turma" value={escolhida.id} onChange={(e) => setTurmaId(e.target.value)}>
                {turmas.dados.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            {escolhida.programa.sensivel
              ? <Caixa titulo="Esta turma registra só o total de presentes.">Nas Vivências, o portal não guarda quem participou, só quantos.</Caixa>
              : <ListaTurma turma={escolhida} />}
          </>
        )}
      </div>
    </Moldura>
  )
}

function ListaTurma({ turma }) {
  const { dados, erro, carregando } = useCarregar(async () => {
    const desde = new Date(); desde.setDate(desde.getDate() - 30)
    const [criancas, presencas] = await Promise.all([api.criancasDaTurma(turma.id), api.presencaDaTurma(turma.id, desde.toISOString().slice(0, 10))])
    return criancas.map((c) => {
      const p = presencas.filter((x) => x.crianca_id === c.id)
      return { ...c, presentes: p.filter((x) => x.presente).length, possiveis: p.length }
    })
  }, [turma.id])
  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} />
  return (
    <div className="pilha">
      <p className="suave">{turma.turno}. {dados.length} crianças. Presença dos últimos 30 dias.</p>
      <div className="tabela-rolagem cartao" style={{ padding: '4px 12px' }}>
        <table className="tabela">
          <thead><tr><th>Criança</th><th>Idade</th><th>Código</th><th>Presença</th></tr></thead>
          <tbody>
            {dados.map((c) => {
              const baixa = c.possiveis >= 4 && c.presentes / c.possiveis < 0.6
              return (
                <tr key={c.id}>
                  <td><strong>{c.nome_exibicao}</strong></td>
                  <td>{idade(c.ano_nascimento)}</td>
                  <td className="suave">{c.codigo_parceiro}</td>
                  <td style={baixa ? { color: 'var(--alerta)', fontWeight: 700 } : undefined}>
                    {c.possiveis ? `${c.presentes} de ${c.possiveis}` : 'sem registro'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="fonte">Use o código na planilha de presença: é ele que liga a linha à criança certa.</p>
    </div>
  )
}
