// Dados de exemplo da vida escolar (agenda, tarefas, biblioteca, notas…) para o modo mock.
// Imita as mesmas regras de visibilidade da migração 6, para revisar cada perfil.

const ts = (dias, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(h, m, 0, 0); return d.toISOString() }
const dia = (dias) => ts(dias, 12).slice(0, 10)
// n-ésimo dia útil a partir de amanhã, em dias corridos (aula e prova nunca caem no fim de semana).
const util = (n) => { let dias = 0; for (let k = 0; k < n;) { dias++; const d = new Date(); d.setDate(d.getDate() + dias); if (d.getDay() % 6) k++ } return dias }
const sabado = (n) => { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7) + 7 * n); return Math.round((d - new Date()) / 86400000) }
let seq = 100
const novoId = (p) => `${p}-${++seq}`

const TURMAS = [
  { id: 't-ref-m', nome: 'Reforço Manhã', programa: { nome: 'Reforço Escolar', sensivel: false } },
  { id: 't-ref-t', nome: 'Reforço Tarde', programa: { nome: 'Reforço Escolar', sensivel: false } },
  { id: 't-son-a', nome: 'Sonhos A', programa: { nome: 'Laboratório de Sonhos', sensivel: false } },
  { id: 't-son-b', nome: 'Sonhos B', programa: { nome: 'Laboratório de Sonhos', sensivel: false } },
  { id: 't-inf', nome: 'Primeira Infância', programa: { nome: 'Primeira Infância', sensivel: false } },
]
const nomeTurma = (id) => TURMAS.find((t) => t.id === id)?.nome
// Turmas ligadas a cada perfil (filhos, aluno ou educador).
const TURMAS_DO_PERFIL = {
  'p-adriana': ['t-ref-m', 't-son-a', 't-inf'], 'p-kaua': ['t-ref-m', 't-son-a'],
  'p-beatriz': ['t-ref-m', 't-ref-t', 't-son-a', 't-son-b', 't-inf'],
}
const EQUIPE = [{ id: 'p-beatriz', nome: 'Beatriz (coordenação)', papel: 'educacao' }, { id: 'p-gestao', nome: 'Elias (gestão)', papel: 'gestao' }]
const FAMILIA = ['estudante', 'responsavel', 'educacao', 'gestao']

const EVENTOS = [
  { tipo: 'prova', titulo: 'Prova de matemática', descricao: 'Frações e problemas com as quatro operações.', inicio: ts(util(3), 9), fim: ts(util(3), 10, 30), local: 'Sala 2', turma_id: 't-ref-m', publico: FAMILIA, criado_por: 'p-beatriz' },
  { tipo: 'entrega', titulo: 'Entrega do caderno de leitura', descricao: 'Trazer o caderno com os três resumos do mês.', inicio: ts(util(5), 8), local: 'Sala 2', turma_id: 't-ref-m', publico: FAMILIA, criado_por: 'p-beatriz' },
  { tipo: 'aula', titulo: 'Aula de reforço de inglês', descricao: 'Revisão de cores, números e cumprimentos.', inicio: ts(util(1), 14), fim: ts(util(1), 15, 30), local: 'Sala 1', turma_id: 't-ref-t', publico: FAMILIA, criado_por: 'p-beatriz' },
  { tipo: 'esportiva', titulo: 'Futebol no campinho', descricao: 'Atividade esportiva do Laboratório de Sonhos. Ir de tênis.', inicio: ts(util(4), 13), fim: ts(util(4), 15), local: 'Campo do Jardim Ângela', turma_id: 't-son-a', publico: FAMILIA, criado_por: 'p-beatriz' },
  { tipo: 'reuniao_pais', titulo: 'Reunião de pais e professores', descricao: 'Conversa sobre o avanço da turma no semestre.', inicio: ts(6, 18), fim: ts(6, 19, 30), local: 'Salão do Instituto', publico: ['responsavel', 'educacao', 'gestao'], criado_por: 'p-beatriz' },
  { tipo: 'reuniao_individual', titulo: 'Conversa sobre o Kauã', descricao: 'Combinar rotina de leitura em casa.', inicio: ts(8, 17), fim: ts(8, 17, 30), local: 'Sala da coordenação', participantes: ['p-adriana', 'p-beatriz'], criado_por: 'p-beatriz' },
  { tipo: 'visita_empresa', titulo: 'Visita à TechNorte Sistemas', descricao: 'Visita do mês: as crianças conhecem uma empresa de tecnologia e conversam com profissionais.', inicio: ts(12, 9), fim: ts(12, 12), local: 'TechNorte, Santo Amaro', criado_por: 'p-gestao' },
  { tipo: 'workshop_responsaveis', titulo: 'Sábado das famílias: como escrever seu currículo', descricao: 'Oficina prática. Traga documento com foto; saímos com o currículo impresso.', inicio: ts(sabado(0), 9), fim: ts(sabado(0), 12), local: 'Salão do Instituto', publico: ['responsavel', 'educacao', 'gestao'], criado_por: 'p-gestao' },
  { tipo: 'workshop_responsaveis', titulo: 'Sábado das famílias: finanças da casa', descricao: 'Montar o orçamento do mês, separar a sobra e fugir de juros altos.', inicio: ts(sabado(2), 9), fim: ts(sabado(2), 12), local: 'Salão do Instituto', publico: ['responsavel', 'educacao', 'gestao'], criado_por: 'p-gestao' },
  { tipo: 'workshop_responsaveis', titulo: 'Sábado das famílias: IA no dia a dia', descricao: 'Usar assistentes de IA no celular para escrever mensagens, tirar dúvidas e procurar emprego.', inicio: ts(sabado(4), 9), fim: ts(sabado(4), 12), local: 'Sala de informática', publico: ['responsavel', 'educacao', 'gestao'], criado_por: 'p-gestao' },
  { tipo: 'passeio', titulo: 'Passeio ao Zoológico de São Paulo', descricao: 'Saída com as turmas do Laboratório de Sonhos. Depende da vaquinha do transporte.', inicio: ts(sabado(3), 8), fim: ts(sabado(3), 16), local: 'Zoológico de São Paulo', criado_por: 'p-gestao' },
  { tipo: 'encontro_patrocinadores', titulo: 'Encontro com patrocinadores', descricao: 'Prestação de contas do semestre e plano de 2027.', inicio: ts(20, 19), fim: ts(20, 21), local: 'Salão do Instituto', publico: ['doador_pf', 'empresa', 'gestao'], criado_por: 'p-gestao' },
].map((e, i) => ({ id: 'e' + i, status: 'confirmado', publico: null, participantes: null, turma_id: null, crianca_id: null, fim: null, ...e }))

