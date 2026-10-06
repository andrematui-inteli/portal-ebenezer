import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Erro } from '../../components/comuns'
import { useSessao, INICIO_POR_PAPEL } from '../../lib/sessao'

export default function Entrar() {
  const { perfil, recarregar } = useSessao()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (perfil) return <Navigate to={INICIO_POR_PAPEL[perfil.papel]} replace />

  const enviar = async (e) => {
    e.preventDefault(); setErro(null); setEnviando(true)
    try {
      await api.entrar(email, senha)
      await recarregar()   // com o perfil carregado, o redirecionamento acima leva à área certa
    } catch (err) { setErro(err.message) } finally { setEnviando(false) }
  }

  return (
    <Moldura>
      <form className="pilha" onSubmit={enviar} style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1>Entrar</h1>
        <p>Use o e-mail e a senha que o Instituto enviou para você.</p>
        {erro && <Erro mensagem={erro} />}
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="username" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        <button className="botao botao--largo" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
        <p className="fonte">Ainda não tem acesso? <Link to="/pedir-acesso">Peça aqui</Link>. Esqueceu a senha? Fale com a coordenação do Instituto.</p>
        <p className="fonte"><Link to="/">Voltar para a página do Instituto</Link></p>
      </form>
    </Moldura>
  )
}
