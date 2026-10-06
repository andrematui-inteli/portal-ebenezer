-- Portal Ebenézer · Dados sintéticos
-- Gera um Instituto fictício com a mesma estrutura e as mesmas proporções do
-- Relatório Anual 2025: 129 crianças em 4 programas, 110 famílias, presença
-- média perto de 85%, 77% das crianças do reforço no nível inicial de leitura
-- no começo do ano. Nenhum nome, valor ou empresa corresponde a pessoa real.
--
-- Como usar: cole tudo no SQL Editor do Supabase e rode. Pode rodar de novo
-- quando quiser: o script apaga os dados sintéticos anteriores e gera tudo
-- outra vez, com datas relativas a hoje (rode de novo antes de cada demonstração).
--
-- Contas de demonstração (senha de todas: Ebenezer#2026):
--   gestao@ebenezer.test       Elias, gestão
--   educacao@ebenezer.test     Beatriz, coordenação de educação
--   responsavel@ebenezer.test  Adriana, mãe do Kauã e da Ana
--   pendente@ebenezer.test     Rosa, responsável que ainda não autorizou (tela T-11)
--   estudante@ebenezer.test    Kauã, 9 anos, reforço e Laboratório de Sonhos (PIN de saída: 1234)
--   doador@ebenezer.test       Marisa, doadora mensal
--   empresa@ebenezer.test      Roberto, TechNorte Sistemas (empresa fictícia)

-- ───────────────────────── Funções temporárias de apoio ─────────────────────────
create or replace function privado.seed_usuario(p_email text, p_senha text)
returns uuid language plpgsql security definer set search_path = public, extensions, auth as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    p_email, case when p_senha is not null then crypt(p_senha, gen_salt('bf')) end,
    case when p_email is not null then now() end,
    '{"provider":"email","providers":["email"],"sintetico":true}'::jsonb, '{}'::jsonb,
    now(), now(), '', '', '', '');
  if p_senha is not null then
    insert into auth.identities (id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
      'email', now(), now(), now());
  end if;
  return v_id;
end $$;

create or replace function privado.seed_sorteio(opcoes text[]) returns text
language sql volatile as $$ select opcoes[1 + floor(random() * array_length(opcoes, 1))::int] $$;

-- ───────────────────────── Limpeza ─────────────────────────
truncate presenca, presenca_agregada, conquista, avaliacao, marco_turma, lote_alteracao,
  lote_importacao, aviso_visto, aviso, sugestao, solicitacao_acesso, doacao, carencia,
  acesso_estudante, responsavel_crianca, educador_turma, matricula, indicador_valor,
  resumo_ia, crianca cascade;
delete from auth.users where raw_app_meta_data->>'sintetico' = 'true';

select setseed(0.2026);

-- ───────────────────────── Geração ─────────────────────────
do $$
declare
  senha     constant text := 'Ebenezer#2026';
  hoje      constant date := current_date;
  ano       constant int  := extract(year from current_date)::int;
  dt_ini    constant date := make_date(ano, 2, 2);
  rec_ini   constant date := make_date(ano, 7, 13);   -- recesso de julho
  rec_fim   constant date := make_date(ano, 7, 24);
  meninos   text[] := array['Kauã','Davi','Arthur','Heitor','Miguel','Gael','Theo','Bernardo','Samuel','Pedro',
                            'Lucas','Enzo','Ravi','Benício','Isaac','Gustavo','Matheus','Caio','Bento','Murilo',
                            'Vicente','Joaquim','Lorenzo','Otávio','Nicolas','Henrique','Rafael','João','Erick','Yuri'];
  meninas   text[] := array['Ana','Lia','Helena','Alice','Laura','Maria','Valentina','Sophia','Cecília','Isis',
                            'Lívia','Manuela','Antonella','Clara','Yasmin','Luna','Ayla','Eloá','Júlia','Isabela',
                            'Mariana','Agatha','Rebeca','Lorena','Esther','Vitória','Emanuelly','Nicole','Kemily','Bianca'];
  adultos   text[] := array['Jéssica','Patrícia','Fernanda','Aline','Daiane','Simone','Rosângela','Cláudia','Tatiane','Viviane',
                            'Juliana','Priscila','Elaine','Michele','Sueli','Cristiane','Márcia','Andreia','Luana','Gisele',
                            'Carlos','Edson','Rogério','Anderson','Wellington','Marcos','Reginaldo','Fábio','Sérgio','Diego'];
  iniciais  text[] := array['A.','B.','C.','D.','F.','G.','L.','M.','N.','O.','P.','R.','S.','T.','V.'];

  u_gestao uuid; u_gestao2 uuid; u_beatriz uuid; u_aux1 uuid; u_aux2 uuid; u_aux3 uuid; u_helena uuid;
  u_adriana uuid; u_rosa uuid; u_kaua uuid; u_marisa uuid; u_roberto uuid;
  t_ref_m uuid; t_ref_t uuid; t_son_a uuid; t_son_b uuid; t_inf uuid; t_viv_a uuid; t_viv_b uuid;
  v_crianca uuid[] := '{}'; v_familia uuid[] := '{}';
  c uuid; f uuid; i int; j int; k int; idade int; v_nome text; d date; v uuid;
  p numeric; taxa numeric; nivel text; lote uuid; car uuid[] := '{}'; doador uuid; valor numeric;
