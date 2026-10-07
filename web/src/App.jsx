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
import Escola from './pages/escola/Escola'
import Agenda from './pages/escola/Agenda'
import Tarefas from './pages/escola/Tarefas'
import Estudos from './pages/escola/Estudos'
import Biblioteca from './pages/escola/Biblioteca'
import Necessidades from './pages/escola/Necessidades'
import Ranking from './pages/escola/Ranking'
import Desempenho from './pages/escola/Desempenho'
import Feedback from './pages/escola/Feedback'

// Vida escolar: quem entra em cada seção (o banco aplica o mesmo filtro por linha).
const TODOS = ['estudante', 'responsavel', 'educacao', 'gestao', 'doador_pf', 'empresa']
const ADULTOS = TODOS.filter((p) => p !== 'estudante')
const ESCOLA = [
  ['/escola', Escola, TODOS], ['/escola/agenda', Agenda, TODOS], ['/escola/tarefas', Tarefas, TODOS],
  ['/escola/estudos', Estudos, TODOS], ['/escola/biblioteca', Biblioteca, TODOS], ['/escola/desempenho', Desempenho, TODOS],
  ['/escola/necessidades', Necessidades, ADULTOS], ['/escola/ranking', Ranking, ADULTOS], ['/escola/feedback', Feedback, ADULTOS],
]

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
        {ESCOLA.filter(([, , papeis]) => papeis.includes('estudante')).map(([p, Tela]) => <Route key={p} path={p} element={<Tela />} />)}
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

      {ESCOLA.map(([p, Tela, papeis]) => <Route key={p} path={p} element={<Exige papeis={papeis}><Tela /></Exige>} />)}
      <Route path="/apoio" element={<Navigate to="/escola" replace />} />
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
