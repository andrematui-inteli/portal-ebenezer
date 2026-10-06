import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, TriangleAlert, CircleDashed, Undo2, LogOut } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Caixa, Carregando, Erro } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { useSessao } from '../../lib/sessao'
import { dataCurta, haQuanto } from '../../lib/formato'
import { NAV_EQUIPE } from './comum'

const ESTADO = {
  atualizado: { rotulo: 'Em dia', classe: '', Icone: CircleCheck },
  desatualizado: { rotulo: 'Atrasado', classe: 'etiqueta--alerta', Icone: TriangleAlert },
  vazio: { rotulo: 'Sem dados', classe: 'etiqueta--neutra', Icone: CircleDashed },
}

export default function Pendencias() {
  const { perfil } = useSessao()
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [painel, alertas, lotes] = await Promise.all([api.painelAtualizacao(), api.alertasPresenca(), api.lotesRecentes()])
    return { painel, alertas, lotes }
  })
  const atrasados = dados?.painel.filter((p) => p.estado !== 'atualizado') || []

  return (
    <Moldura itens={NAV_EQUIPE} largo acaoTopo={<button className="botao botao--texto" onClick={() => api.sair()}><LogOut size={18} aria-hidden="true" />Sair</button>}>
      <div className="pilha-g">
        <div className="pilha">
          <h1>Olá, {perfil?.nome.split(' ')[0]}</h1>
          {dados && <p>{atrasados.length === 0 ? 'Todos os programas estão em dia.' : `${atrasados.length === 1 ? 'Um programa precisa' : `${atrasados.length} programas precisam`} de atualização.`}</p>}
        </div>
        {carregando && <Carregando />}
        {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
        {dados && (
          <>
            <section className="pilha" aria-labelledby="prog">
              <h2 id="prog">Presença por programa</h2>
              <div className="grade-numeros">
                {dados.painel.map((p) => {
                  const e = ESTADO[p.estado]
                  return (
                    <div key={p.codigo} className="cartao pilha">
                      <span className={`etiqueta ${e.classe}`}><e.Icone size={16} aria-hidden="true" />{e.rotulo}</span>
                      <h3>{p.nome}</h3>
                      <p className="fonte">
                        {p.ultima_presenca ? `Último registro: ${dataCurta(p.ultima_presenca)} (${haQuanto(p.ultima_presenca)}).` : 'Nenhuma presença registrada ainda.'}
                        {' '}{p.cadencia === 'diaria' ? 'Atualizar toda semana.' : 'Atualizar a cada 2 semanas.'}
                      </p>
                      {p.estado !== 'atualizado' && (
                        <Link className="botao" to={`/equipe/importar?tipo=${p.codigo === 'vivencias' ? 'presenca_agregada' : 'presenca'}`}>Importar presença</Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="pilha" aria-labelledby="alertas">
              <h2 id="alertas">Crianças faltando mais</h2>
              {dados.alertas.length === 0
                ? <Caixa titulo="Nenhuma queda de presença nas últimas semanas." />
                : (
                  <>
                    <p className="suave">A presença caiu bastante nas últimas semanas. Vale um contato com a família.</p>
                    <div className="tabela-rolagem cartao" style={{ padding: '4px 12px' }}>
                      <table className="tabela">
                        <thead><tr><th>Criança</th><th>Turma</th><th>Antes</th><th>Últimas semanas</th></tr></thead>
                        <tbody>
                          {dados.alertas.map((a) => (
                            <tr key={a.crianca_id + a.turma}>
                              <td><strong>{a.nome_exibicao}</strong></td><td>{a.turma}</td>
                              <td>{a.presenca_anterior}%</td><td style={{ color: 'var(--alerta)', fontWeight: 700 }}>{a.presenca_recente}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
            </section>

            <section className="pilha" aria-labelledby="lotes">
              <h2 id="lotes">Últimas importações</h2>
              <ul className="lista-simples cartao" style={{ padding: '0 16px' }}>
                {dados.lotes.map((l) => <Lote key={l.id} l={l} aoDesfazer={recarregar} />)}
              </ul>
            </section>
          </>
        )}
      </div>
    </Moldura>
  )
}

function Lote({ l, aoDesfazer }) {
  const [confirmando, setConfirmando] = useState(false)
  const [falha, setFalha] = useState(null)
  const desfazer = async () => { try { await api.desfazerLote(l.id); aoDesfazer() } catch (e) { setFalha(e.message) } }
  return (
    <li className="pilha">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <strong>{l.arquivo_nome}</strong>
          <p className="fonte">{haQuanto(l.importado_em)}. {l.criadas} novos, {l.alteradas} alterados.{l.desfeito_em ? ' Desfeita.' : ''}</p>
        </div>
        {!l.desfeito_em && !confirmando && <button className="botao botao--texto" onClick={() => setConfirmando(true)}><Undo2 size={18} aria-hidden="true" />Desfazer</button>}
      </div>
      {confirmando && (
        <Caixa tipo="alerta" titulo="Desfazer esta importação?"
          acao={<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="botao botao--perigo" onClick={desfazer}>Sim, desfazer</button>
            <button className="botao botao--claro" onClick={() => setConfirmando(false)}>Manter</button>
          </div>}>
          Os registros criados por ela somem e os alterados voltam ao valor anterior.
        </Caixa>
      )}
      {falha && <Erro mensagem={falha} />}
    </li>
  )
}