const INSTITUCIONAIS = ['visita_empresa', 'workshop_responsaveis', 'passeio', 'encontro_patrocinadores', 'institucional']

function veEvento(e, p) {
  if (!p) return false
  if (p.papel === 'gestao' || e.criado_por === p.id) return true
  if (e.participantes) return e.participantes.includes(p.id)
  if (e.status !== 'confirmado') return false
  if (e.publico && !e.publico.includes(p.papel)) return false
  if (e.turma_id && ['estudante', 'responsavel', 'educacao'].includes(p.papel)) return (TURMAS_DO_PERFIL[p.id] || []).includes(e.turma_id)
  return true
}

const TAREFAS = [
  { turma_id: 't-ref-m', tipo: 'tarefa', titulo: 'Ler um conto e contar para alguém de casa', corpo: 'Escolha um conto da biblioteca, leia e conte a história para um adulto. Escreva 3 frases sobre o final.', entrega: dia(4), criado_em: ts(-1, 10) },
  { turma_id: 't-ref-m', tipo: 'tarefa', titulo: 'Lista de frações', corpo: 'Resolver os 10 exercícios da folha que levou para casa. Use desenhos de pizza se ajudar.', link: 'https://pt.khanacademy.org/math/arithmetic/fraction-arithmetic', entrega: dia(3), criado_em: ts(-2, 10) },
  { turma_id: 't-ref-m', tipo: 'resumo', titulo: 'O que vimos hoje: sílabas complexas', corpo: 'Treinamos palavras com BR, CR e TR (bruxa, cravo, trem). Peça para a criança ler as placas no caminho de casa.', criado_em: ts(0, 11, 30) },
  { turma_id: 't-ref-m', tipo: 'dica', titulo: 'Dica de estudo: 15 minutos por dia', corpo: 'Melhor 15 minutos todo dia do que 2 horas no fim de semana. Desligue a TV nesse tempo.', criado_em: ts(-5, 10) },
  { turma_id: 't-ref-t', tipo: 'tarefa', titulo: 'Vocabulário de inglês: cores', corpo: 'Desenhe 6 objetos de casa e escreva a cor de cada um em inglês.', entrega: dia(2), criado_em: ts(-1, 15) },
  { turma_id: 't-son-a', tipo: 'resumo', titulo: 'Oficina de sonhos: profissões', corpo: 'Cada criança desenhou a profissão que quer ter. Pergunte em casa por que escolheu.', criado_em: ts(-4, 16) },
].map((t, i) => ({ id: 'tf' + i, link: null, entrega: null, criado_por: 'p-beatriz', autor: { nome: 'Beatriz (coordenação)' }, ...t }))

