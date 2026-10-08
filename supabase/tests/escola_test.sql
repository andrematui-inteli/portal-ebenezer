-- Teste das permissões da vida escolar (migração 6).
-- Roda depois de permissoes_test.sql, na mesma sessão: reaproveita as pessoas e crianças dele.
-- Adriana é mãe do Kauã (Reforço Manhã); Beatriz educa só o Reforço Manhã; Lia está no Reforço Tarde.
\set ON_ERROR_STOP on
\set QUIET on

-- ── Fixture (como dono do banco) ──
reset role; select pg_temp.entrar(null);
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000c1');
insert into perfil (id, papel, nome, exibir_nome_publico, nome_publico) values
 ('00000000-0000-0000-0000-0000000000c1','empresa','TechNorte',true,'TechNorte Sistemas');
insert into evento (titulo, tipo, inicio, turma_id, publico, participantes, status, criado_por) values
 ('Prova de matemática', 'prova', now() + interval '2 days', (select id from turma where nome = 'Reforço Manhã'),
  '{estudante,responsavel,educacao,gestao}', null, 'confirmado', '00000000-0000-0000-0000-00000000000e'),
 ('Prova do Reforço Tarde', 'prova', now() + interval '2 days', (select id from turma where nome = 'Reforço Tarde'),
  '{estudante,responsavel,educacao,gestao}', null, 'confirmado', '00000000-0000-0000-0000-00000000000a'),
 ('Conversa sobre o Kauã', 'reuniao_individual', now() + interval '3 days', null, null,
  '{00000000-0000-0000-0000-0000000000a1,00000000-0000-0000-0000-00000000000e}', 'confirmado', '00000000-0000-0000-0000-00000000000e'),
 ('Reunião de pais', 'reuniao_pais', now() + interval '4 days', null, '{responsavel,educacao,gestao}', null, 'confirmado', '00000000-0000-0000-0000-00000000000e'),
 ('Encontro com patrocinadores', 'encontro_patrocinadores', now() + interval '5 days', null, '{doador_pf,empresa,gestao}', null, 'confirmado', '00000000-0000-0000-0000-00000000000a'),
 ('Passeio ao zoológico', 'passeio', now() + interval '9 days', null, null, null, 'confirmado', '00000000-0000-0000-0000-00000000000a');
insert into nota (crianca_id, turma_id, disciplina, avaliacao, valor, lancado_por) values
 ('10000000-0000-0000-0000-000000000001', (select id from turma where nome = 'Reforço Manhã'), 'Matemática', 'Prova 1', 7.5, '00000000-0000-0000-0000-00000000000a'),
 ('10000000-0000-0000-0000-000000000002', (select id from turma where nome = 'Reforço Tarde'), 'Matemática', 'Prova 1', 6.0, '00000000-0000-0000-0000-00000000000a');
insert into observacao_aluno (crianca_id, tipo, texto, autor_id) values
 ('10000000-0000-0000-0000-000000000002', 'dificuldade', 'Comentário sobre a Lia', '00000000-0000-0000-0000-00000000000a');
insert into livro (titulo, autor, faixa, exemplares) values ('A bolsa amarela', 'Lygia Bojunga', '9 a 11 anos', 1);
insert into carencia (titulo, categoria, quantidade_necessaria, quantidade_atendida, unidade, vaquinha, publicacao, criado_por) values
 ('Vaquinha do telhado', 'infraestrutura', 1000, 0, 'reais', true, 'publicado', '00000000-0000-0000-0000-00000000000a');
insert into tarefa (turma_id, titulo, corpo, criado_por)
select id, 'Lista de frações', 'Resolver 10 exercícios', '00000000-0000-0000-0000-00000000000e' from turma where nome = 'Reforço Manhã';

set role authenticated;

-- ── Kauã (aluno do Reforço Manhã) ──
select pg_temp.entrar('00000000-0000-0000-0000-0000000000b1');
select pg_temp.checa((select array_agg(titulo order by titulo) from evento) = '{"Passeio ao zoológico","Prova de matemática"}',
  'Kauã vê a prova da turma dele e o passeio; não vê conversa, reunião de pais, encontro nem prova de outra turma');
