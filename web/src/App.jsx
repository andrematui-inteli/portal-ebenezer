import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProvedorSessao, useSessao, INICIO_POR_PAPEL } from './lib/sessao'
import { Carregando } from './components/comuns'
import Inicio from './pages/publico/Inicio'
import Carencias from './pages/publico/Carencias'
import Apoiar from './pages/publico/Apoiar'
import Entrar from './pages/publico/Entrar'
import PedirAcesso from './pages/publico/PedirAcesso'
import InicioFamilia from './pages/familia/Inicio'
import Crianca from './pages/familia/Crianca'
import Autorizar from './pages/familia/Autorizar'
import Avisos from './pages/familia/Avisos'
import Conta from './pages/familia/Conta'
import Trilha from './pages/estudante/Trilha'
import ConquistasEstudante from './pages/estudante/Conquistas'
import TurmaEstudante from './pages/estudante/Turma'
import Pendencias from './pages/equipe/Pendencias'
import Importar from './pages/equipe/Importar'
import Turmas from './pages/equipe/Turmas'
import EmBreve from './pages/apoio/EmBreve'

// A navegação também respeita o perfil, mas quem garante o isolamento é o banco.
function Exige({ papeis, children }) {
  const { perfil, carregando } = useSessao()
  if (carregando) return <Carregando />
  if (!perfil) return <Navigate to="/entrar" replace />
  if (!papeis.includes(perfil.papel)) return <Navigate to={INICIO_POR_PAPEL[perfil.papel] || '/'} replace />
  return children
}

// O estudante fica sempre no próprio espaço: qualquer outra rota volta para a trilha.
function Rotas() {
  const { perfil, carregando } = useSessao()
  if (carregando) return <Carregando />
  if (perfil?.papel === 'estudante') {
    return (
      <Routes>
        <Route path="/estudante" element={<Trilha />} />
        <Route path="/estudante/conquistas" element={<ConquistasEstudante />} />
        <Route path="/estudante/turma" element={<TurmaEstudante />} />
        <Route path="*" element={<Navigate to="/estudante" replace />} />
      </Routes>
    )
  }
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/carencias" element={<Carencias />} />
      <Route path="/apoiar" element={<Apoiar />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/pedir-acesso" element={<PedirAcesso />} />

      <Route path="/familia" element={<Exige papeis={['responsavel']}><InicioFamilia /></Exige>} />
      <Route path="/familia/crianca/:id" element={<Exige papeis={['responsavel']}><Crianca /></Exige>} />
      <Route path="/familia/autorizar" element={<Exige papeis={['responsavel']}><Autorizar /></Exige>} />
      <Route path="/familia/avisos" element={<Exige papeis={['responsavel']}><Avisos /></Exige>} />
      <Route path="/familia/conta" element={<Exige papeis={['responsavel']}><Conta /></Exige>} />

      <Route path="/equipe" element={<Exige papeis={['educacao', 'gestao']}><Pendencias /></Exige>} />
      <Route path="/equipe/importar" element={<Exige papeis={['educacao', 'gestao']}><Importar /></Exige>} />
      <Route path="/equipe/turmas" element={<Exige papeis={['educacao', 'gestao']}><Turmas /></Exige>} />

      <Route path="/apoio" element={<Exige papeis={['doador_pf', 'empresa']}><EmBreve /></Exige>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ProvedorSessao>
      <BrowserRouter><Rotas /></BrowserRouter>
    </ProvedorSessao>
  )
}
