import { Link } from 'react-router-dom'
import { useSessao, INICIO_POR_PAPEL } from '../../lib/sessao'

export function BotaoEntrar() {
  const { perfil } = useSessao()
  return perfil
    ? <Link className="botao botao--claro" to={INICIO_POR_PAPEL[perfil.papel]}>Minha área</Link>
    : <Link className="botao botao--claro" to="/entrar">Entrar</Link>
}