const MATERIAIS = [
  ['Khan Academy em português', 'Matemática do 1º ano em diante, com vídeos e exercícios que corrigem na hora.', 'https://pt.khanacademy.org/', 'Matemática', 'alunos'],
  ['Ler com o Google (Read Along)', 'Aplicativo que escuta a criança lendo em voz alta e ajuda nas palavras difíceis.', 'https://readalong.google.com/', 'Leitura', 'alunos'],
  ['Duolingo', 'Inglês em lições curtas de 5 minutos, gratuito.', 'https://www.duolingo.com/', 'Inglês', 'alunos'],
  ['Scratch', 'Programação com blocos para criar jogos e histórias animadas.', 'https://scratch.mit.edu/', 'IA e tecnologia', 'alunos'],
  ['Code.org', 'Primeiros passos em lógica de programação, com atividades em português.', 'https://code.org/', 'IA e tecnologia', 'alunos'],
  ['Domínio Público', 'Biblioteca digital do governo com livros clássicos gratuitos para ler e baixar.', 'http://www.dominiopublico.gov.br/', 'Leitura', 'todos'],
  ['Brasil Escola', 'Explicações simples de todas as matérias da escola.', 'https://brasilescola.uol.com.br/', 'Todas as matérias', 'alunos'],
  ['Fundação Bradesco · Escola Virtual', 'Cursos gratuitos com certificado: informática, finanças pessoais, currículo e IA.', 'https://www.ev.org.br/', 'Currículo e trabalho', 'responsaveis'],
  ['Escola Virtual.Gov', 'Cursos gratuitos do governo federal com certificado.', 'https://www.escolavirtual.gov.br/', 'Currículo e trabalho', 'responsaveis'],
  ['Sebrae · cursos online gratuitos', 'Para quem quer abrir ou organizar um pequeno negócio.', 'https://sebrae.com.br/sites/PortalSebrae/cursosonline', 'Currículo e trabalho', 'responsaveis'],
  ['Banco Central · Cidadania Financeira', 'Material e cursos para organizar o orçamento da casa e evitar dívidas.', 'https://www.bcb.gov.br/cidadaniafinanceira', 'Finanças da casa', 'responsaveis'],
  ['Meu Bolso em Dia (Febraban)', 'Teste e dicas práticas para cuidar do dinheiro da família.', 'https://meubolsoemdia.com.br/', 'Finanças da casa', 'responsaveis'],
  ['Cresça com o Google', 'Cursos gratuitos de habilidades digitais e uso de IA no trabalho.', 'https://grow.google/intl/pt-br/', 'IA e tecnologia', 'responsaveis'],
].map(([titulo, descricao, url, area, para], i) => ({ id: 'mt' + i, titulo, descricao, url, area, para, ordem: i }))

const LIVROS = [
  ['Menina bonita do laço de fita', 'Ana Maria Machado', '6 a 8 anos', 'Identidade', 3],
  ['O menino maluquinho', 'Ziraldo', '6 a 8 anos', 'Infância', 2],
  ['A bolsa amarela', 'Lygia Bojunga', '9 a 11 anos', 'Sonhos', 2],
  ['Marcelo, marmelo, martelo', 'Ruth Rocha', '6 a 8 anos', 'Palavras', 2],
  ['O pequeno príncipe', 'Antoine de Saint-Exupéry', '9 a 11 anos', 'Amizade', 3],
  ['Reinações de Narizinho', 'Monteiro Lobato', '9 a 11 anos', 'Aventura', 1],
  ['Diário de Biloca', 'Edson Gabriel Garcia', '9 a 11 anos', 'Escola', 1],
  ['Pai rico, pai pobre (edição jovem)', 'Robert Kiyosaki', 'adultos', 'Finanças', 1],
  ['Quarto de despejo', 'Carolina Maria de Jesus', 'adultos', 'Literatura brasileira', 2],
].map(([titulo, autor, faixa, tema, exemplares], i) => ({ id: 'l' + i, titulo, autor, faixa, tema, exemplares }))
let RESERVAS = [
  { id: 'r1', livro_id: 'l2', perfil_id: 'p-kaua', status: 'retirado', reservado_em: ts(-6, 10), devolver_ate: dia(8) },
  { id: 'r2', livro_id: 'l5', perfil_id: 'p-adriana', status: 'reservado', reservado_em: ts(-1, 10), devolver_ate: dia(13) },
]
const abertas = (r) => ['reservado', 'retirado'].includes(r.status)