begin
  select id into t_ref_m from turma where nome = 'Reforço Manhã';
  select id into t_ref_t from turma where nome = 'Reforço Tarde';
  select id into t_son_a from turma where nome = 'Sonhos A';
  select id into t_son_b from turma where nome = 'Sonhos B';
  select id into t_inf   from turma where nome = 'Primeira Infância';
  select id into t_viv_a from turma where nome = 'Vivências A';
  select id into t_viv_b from turma where nome = 'Vivências B';

  -- ── Equipe ──
  u_gestao  := privado.seed_usuario('gestao@ebenezer.test', senha);
  u_gestao2 := privado.seed_usuario(null, null);
  u_beatriz := privado.seed_usuario('educacao@ebenezer.test', senha);
  u_aux1 := privado.seed_usuario(null, null); u_aux2 := privado.seed_usuario(null, null);
  u_aux3 := privado.seed_usuario(null, null); u_helena := privado.seed_usuario(null, null);
  insert into perfil (id, papel, nome, telefone) values
    (u_gestao,  'gestao',   'Elias (gestão)',              '11900000001'),
    (u_gestao2, 'gestao',   'Tesouraria',                  '11900000002'),
    (u_beatriz, 'educacao', 'Beatriz (coordenação)',       '11900000003'),
    (u_aux1,    'educacao', 'Daisy (auxiliar)',            '11900000004'),
    (u_aux2,    'educacao', 'Gabriel (auxiliar)',          '11900000005'),
    (u_aux3,    'educacao', 'Raíza (auxiliar)',            '11900000006'),
    (u_helena,  'educacao', 'Helena (Vivências)',          '11900000007');
  insert into educador_turma values
    (u_beatriz, t_ref_m), (u_beatriz, t_ref_t), (u_beatriz, t_son_a), (u_beatriz, t_son_b), (u_beatriz, t_inf),
    (u_aux1, t_ref_m), (u_aux2, t_ref_t), (u_aux3, t_son_a), (u_aux3, t_son_b), (u_aux1, t_inf),
    (u_helena, t_viv_a), (u_helena, t_viv_b);

  -- ── 129 crianças ──
  -- 1–20: Primeira Infância (3–5 anos) · 21–60: Reforço (40) · 56–115: Sonhos (60, 5 em ambos)
  -- 116–129: só Vivências (14) · Vivências também recebe 10 crianças de outros programas
  for i in 1..129 loop
    if i <= 20 then idade := 3 + floor(random() * 3)::int;
    elsif i <= 60 then
      idade := case when random() < 0.02 then 6 when random() < 0.63 then 7 + floor(random() * 4)::int
                    else 11 + floor(random() * 2)::int end;
    else idade := 6 + floor(random() * 6)::int;
    end if;
    v_nome := case when i % 2 = 0 then privado.seed_sorteio(meninos) else privado.seed_sorteio(meninas) end;
    if i = 60 then v_nome := 'Kauã'; idade := 9; end if;
    if i = 8  then v_nome := 'Ana';  idade := 4; end if;
    insert into crianca (nome_exibicao, ano_nascimento, codigo_parceiro, criado_em)
    values (v_nome || ' ' || case when i in (8, 60) then 'R.' else privado.seed_sorteio(iniciais) end,
            ano - idade, 'EBZ' || lpad(i::text, 4, '0'), dt_ini - 30)
    returning id into c;
    v_crianca := v_crianca || c;

    if i <= 20 then insert into matricula (crianca_id, turma_id, inicio) values (c, t_inf, dt_ini); end if;
    if i between 21 and 60 then
      insert into matricula (crianca_id, turma_id, inicio)
      values (c, case when i % 2 = 0 then t_ref_m else t_ref_t end, dt_ini);
    end if;
    if i between 56 and 115 then
      insert into matricula (crianca_id, turma_id, inicio)
      values (c, case when i % 2 = 0 then t_son_a else t_son_b end, dt_ini);
    end if;
    if i >= 116 or (i between 21 and 115 and i % 9 = 0) then
      insert into matricula (crianca_id, turma_id, inicio)
      values (c, case when i % 2 = 0 then t_viv_a else t_viv_b end, dt_ini);
    end if;
  end loop;

  -- ── 110 famílias: crianças 20–129 têm cada uma a sua; 1–19 são irmãs de 20+5i ──
  u_adriana := privado.seed_usuario('responsavel@ebenezer.test', senha);
  u_rosa    := privado.seed_usuario('pendente@ebenezer.test', senha);
  for i in 20..129 loop
    if i = 60 then f := u_adriana;
    elsif i = 20 then f := u_rosa;
    else f := privado.seed_usuario(null, null);
    end if;
    insert into perfil (id, papel, nome, telefone)
    values (f, 'responsavel',
            case when i = 60 then 'Adriana' when i = 20 then 'Rosa' else privado.seed_sorteio(adultos) end,
            '119' || lpad((70000000 + i * 1371)::text, 8, '0'));
    v_familia := v_familia || f;
  end loop;
  for i in 1..129 loop
    j := case when i <= 19 then 20 + 5 * i else i end;   -- criança "âncora" da família
    f := v_familia[j - 19];
    taxa := random();
    insert into responsavel_crianca (responsavel_id, crianca_id, parentesco, consentimento_em, consentimento_revogado_em)
    values (f, v_crianca[i],
      privado.seed_sorteio(array['mãe','mãe','mãe','pai','avó','tia']),
      case when j = 20 then null when j = 60 then dt_ini + 3
           when taxa < 0.05 then null else dt_ini + floor(random() * 40)::int end,
      case when j in (20, 60) then null when taxa between 0.05 and 0.08 then hoje - 20 end);
  end loop;

  -- ── Acesso de estudantes (alfabetizados, família com consentimento ativo) ──
  u_kaua := privado.seed_usuario('estudante@ebenezer.test', senha);
  insert into perfil (id, papel, nome) values (u_kaua, 'estudante', 'Kauã');
  insert into acesso_estudante (crianca_id, perfil_id, liberado_por, liberado_em)
  values (v_crianca[60], u_kaua, u_adriana, dt_ini + 10);
  update acesso_estudante set pin_saida_hash = crypt('1234', gen_salt('bf')) where perfil_id = u_kaua;
  for i in 21..115 loop
    continue when i = 60 or random() > 0.3;
    select rc.responsavel_id into f from responsavel_crianca rc
      where rc.crianca_id = v_crianca[i] and rc.consentimento_em is not null and rc.consentimento_revogado_em is null;
    continue when f is null;
    v := privado.seed_usuario(null, null);
    insert into perfil (id, papel, nome) values (v, 'estudante',
      (select split_part(nome_exibicao, ' ', 1) from crianca where id = v_crianca[i]));
    insert into acesso_estudante (crianca_id, perfil_id, liberado_por, liberado_em, suspenso_em)
    values (v_crianca[i], v, f, dt_ini + floor(random() * 120)::int,
            case when i = 33 then hoje - 10 end);
  end loop;

  -- ── Propensão de presença por criança (média ~85%; 4 crianças em queda recente) ──
  create temp table seed_prop on commit drop as
  select c.id as crianca_id,
         least(0.99, greatest(0.45, 0.865 + (random() + random() + random() - 1.5) * 0.16)) as prop,
         c.codigo_parceiro in ('EBZ0023','EBZ0031','EBZ0047','EBZ0074') as queda
  from crianca c;

  -- ── Presença individual ──
  -- Reforço: dias úteis até 3 dias atrás. Sonhos: sábados até o último.
  -- Primeira Infância: parou há 4 semanas (demonstra o estado "desatualizado").
  insert into presenca (crianca_id, turma_id, data, presente)
  select m.crianca_id, m.turma_id, gs.dia::date,
         random() < sp.prop * case when sp.queda and gs.dia > hoje - 21 then 0.35 else 1 end
  from matricula m
  join turma t on t.id = m.turma_id
  join programa pr on pr.id = t.programa_id and not pr.sensivel
  join seed_prop sp on sp.crianca_id = m.crianca_id
  cross join generate_series(dt_ini, hoje - 1, interval '1 day') gs(dia)
  where gs.dia::date not between rec_ini and rec_fim
    and ((pr.cadencia = 'diaria' and extract(isodow from gs.dia) <= 5 and gs.dia <= hoje - 3)
      or (pr.cadencia = 'semanal' and extract(isodow from gs.dia) = 6
          and (pr.codigo <> 'infancia' or gs.dia <= hoje - 28)));

  -- ── Presença agregada das Vivências ──
  insert into presenca_agregada (turma_id, data, presentes, possiveis)
  select t.id, gs.dia::date, least(12, greatest(5, round(12 * (0.82 + (random() - 0.5) * 0.25))))::int, 12
  from turma t cross join generate_series(dt_ini, hoje - 1, interval '1 day') gs(dia)
  where t.id in (t_viv_a, t_viv_b) and extract(isodow from gs.dia) = 6
    and gs.dia::date not between rec_ini and rec_fim;

  -- ── Lotes de importação: um por programa e mês, como a equipe faria ──
  create temp table seed_lote on commit drop as
  with x as (
    select pr.id as programa_id, pr.codigo, date_trunc('month', p.data)::date as mes, max(p.data) as ultima, count(*) as n
    from presenca p join turma t on t.id = p.turma_id join programa pr on pr.id = t.programa_id group by 1, 2, 3
    union all
    select pr.id, pr.codigo, date_trunc('month', p.data)::date, max(p.data), count(*)
    from presenca_agregada p join turma t on t.id = p.turma_id join programa pr on pr.id = t.programa_id group by 1, 2, 3)
  select x.*, gen_random_uuid() as lote_id from x;

  insert into lote_importacao (id, tipo, arquivo_nome, importado_por, importado_em, criadas)
  select lote_id, case when codigo = 'vivencias' then 'presenca_agregada' else 'presenca' end::tipo_importacao,
         'presenca-' || codigo || '-' || to_char(mes, 'YYYY-MM') || '.xlsx',
         case when codigo = 'vivencias' then u_helena else u_beatriz end,
         (ultima + 1)::timestamp + interval '10 hours', n
  from seed_lote;
  update presenca p set lote_id = l.lote_id from turma t, seed_lote l
    where t.id = p.turma_id and l.programa_id = t.programa_id and l.mes = date_trunc('month', p.data)::date;
  update presenca_agregada p set lote_id = l.lote_id from turma t, seed_lote l
    where t.id = p.turma_id and l.programa_id = t.programa_id and l.mes = date_trunc('month', p.data)::date;

  -- ── Avaliações de leitura da Alicerce (reforço), uma por mês ──
  -- Posição absoluta em blocos: Desbravador 0–8, Mochileiro 8–12, Navegador 12–16, Mergulhador 16–20.
  -- Linha de base: 77% / 14% / 4% / 5%. Todas as crianças avançam; ritmo médio ~3,2 blocos por ano.
  -- A linha de base é distribuída por posição sorteada, para reproduzir 77/14/4/5 exatamente.
  create temp table seed_aval on commit drop as
  select s.crianca_id,
         case when q <= 0.77 then (case when random() < 0.6 then 8 - 3.5 * random() else 1 + 4 * random() end)
              when q <= 0.91 then 8 + 3.9 * random()
              when q <= 0.95 then 12 + 3.9 * random()
              else 16 + 3 * random() end as p0,
         (1.6 + 3.2 * random()) / 12 as ritmo
  from (select m.crianca_id,
               row_number() over (order by random())::numeric / count(*) over () as q
        from matricula m join turma t on t.id = m.turma_id
        join programa pr on pr.id = t.programa_id and pr.codigo = 'reforco') s;

  for d in select generate_series(dt_ini, hoje - 7, interval '1 month')::date loop
    insert into lote_importacao (tipo, arquivo_nome, importado_por, importado_em)
    values ('avaliacao', 'alicerce-evolucao-' || to_char(d, 'YYYY-MM') || '.csv', u_beatriz, d + interval '3 days 9 hours')
    returning id into lote;
    k := (extract(year from age(d, dt_ini)) * 12 + extract(month from age(d, dt_ini)))::int;
    insert into avaliacao (crianca_id, disciplina, data_avaliacao, nivel_codigo, blocos_acumulados, lote_id)
    select a.crianca_id, 'leitura', d,
           case when pos < 8 then 'desbravador' when pos < 12 then 'mochileiro'
                when pos < 16 then 'navegador' else 'mergulhador' end,
           pos, lote
    from (select crianca_id, round(least(19.9, p0 + ritmo * k + (case when k > 0 then 0.05 else 0 end))::numeric, 2) as pos
          from seed_aval) a;
    update lote_importacao set criadas = (select count(*) from avaliacao where lote_id = lote) where id = lote;
  end loop;

  -- Conquistas ganham a data da avaliação; as de mais de 2 semanas já foram vistas.
  update conquista cq set obtida_em = a.data_avaliacao + interval '3 days 10 hours'
    from avaliacao a where a.lote_id = cq.lote_id and a.crianca_id = cq.crianca_id;
  update conquista set vista_em = obtida_em + interval '2 days' where obtida_em < hoje - 14;

  -- ── Saídas culturais do Laboratório de Sonhos ──
  for i in 1..4 loop
    d := dt_ini + 40 * i;
    continue when d >= hoje;
    insert into conquista (crianca_id, tipo_codigo, referencia, obtida_em, vista_em)
    select m.crianca_id, 'cultural',
           (array['saida-pinacoteca','saida-teatro','saida-museu-catavento','saida-concerto'])[i],
           d, case when d < hoje - 14 then d + 2 end
    from matricula m where m.turma_id in (t_son_a, t_son_b) and random() < 0.75;
  end loop;
  insert into marco_turma (turma_id, tipo_codigo, descricao, atingido_em) values
    (t_ref_m, 'turma-presenca', 'A turma da manhã teve 85% de presença em agosto', make_date(ano, 9, 2)),
    (t_ref_t, 'turma-blocos',   'A turma da tarde somou 20 blocos de leitura no semestre', make_date(ano, 7, 5)),
    (t_son_a, 'turma-presenca', 'A turma A esteve presente em peso na saída à Pinacoteca', dt_ini + 40),
    (t_son_b, 'turma-presenca', 'A turma B fechou junho com 88% de presença', make_date(ano, 7, 1));

  -- ── Carências ──
  insert into carencia (titulo, descricao, categoria, quantidade_necessaria, quantidade_atendida, valor_estimado,
                        prazo, status, publicacao, criado_por, criado_em, aprovado_por, aprovado_em) values
    ('Cadernos para o segundo semestre', '120 cadernos de 96 folhas para o reforço e o Laboratório de Sonhos.', 'material_pedagogico', 120, 84, 1440, hoje + 20, 'parcial', 'publicado', u_beatriz, hoje - 40, u_gestao, hoje - 39),
    ('Lanche dos sábados de novembro', 'Lanche para 140 crianças em 4 sábados.', 'alimentacao', 4, 1, 2800, hoje + 30, 'parcial', 'publicado', u_beatriz, hoje - 15, u_gestao, hoje - 14),
    ('Ventiladores para a sala de leitura', 'A sala passa de 32 °C à tarde. Precisamos de 4 ventiladores de parede.', 'infraestrutura', 4, 0, 1200, hoje + 45, 'aberta', 'publicado', u_beatriz, hoje - 8, u_gestao, hoje - 7),
    ('Ingressos para o teatro infantil', '60 ingressos para a turma do Laboratório de Sonhos.', 'experiencias', 60, 60, 2400, hoje - 10, 'atendida', 'publicado', u_gestao, hoje - 70, u_gestao, hoje - 70),
    ('Livros de literatura infantil', '50 livros para a biblioteca da Primeira Infância.', 'material_pedagogico', 50, 50, 1750, hoje - 30, 'atendida', 'publicado', u_beatriz, hoje - 100, u_gestao, hoje - 99),
    ('Tintas e pincéis para as oficinas', 'Material das oficinas de artes visuais do semestre.', 'material_pedagogico', 30, 12, 900, hoje + 25, 'parcial', 'publicado', u_aux3, hoje - 22, u_gestao, hoje - 21),
    ('Transporte para a saída ao museu', 'Ônibus para 60 crianças e 8 acompanhantes.', 'experiencias', 1, 0, 1600, hoje + 18, 'aberta', 'publicado', u_gestao, hoje - 5, u_gestao, hoje - 5),
    ('Tapete emborrachado', 'Piso de EVA para a sala da Primeira Infância.', 'infraestrutura', 20, 0, 800, hoje + 60, 'aberta', 'aguardando_aprovacao', u_aux1, hoje - 2, null, null),
    ('Jogos de tabuleiro pedagógicos', '10 jogos de matemática para o reforço.', 'material_pedagogico', 10, 0, 650, hoje + 40, 'aberta', 'aguardando_aprovacao', u_beatriz, hoje - 1, null, null),
    ('Kit de limpeza mensal', 'Rascunho em revisão pela coordenação.', 'infraestrutura', 1, 0, 350, null, 'aberta', 'rascunho', u_aux2, hoje - 1, null, null);
  select array_agg(id order by criado_em) into car from carencia where publicacao = 'publicado';

  -- ── Doadores pessoa física (60) e empresas (8, fictícias) ──
  u_marisa := privado.seed_usuario('doador@ebenezer.test', senha);
  insert into perfil (id, papel, nome, exibir_nome_publico, nome_publico, exibicao_autorizada_em)
  values (u_marisa, 'doador_pf', 'Marisa', true, 'Marisa S.', dt_ini);
  for d in select generate_series(dt_ini, hoje, interval '1 month')::date loop
    insert into doacao (apoiador_id, valor, data, forma, registrado_por) values (u_marisa, 100, d + 4, 'pix', u_gestao2);
  end loop;
  insert into doacao (apoiador_id, carencia_id, valor, data, forma, registrado_por)
  values (u_marisa, car[1], 120, hoje - 30, 'pix', u_gestao2);

  for i in 1..59 loop
    doador := privado.seed_usuario(null, null);
    v_nome := privado.seed_sorteio(adultos);
    insert into perfil (id, papel, nome, exibir_nome_publico, nome_publico, exibicao_autorizada_em)
    values (doador, 'doador_pf', v_nome, random() < 0.4, v_nome || ' ' || privado.seed_sorteio(iniciais), dt_ini);
    update perfil set nome_publico = null, exibicao_autorizada_em = null where id = doador and not exibir_nome_publico;
    if random() < 0.4 then   -- doador mensal
      valor := (array[30, 50, 50, 100, 150, 200])[1 + floor(random() * 6)::int];
      for d in select generate_series(dt_ini + floor(random() * 90)::int, hoje, interval '1 month')::date loop
        insert into doacao (apoiador_id, valor, data, forma, registrado_por) values (doador, valor, d, 'pix', u_gestao2);
      end loop;
    else                      -- doador eventual, às vezes para uma carência
      for j in 1..(1 + floor(random() * 3)::int) loop
        insert into doacao (apoiador_id, carencia_id, valor, data, forma, registrado_por)
        values (doador, case when random() < 0.5 then car[1 + floor(random() * array_length(car, 1))::int] end,
                round((50 + random() * 450) / 10) * 10, dt_ini + floor(random() * (hoje - dt_ini))::int,
                privado.seed_sorteio(array['pix','pix','transferencia']), u_gestao2);
      end loop;
    end if;
  end loop;

  u_roberto := privado.seed_usuario('empresa@ebenezer.test', senha);
  insert into perfil (id, papel, nome, exibir_nome_publico, nome_publico, exibicao_autorizada_em)
  values (u_roberto, 'empresa', 'Roberto (TechNorte Sistemas)', true, 'TechNorte Sistemas', dt_ini);
  insert into doacao (apoiador_id, carencia_id, valor, data, forma, registrado_por) values
    (u_roberto, null, 5000, dt_ini + 10, 'transferencia', u_gestao2),
    (u_roberto, car[4], 2400, hoje - 75, 'transferencia', u_gestao2),
    (u_roberto, null, 5000, make_date(ano, 7, 10), 'transferencia', u_gestao2);
  for v_nome in select unnest(array['Construtora Horizonte','Farmácias Bem-Estar','Alvorada Logística','Padaria Pão do Bairro',
                                  'Mercado Jardim','Academia Ritmo','Consultoria Prisma']) loop
    doador := privado.seed_usuario(null, null);
    insert into perfil (id, papel, nome, exibir_nome_publico, nome_publico, exibicao_autorizada_em)
    values (doador, 'empresa', v_nome, random() < 0.7, v_nome, dt_ini);
    for j in 1..(1 + floor(random() * 3)::int) loop
      insert into doacao (apoiador_id, carencia_id, valor, quantidade, data, forma, registrado_por)
      values (doador, case when random() < 0.4 then car[1 + floor(random() * array_length(car, 1))::int] end,
              round((1000 + random() * 7000) / 100) * 100, null,
              dt_ini + floor(random() * (hoje - dt_ini))::int, 'transferencia', u_gestao2);
    end loop;
  end loop;

  -- ── Avisos ──
  insert into aviso (titulo, corpo, publico_alvo, data_evento, o_que_levar, publicacao, autor_id, criado_em, aprovado_por, aprovado_em) values
    ('Saída ao Museu Catavento', 'Vamos ao museu com as turmas do Laboratório de Sonhos. Saída às 9h do Instituto, volta às 15h.', '{responsavel}', hoje + 11 + 9/24.0 * interval '1 day', 'Lanche, garrafa de água e a camiseta do Instituto', 'publicado', u_beatriz, hoje - 3, null, null),
    ('Reunião de famílias do reforço', 'Conversa sobre o avanço da turma no semestre, com a equipe da Alicerce.', '{responsavel}', (hoje + 6)::timestamp + interval '18 hours', null, 'publicado', u_beatriz, hoje - 5, null, null),
    ('Não haverá reforço na sexta', 'A sexta-feira é ponto facultativo. O reforço volta na segunda.', '{responsavel,educacao}', (hoje + 4)::timestamp, null, 'publicado', u_beatriz, hoje - 1, null, null),
    ('Festa de fim de ano', 'Apresentação das oficinas e exposição dos desenhos das crianças. Aberto à comunidade.', null, make_date(ano, 12, 12)::timestamp + interval '14 hours', 'Um prato de doce ou salgado para partilhar', 'publicado', u_gestao, hoje - 10, u_gestao, hoje - 10),
    ('Prestação de contas do semestre', 'O relatório do primeiro semestre já está disponível no painel de apoiadores.', '{doador_pf,empresa}', null, null, 'publicado', u_gestao, hoje - 60, u_gestao, hoje - 60),
    ('Campanha de cadernos', 'Ajude a completar os cadernos do segundo semestre.', null, null, null, 'aguardando_aprovacao', u_beatriz, hoje - 1, null, null),
    ('Vacinação na UBS', 'A UBS do bairro faz campanha de vacinação no sábado. Leve a carteirinha.', '{responsavel}', (hoje - 20)::timestamp + interval '9 hours', 'Carteirinha de vacinação', 'publicado', u_beatriz, hoje - 26, null, null);
  insert into aviso_visto (aviso_id, perfil_id) select id, u_adriana from aviso where criado_em < hoje - 4 and publicacao = 'publicado';

  -- ── Sugestões e solicitações ──
  insert into sugestao (autor_id, texto, criada_em, resposta, respondida_por, respondida_em) values
    (u_adriana, 'Seria bom ter o horário do reforço no aplicativo.', hoje - 30, 'Boa ideia! O horário já aparece na tela de cada programa.', u_beatriz, hoje - 28),
    (v_familia[10], 'Meu filho adorou a saída ao teatro. Façam mais!', hoje - 12, 'Que bom! Já estamos organizando a próxima.', u_beatriz, hoje - 11),
    (v_familia[25], 'O aviso da reunião chegou em cima da hora.', hoje - 6, null, null, null),
    (u_marisa, 'Gostaria de receber um resumo trimestral por e-mail.', hoje - 9, null, null, null),
    (v_familia[40], 'Dá para avisar quando faltar lanche? A gente ajuda.', hoje - 2, null, null, null);
  insert into solicitacao_acesso (nome, contato, papel_pretendido, mensagem, criada_em) values
    ('Luciana P.', '11988887777', 'responsavel', 'Meu filho entrou no reforço este mês.', hoje - 2),
    ('Grupo Ipê Engenharia', 'contato@ipe.test', 'empresa', 'Queremos apoiar o Instituto.', hoje - 4),
    ('Paulo T.', 'paulo@exemplo.test', 'doador_pf', null, hoje - 1);

  -- ── Indicadores mensais, calculados a partir dos próprios dados ──
  insert into indicador_valor (indicador_codigo, periodo, valor, atualizado_em)
  select 'taxa_presenca', mes, round(100.0 * sum(pres) / sum(poss), 1), mes + interval '1 month 2 days'
  from (select date_trunc('month', data)::date mes, count(*) filter (where presente) pres, count(*) poss from presenca group by 1
        union all
        select date_trunc('month', data)::date, sum(presentes), sum(possiveis) from presenca_agregada group by 1) x
  group by mes having mes < date_trunc('month', hoje);
  insert into indicador_valor (indicador_codigo, periodo, valor, atualizado_em)
  select 'criancas_atendidas', date_trunc('month', gs.dia)::date, 129, gs.dia + interval '2 days'
  from generate_series(dt_ini, hoje - 30, interval '1 month') gs(dia);
  insert into indicador_valor (indicador_codigo, periodo, valor, atualizado_em)
  select 'avanco_medio_blocos', a.data_avaliacao, round(avg(a.blocos_acumulados - b.blocos_acumulados), 2), a.data_avaliacao + 3
  from avaliacao a join avaliacao b on b.crianca_id = a.crianca_id and b.data_avaliacao = dt_ini
  where a.data_avaliacao > dt_ini group by a.data_avaliacao;
  insert into indicador_valor (indicador_codigo, periodo, valor, atualizado_em)
  select 'criancas_com_avanco', a.data_avaliacao,
         round(100.0 * count(*) filter (where a.blocos_acumulados - b.blocos_acumulados >= 1) / count(*), 1), a.data_avaliacao + 3
  from avaliacao a join avaliacao b on b.crianca_id = a.crianca_id and b.data_avaliacao = dt_ini
  where a.data_avaliacao > dt_ini group by a.data_avaliacao;
  insert into indicador_valor (indicador_codigo, periodo, valor) values
    ('carencias_atendidas', date_trunc('month', hoje)::date, (select count(*) from carencia where status = 'atendida')),
    ('experiencias_culturais', date_trunc('month', hoje)::date, (select count(*) from conquista where tipo_codigo = 'cultural')),
    ('sroi', make_date(ano - 1, 12, 31), 4.18);

  -- ── Resumos de IA (dois aprovados, um aguardando revisão) ──
  insert into resumo_ia (escopo, periodo, texto, status, gerado_em, aprovado_por, aprovado_em) values
    ('programa:reforco', date_trunc('month', hoje - 30)::date,
     'No último mês, o reforço manteve presença acima de 80% nas duas turmas. A maioria das crianças avançou ao menos um bloco de leitura desde fevereiro, e o grupo no nível inicial ficou menor.',
     'aprovado', hoje - 25, u_gestao, hoje - 24),
    ('patrocinador', date_trunc('month', hoje - 30)::date,
     'Os recursos do semestre garantiram material pedagógico para os quatro programas e as saídas culturais do Laboratório de Sonhos. Os indicadores de presença e avanço seguem a trajetória de 2025.',
     'aprovado', hoje - 20, u_gestao, hoje - 19),
    ('alerta-meta', date_trunc('month', hoje)::date,
     'Quatro crianças do reforço tiveram queda de presença nas últimas três semanas. Vale um contato da equipe com as famílias.',
     'rascunho', hoje - 1, null, null);

  update perfil set ultimo_acesso_em = hoje - floor(random() * 20)::int where papel <> 'estudante' and random() < 0.6;
end $$;

-- ───────────────────────── Remove as funções temporárias ─────────────────────────
drop function privado.seed_usuario(text, text);
drop function privado.seed_sorteio(text[]);

-- Resumo do que foi gerado
select 'crianças' as item, count(*)::text as total from crianca
union all select 'famílias (responsáveis)', count(*)::text from perfil where papel = 'responsavel'
union all select 'estudantes com acesso', count(*)::text from acesso_estudante
union all select 'registros de presença', count(*)::text from presenca
union all select 'presença média (%)', round(100.0 * avg(presente::int), 1)::text from presenca
union all select 'avaliações de leitura', count(*)::text from avaliacao
union all select 'conquistas', count(*)::text from conquista
union all select 'apoiadores', count(*)::text from perfil where papel in ('doador_pf', 'empresa')
union all select 'doações', count(*)::text from doacao
union all select 'contas de demonstração', count(*)::text from auth.users where email like '%@ebenezer.test';
