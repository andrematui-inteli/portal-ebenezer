-- Portal Ebenézer · Dados sintéticos da vida escolar (migração 6)
-- Rode DEPOIS de dados_sinteticos.sql. Pode ser rodado de novo: apaga e recria.
-- Os links de materiais são reais e gratuitos; todo o resto é fictício.

truncate evento, tarefa, material, reserva_livro, livro, compromisso_doacao, nota, observacao_aluno;

do $$
declare
  hoje      constant date := current_date;
  u_gestao  uuid := (select p.id from perfil p join auth.users u on u.id = p.id where u.email = 'gestao@ebenezer.test');
  u_beatriz uuid := (select p.id from perfil p join auth.users u on u.id = p.id where u.email = 'educacao@ebenezer.test');
  u_adriana uuid := (select p.id from perfil p join auth.users u on u.id = p.id where u.email = 'responsavel@ebenezer.test');
  u_marisa  uuid := (select p.id from perfil p join auth.users u on u.id = p.id where u.email = 'doador@ebenezer.test');
  u_roberto uuid := (select p.id from perfil p join auth.users u on u.id = p.id where u.email = 'empresa@ebenezer.test');
  t_ref_m uuid := (select id from turma where nome = 'Reforço Manhã');
  t_ref_t uuid := (select id from turma where nome = 'Reforço Tarde');
  t_son_a uuid := (select id from turma where nome = 'Sonhos A');
  t_son_b uuid := (select id from turma where nome = 'Sonhos B');
  c_kaua  uuid := (select ae.crianca_id from acesso_estudante ae join auth.users u on u.id = ae.perfil_id where u.email = 'estudante@ebenezer.test');
  disc text; m int; r record; base numeric;