const NECESSIDADES = [
  { id: 'n1', titulo: 'Bolas de futebol', descricao: 'Para as atividades esportivas do Laboratório de Sonhos.', categoria: 'material_pedagogico', quantidade_necessaria: 5, quantidade_atendida: 2, unidade: 'bolas', condicao: 'semiusadas', vaquinha: false, prazo: dia(30), status: 'parcial' },
  { id: 'n2', titulo: 'Cadernos para o segundo semestre', descricao: '120 cadernos de 96 folhas.', categoria: 'material_pedagogico', quantidade_necessaria: 120, quantidade_atendida: 84, unidade: 'cadernos', condicao: 'novos', vaquinha: false, prazo: dia(20), status: 'parcial' },
  { id: 'n3', titulo: 'Vaquinha para consertar o telhado', descricao: 'Goteiras na sala de leitura. Orçamento de dois pedreiros do bairro.', categoria: 'infraestrutura', quantidade_necessaria: 10000, quantidade_atendida: 3850, unidade: 'reais', vaquinha: true, prazo: dia(60), status: 'parcial' },
  { id: 'n4', titulo: 'Vaquinha para levar as crianças ao zoológico', descricao: 'Ônibus, ingressos e lanche para 60 crianças e 8 acompanhantes.', categoria: 'experiencias', quantidade_necessaria: 5000, quantidade_atendida: 1200, unidade: 'reais', vaquinha: true, prazo: dia(25), status: 'parcial' },
  { id: 'n5', titulo: 'Ventiladores para a sala de leitura', descricao: 'A sala passa de 32 °C à tarde.', categoria: 'infraestrutura', quantidade_necessaria: 4, quantidade_atendida: 0, unidade: 'ventiladores', condicao: 'novos ou semiusados', vaquinha: false, prazo: dia(45), status: 'aberta' },
  { id: 'n6', titulo: 'Tintas e pincéis para as oficinas', descricao: 'Material das oficinas de artes visuais do semestre.', categoria: 'material_pedagogico', quantidade_necessaria: 30, quantidade_atendida: 12, unidade: 'kits', condicao: 'novos', vaquinha: false, prazo: dia(25), status: 'parcial' },
  { id: 'n7', titulo: 'Ingressos para o teatro infantil', descricao: '60 ingressos para a turma do Laboratório de Sonhos.', categoria: 'experiencias', quantidade_necessaria: 60, quantidade_atendida: 60, unidade: 'ingressos', vaquinha: false, prazo: dia(-10), status: 'atendida' },
].map((n) => ({ condicao: null, ...n }))
const pct = (n) => Math.min(100, Math.round((n.quantidade_atendida * 100) / n.quantidade_necessaria))
let COMPROMISSOS = [
  { id: 'cp1', carencia_id: 'n1', perfil_id: 'p-adriana', perfil: { nome: 'Adriana' }, quantidade: 1, valor: null, mensagem: 'Tenho uma bola em bom estado para doar.', status: 'pendente', criado_em: ts(-1, 9) },
  { id: 'cp2', carencia_id: 'n4', perfil_id: 'p-roberto', perfil: { nome: 'Roberto (TechNorte Sistemas)' }, quantidade: null, valor: 1500, mensagem: 'A TechNorte cobre parte do ônibus.', status: 'pendente', criado_em: ts(-2, 9) },
]

const APOIADORES = [
  ['p-marisa', 'pessoa_fisica', 'Marisa S.', 1020, 0, 9], ['x1', 'pessoa_fisica', 'Elaine A.', 1800, 0, 9], ['x2', 'pessoa_fisica', 'Apoiador anônimo', 1350, 0, 8],
  ['x3', 'pessoa_fisica', 'Simone D.', 900, 0, 8], ['x4', 'pessoa_fisica', 'Juliana A.', 640, 4, 6], ['x5', 'pessoa_fisica', 'Apoiador anônimo', 450, 0, 3],
  ['x6', 'pessoa_fisica', 'Rogério T.', 300, 10, 2], ['p-adriana', 'pessoa_fisica', 'Adriana (você, anônimo)', 0, 2, 1],
  ['p-roberto', 'empresa', 'TechNorte Sistemas', 12400, 0, 8], ['y1', 'empresa', 'Construtora Horizonte', 18000, 0, 6], ['y2', 'empresa', 'Farmácias Bem-Estar', 7500, 0, 5],
  ['y3', 'empresa', 'Mercado Jardim', 3200, 140, 7], ['y4', 'empresa', 'Padaria Pão do Bairro', 1800, 96, 9], ['y5', 'empresa', 'Apoiador anônimo', 1500, 0, 2],
]

