// Aulas em família no modo de exemplo (npm run dev:mock). Mesmo formato do banco.
export function apiFamilia(personaAtual, espera) {
  const dia = (n, h) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d.toISOString() }
  const ate = (dias) => dia(dias, 12).slice(0, 10)
  const CURSOS = [
    { id: 'cf-ia', slug: 'ia-em-familia', titulo: 'IA em família', tema: 'ia', idade_min: 12, idade_max: 17, vagas_familias: 15, status: 'inscricoes_abertas',
      chamada: 'Quatro sábados para pais e filhos adolescentes entenderem, testarem e combinarem juntos como usar inteligência artificial.',
      descricao: 'A inteligência artificial já está no celular de todo mundo: no buscador, no WhatsApp, nos vídeos que aparecem para o seu filho. Neste curso, um adulto e um jovem de 12 a 17 anos aprendem juntos o que ela faz bem, onde ela erra e como usar sem cair em golpe. Ninguém precisa saber nada de tecnologia: a gente aprende fazendo, em duplas e trios.',
      local: 'Instituto Ebenézer, Jardim Ângela', o_que_levar: 'Celular com internet, se tiver. Quem não tiver faz em dupla com outra família.', inscricoes_ate: ate(15) },
    { id: 'cf-fin', slug: 'dinheiro-em-familia', titulo: 'Dinheiro em família', tema: 'financas', idade_min: 12, idade_max: 17, vagas_familias: 12, status: 'inscricoes_abertas',
      chamada: 'Quatro noites para conversar sobre dinheiro sem vergonha: orçamento, consumo, golpes e um sonho com prazo.',
      descricao: 'Falar de dinheiro em casa nem sempre é fácil, e o jovem já está exposto a propaganda, compras pelo celular e apostas online. Neste curso, um adulto e um jovem de 12 a 17 anos montam juntos o orçamento da casa do jeito que ela é, aprendem a se proteger de golpes e terminam com um plano de poupança da família. Sem planilha complicada e sem julgamento.',
      local: 'Instituto Ebenézer, Jardim Ângela', o_que_levar: 'Caderno e caneta. Não é preciso levar extrato nem nenhum dado do banco.', inscricoes_ate: ate(13) },
  ]
  const ENCONTROS = {
    'cf-ia': [['O que é e o que não é inteligência artificial', 'Onde a IA já aparece no nosso dia e a primeira conversa com um assistente, feita em família.'],
      ['Perguntar bem', 'Como pedir ajuda à IA para estudar, planejar a semana e resolver problemas da casa juntos.'],
      ['Verdade ou invenção?', 'Vídeos falsos, golpes e notícias inventadas: como checar em família antes de acreditar ou repassar.'],
      ['Os combinados da nossa família', 'Privacidade, tempo de tela e um pequeno projeto feito pela dupla para apresentar às outras famílias.']]
      .map(([titulo, resumo], i) => ({ id: 'e-ia-' + i, numero: i + 1, titulo, resumo, inicio: dia(18 + 7 * i, 9), duracao_min: 120 })),
    'cf-fin': [['Para onde vai o dinheiro da casa?', 'O orçamento da família com papel e caneta: o que entra, o que sai e o que dá para mudar.'],
      ['Querer e precisar', 'Propaganda, influenciadores e a pressão para comprar: como decidir juntos.'],
      ['Pix, golpes e apostas', 'Como os golpes mais comuns funcionam e por que as apostas online são um risco para o jovem e para a casa.'],
      ['Um sonho com prazo', 'Plano de poupança da família e o primeiro dinheiro do jovem: quanto, até quando e como acompanhar.']]
      .map(([titulo, resumo], i) => ({ id: 'e-fin-' + i, numero: i + 1, titulo, resumo, inicio: dia(15 + 7 * i, 19), duracao_min: 120 })),
  }
  const nomes = ['Jéssica A.', 'Patrícia B.', 'Fernanda C.', 'Aline D.', 'Daiane F.', 'Simone G.', 'Rosângela L.', 'Cláudia M.', 'Tatiane N.', 'Viviane P.', 'Carlos R.', 'Edson S.', 'Rogério T.', 'Anderson A.', 'Wellington B.']
  const INSCRICOES = [
    ...nomes.slice(0, 11).map((n, i) => ({ id: 'i-ia-' + i, curso_id: 'cf-ia', nome_adulto: n, contato: `11 98${String(1000000 + i * 977).slice(0, 7)}`, idades_jovens: [12 + (i % 6)], adultos: 1, ja_participa: i % 3 !== 0, status: i < 6 ? 'confirmada' : 'inscrita', criada_em: dia(-i - 1, 10) })),
    ...nomes.map((n, i) => ({ id: 'i-fin-' + i, curso_id: 'cf-fin', nome_adulto: n, contato: `11 97${String(2000000 + i * 1213).slice(0, 7)}`, idades_jovens: i % 4 === 3 ? [13, 16] : [12 + (i % 6)], adultos: i % 5 === 4 ? 2 : 1, ja_participa: i % 2 === 1, status: i < 12 ? 'inscrita' : 'lista_espera', criada_em: dia(-20 + i, 10) })),
  ]
  const vagas = (c) => Math.max(0, c.vagas_familias - INSCRICOES.filter((i) => i.curso_id === c.id && ['inscrita', 'confirmada'].includes(i.status)).length)
  const publico = (c) => ({ ...c, vagas_restantes: vagas(c), primeiro_encontro: ENCONTROS[c.id][0].inicio, encontros: ENCONTROS[c.id].length })

  return {
    async cursosFamilia() { return espera(CURSOS.filter((c) => c.status !== 'rascunho').map(publico)) },
    async cursoFamilia(slug) { const c = CURSOS.find((x) => x.slug === slug); return espera(c ? { ...publico(c), encontros: ENCONTROS[c.id] } : null) },
    async inscreverFamilia({ curso, nome, contato, idades, adultos, jaParticipa }) {
      const c = CURSOS.find((x) => x.id === curso)
      if (idades.some((i) => i < c.idade_min || i > c.idade_max)) throw new Error(`Este curso é para jovens de ${c.idade_min} a ${c.idade_max} anos.`)
      if (INSCRICOES.some((i) => i.curso_id === curso && i.contato.replace(/\D/g, '') === contato.replace(/\D/g, ''))) throw new Error('Já existe uma inscrição com este contato. Se quiser mudar algo, fale com o Instituto.')
      const status = vagas(c) > 0 ? 'inscrita' : 'lista_espera'
      INSCRICOES.push({ id: 'i-novo-' + INSCRICOES.length, curso_id: curso, nome_adulto: nome, contato, idades_jovens: idades, adultos, ja_participa: jaParticipa, status, criada_em: new Date().toISOString(), perfil_id: personaAtual()?.id })
      return espera({ status, posicao_espera: status === 'lista_espera' ? INSCRICOES.filter((i) => i.curso_id === curso && i.status === 'lista_espera').length : null })
    },
    async minhasInscricoesFamilia() { const p = personaAtual(); return espera(p ? INSCRICOES.filter((i) => i.perfil_id === p.id && i.status !== 'cancelada') : []) },
    async cursosFamiliaGestao() { return espera(CURSOS) },
    async inscricoesFamilia(cursoId) { return espera(INSCRICOES.filter((i) => i.curso_id === cursoId)) },
    async tratarInscricao(id, status) {
      const i = INSCRICOES.find((x) => x.id === id); const antes = i.status; i.status = status
      if (status === 'cancelada' && ['inscrita', 'confirmada'].includes(antes)) {
        const prox = INSCRICOES.find((x) => x.curso_id === i.curso_id && x.status === 'lista_espera'); if (prox) prox.status = 'inscrita'
      }
    },
    async mudarStatusCurso(id, status) { CURSOS.find((c) => c.id === id).status = status },
  }
}
