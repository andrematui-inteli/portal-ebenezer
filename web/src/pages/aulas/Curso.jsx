import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Backpack, CalendarDays, Copy, Hourglass, MapPin, MessageCircle, PartyPopper } from 'lucide-react'
import { api } from '@api'
import { Caixa, Carregando, Erro } from '../../components/comuns'
import { useCarregar } from '../../lib/useCarregar'
import { useSessao } from '../../lib/sessao'
import { dataComDia, dataCurta, hora } from '../../lib/formato'
import { MolduraAulas, TEMA, Vagas, quando } from './comum'

export default function Curso() {
  const { slug } = useParams()
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [curso, minhas] = await Promise.all([api.cursoFamilia(slug), api.minhasInscricoesFamilia()])
    if (!curso) throw new Error('Este curso não foi encontrado ou ainda não foi divulgado.')
    return { curso, minha: minhas.find((m) => m.curso_id === curso.id) }
  }, [slug])

  return (
    <MolduraAulas>
      <Link to="/aulas-em-familia" className="botao botao--texto" style={{ alignSelf: 'flex-start' }}><ArrowLeft size={18} aria-hidden="true" />Todos os cursos</Link>
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} tentarDeNovo={recarregar} />}
      {dados && <Conteudo {...dados} aoInscrever={recarregar} />}
    </MolduraAulas>
  )
}