select pg_temp.checa((select count(*) from nota) = 1 and (select crianca_id from nota) = '10000000-0000-0000-0000-000000000001',
  'Kauã vê só a própria nota');
select pg_temp.checa((select count(*) from ranking_apoiadores) = 0, 'aluno não vê o ranking de doações');
select pg_temp.checa((select count(*) from tarefa) = 1, 'aluno vê as tarefas');

-- ── Adriana (mãe do Kauã) ──
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
select pg_temp.checa((select array_agg(titulo order by titulo) from evento)
  = '{"Conversa sobre o Kauã","Passeio ao zoológico","Prova de matemática","Reunião de pais"}',
  'Adriana vê a turma do filho, a própria conversa e a reunião de pais; não vê o encontro de patrocinadores');
select pg_temp.checa((select count(*) from nota) = 1 and (select count(*) from observacao_aluno) = 0,
  'Adriana vê a nota do filho e não vê a nota nem o comentário da Lia');
select pg_temp.checa((select count(*) from equipe_contato) = 2, 'Adriana vê com quem pode pedir conversa');
insert into evento (titulo, tipo, inicio, participantes, status, criado_por)
values ('Conversa: notas', 'reuniao_individual', now() + interval '6 days',
        '{00000000-0000-0000-0000-0000000000a1,00000000-0000-0000-0000-00000000000e}', 'solicitado', auth.uid());
select pg_temp.checa(true, 'Adriana consegue pedir conversa');
do $$ begin
  insert into evento (titulo, tipo, inicio, status, criado_por) values ('Prova falsa', 'prova', now(), 'confirmado', auth.uid());
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'A agenda só é editada pela equipe%' then raise; end if;
  raise notice 'ok  responsável não marca prova na agenda';
end $$;
select (public.reservar_livro((select id from livro where titulo = 'A bolsa amarela'))).id is not null;
select pg_temp.checa((select disponiveis from livro_disponivel where titulo = 'A bolsa amarela') = 0, 'reserva ocupa o exemplar');
do $$ begin
  insert into nota (crianca_id, turma_id, disciplina, avaliacao, valor, lancado_por)
  values ('10000000-0000-0000-0000-000000000001', (select id from turma where nome = 'Reforço Manhã'), 'Matemática', 'Fake', 10, auth.uid());
  raise exception 'deveria ter falhado';
exception when insufficient_privilege then raise notice 'ok  responsável não lança nota';
end $$;

-- ── Marisa (doadora) ──
select pg_temp.entrar('00000000-0000-0000-0000-0000000000d1');
select pg_temp.checa((select array_agg(titulo order by titulo) from evento) = '{"Encontro com patrocinadores","Passeio ao zoológico"}',
  'Marisa vê o encontro de patrocinadores e o passeio; não vê provas, reuniões nem conversas');
select pg_temp.checa((select count(*) from nota) + (select count(*) from observacao_aluno) = 0, 'Marisa não vê notas nem comentários');
select pg_temp.checa((select count(*) from ranking_apoiadores where categoria = 'pessoa_fisica') = 2
  and exists (select 1 from ranking_apoiadores where nome = 'Marisa S.' and sou_eu and posicao = 1)
  and exists (select 1 from ranking_apoiadores where nome = 'Apoiador anônimo'),
  'ranking: Marisa em 1º com nome autorizado; Jonas aparece anônimo');
do $$ begin
  perform public.reservar_livro((select id from livro where titulo = 'A bolsa amarela'));
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Todos os exemplares%' then raise; end if;
  raise notice 'ok  livro sem exemplar livre não é reservado';
end $$;
insert into compromisso_doacao (carencia_id, perfil_id, valor) values ((select id from carencia where titulo = 'Vaquinha do telhado'), auth.uid(), 300);
do $$ begin
  perform public.confirmar_compromisso((select id from compromisso_doacao limit 1));
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Só a diretoria%' then raise; end if;
  raise notice 'ok  doadora não confirma a própria doação';
end $$;

