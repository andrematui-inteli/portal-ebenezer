-- Teste das permissões por perfil. Roda em banco local com o stub do Supabase.
-- Cada bloco entra como um perfil e confere o que ele vê e o que não consegue fazer.
\set ON_ERROR_STOP on
\set QUIET on

create or replace function pg_temp.entrar(u uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(u::text, ''), false) $$;
create or replace function pg_temp.checa(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FALHOU: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;
grant execute on all functions in schema pg_temp to authenticated, anon;

-- ── Fixture (como dono do banco) ──
insert into auth.users (id) values
 ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000e'),
 ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000a2'),
 ('00000000-0000-0000-0000-0000000000b1'), ('00000000-0000-0000-0000-0000000000b2'),
 ('00000000-0000-0000-0000-0000000000d1'), ('00000000-0000-0000-0000-0000000000d2');
insert into perfil (id, papel, nome, exibir_nome_publico, nome_publico) values
 ('00000000-0000-0000-0000-00000000000a','gestao','Elias',false,null),
 ('00000000-0000-0000-0000-00000000000e','educacao','Beatriz',false,null),
 ('00000000-0000-0000-0000-0000000000a1','responsavel','Adriana',false,null),
 ('00000000-0000-0000-0000-0000000000a2','responsavel','Rosa',false,null),
 ('00000000-0000-0000-0000-0000000000b1','estudante','Kauã',false,null),
 ('00000000-0000-0000-0000-0000000000b2','estudante','Lia',false,null),
 ('00000000-0000-0000-0000-0000000000d1','doador_pf','Marisa',true,'Marisa S.'),
 ('00000000-0000-0000-0000-0000000000d2','doador_pf','Jonas',false,null);
insert into crianca (id, nome_exibicao, ano_nascimento, codigo_parceiro) values
 ('10000000-0000-0000-0000-000000000001','Kauã R.',2016,'A001'),
 ('10000000-0000-0000-0000-000000000002','Lia M.',2017,'A002'),
 ('10000000-0000-0000-0000-000000000003','Davi S.',2015,'A003');
insert into matricula (crianca_id, turma_id, inicio)
select c, (select id from turma where nome = t), '2026-02-01' from (values
 ('10000000-0000-0000-0000-000000000001'::uuid,'Reforço Manhã'),
 ('10000000-0000-0000-0000-000000000001'::uuid,'Vivências A'),
 ('10000000-0000-0000-0000-000000000002'::uuid,'Reforço Tarde'),
 ('10000000-0000-0000-0000-000000000003'::uuid,'Sonhos A')) v(c,t);
insert into educador_turma select '00000000-0000-0000-0000-00000000000e', id from turma where nome = 'Reforço Manhã';
insert into responsavel_crianca values
 ('00000000-0000-0000-0000-0000000000a1','10000000-0000-0000-0000-000000000001','mãe', now(), null),
 ('00000000-0000-0000-0000-0000000000a2','10000000-0000-0000-0000-000000000002','avó', now() - interval '30 days', now());
insert into acesso_estudante values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a1', now(), null),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000a2', now(), now());
-- Dados da Lia e do Davi entram pela gestão (fora das turmas da Beatriz).
insert into presenca (crianca_id, turma_id, data, presente)
select '10000000-0000-0000-0000-000000000002', id, current_date - 1, true from turma where nome = 'Reforço Tarde';
insert into avaliacao (crianca_id, disciplina, data_avaliacao, nivel_codigo, blocos_acumulados) values
 ('10000000-0000-0000-0000-000000000002','leitura','2026-03-01','desbravador',1.0);
insert into carencia (titulo, categoria, quantidade_necessaria, quantidade_atendida, publicacao, criado_por) values
 ('Cadernos','material_pedagogico',100,40,'publicado','00000000-0000-0000-0000-00000000000a'),
 ('Ventiladores','infraestrutura',4,0,'aguardando_aprovacao','00000000-0000-0000-0000-00000000000e');
insert into doacao (apoiador_id, valor, data, forma, registrado_por, carencia_id) values
 ('00000000-0000-0000-0000-0000000000d1',100,'2026-08-10','pix','00000000-0000-0000-0000-00000000000a',(select id from carencia where titulo='Cadernos')),
 ('00000000-0000-0000-0000-0000000000d1',100,'2026-09-10','pix','00000000-0000-0000-0000-00000000000a',null),
 ('00000000-0000-0000-0000-0000000000d2',50,'2026-09-12','pix','00000000-0000-0000-0000-00000000000a',null);

