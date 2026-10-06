import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileSpreadsheet, Download, Upload, Undo2, CircleCheck } from 'lucide-react'
import { api } from '@api'
import { Moldura } from '../../components/Moldura'
import { Caixa, Erro } from '../../components/comuns'
import { TIPOS_IMPORTACAO, lerPlanilha, baixarModelo } from '../../lib/planilha'
import { NAV_EQUIPE } from './comum'

// Importação em quatro passos: tipo, arquivo, prévia, resultado (RF-11).
// A prévia vem do próprio banco, que confere linha a linha sem gravar nada.
export default function Importar() {
  const [params] = useSearchParams()
  const [tipo, setTipo] = useState(params.get('tipo') || null)
  const [arquivo, setArquivo] = useState(null)
  const [linhas, setLinhas] = useState(null)
  const [previa, setPrevia] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [desfeito, setDesfeito] = useState(false)
  const passo = resultado ? 4 : previa ? 3 : tipo ? 2 : 1

  const recomecar = () => { setArquivo(null); setLinhas(null); setPrevia(null); setResultado(null); setErro(null) }

  const escolherArquivo = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    recomecar(); setOcupado(true)
    try {
      const l = await lerPlanilha(f, tipo)
      setArquivo(f); setLinhas(l)
      setPrevia(await api.importar(tipo, f.name, l, false))
    } catch (err) { setErro(err.message) } finally { setOcupado(false); e.target.value = '' }
  }
  const confirmar = async () => {
    setOcupado(true); setErro(null)
    try { setResultado(await api.importar(tipo, arquivo.name, linhas, true)) }
    catch (err) { setErro(err.message) } finally { setOcupado(false) }
  }
  const desfazer = async () => {
    setOcupado(true)
    try { await api.desfazerLote(resultado.lote); recomecar(); setDesfeito(true) }
    catch (err) { setErro(err.message) } finally { setOcupado(false) }
  }

  return (
    <Moldura itens={NAV_EQUIPE} largo>
      <div className="pilha-g" style={{ maxWidth: 680 }}>
        <div className="pilha">
          <h1>Importar planilha</h1>
          <div className="passos" aria-label={`Passo ${passo} de 4`}>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= passo ? 'feito' : ''} />)}</div>
        </div>
        {desfeito && <Caixa titulo="Importação desfeita. Nada daquele arquivo ficou no portal." />}

        <section className="pilha" aria-labelledby="p1">
          <h2 id="p1">1. O que você vai importar?</h2>
          {Object.entries(TIPOS_IMPORTACAO).map(([chave, t]) => (
            <button key={chave} className="opcao" aria-pressed={tipo === chave} disabled={Boolean(resultado)}
              onClick={() => { setTipo(chave); recomecar(); setDesfeito(false) }}>
              <FileSpreadsheet size={26} aria-hidden="true" />
              <span><strong>{t.titulo}</strong><br /><span className="suave">{t.descricao}</span></span>
            </button>
          ))}
        </section>

        {tipo && !resultado && (
          <section className="pilha" aria-labelledby="p2">
            <h2 id="p2">2. Escolha o arquivo</h2>
            <p className="suave">Colunas esperadas: {TIPOS_IMPORTACAO[tipo].colunas.join(', ')}.{' '}
              <button className="botao botao--texto" onClick={() => baixarModelo(tipo)}><Download size={16} aria-hidden="true" />Baixar modelo</button>
            </p>
            <label className="soltar">
              <Upload size={30} aria-hidden="true" />
              <strong>{arquivo ? arquivo.name : 'Toque para escolher a planilha'}</strong>
              <span className="fonte">Excel (.xlsx) ou .csv</span>
              <input type="file" accept=".xlsx,.csv" onChange={escolherArquivo} disabled={ocupado} />
            </label>
            {ocupado && !previa && <p className="suave" role="status">Conferindo a planilha…</p>}
          </section>
        )}

        {erro && <Erro mensagem={erro} />}

        {previa && !resultado && (
          <section className="pilha" aria-labelledby="p3">
            <h2 id="p3">3. Confira antes de gravar</h2>
            <div className="contagens">
              <div><strong>{previa.criadas}</strong>novos</div>
              <div><strong>{previa.alteradas}</strong>alterados</div>
              <div><strong>{previa.ignoradas}</strong>iguais, sem mudança</div>
            </div>
            {previa.erros.length > 0 ? (
              <>
                <Caixa tipo="erro" titulo={`${previa.erros.length === 1 ? 'Uma linha precisa' : `${previa.erros.length} linhas precisam`} de correção.`}>
                  Nada foi gravado. Corrija a planilha e escolha o arquivo de novo.
                </Caixa>
                <div className="tabela-rolagem cartao" style={{ padding: '4px 12px' }}>
                  <table className="tabela">
                    <thead><tr><th>Linha</th><th>O que corrigir</th></tr></thead>
                    <tbody>{previa.erros.slice(0, 50).map((e, i) => <tr key={i}><td>{e.linha + 1}</td><td>{e.mensagem}</td></tr>)}</tbody>
                  </table>
                </div>
                <p className="fonte">A linha 1 é o cabeçalho, então a contagem começa na linha 2.</p>
              </>
            ) : (
              <button className="botao botao--largo" onClick={confirmar} disabled={ocupado}>
                {ocupado ? 'Gravando…' : `Gravar ${previa.criadas + previa.alteradas} registros`}
              </button>
            )}
          </section>
        )}

        {resultado && (
          <section className="pilha" aria-labelledby="p4">
            <h2 id="p4">4. Pronto</h2>
            <Caixa titulo={`Importação gravada: ${resultado.criadas} novos e ${resultado.alteradas} alterados.`}>
              Os responsáveis já veem a presença atualizada.
            </Caixa>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="botao botao--claro" onClick={desfazer} disabled={ocupado}><Undo2 size={18} aria-hidden="true" />Desfazer esta importação</button>
              <button className="botao" onClick={() => { recomecar(); setTipo(null) }}><CircleCheck size={18} aria-hidden="true" />Importar outro arquivo</button>
            </div>
            <Link to="/equipe" className="botao botao--texto">Voltar para as pendências</Link>
          </section>
        )}
      </div>
    </Moldura>
  )
}