// Notas mensais de uma turma de reforço inteira, para o gráfico por turma e o individual.
const DISC = ['Português', 'Matemática', 'Inglês']
let semente = 11
const sorte = () => { semente = (semente * 9301 + 49297) % 233280; return semente / 233280 }
const meses = () => { const h = new Date(); const r = []; for (let m = 1; m <= h.getMonth(); m++) r.push(new Date(h.getFullYear(), m, 20)); return r }
const ALUNOS = { 't-ref-m': ['c-kaua', ...Array.from({ length: 19 }, (_, i) => 'c-rm' + i)], 't-ref-t': Array.from({ length: 20 }, (_, i) => 'c-rt' + i) }
let NOTAS = []
for (const [turma, criancas] of Object.entries(ALUNOS)) for (const c of criancas) {
  const base = c === 'c-kaua' ? 5.2 : 4.5 + sorte() * 3
  for (const d of DISC) meses().forEach((mes, i) => NOTAS.push({
    id: novoId('nt'), crianca_id: c, turma_id: turma, disciplina: d, avaliacao: 'Avaliação mensal',
    valor: Math.min(10, Math.round((base + i * 0.28 + sorte() * 1.4 - 0.7) * 10) / 10), data: mes.toISOString().slice(0, 10),
  }))
}
const PRESENCA_TURMA = { 't-ref-m': [88, 86, 90, 84, 87, 82, 89, 91, 86], 't-ref-t': [85, 83, 80, 86, 84, 79, 83, 85, 84], 't-son-a': [90, 88, 85, 87, 89, 86, 84, 88, 90], 't-son-b': [84, 86, 83, 85, 82, 80, 85, 87, 86] }
const PRESENCA_KAUA = [95, 90, 92, 85, 88, 70, 90, 94, 91]
let OBSERVACOES = [
  { id: 'o1', crianca_id: 'c-kaua', tipo: 'elogio', texto: 'Kauã ajudou dois colegas na leitura em dupla. Está mais confiante para ler em voz alta.', criado_em: ts(-3, 10) },
  { id: 'o2', crianca_id: 'c-kaua', tipo: 'dificuldade', texto: 'Ainda confunde frações com denominadores diferentes.', criado_em: ts(-10, 10) },
  { id: 'o3', crianca_id: 'c-kaua', tipo: 'recomendacao', texto: 'Praticar 15 minutos de frações na Khan Academy, 3 vezes por semana.', criado_em: ts(-10, 10) },
  { id: 'o4', crianca_id: 'c-kaua', tipo: 'comportamento', texto: 'Participativo nas rodas de conversa; às vezes se distrai depois do lanche.', criado_em: ts(-20, 10) },
].map((o) => ({ autor: { nome: 'Beatriz (coordenação)' }, ...o }))

let FEEDBACKS = [
  { id: 'f1', autor_id: 'p-marisa', autor: { nome: 'Marisa', papel: 'doador_pf' }, tipo: 'sugestao', texto: 'Gostaria de receber fotos das atividades (sem o rosto das crianças) junto com a prestação de contas.', criada_em: ts(-6, 10), resposta: null },
  { id: 'f2', autor_id: 'p-adriana', autor: { nome: 'Adriana', papel: 'responsavel' }, tipo: 'reclamacao', texto: 'O portão abriu atrasado no sábado e as crianças esperaram na rua.', criada_em: ts(-2, 10), resposta: 'Obrigado por avisar. A partir deste sábado, a abertura é às 8h45.', respondida_em: ts(-1, 9) },
  { id: 'f3', autor_id: 'p-adriana', autor: { nome: 'Adriana', papel: 'responsavel' }, tipo: 'elogio', texto: 'O Kauã está lendo para a irmã toda noite. Obrigada!', criada_em: ts(-12, 10), resposta: null },
]

// Chave fictícia: no modo de demonstração nunca aparece uma chave PIX real.
let PIX = { chave: 'pix-exemplo@ebenezer.test', tipo_chave: 'email', titular: 'Instituto Ebenezer', cidade: 'SAO PAULO',
  instrucoes: 'Depois do PIX, mande o comprovante no WhatsApp da secretaria.', atualizado_em: ts(-3, 10) }
