import { NavLink, Link } from 'react-router-dom'
import { MarcaArvore } from './Arvore'
import { useSessao, INICIO_POR_PAPEL } from '../lib/sessao'

// Topo + conteúdo + barra inferior (vira menu lateral no computador).
export function Moldura({ itens = [], children, largo = false, acaoTopo, classe = '', dados = {} }) {
  const { perfil } = useSessao()
  return (
    <div className={`app ${itens.length ? 'app--com-barra' : ''} ${classe}`} {...dados}>
      <header className="topo">
        <Link to={perfil ? INICIO_POR_PAPEL[perfil.papel] || '/' : '/'} className="marca" aria-label="Instituto Ebenézer, início">
          <MarcaArvore />
          <span>Instituto Ebenézer<small>Jardim Ângela</small></span>
        </Link>
        {acaoTopo}
      </header>
      <main className={`conteudo ${largo ? 'conteudo--largo' : ''}`}>{children}</main>
      {itens.length > 0 && (
        <nav className="barra" aria-label="Navegação principal">
          {itens.map(({ para, rotulo, Icone, fim, cor }) => (
            <NavLink key={para} to={para} end={fim} data-cor={cor} className={({ isActive }) => (isActive ? 'ativo' : '')}>
              <Icone size={24} aria-hidden="true" />
              {rotulo}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
