import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, Users, EyeOff, ShieldCheck } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Carregando, Erro, Pontos } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'

// Autorização em três passos curtos (LGPD, Art. 14). Nada de bloco de texto jurídico.
export default function Autorizar() {
  const navegar = useNavigate()
  const { dados, erro, carregando } = useCarregar(async () =>
    (await api.meusVinculos()).filter((v) => !v.consentimento_em && !v.consentimento_revogado_em))
  const [passo, setPasso] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [falha, setFalha] = useState(null)

  if (carregando) return <Moldura><Carregando /></Moldura>
  if (erro) return <Moldura><Erro mensagem={erro} /></Moldura>
  if (!dados.length) return <Navigate to="/familia" replace />

  const nomes = dados.map((v) => v.crianca.nome_exibicao.split(' ')[0])
  const quem = nomes.join(' e ')
  const decidir = async (autorizar) => {
    setSalvando(true); setFalha(null)
    try {
      for (const v of dados) autorizar ? await api.consentir(v.crianca_id) : await api.pausarExibicao(v.crianca_id)
      navegar('/familia', { replace: true })
    } catch (e) { setFalha(e.message); setSalvando(false) }
  }

  const passos = [
    {
      Icone: Eye, titulo: `O que você vai ver sobre ${quem}`,
      corpo: (
        <>
          <p>Se a criança foi às atividades, como está na leitura e as conquistas dela. Assim:</p>
          <div className="cartao pilha" aria-label="Exemplo de como aparece">
            <p><strong>Reforço Escolar:</strong> foi em 18 de 20 dias em setembro.</p>
            <Pontos dias={Array.from({ length: 20 }, (_, i) => ({ presente: ![4, 13].includes(i) }))} />
            <p>Na leitura, está no nível do <strong>3º ano</strong>.</p>
          </div>
        </>
      ),
    },
    {
      Icone: Users, titulo: 'Quem mais vê',
      corpo: (
        <ul className="lista-simples">
          <li><strong>Só você</strong> vê os dados de {quem} com o nome.</li>
          <li>A <strong>equipe de educação</strong> vê a turma para acompanhar as atividades.</li>
          <li><strong>Apoiadores e visitantes</strong> veem só números somados de todas as crianças. Nunca o nome.</li>
          <li><strong>Nenhuma foto</strong> de criança aparece no portal.</li>
        </ul>
      ),
    },
    {
      Icone: EyeOff, titulo: 'Você decide',
      corpo: <p>Você pode pausar a exibição quando quiser, em Minha conta. Enquanto estiver pausado, nada sobre a criança aparece aqui. Se não autorizar agora, pode autorizar depois.</p>,
    },
  ]
  const atual = passos[passo]

  return (
    <Moldura>
      <div className="pilha" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="passos" aria-label={`Passo ${passo + 1} de 3`}>{passos.map((_, i) => <i key={i} className={i <= passo ? 'feito' : ''} />)}</div>
        <atual.Icone size={36} color="var(--verde-escuro)" aria-hidden="true" />
        <h1>{atual.titulo}</h1>
        {atual.corpo}
        {falha && <Erro mensagem={falha} />}
        {passo < 2 ? (
          <button className="botao botao--largo" onClick={() => setPasso(passo + 1)}>Continuar</button>
        ) : (
          <>
            <button className="botao botao--largo" disabled={salvando} onClick={() => decidir(true)}>
              <ShieldCheck size={20} aria-hidden="true" />Autorizar
            </button>
            <button className="botao botao--claro botao--largo" disabled={salvando} onClick={() => decidir(false)}>Agora não</button>
          </>
        )}
        {passo > 0 && <button className="botao botao--texto" onClick={() => setPasso(passo - 1)}>Voltar</button>}
      </div>
    </Moldura>
  )
}