const PESSOAS = [
  { id: 'p-gestao', nome: 'Elias (gestão)', papel: 'gestao', telefone: '11900000001', ativo: true },
  { id: 'p-beatriz', nome: 'Beatriz (coordenação)', papel: 'educacao', telefone: '11900000003', ativo: true },
  { id: 'p-adriana', nome: 'Adriana', papel: 'responsavel', telefone: '11911112222', ativo: true },
  { id: 'p-rosa', nome: 'Rosa', papel: 'responsavel', telefone: null, ativo: true },
  { id: 'p-marisa', nome: 'Marisa', papel: 'doador_pf', telefone: null, ativo: true },
  { id: 'p-roberto', nome: 'Roberto (TechNorte Sistemas)', papel: 'empresa', telefone: null, ativo: true },
]
const CRIANCAS_CAD = [
  { id: 'c-kaua', nome_exibicao: 'Kauã R.', ano_nascimento: new Date().getFullYear() - 9, codigo_parceiro: 'A001',
    matricula: [{ fim: null, turma: { nome: 'Reforço Manhã' } }, { fim: null, turma: { nome: 'Sonhos A' } }],
    responsavel_crianca: [{ parentesco: 'mãe', consentimento_em: '2026-02-05', perfil: { nome: 'Adriana' } }], acesso_estudante: { suspenso_em: null } },
  { id: 'c-ana', nome_exibicao: 'Ana R.', ano_nascimento: new Date().getFullYear() - 4, codigo_parceiro: 'A002',
    matricula: [{ fim: null, turma: { nome: 'Primeira Infância' } }],
    responsavel_crianca: [{ parentesco: 'mãe', consentimento_em: '2026-02-05', perfil: { nome: 'Adriana' } }], acesso_estudante: null },
  { id: 'c-heitor', nome_exibicao: 'Heitor M.', ano_nascimento: new Date().getFullYear() - 8, codigo_parceiro: 'A003',
    matricula: [{ fim: null, turma: { nome: 'Reforço Tarde' } }],
    responsavel_crianca: [{ parentesco: 'avó', consentimento_em: null, perfil: { nome: 'Rosa' } }], acesso_estudante: null },
]
const SOLICITACOES = [
  { id: 's1', nome: 'Cleide M.', contato: '(11) 98888-1234', papel_pretendido: 'responsavel', mensagem: 'Sou mãe do Davi, da turma da tarde.', criada_em: ts(-2, 10), status: 'pendente' },
  { id: 's2', nome: 'Padaria Pão do Bairro', contato: 'contato@paodobairro.test', papel_pretendido: 'empresa', mensagem: 'Queremos doar o lanche de sábado.', criada_em: ts(-1, 15), status: 'pendente' },
]