begin
  -- ── Agenda ──
  insert into evento (titulo, descricao, tipo, inicio, fim, local, turma_id, publico, participantes, crianca_id, status, criado_por) values
    ('Prova de matemática', 'Frações e problemas com as quatro operações.', 'prova', hoje + 3 + time '09:00', hoje + 3 + time '10:30', 'Sala 2', t_ref_m, array['estudante','responsavel','educacao','gestao']::papel[], null, null, 'confirmado', u_beatriz),
    ('Entrega do caderno de leitura', 'Trazer o caderno com os três resumos do mês.', 'entrega', hoje + 5 + time '08:00', null, 'Sala 2', t_ref_m, array['estudante','responsavel','educacao','gestao']::papel[], null, null, 'confirmado', u_beatriz),
    ('Aula de reforço de inglês', 'Revisão de cores, números e cumprimentos.', 'aula', hoje + 1 + time '14:00', hoje + 1 + time '15:30', 'Sala 1', t_ref_t, array['estudante','responsavel','educacao','gestao']::papel[], null, null, 'confirmado', u_beatriz),
    ('Futebol no campinho', 'Atividade esportiva do Laboratório de Sonhos. Ir de tênis.', 'esportiva', hoje + 4 + time '13:00', hoje + 4 + time '15:00', 'Campo do Jardim Ângela', t_son_a, array['estudante','responsavel','educacao','gestao']::papel[], null, null, 'confirmado', u_beatriz),
    ('Reunião de pais e professores', 'Conversa sobre o avanço da turma no semestre.', 'reuniao_pais', hoje + 6 + time '18:00', hoje + 6 + time '19:30', 'Salão do Instituto', null, array['responsavel','educacao','gestao']::papel[], null, null, 'confirmado', u_beatriz),
    ('Conversa sobre o Kauã', 'Combinar rotina de leitura em casa.', 'reuniao_individual', hoje + 8 + time '17:00', hoje + 8 + time '17:30', 'Sala da coordenação', null, null, array[u_adriana, u_beatriz], c_kaua, 'confirmado', u_beatriz),
    ('Visita à TechNorte Sistemas', 'Visita do mês: as crianças conhecem como funciona uma empresa de tecnologia e conversam com profissionais.', 'visita_empresa', hoje + 12 + time '09:00', hoje + 12 + time '12:00', 'TechNorte, Santo Amaro', null, null, null, null, 'confirmado', u_gestao),
    ('Sábado das famílias: como escrever seu currículo', 'Oficina prática para responsáveis. Traga documento com foto; saímos com o currículo impresso.', 'workshop_responsaveis', (date_trunc('week', hoje)::date + 12) + time '09:00', (date_trunc('week', hoje)::date + 12) + time '12:00', 'Salão do Instituto', null, array['responsavel','gestao','educacao']::papel[], null, null, 'confirmado', u_gestao),
    ('Sábado das famílias: finanças da casa', 'Como montar o orçamento do mês, separar a sobra e fugir de juros altos.', 'workshop_responsaveis', (date_trunc('week', hoje)::date + 26) + time '09:00', (date_trunc('week', hoje)::date + 26) + time '12:00', 'Salão do Instituto', null, array['responsavel','gestao','educacao']::papel[], null, null, 'confirmado', u_gestao),
    ('Sábado das famílias: IA no dia a dia', 'Usar assistentes de IA no celular para escrever mensagens, tirar dúvidas e procurar emprego, com exemplos.', 'workshop_responsaveis', (date_trunc('week', hoje)::date + 40) + time '09:00', (date_trunc('week', hoje)::date + 40) + time '12:00', 'Sala de informática', null, array['responsavel','gestao','educacao']::papel[], null, null, 'confirmado', u_gestao),
    ('Passeio ao Zoológico de São Paulo', 'Saída com as turmas do Laboratório de Sonhos. Depende da vaquinha do transporte.', 'passeio', hoje + 30 + time '08:00', hoje + 30 + time '16:00', 'Zoológico de São Paulo', null, null, null, null, 'confirmado', u_gestao),
    ('Encontro com patrocinadores', 'Prestação de contas do semestre e plano de 2027.', 'encontro_patrocinadores', hoje + 20 + time '19:00', hoje + 20 + time '21:00', 'Salão do Instituto', null, array['doador_pf','empresa','gestao']::papel[], null, null, 'confirmado', u_gestao);

  -- ── Tarefas, dicas e resumos ──
  insert into tarefa (turma_id, tipo, titulo, corpo, link, entrega, criado_por, criado_em) values
    (t_ref_m, 'tarefa', 'Ler um conto e contar para alguém de casa', 'Escolha um conto da biblioteca, leia e conte a história para um adulto. Escreva 3 frases sobre o final.', null, hoje + 4, u_beatriz, now() - interval '1 day'),
    (t_ref_m, 'tarefa', 'Lista de frações', 'Resolver os 10 exercícios da folha que levou para casa. Use desenhos de pizza se ajudar.', 'https://pt.khanacademy.org/math/arithmetic/fraction-arithmetic', hoje + 3, u_beatriz, now() - interval '2 days'),
    (t_ref_m, 'resumo', 'O que vimos hoje: sílabas complexas', 'Treinamos palavras com BR, CR e TR (bruxa, cravo, trem). Peça para a criança ler as placas no caminho de casa.', null, null, u_beatriz, now() - interval '3 hours'),
    (t_ref_m, 'dica', 'Dica de estudo: 15 minutos por dia', 'Melhor 15 minutos todo dia do que 2 horas no fim de semana. Desligue a TV nesse tempo.', null, null, u_beatriz, now() - interval '5 days'),
    (t_ref_t, 'tarefa', 'Vocabulário de inglês: cores', 'Desenhe 6 objetos de casa e escreva a cor de cada um em inglês.', null, hoje + 2, u_beatriz, now() - interval '1 day'),
    (t_son_a, 'resumo', 'Oficina de sonhos: profissões', 'Cada criança desenhou a profissão que quer ter. Pergunte em casa por que escolheu.', null, null, u_beatriz, now() - interval '4 days');

  -- ── Links de estudo e materiais de apoio (reais e gratuitos) ──
  insert into material (titulo, descricao, url, area, para, ordem) values
    ('Khan Academy em português', 'Matemática do 1º ano em diante, com vídeos e exercícios que corrigem na hora.', 'https://pt.khanacademy.org/', 'Matemática', 'alunos', 1),
    ('Ler com o Google (Read Along)', 'Aplicativo que escuta a criança lendo em voz alta e ajuda nas palavras difíceis.', 'https://readalong.google.com/', 'Leitura', 'alunos', 2),
    ('Duolingo', 'Inglês em lições curtas de 5 minutos, gratuito.', 'https://www.duolingo.com/', 'Inglês', 'alunos', 3),
    ('Scratch', 'Programação com blocos para criar jogos e histórias animadas.', 'https://scratch.mit.edu/', 'IA e tecnologia', 'alunos', 4),
    ('Code.org', 'Primeiros passos em lógica de programação, com atividades em português.', 'https://code.org/', 'IA e tecnologia', 'alunos', 5),
    ('Domínio Público', 'Biblioteca digital do governo com livros clássicos gratuitos para ler e baixar.', 'http://www.dominiopublico.gov.br/', 'Leitura', 'todos', 6),
    ('Brasil Escola', 'Explicações simples de todas as matérias da escola.', 'https://brasilescola.uol.com.br/', 'Todas as matérias', 'alunos', 7),
    ('Fundação Bradesco · Escola Virtual', 'Cursos gratuitos com certificado: informática, finanças pessoais, currículo e IA.', 'https://www.ev.org.br/', 'Currículo e trabalho', 'responsaveis', 10),
    ('Escola Virtual.Gov', 'Cursos gratuitos do governo federal com certificado.', 'https://www.escolavirtual.gov.br/', 'Currículo e trabalho', 'responsaveis', 11),
    ('Sebrae · cursos online gratuitos', 'Para quem quer abrir ou organizar um pequeno negócio.', 'https://sebrae.com.br/sites/PortalSebrae/cursosonline', 'Currículo e trabalho', 'responsaveis', 12),
    ('Banco Central · Cidadania Financeira', 'Material e cursos para organizar o orçamento da casa e evitar dívidas.', 'https://www.bcb.gov.br/cidadaniafinanceira', 'Finanças da casa', 'responsaveis', 13),
    ('Meu Bolso em Dia (Febraban)', 'Teste e dicas práticas para cuidar do dinheiro da família.', 'https://meubolsoemdia.com.br/', 'Finanças da casa', 'responsaveis', 14),
    ('Cresça com o Google', 'Cursos gratuitos de habilidades digitais e uso de IA no trabalho.', 'https://grow.google/intl/pt-br/', 'IA e tecnologia', 'responsaveis', 15);

  -- ── Biblioteca ──
  insert into livro (titulo, autor, faixa, tema, exemplares) values
    ('Menina bonita do laço de fita', 'Ana Maria Machado', '6 a 8 anos', 'Identidade', 3),
    ('O menino maluquinho', 'Ziraldo', '6 a 8 anos', 'Infância', 2),
    ('A bolsa amarela', 'Lygia Bojunga', '9 a 11 anos', 'Sonhos', 2),
    ('Marcelo, marmelo, martelo', 'Ruth Rocha', '6 a 8 anos', 'Palavras', 2),
    ('O pequeno príncipe', 'Antoine de Saint-Exupéry', '9 a 11 anos', 'Amizade', 3),
    ('Reinações de Narizinho', 'Monteiro Lobato', '9 a 11 anos', 'Aventura', 1),
    ('Diário de Biloca', 'Edson Gabriel Garcia', '9 a 11 anos', 'Escola', 1),
    ('Pai rico, pai pobre (edição jovem)', 'Robert Kiyosaki', 'adultos', 'Finanças', 1),
    ('Quarto de despejo', 'Carolina Maria de Jesus', 'adultos', 'Literatura brasileira', 2);
  insert into reserva_livro (livro_id, perfil_id, status)
    select id, (select perfil_id from acesso_estudante where crianca_id = c_kaua), 'retirado' from livro where titulo = 'A bolsa amarela';
  insert into reserva_livro (livro_id, perfil_id, status)
    select id, u_adriana, 'reservado' from livro where titulo = 'Reinações de Narizinho';

  -- ── Necessidades no formato da tabela (itens e vaquinhas) ──
  update carencia set unidade = 'cadernos', condicao = 'novos' where titulo like 'Cadernos%';
  update carencia set unidade = 'ventiladores', condicao = 'novos ou semiusados' where titulo like 'Ventiladores%';
  update carencia set unidade = 'kits', condicao = 'novos' where titulo like 'Tintas%';
  insert into carencia (titulo, descricao, categoria, quantidade_necessaria, quantidade_atendida, unidade, condicao, vaquinha,
                        prazo, status, publicacao, criado_por, aprovado_por, aprovado_em) values
    ('Bolas de futebol', 'Para as atividades esportivas do Laboratório de Sonhos.', 'material_pedagogico', 5, 2, 'bolas', 'semiusadas', false, hoje + 30, 'parcial', 'publicado', u_beatriz, u_gestao, now()),
    ('Vaquinha para consertar o telhado', 'Goteiras na sala de leitura. Orçamento de dois pedreiros do bairro.', 'infraestrutura', 10000, 3850, 'reais', null, true, hoje + 60, 'parcial', 'publicado', u_gestao, u_gestao, now()),
    ('Vaquinha para levar as crianças ao zoológico', 'Ônibus, ingressos e lanche para 60 crianças e 8 acompanhantes.', 'experiencias', 5000, 1200, 'reais', null, true, hoje + 25, 'parcial', 'publicado', u_gestao, u_gestao, now());
  insert into compromisso_doacao (carencia_id, perfil_id, quantidade, mensagem)
    select id, u_adriana, 1, 'Tenho uma bola em bom estado para doar.' from carencia where titulo = 'Bolas de futebol';
  insert into compromisso_doacao (carencia_id, perfil_id, valor, mensagem)
    select id, u_roberto, 1500, 'A TechNorte cobre parte do ônibus.' from carencia where titulo like 'Vaquinha para levar%';

  -- ── Notas mensais e observações (crianças das turmas de reforço) ──
  for r in select m2.crianca_id, m2.turma_id from matricula m2 where m2.turma_id in (t_ref_m, t_ref_t) and m2.fim is null loop
    base := 4.5 + random() * 3;
    foreach disc in array array['Português','Matemática','Inglês'] loop
      for m in 2..extract(month from hoje)::int loop
        insert into nota (crianca_id, turma_id, disciplina, avaliacao, valor, data, lancado_por)
        values (r.crianca_id, r.turma_id, disc, 'Avaliação mensal',
                least(10, round((base + (m - 2) * 0.25 + random() * 1.4 - 0.7)::numeric, 1)),
                make_date(extract(year from hoje)::int, m, 20), u_beatriz);
      end loop;
    end loop;
  end loop;
  insert into observacao_aluno (crianca_id, tipo, texto, autor_id, criado_em) values
    (c_kaua, 'elogio', 'Kauã ajudou dois colegas na leitura em dupla. Está mais confiante para ler em voz alta.', u_beatriz, now() - interval '3 days'),
    (c_kaua, 'dificuldade', 'Ainda confunde frações com denominadores diferentes.', u_beatriz, now() - interval '10 days'),
    (c_kaua, 'recomendacao', 'Praticar 15 minutos de frações na Khan Academy, 3 vezes por semana.', u_beatriz, now() - interval '10 days'),
    (c_kaua, 'comportamento', 'Participativo nas rodas de conversa; às vezes se distrai depois do lanche.', u_beatriz, now() - interval '20 days');

  -- ── Feedbacks de exemplo ──
  update sugestao set tipo = 'sugestao';
  insert into sugestao (autor_id, texto, tipo, criada_em) values
    (u_marisa, 'Gostaria de receber fotos das atividades (sem o rosto das crianças) junto com a prestação de contas.', 'sugestao', now() - interval '6 days'),
    (u_adriana, 'O portão abriu atrasado no sábado e as crianças esperaram na rua.', 'reclamacao', now() - interval '2 days');
end $$;