set role authenticated;

-- ── Beatriz (educação, só Reforço Manhã) importa dados ──
select pg_temp.entrar('00000000-0000-0000-0000-00000000000e');
select pg_temp.checa((public.importar('presenca','presenca.xlsx',
  '[{"codigo":"A001","turma":"Reforço Manhã","data":"2026-10-01","presente":true},
    {"codigo":"A001","turma":"Reforço Manhã","data":"2026-10-02","presente":false},
    {"codigo":"A002","turma":"Reforço Tarde","data":"2026-10-02","presente":true},
    {"codigo":"X999","turma":"Reforço Manhã","data":"2026-10-02","presente":true}]'::jsonb, false)
  ->'erros') @> '[{"linha":3},{"linha":4}]', 'prévia aponta turma alheia e código inexistente, linha a linha');
select pg_temp.checa((select count(*) from presenca where data >= '2026-10-01') = 0, 'prévia não grava nada');

do $$ begin
  perform public.importar('presenca','presenca.xlsx',
    '[{"codigo":"X999","turma":"Reforço Manhã","data":"2026-10-02","presente":true}]'::jsonb, true);
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Importação cancelada%' then raise; end if;
  raise notice 'ok  confirmação com erro cancela tudo';
end $$;

select public.importar('presenca','presenca.xlsx',
  '[{"codigo":"A001","turma":"Reforço Manhã","data":"2026-10-01","presente":true},
    {"codigo":"A001","turma":"Reforço Manhã","data":"2026-10-02","presente":false}]'::jsonb, true) is not null;
select public.importar('avaliacao','alicerce-marco.csv',
  '[{"codigo":"A001","disciplina":"leitura","data":"2026-03-01","nivel":"Desbravador","blocos":1.5}]'::jsonb, true) is not null;
select pg_temp.checa((select count(*) from conquista) = 0, 'linha de base não gera conquista');
select (public.importar('avaliacao','alicerce-setembro.csv',
  '[{"codigo":"A001","disciplina":"leitura","data":"2026-09-01","nivel":"Mochileiro","blocos":3.2}]'::jsonb, true)->>'lote') as lote_set \gset
select pg_temp.checa((select count(*) from conquista where tipo_codigo = 'bloco') = 2
  and (select count(*) from conquista where tipo_codigo = 'nivel') = 1,
  'avanço de 1,5 para 3,2 blocos e novo nível geram 3 conquistas');

select pg_temp.checa((public.importar('presenca','viv.xlsx',
  '[{"codigo":"A001","turma":"Vivências A","data":"2026-10-03","presente":true}]'::jsonb, false)->'erros') <> '[]',
  'Vivências recusa presença individual (e a turma nem é da Beatriz)');

select pg_temp.checa((select count(distinct crianca_id) from avaliacao) = 1, 'Beatriz vê avaliações só da própria turma');
select pg_temp.checa((select count(*) from matricula) = 1, 'Beatriz não vê a matrícula do Kauã em Vivências');
select pg_temp.checa((select count(*) from doacao) = 0, 'Beatriz não vê doações');

do $$ begin
  update perfil set papel = 'gestao' where id = auth.uid();
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Somente a gestão%' then raise; end if;
  raise notice 'ok  Beatriz não consegue virar gestão';
end $$;

do $$ begin
  insert into aviso (titulo, corpo, autor_id, publicacao)
  values ('Festa', 'Sábado', auth.uid(), 'publicado');
  raise exception 'deveria ter falhado';
exception when insufficient_privilege then
  raise notice 'ok  aviso aberto ao público não publica sem aprovação';
end $$;
insert into aviso (titulo, corpo, autor_id, publico_alvo, data_evento, o_que_levar)
values ('Passeio à Pinacoteca', 'Saída às 9h', auth.uid(), '{responsavel}', now() + interval '4 days', 'Lanche e garrafa de água');

-- ── Adriana (responsável com consentimento) ──
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
select pg_temp.checa((select count(*) from presenca) = 2 and (select count(distinct crianca_id) from presenca) = 1,
  'Adriana vê a presença só do filho');
select pg_temp.checa((select serie_equivalente from avaliacao_traduzida order by data_avaliacao desc limit 1) = '3º ano',
  'avanço chega traduzido em série escolar');