export function apiEscola(personaAtual, espera) {
  const eu = () => personaAtual()
  const equipe = () => ['educacao', 'gestao'].includes(eu()?.papel)
  const criancasVisiveis = () => {
    const p = eu(); if (!p) return []
    if (p.papel === 'gestao' || p.papel === 'educacao') return Object.values(ALUNOS).flat()
    if (p.papel === 'responsavel' && p.id === 'p-adriana') return ['c-kaua']
    if (p.papel === 'estudante') return ['c-kaua']
    return []
  }
  return {
    async agenda(desde, ate) {
      return espera(EVENTOS.filter((e) => e.status !== 'cancelado' && e.inicio >= desde && e.inicio <= ate && veEvento(e, eu()))
        .map((e) => ({ ...e, turma: e.turma_id ? { nome: nomeTurma(e.turma_id) } : null })).sort((a, b) => a.inicio.localeCompare(b.inicio)))
    },
    async salvarEvento(e) {
      const p = eu()
      if (p.papel !== 'gestao' && INSTITUCIONAIS.includes(e.tipo)) throw new Error('Só a diretoria marca eventos institucionais (passeios, visitas, workshops, encontros com patrocinadores).')
      if (!equipe() && !(e.tipo === 'reuniao_individual' && e.status === 'solicitado')) throw new Error('A agenda só é editada pela equipe. Use "Pedir conversa" para marcar um horário.')
      EVENTOS.push({ id: novoId('e'), publico: null, participantes: null, turma_id: null, crianca_id: null, fim: null, status: 'confirmado', ...e })
    },
    async atualizarEvento(id, campos) { Object.assign(EVENTOS.find((e) => e.id === id), campos) },
    async removerEvento(id) { const i = EVENTOS.findIndex((e) => e.id === id); if (i >= 0) EVENTOS.splice(i, 1) },
    async equipeContato() { return espera(EQUIPE) },
    async todasTurmas() { return espera(TURMAS) },

    async tarefas() { return espera(TAREFAS.map((t) => ({ ...t, turma: { nome: nomeTurma(t.turma_id) } })).sort((a, b) => b.criado_em.localeCompare(a.criado_em))) },
    async salvarTarefa(t) { TAREFAS.push({ id: novoId('tf'), criado_em: new Date().toISOString(), autor: { nome: eu().nome }, link: null, entrega: null, ...t }) },
    async removerTarefa(id) { const i = TAREFAS.findIndex((t) => t.id === id); if (i >= 0) TAREFAS.splice(i, 1) },

    async materiais() { return espera(MATERIAIS) },
    async salvarMaterial(m) { MATERIAIS.push({ id: novoId('mt'), ordem: 99, ...m }) },

    async livros() {
      return espera(LIVROS.map((l) => ({ ...l, disponiveis: l.exemplares - RESERVAS.filter((r) => r.livro_id === l.id && abertas(r)).length })))
    },
    async minhasReservas() {
      const p = eu()
      return espera(RESERVAS.filter((r) => abertas(r) && (equipe() || r.perfil_id === p.id))
        .map((r) => ({ ...r, livro: LIVROS.find((l) => l.id === r.livro_id) })))
    },
    async reservarLivro(livroId) {
      const p = eu(); const l = LIVROS.find((x) => x.id === livroId)
      if (l.exemplares - RESERVAS.filter((r) => r.livro_id === livroId && abertas(r)).length <= 0) throw new Error('Todos os exemplares estão emprestados. Tente de novo em alguns dias.')
      if (RESERVAS.filter((r) => r.perfil_id === p.id && abertas(r)).length >= 2) throw new Error('Você já tem 2 livros reservados. Devolva um para reservar outro.')
      const r = { id: novoId('r'), livro_id: livroId, perfil_id: p.id, status: 'reservado', reservado_em: new Date().toISOString(), devolver_ate: dia(14) }
      RESERVAS.push(r); return espera(r)
    },
    async cancelarReserva(id) { RESERVAS.find((r) => r.id === id).status = 'cancelado' },
    async atualizarReserva(id, status) { RESERVAS.find((r) => r.id === id).status = status },

    async necessidades() {
      return espera(NECESSIDADES.map((n) => ({ ...n, progresso_pct: pct(n) })))
    },
    async comprometerDoacao(c) {
      const p = eu()
      COMPROMISSOS.unshift({ id: novoId('cp'), perfil_id: p.id, perfil: { nome: p.nome }, status: 'pendente', criado_em: new Date().toISOString(), valor: null, quantidade: null, ...c })
    },
    async compromissos() {
      const p = eu()
      return espera(COMPROMISSOS.filter((c) => p.papel === 'gestao' || c.perfil_id === p.id)
        .map((c) => ({ ...c, carencia: NECESSIDADES.find((n) => n.id === c.carencia_id) })))
    },
    async confirmarCompromisso(id) {
      const c = COMPROMISSOS.find((x) => x.id === id); const n = NECESSIDADES.find((x) => x.id === c.carencia_id)
      if (n) { n.quantidade_atendida += n.vaquinha ? Number(c.valor || 0) : Number(c.quantidade || 0); n.status = n.quantidade_atendida >= n.quantidade_necessaria ? 'atendida' : 'parcial' }
      c.status = 'confirmado'
    },
    async salvarCarencia(c) { NECESSIDADES.push({ id: novoId('n'), quantidade_atendida: 0, status: 'aberta', condicao: null, ...c }) },

    async ranking() {
      const p = eu()
      if (!p || p.papel === 'estudante') return espera([])
      const linhas = APOIADORES.map(([id, categoria, nome, total_reais, itens_doados, meses_de_apoio]) => ({ sou_eu: id === p.id, categoria, nome, total_reais, itens_doados, meses_de_apoio }))
      for (const cat of ['pessoa_fisica', 'empresa']) linhas.filter((l) => l.categoria === cat).sort((a, b) => b.total_reais - a.total_reais).forEach((l, i) => { l.posicao = i + 1 })
      return espera(linhas.sort((a, b) => a.posicao - b.posicao))
    },

    async notas(criancaId) { return espera(criancasVisiveis().includes(criancaId) ? NOTAS.filter((n) => n.crianca_id === criancaId) : []) },
    async observacoes(criancaId) { return espera(criancasVisiveis().includes(criancaId) ? OBSERVACOES.filter((o) => o.crianca_id === criancaId) : []) },
    async lancarNota(n) { NOTAS.push({ id: novoId('nt'), avaliacao: 'Avaliação', ...n }) },
    async salvarObservacao(o) { OBSERVACOES.unshift({ id: novoId('o'), criado_em: new Date().toISOString(), autor: { nome: eu().nome }, ...o }) },
    async presencaIndividual(criancaId) {
      return espera(criancaId === 'c-kaua' && criancasVisiveis().includes(criancaId)
        ? meses().map((m, i) => ({ mes: m.toISOString().slice(0, 7) + '-01', presenca_pct: PRESENCA_KAUA[i] ?? 88 })) : [])
    },
    async desempenhoTurmas() {
      const linhas = []
      for (const t of TURMAS.slice(0, 4)) meses().forEach((m, i) => {
        const mes = m.toISOString().slice(0, 7) + '-01'
        const presenca_pct = PRESENCA_TURMA[t.id]?.[i] ?? 85
        const ds = ALUNOS[t.id] ? DISC : [null]
        for (const d of ds) {
          const ns = d ? NOTAS.filter((n) => n.turma_id === t.id && n.disciplina === d && n.data.slice(0, 7) === mes.slice(0, 7)) : []
          linhas.push({ turma_id: t.id, turma: t.nome, programa: t.programa.nome, mes, disciplina: d, presenca_pct,
            media: ns.length >= 5 ? Math.round((ns.reduce((s, n) => s + n.valor, 0) / ns.length) * 10) / 10 : null })
        }
      })
      return espera(linhas)
    },
    async criancasVisiveis() {
      const nomes = { 'c-kaua': 'Kauã R.' }
      const NOMES = ['Davi', 'Alice', 'Theo', 'Helena', 'Gael', 'Laura', 'Miguel', 'Lívia', 'Samuel', 'Cecília', 'Ravi', 'Clara', 'Bento', 'Isis', 'Lucas', 'Luna', 'Caio', 'Yasmin', 'Joaquim', 'Bianca']
      return espera(Object.entries(ALUNOS).flatMap(([turma_id, cs]) => cs.filter((c) => criancasVisiveis().includes(c))
        .map((c, i) => ({ turma_id, crianca: { id: c, nome_exibicao: nomes[c] || `${NOMES[i % 20]} ${'ABCDFGLMNPRS'[i % 12]}.` } }))))
    },

    async responsaveisVisiveis() {
      if (!equipe()) return espera([])
      return espera(Object.values(ALUNOS).flat().map((c, i) => c === 'c-kaua'
        ? { crianca_id: c, perfil_id: 'p-adriana', nome: 'Adriana', parentesco: 'mãe' }
        : { crianca_id: c, perfil_id: `p-resp-${i}`, nome: `Responsável ${i}`, parentesco: 'mãe' }))
    },
    async pix() { return espera(PIX) },
    async salvarPix(dados) {
      if (eu()?.papel !== 'gestao') throw new Error('Este conteúdo não está disponível para o seu perfil.')
      PIX = { ...dados, atualizado_em: new Date().toISOString() }
    },
    async pessoas() { return espera(PESSOAS) },
    async criancasCadastro() { return espera(CRIANCAS_CAD) },
    async solicitacoes() { return espera(SOLICITACOES.filter((s) => s.status === 'pendente')) },
    async tratarSolicitacao(id, status) { SOLICITACOES.find((s) => s.id === id).status = status },
    async cadastrarPessoa(p) {
      if (eu()?.papel !== 'gestao') throw new Error('Só a diretoria cadastra pessoas.')
      if (PESSOAS.some((x) => x.email === p.email)) throw new Error('Já existe uma conta com este e-mail.')
      if ((p.senha || '').length < 8) throw new Error('A senha provisória precisa ter pelo menos 8 caracteres.')
      const id = novoId('p'); PESSOAS.push({ id, nome: p.nome, papel: p.papel, telefone: p.telefone, email: p.email, ativo: true }); return espera(id)
    },
    async cadastrarCrianca(c) {
      if (!/^\S+ \S\.?$/.test(c.nome)) throw new Error('Use só o primeiro nome e a inicial do sobrenome (ex.: Kauã R.). O portal não guarda nome completo.')
      const resp = PESSOAS.find((p) => p.id === c.responsavel)
      CRIANCAS_CAD.push({ id: novoId('c'), nome_exibicao: c.nome, ano_nascimento: Number(c.ano), codigo_parceiro: c.codigo || null,
        matricula: c.turma ? [{ fim: null, turma: { nome: nomeTurma(c.turma) } }] : [],
        responsavel_crianca: resp ? [{ parentesco: c.parentesco, consentimento_em: null, perfil: { nome: resp.nome } }] : [], acesso_estudante: null })
    },
    async vincularResponsavel(responsavel, crianca, parentesco) {
      const resp = PESSOAS.find((p) => p.id === responsavel)
      CRIANCAS_CAD.find((c) => c.id === crianca).responsavel_crianca.push({ parentesco, consentimento_em: null, perfil: { nome: resp.nome } })
    },
    async liberarAcessoEstudante(crianca) { CRIANCAS_CAD.find((c) => c.id === crianca).acesso_estudante = { suspenso_em: null } },

    async enviarFeedback(texto, tipo) { const p = eu(); FEEDBACKS.unshift({ id: novoId('f'), autor_id: p.id, autor: { nome: p.nome, papel: p.papel }, tipo, texto, criada_em: new Date().toISOString(), resposta: null }) },
    async feedbacks() { const p = eu(); return espera(FEEDBACKS.filter((f) => equipe() || f.autor_id === p.id)) },
    async responderFeedback(id, resposta) { Object.assign(FEEDBACKS.find((f) => f.id === id), { resposta, respondida_em: new Date().toISOString() }) },
  }
}