-- ── Beatriz (educação, só Reforço Manhã) ──
select pg_temp.entrar('00000000-0000-0000-0000-00000000000e');
select pg_temp.checa((select count(*) from evento where titulo = 'Prova do Reforço Tarde') = 0
  and (select count(*) from evento where titulo like 'Conversa%') = 2,
  'Beatriz não vê prova de turma alheia e vê as conversas em que participa');
select pg_temp.checa((select count(*) from nota) = 1, 'Beatriz vê só as notas da própria turma');
insert into evento (titulo, tipo, inicio, turma_id, criado_por)
values ('Aula de revisão', 'aula',
  ((select d from generate_series(current_date + 1, current_date + 7, interval '1 day') d where extract(isodow from d) < 6 limit 1)::date + time '14:00')
    at time zone 'America/Sao_Paulo',
  (select id from turma where nome = 'Reforço Manhã'), auth.uid());
select pg_temp.checa(true, 'Beatriz marca aula na própria turma em dia útil');
do $$ begin
  insert into evento (titulo, tipo, inicio, turma_id, criado_por)
  values ('Prova no sábado', 'prova',
    ((select d from generate_series(current_date + 1, current_date + 7, interval '1 day') d where extract(isodow from d) = 6 limit 1)::date + time '09:00')
      at time zone 'America/Sao_Paulo',
    (select id from turma where nome = 'Reforço Manhã'), auth.uid());
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Não há aulas, provas nem entregas no fim de semana%' then raise; end if;
  raise notice 'ok  não há prova no fim de semana';
end $$;
select pg_temp.checa((select count(*) from responsaveis_visiveis) = 1
  and (select nome from responsaveis_visiveis) = 'Adriana', 'Beatriz vê só a responsável do aluno da turma dela, para marcar conversa');
insert into evento (titulo, tipo, inicio, participantes, crianca_id, criado_por)
values ('Conversa com Adriana', 'reuniao_individual', now() + interval '8 days',
        '{00000000-0000-0000-0000-0000000000a1,00000000-0000-0000-0000-00000000000e}', '10000000-0000-0000-0000-000000000001', auth.uid());
select pg_temp.checa(true, 'professora marca conversa com a família');
do $$ begin
  update acesso_estudante set suspenso_em = now() where crianca_id = '10000000-0000-0000-0000-000000000002';
  if found then raise exception 'deveria ter falhado'; end if;
  raise notice 'ok  professora não suspende aluno de outra turma';
end $$;
do $$ begin
  insert into config_pix (chave, tipo_chave, titular) values ('x@y.com', 'email', 'X');
  raise exception 'deveria ter falhado';
exception when insufficient_privilege then raise notice 'ok  professora não edita o PIX';
end $$;
do $$ begin
  perform public.cadastrar_pessoa('novo@x.com', 'senha12345', 'Novo', 'responsavel');
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Só a diretoria%' then raise; end if;
  raise notice 'ok  professora não cadastra pessoas';
end $$;
do $$ begin
  insert into evento (titulo, tipo, inicio, criado_por) values ('Ida ao zoológico', 'passeio', now(), auth.uid());
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Só a diretoria%' then raise; end if;
  raise notice 'ok  professora não marca passeio';
end $$;
do $$ begin
  insert into evento (titulo, tipo, inicio, turma_id, criado_por)
  values ('Prova', 'prova', now(), (select id from turma where nome = 'Reforço Tarde'), auth.uid());
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Você só marca eventos nas suas turmas%' then raise; end if;
  raise notice 'ok  professora não marca prova em turma alheia';
end $$;
insert into nota (crianca_id, turma_id, disciplina, avaliacao, valor, lancado_por)
values ('10000000-0000-0000-0000-000000000001', (select id from turma where nome = 'Reforço Manhã'), 'Português', 'Prova 1', 8, auth.uid());
select pg_temp.checa(true, 'Beatriz lança nota de aluno da turma');
do $$ begin
  insert into nota (crianca_id, turma_id, disciplina, avaliacao, valor, lancado_por)
  values ('10000000-0000-0000-0000-000000000002', (select id from turma where nome = 'Reforço Tarde'), 'Português', 'Prova 1', 8, auth.uid());
  raise exception 'deveria ter falhado';
