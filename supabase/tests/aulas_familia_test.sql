-- Teste das aulas em família (migração 10). Roda depois de permissoes_test.sql e
-- escola_test.sql, na mesma sessão: reaproveita as pessoas criadas por eles.
\set ON_ERROR_STOP on
\set QUIET on

reset role; select pg_temp.entrar(null);
insert into curso_familia (id, slug, titulo, chamada, descricao, tema, vagas_familias, status) values
 ('20000000-0000-0000-0000-000000000001', 'teste-ia', 'IA em família', 'chamada', 'descrição', 'ia', 2, 'inscricoes_abertas'),
 ('20000000-0000-0000-0000-000000000002', 'teste-rascunho', 'Rascunho', 'chamada', 'descrição', 'financas', 10, 'rascunho');
insert into encontro_familia (curso_id, numero, titulo, resumo, inicio) values
 ('20000000-0000-0000-0000-000000000001', 1, 'Encontro 1', 'resumo', now() + interval '10 days');

-- ── Visitante ──
set role anon;
select pg_temp.checa((select count(*) from publico_cursos_familia) = 1, 'visitante vê o curso aberto e não vê o rascunho');
select pg_temp.checa((select vagas_restantes from publico_cursos_familia) = 2, 'vitrine mostra as vagas restantes');
select pg_temp.checa((select inscrever_familia('20000000-0000-0000-0000-000000000001', 'Ana P.', '11 98888-0001', '{14}')->>'status') = 'inscrita',
  'visitante se inscreve sem conta');
do $$ begin
  perform inscrever_familia('20000000-0000-0000-0000-000000000001', 'Bia', '11 98888-0002', '{9}');
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Este curso é para jovens de 12 a 17 anos%' then raise; end if;
  raise notice 'ok  idade fora da faixa é recusada com mensagem clara';
end $$;
do $$ begin
  perform inscrever_familia('20000000-0000-0000-0000-000000000001', 'Ana de novo', '(11) 98888-0001', '{15}');
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Já existe uma inscrição com este contato%' then raise; end if;
  raise notice 'ok  mesmo contato não se inscreve duas vezes';
end $$;
do $$ begin
  perform 1 from inscricao_familia;
  raise exception 'deveria ter falhado';
exception when insufficient_privilege then raise notice 'ok  visitante não lê a lista de inscritos';
end $$;
do $$ begin
  perform inscrever_familia('20000000-0000-0000-0000-000000000002', 'Caio', '11 98888-0003', '{13}');
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'As inscrições deste curso não estão abertas%' then raise; end if;
  raise notice 'ok  rascunho não recebe inscrição';
end $$;

-- ── Adriana (logada) ocupa a última vaga; a próxima família vai para a espera ──
reset role; set role authenticated;
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
select pg_temp.checa((select inscrever_familia('20000000-0000-0000-0000-000000000001', 'Adriana', '11 97777-0001', '{13,16}', 1::smallint, true)->>'status') = 'inscrita',
  'Adriana inscreve a família com dois filhos adolescentes');
select pg_temp.checa((select count(*) from inscricao_familia) = 1, 'Adriana vê só a própria inscrição');
select pg_temp.entrar('00000000-0000-0000-0000-0000000000d1');
select pg_temp.checa((select inscrever_familia('20000000-0000-0000-0000-000000000001', 'Marisa', '11 96666-0001', '{12}')) = '{"status": "lista_espera", "posicao_espera": 1}'::jsonb,
  'curso lotado manda para a lista de espera, com a posição');

-- ── Equipe de educação não lê inscrições; a gestão lê e trata ──
select pg_temp.entrar('00000000-0000-0000-0000-00000000000e');
select pg_temp.checa((select count(*) from inscricao_familia) = 0, 'a equipe de educação não vê os inscritos (inscrição separada)');
select pg_temp.entrar('00000000-0000-0000-0000-00000000000a');
select pg_temp.checa((select count(*) from inscricao_familia) = 3, 'a gestão vê todas as inscrições');
update inscricao_familia set status = 'cancelada' where nome_adulto = 'Ana P.';
select pg_temp.checa((select status from inscricao_familia where nome_adulto = 'Marisa') = 'inscrita',
  'ao cancelar uma inscrição, a primeira da lista de espera ganha a vaga');
select pg_temp.checa(not exists (select 1 from information_schema.columns where table_name = 'inscricao_familia'
  and column_name ~ 'nome_jovem|crianca'), 'do jovem, o banco guarda só a idade');

\echo '\nTodos os testes das aulas em família passaram.'
