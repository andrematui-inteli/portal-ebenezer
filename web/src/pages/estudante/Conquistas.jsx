import { useEffect } from 'react'
import { api } from '@api'
import { Espaco } from './Espaco'
import { Carregando, Erro, Vazio } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { tituloConquista, ICONE_CONQUISTA } from '../../lib/conquistas'
import { dataCurta } from '../../lib/formato'

export default function Conquistas() {
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const crianca = await api.minhaCrianca()
    if (!crianca) throw new Error('Seu acesso está pausado. Fale com o seu responsável.')
    return { crianca, conquistas: await api.conquistas(crianca.id) }
  })
  // As novas ficam destacadas nesta visita e deixam de ser novas na próxima.
  useEffect(() => { if (dados?.conquistas.some((q) => !q.vista_em)) api.marcarConquistasVistas(dados.crianca.id) }, [dados])

  return (
    <Espaco tela="conquistas">
      <h1>Minhas conquistas</h1>
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados?.conquistas.length === 0 && <Vazio titulo="Suas conquistas vão aparecer aqui.">Você ganha uma quando completa um bloco de leitura, sobe de nível ou vai a um passeio cultural.</Vazio>}
      {dados?.conquistas.length > 0 && (
        <>
          <p>Você já tem <strong>{dados.conquistas.length}</strong>. Conquista nunca some: fica com você.</p>
          <div className="selo-grade">
            {dados.conquistas.map((q) => {
              const Icone = ICONE_CONQUISTA[q.tipo_conquista.icone]
              const nova = !q.vista_em
              return (
                <div key={q.id} className={`selo ${nova ? 'selo--nova' : ''}`}>
                  {nova && <span className="selo__nova">Nova!</span>}
                  <Icone aria-hidden="true" />
                  <strong>{tituloConquista(q)}</strong>
                  <small>{dataCurta(q.obtida_em)}</small>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Espaco>
  )
}
