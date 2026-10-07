import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked, Search } from 'lucide-react'
import { api } from '@api'
import { useSessao } from '../../lib/sessao'
import { useCarregar } from '../../lib/useCarregar'
import { Carregando, Erro, Vazio, Caixa } from '../../components/comuns'
import { dataCurta } from '../../lib/formato'
import { Pagina, Filtros, ehEquipe } from './comum'

const CORES = ['#256B29', '#1F5FA8', '#8C6100', '#7A3E9D', '#B4570B', '#0B6E74']

export default function Biblioteca() {
  const { perfil } = useSessao()
  const equipe = ehEquipe(perfil)
  const [busca, setBusca] = useState('')
  const [faixa, setFaixa] = useState('todas')
  const [msg, setMsg] = useState(null)
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [livros, reservas] = await Promise.all([api.livros(), api.minhasReservas()])
    return { livros, reservas }
  })
  const termo = busca.trim().toLowerCase()
  const livros = (dados?.livros || []).filter((l) => (faixa === 'todas' || l.faixa === faixa)
    && (!termo || `${l.titulo} ${l.autor} ${l.tema}`.toLowerCase().includes(termo)))

  const reservar = async (l) => {
    setMsg(null)
    try { await api.reservarLivro(l.id); setMsg({ tipo: 'info', texto: `"${l.titulo}" reservado! Retire na secretaria em até 3 dias. Você tem 14 dias para ler.` }); recarregar() }
    catch (e) { setMsg({ tipo: 'erro', texto: e.message }) }
  }
  const mudarReserva = async (r, status) => { status === 'cancelado' ? await api.cancelarReserva(r.id) : await api.atualizarReserva(r.id, status); recarregar() }

  return (
    <Pagina titulo="Biblioteca" largo intro="Escolha um livro, reserve aqui e retire no Instituto. Cada pessoa pode ter até 2 livros ao mesmo tempo.">
      {msg && <Caixa tipo={msg.tipo} titulo={msg.texto} />}
      {dados?.reservas.length > 0 && (
        <section className="pilha" aria-labelledby="minhas">
          <h2 id="minhas">{equipe ? 'Reservas em aberto' : 'Meus livros'}</h2>
          <ul className="lista-simples cartao">
            {dados.reservas.map((r) => (
              <li key={r.id} className="reserva">
                <BookMarked size={22} aria-hidden="true" />
                <div style={{ flex: 1 }}>
                  <strong>{r.livro?.titulo}</strong>
                  <p className="fonte">{r.status === 'retirado' ? `Com você. Devolver até ${dataCurta(r.devolver_ate)}.` : 'Reservado. Retire na secretaria.'}</p>
                </div>
                {equipe ? (
                  r.status === 'reservado'
                    ? <button className="botao botao--claro" onClick={() => mudarReserva(r, 'retirado')}>Entregue</button>
                    : <button className="botao botao--claro" onClick={() => mudarReserva(r, 'devolvido')}>Devolvido</button>
                ) : r.status === 'reservado' && <button className="botao botao--texto" onClick={() => mudarReserva(r, 'cancelado')}>Cancelar</button>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="pilha" aria-labelledby="acervo">
        <h2 id="acervo">Livros</h2>
        <div className="campo busca">
          <label htmlFor="busca" className="so-leitor">Buscar livro</label>
          <Search size={18} aria-hidden="true" />
          <input id="busca" type="search" placeholder="Buscar por título, autor ou tema" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Filtros rotulo="Idade" valor={faixa} mudar={setFaixa} opcoes={[['todas', 'Todos'], ['6 a 8 anos', '6 a 8 anos'], ['9 a 11 anos', '9 a 11 anos'], ['adultos', 'Para adultos']]} />
        {carregando && <Carregando />}
        {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
        {dados && livros.length === 0 && <Vazio titulo="Nenhum livro encontrado.">Tente outra palavra.</Vazio>}
        <div className="grade-livros">
          {livros.map((l, i) => (
            <article key={l.id} className="livro">
              <div className="livro__capa" style={{ background: CORES[i % CORES.length] }} aria-hidden="true"><span>{l.titulo}</span></div>
              <strong>{l.titulo}</strong>
              <span className="fonte">{l.autor} · {l.faixa}</span>
              <span className={`etiqueta ${l.disponiveis > 0 ? '' : 'etiqueta--neutra'}`}>
                {l.disponiveis > 0 ? `${l.disponiveis} de ${l.exemplares} disponível${l.disponiveis > 1 ? 'is' : ''}` : 'Todos emprestados'}
              </span>
              <button className="botao botao--claro" disabled={l.disponiveis <= 0} onClick={() => reservar(l)}>Reservar</button>
            </article>
          ))}
        </div>
      </section>

      <Caixa titulo="Materiais virtuais">
        Livros digitais gratuitos, aplicativos de leitura e cursos para famílias estão em <Link to="/escola/estudos">Links de estudo</Link>.
      </Caixa>
    </Pagina>
  )
}