function Conteudo({ curso, minha, aoInscrever }) {
  const t = TEMA[curso.tema] || TEMA.outro
  const primeiro = curso.encontros[0]
  return (
    <>
      <section className="pilha">
        <span className="etiqueta" style={{ background: t.fundo, color: t.cor, alignSelf: 'flex-start' }}><t.Icone size={16} aria-hidden="true" />{t.rotulo}</span>
        <h1>{curso.titulo}</h1>
        <p style={{ fontSize: '1.15rem' }}>{curso.chamada}</p>
        <Vagas curso={curso} />
      </section>

      <div className="cartao pilha">
        <p><CalendarDays size={18} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> <strong>{quando(primeiro?.inicio, primeiro?.duracao_min)}</strong>, {curso.encontros.length} encontros a partir de {dataCurta(primeiro?.inicio)}.</p>
        <p><MapPin size={18} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> {curso.local}</p>
        {curso.o_que_levar && <p><Backpack size={18} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> {curso.o_que_levar}</p>}
        <p className="fonte">Para um ou dois adultos e até três jovens de {curso.idade_min} a {curso.idade_max} anos. Gratuito.{curso.inscricoes_ate && ` Inscrições até ${dataCurta(curso.inscricoes_ate)}.`}</p>
      </div>

      <p>{curso.descricao}</p>

      <section className="pilha" aria-labelledby="encontros">
        <h2 id="encontros">Os encontros</h2>
        <ol className="lista-simples cartao" style={{ padding: '0 16px' }}>
          {curso.encontros.map((e) => (
            <li key={e.id} style={{ display: 'flex', gap: 14 }}>
              <span style={{ flex: 'none', width: 36, height: 36, borderRadius: '50%', background: t.fundo, color: t.cor, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{e.numero}</span>
              <div>
                <strong>{e.titulo}</strong>
                <p>{e.resumo}</p>
                <p className="fonte">{dataComDia(e.inicio)}, {hora(e.inicio)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {minha
        ? <Caixa titulo={minha.status === 'lista_espera' ? 'Sua família está na lista de espera.' : 'Sua família já está inscrita.'}>O Instituto fala com você pelo WhatsApp. Para mudar algo, responda a mensagem de confirmação.</Caixa>
        : curso.status === 'inscricoes_abertas' && <Inscricao curso={curso} aoInscrever={aoInscrever} />}

      <Compartilhar curso={curso} />
    </>
  )
}

function Inscricao({ curso, aoInscrever }) {
  const { perfil } = useSessao()
  const [form, setForm] = useState({ nome: perfil?.nome || '', contato: '', adultos: 1, idades: [''], jaParticipa: perfil?.papel === 'responsavel', autoriza: false })
  const [estado, setEstado] = useState({ enviando: false, erro: null, resultado: null })
  const idadesOk = form.idades.every((i) => i !== '')
  const mudarIdade = (k, v) => setForm({ ...form, idades: form.idades.map((x, j) => (j === k ? v : x)) })
  const faixa = Array.from({ length: curso.idade_max - curso.idade_min + 1 }, (_, i) => curso.idade_min + i)

  const enviar = async (e) => {
    e.preventDefault(); setEstado({ enviando: true, erro: null, resultado: null })
    try {
      const r = await api.inscreverFamilia({ curso: curso.id, nome: form.nome.trim(), contato: form.contato.trim(),
        idades: form.idades.map(Number), adultos: form.adultos, jaParticipa: form.jaParticipa })
      setEstado({ enviando: false, erro: null, resultado: r })
    } catch (err) { setEstado({ enviando: false, erro: err.message, resultado: null }) }
  }

  if (estado.resultado) {
    const espera = estado.resultado.status === 'lista_espera'
    return (
      <section className="cartao pilha" aria-live="polite" style={{ background: espera ? 'var(--alerta-fundo)' : 'var(--verde-nevoa)', borderColor: 'transparent' }}>
        {espera ? <Hourglass size={32} color="var(--alerta)" aria-hidden="true" /> : <PartyPopper size={32} color="var(--verde-escuro)" aria-hidden="true" />}
        <h2>{espera ? `Vocês são a ${estado.resultado.posicao_espera}ª família na lista de espera` : 'Inscrição feita!'}</h2>
        <p>{espera
          ? 'Se uma família desistir, a vaga passa para a próxima da lista e o Instituto avisa pelo WhatsApp.'
          : `O Instituto vai confirmar pelo WhatsApp. O primeiro encontro é ${dataComDia(curso.encontros[0]?.inicio)}, às ${hora(curso.encontros[0]?.inicio)}.`}</p>
        <button className="botao botao--claro" onClick={aoInscrever}>Fechar</button>
      </section>
    )
  }

  return (
    <section className="pilha" aria-labelledby="inscricao">
      <h2 id="inscricao">{curso.vagas_restantes === 0 ? 'Entrar na lista de espera' : 'Inscrever minha família'}</h2>
      <form className="cartao pilha" onSubmit={enviar}>
        {estado.erro && <Erro mensagem={estado.erro} />}
        <div className="campo"><label htmlFor="nome">Seu nome</label>
          <input id="nome" required minLength={2} autoComplete="name" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
        <div className="campo"><label htmlFor="contato">Seu WhatsApp</label>
          <input id="contato" required inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} /></div>

        <fieldset className="pilha" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 700, marginBottom: 8 }}>Quantos adultos vêm?</legend>
          <div className="filtros" role="group">
            {[1, 2].map((n) => <button type="button" key={n} aria-pressed={form.adultos === n} onClick={() => setForm({ ...form, adultos: n })}>{n === 1 ? 'Um adulto' : 'Dois adultos'}</button>)}
          </div>
        </fieldset>

        <fieldset className="pilha" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 700, marginBottom: 8 }}>Idade de cada jovem que vem junto</legend>
          {form.idades.map((v, k) => (
            <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="campo" style={{ flex: 1 }}>
                <select aria-label={`Idade do ${k + 1}º jovem`} required value={v} onChange={(e) => mudarIdade(k, e.target.value)}>
                  <option value="">Escolha a idade</option>
                  {faixa.map((i) => <option key={i} value={i}>{i} anos</option>)}
                </select>
              </div>
              {k > 0 && <button type="button" className="botao botao--texto" onClick={() => setForm({ ...form, idades: form.idades.filter((_, j) => j !== k) })}>Tirar</button>}
            </div>
          ))}
          {form.idades.length < 3 && <button type="button" className="botao botao--texto" style={{ alignSelf: 'flex-start' }} onClick={() => setForm({ ...form, idades: [...form.idades, ''] })}>+ Outro jovem</button>}
          <small className="suave">Do jovem, pedimos só a idade. O nome você conta no primeiro encontro.</small>
        </fieldset>

        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <input type="checkbox" checked={form.jaParticipa} onChange={(e) => setForm({ ...form, jaParticipa: e.target.checked })} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} />
          <span>Minha família já participa de algum programa do Instituto</span>
        </label>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <input type="checkbox" required checked={form.autoriza} onChange={(e) => setForm({ ...form, autoriza: e.target.checked })} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} />
          <span>Sou responsável pelos jovens que vou levar e autorizo o Instituto a falar comigo pelo WhatsApp sobre este curso.</span>
        </label>
        <button className="botao botao--largo" disabled={estado.enviando || !idadesOk || !form.autoriza}>
          {estado.enviando ? 'Enviando…' : curso.vagas_restantes === 0 ? 'Entrar na lista de espera' : 'Fazer inscrição'}
        </button>
      </form>
    </section>
  )
}

// Divulgação: o link do curso vai para o WhatsApp com uma mensagem pronta.
function Compartilhar({ curso }) {
  const [copiado, setCopiado] = useState(false)
  const link = `${window.location.origin}/aulas-em-familia/${curso.slug}`
  const texto = `${curso.titulo}, no Instituto Ebenézer: ${curso.chamada} Gratuito, para um adulto e jovens de ${curso.idade_min} a ${curso.idade_max} anos. Inscrições: ${link}`
  const copiar = async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true) } catch { setCopiado(false) } }
  return (
    <section className="pilha" aria-labelledby="divulgar">
      <h2 id="divulgar">Chame outra família</h2>
      <a className="botao botao--largo" href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer">
        <MessageCircle size={20} aria-hidden="true" />Mandar no WhatsApp
      </a>
      <button className="botao botao--claro botao--largo" onClick={copiar}><Copy size={18} aria-hidden="true" />{copiado ? 'Mensagem copiada' : 'Copiar mensagem'}</button>
    </section>
  )
}
