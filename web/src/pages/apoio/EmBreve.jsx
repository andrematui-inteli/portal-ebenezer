import { LogOut } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Caixa } from '../../components/comuns'
import { useSessao } from '../../lib/sessao'

// Área de apoiadores e gestão: entra na próxima etapa do MVP.
export default function EmBreve() {
  const { perfil } = useSessao()
  return (
    <Moldura acaoTopo={<button className="botao botao--texto" onClick={() => api.sair()}><LogOut size={18} aria-hidden="true" />Sair</button>}>
      <div className="pilha">
        <h1>Olá, {perfil?.nome.split(' ')[0]}</h1>
        <Caixa titulo="Seu painel está sendo preparado.">Enquanto isso, veja na página do Instituto os números do ano e as carências em aberto.</Caixa>
        <a className="botao" href="/">Ir para a página do Instituto</a>
      </div>
    </Moldura>
  )
}