exception when insufficient_privilege then raise notice 'ok  professora não lança nota de aluno de outra turma';
end $$;

-- ── Elias (gestão) confirma a doação prometida ──
select pg_temp.entrar('00000000-0000-0000-0000-00000000000a');
select public.confirmar_compromisso((select id from compromisso_doacao limit 1));
select pg_temp.checa((select quantidade_atendida from carencia where titulo = 'Vaquinha do telhado') = 300
  and (select status from compromisso_doacao limit 1) = 'confirmado'
  and exists (select 1 from doacao where valor = 300), 'confirmação vira doação e soma na vaquinha');
insert into evento (titulo, tipo, inicio, criado_por) values ('Visita à TechNorte', 'visita_empresa', now() + interval '10 days', auth.uid());
select pg_temp.checa(true, 'diretoria marca visita a empresa');
insert into config_pix (chave, tipo_chave, titular, atualizado_por) values ('12.345.678/0001-90', 'cnpj', 'Instituto Ebenezer', auth.uid());
select pg_temp.checa(true, 'diretoria cadastra o PIX');
select pg_temp.checa(public.cadastrar_pessoa('nova.mae@exemplo.com', 'senha12345', 'Joana', 'responsavel') is not null,
  'diretoria cadastra responsável com login');
select pg_temp.checa(public.cadastrar_crianca('Bia S.', (extract(year from current_date) - 8)::smallint,
  (select id from turma where nome = 'Reforço Manhã'), 'A900',
  (select id from perfil where nome = 'Joana'), 'mãe') is not null, 'diretoria cadastra criança, matrícula e vínculo');
select pg_temp.checa(public.liberar_acesso_estudante((select id from crianca where nome_exibicao = 'Bia S.'), 'bia@exemplo.com', 'senha12345') is not null,
  'diretoria libera o acesso da aluna');
do $$ begin
  perform public.cadastrar_crianca('Beatriz Souza Lima', 2017::smallint, null);
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Use só o primeiro nome%' then raise; end if;
  raise notice 'ok  cadastro recusa nome completo de criança';
end $$;
do $$ begin
  perform public.cadastrar_pessoa('nova.mae@exemplo.com', 'senha12345', 'Outra', 'responsavel');
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Já existe uma conta%' then raise; end if;
  raise notice 'ok  e-mail repetido é recusado';
end $$;
-- A nova mãe entra e vê a filha (vínculo aguardando autorização dela).
select pg_temp.entrar((select id from perfil where nome = 'Joana'));
select pg_temp.checa((select count(*) from responsavel_crianca where consentimento_em is null) = 1, 'nova mãe vê o vínculo e autoriza no primeiro acesso');
select pg_temp.checa((select chave from config_pix) = '12.345.678/0001-90', 'quem vai doar vê o PIX do Instituto');
select pg_temp.entrar('00000000-0000-0000-0000-00000000000a');

-- ── Visitante (anônimo) ──
reset role; set role anon; select pg_temp.entrar(null);
-- Sem permissão de tabela (aqui) ou com zero linhas pela RLS (Supabase dá select padrão ao anônimo): os dois protegem.
do $$ begin
  if (select count(*) from evento) + (select count(*) from nota) > 0 then raise exception 'FALHOU: visitante viu agenda ou notas'; end if;
  raise notice 'ok  visitante não vê agenda nem notas';
exception when insufficient_privilege then raise notice 'ok  visitante não vê agenda nem notas';
end $$;
do $$ begin
  perform 1 from ranking_apoiadores;
  raise exception 'deveria ter falhado';
exception when insufficient_privilege then raise notice 'ok  visitante não acessa o ranking';
end $$;
do $$ begin
  perform 1 from equipe_contato;
  raise exception 'deveria ter falhado';
exception when insufficient_privilege then raise notice 'ok  visitante não vê a lista da equipe';
end $$;
select pg_temp.checa((select vaquinha from publico_carencias where titulo = 'Vaquinha do telhado'), 'vitrine pública já mostra a vaquinha');

\echo '\nTodos os testes da vida escolar passaram.'
