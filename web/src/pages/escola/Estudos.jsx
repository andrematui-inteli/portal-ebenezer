import { useState } from 'react'
import { ExternalLink, Plus } from 'lucide-react'
import { api } from '@api'
import { useSessao } from '../../lib/sessao'
import { useCarregar } from '../../lib/useCarregar'
import { Carregando, Erro, Caixa } from '../../components/comuns'
import { Pagina, Filtros, Modal, ehEquipe } from './comum'

// Links de estudo: sites e cursos gratuitos, separados para alunos e para responsáveis.
export default function Estudos() {
  const { perfil } = useSessao()
  const crianca = perfil?.papel === 'estudante'
  const [para, setPara] = useState(crianca ? 'alunos' : perfil?.papel === 'responsavel' ? 'responsaveis' : 'todos')
  const [novo, setNovo] = useState(false)
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.materiais())
  const lista = (dados || []).filter((m) => para === 'todos' || m.para === para || m.para === 'todos')
  const areas = [...new Set(lista.map((m) => m.area))]
  return (
    <Pagina titulo="Links de estudo" largo
      intro={crianca ? 'Sites legais e gratuitos para aprender brincando.' : 'Sites e cursos gratuitos e confiáveis, escolhidos pela equipe. Para as crianças e para quem cuida delas.'}
      acao={ehEquipe(perfil) && <button className="botao" onClick={() => setNovo(true)}><Plus size={18} aria-hidden="true" />Novo link</button>}>
      {!crianca && <Filtros rotulo="Para quem" valor={para} mudar={setPara} opcoes={[['todos', 'Tudo'], ['alunos', 'Para as crianças'], ['responsaveis', 'Para responsáveis']]} />}
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {areas.map((area) => (
        <section key={area} className="pilha" aria-label={area}>
          <h2>{area}</h2>
          <div className="grade-links">
            {lista.filter((m) => m.area === area).map((m) => (
              <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="cartao cartao--link link-estudo">
                <span className="link-estudo__dominio">{new URL(m.url).hostname.replace(/^www\./, '')}</span>
                <strong>{m.titulo} <ExternalLink size={14} aria-hidden="true" /></strong>
                {m.descricao && <span className="suave">{m.descricao}</span>}
                {m.para === 'responsaveis' && <span className="etiqueta etiqueta--neutra" style={{ alignSelf: 'flex-start' }}>Para responsáveis</span>}
              </a>
            ))}
          </div>
        </section>
      ))}
      <p className="fonte">Todos os links abrem o site oficial em outra aba. Nenhum pede pagamento para o conteúdo indicado.</p>
      {novo && <FormLink fechar={() => setNovo(false)} salvo={() => { setNovo(false); recarregar() }} perfil={perfil} />}
    </Pagina>
  )
}

function FormLink({ fechar, salvo, perfil }) {
  const [f, setF] = useState({ titulo: '', url: '', descricao: '', area: 'Leitura', para: 'alunos' })
  const [erro, setErro] = useState(null)
  const enviar = async (e) => {
    e.preventDefault()
    try { await api.salvarMaterial({ ...f, criado_por: perfil.id }); salvo() } catch (x) { setErro(x.message) }
  }
  return (
    <Modal titulo="Novo link de estudo" fechar={fechar}>
      <form className="pilha" onSubmit={enviar}>
        <div className="campo"><label htmlFor="m-t">Nome</label><input id="m-t" required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
        <div className="campo"><label htmlFor="m-u">Endereço</label><input id="m-u" type="url" required placeholder="https://" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
        <div className="campo"><label htmlFor="m-d">Para que serve</label><input id="m-d" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
        <div className="campo"><label htmlFor="m-a">Assunto</label>
          <select id="m-a" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })}>
            {['Leitura', 'Matemática', 'Inglês', 'Todas as matérias', 'IA e tecnologia', 'Currículo e trabalho', 'Finanças da casa'].map((a) => <option key={a}>{a}</option>)}
          </select></div>
        <Filtros rotulo="Para quem" valor={f.para} mudar={(v) => setF({ ...f, para: v })} opcoes={[['alunos', 'Crianças'], ['responsaveis', 'Responsáveis'], ['todos', 'Todos']]} />
        {erro && <Caixa tipo="erro" titulo={erro} />}
        <button className="botao botao--largo">Salvar link</button>
      </form>
    </Modal>
  )
}