select pg_temp.checa((select count(*) from matricula) = 2, 'Adriana vê as duas matrículas do filho, inclusive Vivências');
select pg_temp.checa((select count(*) from aviso) = 1, 'Adriana vê o aviso dirigido a responsáveis');
select pg_temp.checa((select count(*) from doacao) = 0, 'Adriana não vê doações');

-- ── Rosa (responsável que revogou o consentimento) ──
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a2');
select pg_temp.checa((select count(*) from crianca) = 1, 'Rosa ainda vê o vínculo com a neta');
select pg_temp.checa((select count(*) from presenca) + (select count(*) from avaliacao) = 0,
  'consentimento revogado suspende a exibição');

-- ── Kauã (estudante ativo) ──
select pg_temp.entrar('00000000-0000-0000-0000-0000000000b1');
select pg_temp.checa((select count(*) from conquista) = 3, 'Kauã vê as próprias conquistas');
select pg_temp.checa((select count(*) from avaliacao where crianca_id <> '10000000-0000-0000-0000-000000000001') = 0,
  'Kauã não vê avaliação de outra criança');
select pg_temp.checa((select count(*) from aviso) = 0, 'Kauã não alcança avisos adultos');
select pg_temp.checa((select count(*) from perfil) = 1, 'Kauã só vê o próprio perfil');

-- ── Lia (estudante com acesso suspenso) ──
select pg_temp.entrar('00000000-0000-0000-0000-0000000000b2');
select pg_temp.checa((select count(*) from avaliacao) + (select count(*) from conquista) + (select count(*) from crianca) = 0,
  'acesso suspenso pelo responsável não vê nada');

-- ── Marisa e Jonas (doadores) ──
select pg_temp.entrar('00000000-0000-0000-0000-0000000000d1');
select pg_temp.checa((select sum(valor) from doacao) = 200, 'Marisa vê o próprio histórico de doações');
select pg_temp.checa((select count(*) from crianca) + (select count(*) from presenca) = 0, 'Marisa não vê crianças');
select pg_temp.entrar('00000000-0000-0000-0000-0000000000d2');
select pg_temp.checa((select count(*) from doacao) = 1, 'Jonas não vê a doação da Marisa');

-- ── Visitante (anônimo) ──
reset role; set role anon; select pg_temp.entrar(null);
select pg_temp.checa((select count(*) from publico_carencias) = 1, 'visitante vê só a carência aprovada');
select pg_temp.checa((select progresso_pct from publico_carencias) = 40, 'vitrine mostra o progresso da carência');
select pg_temp.checa((select meses_de_apoio from publico_reconhecimento where nome_publico = 'Marisa S.') = 2
  and (select count(*) from publico_reconhecimento) = 1, 'reconhecimento por constância, só de quem autorizou');
select pg_temp.checa(not exists (select 1 from information_schema.columns
  where table_name = 'publico_reconhecimento' and column_name ilike '%valor%'), 'reconhecimento não tem coluna de valor');
select pg_temp.checa((select criancas_atendidas from publico_programas where codigo = 'reforco') is null,
  'programa com menos de 5 crianças tem o número suprimido');
select pg_temp.checa((select count(*) from crianca) + (select count(*) from doacao) + (select count(*) from perfil) = 0,
  'visitante não vê dado individual');
do $$ begin
  insert into solicitacao_acesso (nome, contato, papel_pretendido) values ('Ana', '11999990000', 'responsavel');
  raise notice 'ok  visitante consegue solicitar acesso';
end $$;

-- ── Elias (gestão) desfaz o lote de setembro ──
reset role; set role authenticated;
select pg_temp.entrar('00000000-0000-0000-0000-00000000000a');
select public.desfazer_lote(:'lote_set');
select pg_temp.checa((select count(*) from avaliacao where crianca_id = '10000000-0000-0000-0000-000000000001') = 1
  and (select count(*) from conquista) = 0, 'desfazer remove o lote e as conquistas ainda não vistas');
do $$ begin
  insert into presenca (crianca_id, turma_id, data, presente)
  select '10000000-0000-0000-0000-000000000001', id, current_date, true from turma where nome = 'Vivências A';
  raise exception 'deveria ter falhado';
exception when others then
  if sqlerrm not like 'Programa sensível%' then raise; end if;
  raise notice 'ok  nem a gestão grava presença individual em programa sensível';
end $$;

\echo '\nTodos os testes de permissão passaram.'
