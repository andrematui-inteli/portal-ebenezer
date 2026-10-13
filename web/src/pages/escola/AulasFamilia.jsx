import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, ExternalLink, MessageCircle } from 'lucide-react'
import { api } from '@api'
import { useCarregar } from '../../lib/useCarregar'
import { useSessao } from '../../lib/sessao'
import { Carregando, Erro, Vazio } from '../../components/comuns'
import { dataCurta } from '../../lib/formato'
import { Pagina, Filtros } from './comum'

const STATUS = {
  inscrita: ['Inscrita', ''], confirmada: ['Confirmada', ''], lista_espera: ['Lista de espera', 'etiqueta--alerta'], cancelada: ['Cancelada', 'etiqueta--neutra'],
}
const STATUS_CURSO = { rascunho: 'Rascunho', inscricoes_abertas: 'Inscrições abertas', em_andamento: 'Em andamento', encerrado: 'Encerrado' }

// Gestão das aulas em família: lista de inscritos, confirmação e lista de espera.
// Inscrição separada: nada aqui se liga ao cadastro das crianças nem ao acompanhamento.
export default function AulasFamilia() {
  const cursos = useCarregar(() => api.cursosFamiliaGestao())
  const [cursoId, setCursoId] = useState(null)
  const curso = cursos.dados?.find((c) => c.id === cursoId) || cursos.dados?.[0]
  return (
    <Pagina titulo="Aulas em família" largo intro="Inscrições dos cursos para adultos e adolescentes. Só a gestão vê esta lista.">
      {cursos.carregando && <Carregando />}
      {cursos.erro && <Erro mensagem={cursos.erro} tentarDeNovo={cursos.recarregar} />}
      {cursos.dados?.length === 0 && <Vazio titulo="Nenhum curso cadastrado." />}
      {curso && (
        <>
          <Filtros rotulo="Curso" valor={curso.id} mudar={setCursoId} opcoes={cursos.dados.map((c) => [c.id, c.titulo])} />
          <Curso key={curso.id} curso={curso} aoMudarCurso={cursos.recarregar} />
        </>
      )}
    </Pagina>
  )
}

function Curso({ curso, aoMudarCurso }) {
  const { perfil } = useSessao()
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.inscricoesFamilia(curso.id), [curso.id])
  const [filtro, setFiltro] = useState('ativas')
  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} tentarDeNovo={recarregar} />

  const ativas = dados.filter((i) => ['inscrita', 'confirmada'].includes(i.status))
  const espera = dados.filter((i) => i.status === 'lista_espera')
  const pessoas = ativas.reduce((s, i) => s + i.adultos + i.idades_jovens.length, 0)
  const novas = ativas.filter((i) => !i.ja_participa).length
  const lista = dados.filter((i) => (filtro === 'ativas' ? ['inscrita', 'confirmada'].includes(i.status) : filtro === 'espera' ? i.status === 'lista_espera' : i.status === 'cancelada'))
  const tratar = async (id, status) => { await api.tratarInscricao(id, status, perfil.id); recarregar() }

  const baixar = () => {
    const linhas = [['adulto', 'whatsapp', 'adultos', 'idades dos jovens', 'já participa', 'situação', 'inscrição'],
      ...dados.map((i) => [i.nome_adulto, i.contato, i.adultos, i.idades_jovens.join(' e '), i.ja_participa ? 'sim' : 'não', STATUS[i.status][0], dataCurta(i.criada_em)])]
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    Object.assign(document.createElement('a'), { href: url, download: `inscricoes-${curso.slug}.csv` }).click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="cartao" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <strong>{STATUS_CURSO[curso.status]}</strong>
          <p className="fonte">{curso.vagas_familias} vagas para famílias.{curso.inscricoes_ate && ` Inscrições até ${dataCurta(curso.inscricoes_ate)}.`}</p>
        </div>
        <Link className="botao botao--claro" to={`/aulas-em-familia/${curso.slug}`}><ExternalLink size={18} aria-hidden="true" />Ver página do curso</Link>
        {curso.status === 'rascunho' && <button className="botao" onClick={async () => { await api.mudarStatusCurso(curso.id, 'inscricoes_abertas'); aoMudarCurso() }}>Abrir inscrições</button>}
        {curso.status === 'inscricoes_abertas' && <button className="botao botao--claro" onClick={async () => { await api.mudarStatusCurso(curso.id, 'em_andamento'); aoMudarCurso() }}>Encerrar inscrições</button>}
      </div>

      <div className="grade-numeros">
        <div className="cartao numero"><span className="numero__valor">{ativas.length}<small style={{ fontSize: '1.2rem' }}> de {curso.vagas_familias}</small></span><span className="numero__rotulo">famílias com vaga</span></div>
        <div className="cartao numero"><span className="numero__valor">{espera.length}</span><span className="numero__rotulo">na lista de espera</span></div>
        <div className="cartao numero"><span className="numero__valor">{pessoas}</span><span className="numero__rotulo">pessoas esperadas</span><span className="suave">adultos e jovens somados</span></div>
        <div className="cartao numero"><span className="numero__valor">{novas}</span><span className="numero__rotulo">famílias novas</span><span className="suave">ainda não participavam do Instituto</span></div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <Filtros rotulo="Situação" valor={filtro} mudar={setFiltro} opcoes={[['ativas', `Com vaga (${ativas.length})`], ['espera', `Espera (${espera.length})`], ['canceladas', 'Canceladas']]} />
        <button className="botao botao--texto" onClick={baixar}><Download size={18} aria-hidden="true" />Baixar lista</button>
      </div>

      {lista.length === 0 ? <Vazio titulo="Ninguém nesta situação." /> : (
        <div className="tabela-rolagem cartao" style={{ padding: '4px 12px' }}>
          <table className="tabela">
            <thead><tr><th>Família</th><th>Jovens</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.map((i) => (
                <tr key={i.id}>
                  <td>
                    <strong>{i.nome_adulto}</strong>{i.adultos === 2 && <span className="suave"> + 1 adulto</span>}
                    <br /><a href={`https://wa.me/55${i.contato.replace(/\D/g, '').replace(/^55/, '')}`} target="_blank" rel="noreferrer"><MessageCircle size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {i.contato}</a>
                    <br /><span className="fonte">{i.ja_participa ? 'Já participa do Instituto' : 'Família nova'}. Inscrita em {dataCurta(i.criada_em)}.</span>
                  </td>
                  <td>{i.idades_jovens.map((x) => `${x} anos`).join(', ')}</td>
                  <td><span className={`etiqueta ${STATUS[i.status][1]}`}>{STATUS[i.status][0]}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {i.status === 'inscrita' && <button className="botao botao--texto" onClick={() => tratar(i.id, 'confirmada')}>Confirmar</button>}
                    {i.status === 'lista_espera' && <button className="botao botao--texto" onClick={() => tratar(i.id, 'inscrita')}>Dar vaga</button>}
                    {i.status !== 'cancelada' && <button className="botao botao--texto" style={{ color: 'var(--erro)' }} onClick={() => { if (confirm(`Cancelar a inscrição de ${i.nome_adulto}?`)) tratar(i.id, 'cancelada') }}>Cancelar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="fonte">Ao cancelar uma inscrição com vaga, a primeira família da lista de espera sobe sozinha. Confirme pelo WhatsApp antes de marcar como confirmada.</p>
    </>
  )
}
