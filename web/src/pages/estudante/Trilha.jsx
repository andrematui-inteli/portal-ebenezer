import { api } from '@api'
import { Espaco } from './Espaco'
import { ArvoreTrilha, nivelDaPosicao } from '../../components/Arvore'
import { Carregando, Erro, Vazio } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'

export default function Trilha() {
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const crianca = await api.minhaCrianca()
    if (!crianca) throw new Error('Seu acesso está pausado. Fale com o seu responsável.')
    return { crianca, leitura: (await api.avaliacoes(crianca.id)).filter((a) => a.disciplina === 'leitura') }
  })
  const nome = dados?.crianca.nome_exibicao.split(' ')[0]
  const ultima = dados?.leitura.at(-1)
  const nivel = ultima && nivelDaPosicao(Number(ultima.blocos_acumulados))
  const faltam = nivel && Math.max(1, Math.ceil(nivel.fim - Number(ultima.blocos_acumulados)))
  const proximo = nivel && { Desbravador: 'Mochileiro', Mochileiro: 'Navegador', Navegador: 'Mergulhador' }[nivel.nome]

  return (
    <Espaco tela="trilha">
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados && !ultima && (
        <>
          <h1>Oi, {nome}!</h1>
          <Vazio titulo="Sua árvore vai começar a crescer em breve.">Ela cresce quando a sua professora registra o que você aprendeu na leitura.</Vazio>
        </>
      )}
      {ultima && (
        <>
          <div>
            <h1>Oi, {nome}!</h1>
            <p>Você é <strong>{nivel.nome}</strong> na leitura.</p>
          </div>
          <ArvoreTrilha blocos={Number(ultima.blocos_acumulados)} />
          <p className="cartao" style={{ background: 'var(--trilha-suave)', borderColor: 'transparent' }}>
            {proximo
              ? <>Faltam <strong>{faltam} {faltam === 1 ? 'folha' : 'folhas'}</strong> para você virar <strong>{proximo}</strong>.</>
              : <>Você chegou ao galho mais alto. Continue lendo!</>}
          </p>
          <p className="fonte">Cada folha é um bloco de leitura que você completou.</p>
        </>
      )}
    </Espaco>
  )
}
