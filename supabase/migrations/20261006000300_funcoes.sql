-- Portal Ebenézer · Migração 3 · Importação, conquistas e visões
-- Importação (RF-11): o front lê a planilha, envia as linhas em JSON e recebe
-- uma prévia (criadas / alteradas / ignoradas / erros). Só confirma se não
-- houver erro: nenhum dado fica pela metade. Todo lote pode ser desfeito.

alter table conquista add column lote_id uuid references lote_importacao(id) on delete set null;

-- ───────────────────────── Importação ─────────────────────────
create or replace function public.importar(
  p_tipo tipo_importacao, p_arquivo text, p_linhas jsonb, p_confirmar boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_lote uuid; r jsonb; i int := 0;
  v_crianca uuid; v_turma uuid; v_prog programa; v_data date; v_nivel text;
  v_existente record;
  n_criadas int := 0; n_alteradas int := 0; n_ignoradas int := 0;
  erros jsonb := '[]'::jsonb;
begin
  if not privado.eh_equipe() then
    raise exception 'Apenas a equipe de educação e a gestão importam dados';
  end if;

  if p_confirmar then
    insert into lote_importacao (tipo, arquivo_nome, importado_por)
    values (p_tipo, p_arquivo, auth.uid()) returning id into v_lote;
  end if;

  for r in select * from jsonb_array_elements(p_linhas) loop
    i := i + 1;
    begin
      v_data := (r->>'data')::date;

      -- Turma (presença) ou criança (avaliação) precisam existir.
      if p_tipo in ('presenca','presenca_agregada') then
        select t.id into v_turma from turma t where t.nome = r->>'turma' and t.ativo;
        if v_turma is null then
          erros := erros || jsonb_build_object('linha', i, 'mensagem',
            format('Turma "%s" não encontrada. Confira o nome na planilha.', r->>'turma'));
          continue;
        end if;
        select p.* into v_prog from programa p join turma t on t.programa_id = p.id where t.id = v_turma;
        if privado.eh('educacao') and not privado.educa_turma(v_turma) then
          erros := erros || jsonb_build_object('linha', i, 'mensagem',
            format('A turma "%s" não está entre as suas turmas.', r->>'turma'));
          continue;
        end if;
        if p_tipo = 'presenca' and v_prog.sensivel then
          erros := erros || jsonb_build_object('linha', i, 'mensagem',
            'Este programa recebe só o total de presentes por dia, não a lista de crianças.');
          continue;
        end if;
      end if;

      if p_tipo in ('presenca','avaliacao') then
        select c.id into v_crianca from crianca c where c.codigo_parceiro = r->>'codigo' and c.ativo;
        if v_crianca is null then
          erros := erros || jsonb_build_object('linha', i, 'mensagem',
            format('Código "%s" não corresponde a nenhuma criança cadastrada.', r->>'codigo'));
          continue;
        end if;
      end if;

      -- ── Presença individual ──
      if p_tipo = 'presenca' then
        select id, presente into v_existente from presenca
          where crianca_id = v_crianca and turma_id = v_turma and data = v_data;
        if v_existente.id is null then
          n_criadas := n_criadas + 1;
          if p_confirmar then
            insert into presenca (crianca_id, turma_id, data, presente, lote_id)
            values (v_crianca, v_turma, v_data, (r->>'presente')::boolean, v_lote);
          end if;
        elsif v_existente.presente = (r->>'presente')::boolean then
          n_ignoradas := n_ignoradas + 1;
        else
          n_alteradas := n_alteradas + 1;
          if p_confirmar then
            insert into lote_alteracao values (v_lote, 'presenca', v_existente.id,
              jsonb_build_object('presente', v_existente.presente));
            update presenca set presente = (r->>'presente')::boolean, lote_id = v_lote
              where id = v_existente.id;
          end if;
        end if;

      -- ── Presença agregada (programas sensíveis) ──
      elsif p_tipo = 'presenca_agregada' then
        select id, presentes, possiveis into v_existente from presenca_agregada
          where turma_id = v_turma and data = v_data;
        if v_existente.id is null then
          n_criadas := n_criadas + 1;
          if p_confirmar then
            insert into presenca_agregada (turma_id, data, presentes, possiveis, lote_id)
            values (v_turma, v_data, (r->>'presentes')::int, (r->>'possiveis')::int, v_lote);
          end if;
        elsif v_existente.presentes = (r->>'presentes')::int
          and v_existente.possiveis = (r->>'possiveis')::int then
          n_ignoradas := n_ignoradas + 1;
        else
          n_alteradas := n_alteradas + 1;
          if p_confirmar then
            insert into lote_alteracao values (v_lote, 'presenca_agregada', v_existente.id,
              jsonb_build_object('presentes', v_existente.presentes, 'possiveis', v_existente.possiveis));
            update presenca_agregada set presentes = (r->>'presentes')::int,
              possiveis = (r->>'possiveis')::int, lote_id = v_lote where id = v_existente.id;
          end if;
        end if;

      -- ── Avaliação do parceiro ──
      else
        if privado.eh('educacao') and not privado.educa_crianca(v_crianca) then
          erros := erros || jsonb_build_object('linha', i, 'mensagem',
            'Esta criança não está matriculada em nenhuma das suas turmas.');
          continue;
        end if;
        select codigo into v_nivel from nivel_parceiro
          where lower(nome) = lower(r->>'nivel') or codigo = lower(r->>'nivel');
        if v_nivel is null then
          erros := erros || jsonb_build_object('linha', i, 'mensagem',
            format('Nível "%s" não reconhecido. Use Desbravador, Mochileiro, Navegador ou Mergulhador.', r->>'nivel'));
          continue;
        end if;
        select id, nivel_codigo, blocos_acumulados into v_existente from avaliacao
          where crianca_id = v_crianca and disciplina = (r->>'disciplina')::disciplina
            and data_avaliacao = v_data;
        if v_existente.id is null then
          n_criadas := n_criadas + 1;
          if p_confirmar then
            insert into avaliacao (crianca_id, disciplina, data_avaliacao, nivel_codigo, blocos_acumulados, lote_id)
            values (v_crianca, (r->>'disciplina')::disciplina, v_data, v_nivel,
                    (r->>'blocos')::numeric, v_lote);
          end if;
        elsif v_existente.nivel_codigo = v_nivel
          and v_existente.blocos_acumulados = (r->>'blocos')::numeric then
          n_ignoradas := n_ignoradas + 1;
        else
          n_alteradas := n_alteradas + 1;
          if p_confirmar then
            insert into lote_alteracao values (v_lote, 'avaliacao', v_existente.id,
              jsonb_build_object('nivel_codigo', v_existente.nivel_codigo,
                                 'blocos_acumulados', v_existente.blocos_acumulados));
            update avaliacao set nivel_codigo = v_nivel, blocos_acumulados = (r->>'blocos')::numeric,
              lote_id = v_lote where id = v_existente.id;
          end if;
        end if;
      end if;

    exception when invalid_text_representation or invalid_datetime_format
                or datetime_field_overflow or check_violation then
      erros := erros || jsonb_build_object('linha', i, 'mensagem',
        'Valor em formato inesperado (data, número ou sim/não). Confira esta linha.');
    end;
  end loop;

  if p_confirmar then
    if jsonb_array_length(erros) > 0 then
      raise exception 'Importação cancelada: % linha(s) com erro. Nada foi gravado.',
        jsonb_array_length(erros);
    end if;
    update lote_importacao set criadas = n_criadas, alteradas = n_alteradas, ignoradas = n_ignoradas
      where id = v_lote;
  end if;

  return jsonb_build_object('lote', v_lote, 'criadas', n_criadas, 'alteradas', n_alteradas,
    'ignoradas', n_ignoradas, 'erros', erros);
end $$;

create or replace function public.desfazer_lote(p_lote uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a record; v_lote lote_importacao;
begin
  select * into v_lote from lote_importacao where id = p_lote;
  if v_lote.id is null or v_lote.desfeito_em is not null then
    raise exception 'Lote inexistente ou já desfeito';
  end if;
  if not (privado.eh('gestao') or (privado.eh('educacao') and v_lote.importado_por = auth.uid())) then
    raise exception 'Só quem importou ou a gestão pode desfazer';
  end if;

  -- Restaura o que foi alterado, depois apaga o que foi criado.
  for a in select * from lote_alteracao where lote_id = p_lote loop
    if a.tabela = 'presenca' then
      update presenca set presente = (a.anterior->>'presente')::boolean, lote_id = null where id = a.registro_id;
    elsif a.tabela = 'presenca_agregada' then
      update presenca_agregada set presentes = (a.anterior->>'presentes')::int,
        possiveis = (a.anterior->>'possiveis')::int, lote_id = null where id = a.registro_id;
    elsif a.tabela = 'avaliacao' then
      update avaliacao set nivel_codigo = a.anterior->>'nivel_codigo',
        blocos_acumulados = (a.anterior->>'blocos_acumulados')::numeric, lote_id = null where id = a.registro_id;
    end if;
  end loop;
  delete from conquista where lote_id = p_lote and vista_em is null;
  delete from presenca where lote_id = p_lote;
  delete from presenca_agregada where lote_id = p_lote;
  delete from avaliacao where lote_id = p_lote;
  update lote_importacao set desfeito_em = now(), desfeito_por = auth.uid() where id = p_lote;
end $$;

-- ───────────────────────── Conquistas automáticas ─────────────────────────
-- Critérios objetivos: cada bloco pedagógico completo e cada nível novo de leitura.
create or replace function privado.gerar_conquistas() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_blocos_antes numeric; v_ordem_antes int; v_ordem_nova int; b int;
begin
  -- A primeira avaliação é linha de base: não gera conquista.
  select max(blocos_acumulados) into v_blocos_antes from avaliacao
    where crianca_id = new.crianca_id and disciplina = new.disciplina and id <> new.id
      and data_avaliacao < new.data_avaliacao;
  if v_blocos_antes is null then return new; end if;
  for b in (floor(v_blocos_antes)::int + 1) .. floor(new.blocos_acumulados)::int loop
    insert into conquista (crianca_id, tipo_codigo, referencia, lote_id)
    values (new.crianca_id, 'bloco', new.disciplina || '-bloco-' || b, new.lote_id)
    on conflict do nothing;
  end loop;

  if new.disciplina = 'leitura' then
    select max(n.ordem) into v_ordem_antes from avaliacao a join nivel_parceiro n on n.codigo = a.nivel_codigo
      where a.crianca_id = new.crianca_id and a.disciplina = 'leitura' and a.id <> new.id
        and a.data_avaliacao < new.data_avaliacao;
    select ordem into v_ordem_nova from nivel_parceiro where codigo = new.nivel_codigo;
    if v_ordem_antes is not null and v_ordem_nova > v_ordem_antes then
      insert into conquista (crianca_id, tipo_codigo, referencia, lote_id)
      values (new.crianca_id, 'nivel', 'nivel-' || new.nivel_codigo, new.lote_id)
      on conflict do nothing;
    end if;
  end if;
  return new;
end $$;
create trigger gerar_conquistas after insert or update of nivel_codigo, blocos_acumulados on avaliacao
  for each row execute function privado.gerar_conquistas();

-- ───────────────────────── Visões com RLS (security_invoker) ─────────────────────────
-- Presença por criança, programa e mês: "foi em X de Y dias" (RF-07).
create view presenca_mensal with (security_invoker = true) as
select p.crianca_id, t.programa_id, date_trunc('month', p.data)::date as mes,
       count(*) filter (where p.presente) as presentes, count(*) as possiveis,
       max(l.importado_em) as atualizado_em
from presenca p join turma t on t.id = p.turma_id
left join lote_importacao l on l.id = p.lote_id
group by 1, 2, 3;

-- Avaliações já traduzidas em série escolar (RF-08).
create view avaliacao_traduzida with (security_invoker = true) as
select a.id, a.crianca_id, a.disciplina, a.data_avaliacao, a.blocos_acumulados,
       n.nome as nivel, n.serie_equivalente, n.ordem as nivel_ordem
from avaliacao a join nivel_parceiro n on n.codigo = a.nivel_codigo;

-- ───────────────────────── Visões agregadas públicas ─────────────────────────
-- Rodam com o dono (ignoram RLS) e expõem só agregados. Grupos com menos de
-- 5 crianças são suprimidos para impedir reidentificação.
create view publico_programas as
with ativos as (
  select t.programa_id, count(distinct m.crianca_id) as criancas
  from matricula m join turma t on t.id = m.turma_id
  where m.fim is null or m.fim >= current_date group by 1),
freq as (
  select t.programa_id, sum(presentes)::numeric / nullif(sum(possiveis), 0) as taxa
  from (select turma_id, count(*) filter (where presente) presentes, count(*) possiveis
          from presenca where data >= current_date - 90 group by turma_id
        union all
        select turma_id, sum(presentes), sum(possiveis) from presenca_agregada
          where data >= current_date - 90 group by turma_id) x
  join turma t on t.id = x.turma_id group by 1)
select p.codigo, p.nome, p.descricao, p.cadencia, p.idade_min, p.idade_max,
       (select count(*) from turma t where t.programa_id = p.id and t.ativo) as turmas,
       case when a.criancas >= 5 then a.criancas end as criancas_atendidas,
       case when a.criancas >= 5 then round(f.taxa * 100, 1) end as taxa_presenca_90d
from programa p left join ativos a on a.programa_id = p.id left join freq f on f.programa_id = p.id
where p.ativo;

create view publico_carencias as
select id, titulo, descricao, categoria, quantidade_necessaria, quantidade_atendida,
       valor_estimado, prazo, status, imagem_url,
       case when quantidade_necessaria > 0
            then least(100, round(quantidade_atendida * 100.0 / quantidade_necessaria)) end as progresso_pct
from carencia where publicacao = 'publicado' and status <> 'encerrada';

-- Reconhecimento por constância, nunca por valor (princípio 2, RF-06).
create view publico_reconhecimento as
select pf.nome_publico, pf.papel,
       count(distinct date_trunc('month', d.data)) as meses_de_apoio,
       count(distinct d.carencia_id) as carencias_apoiadas
from perfil pf join doacao d on d.apoiador_id = pf.id
where pf.exibir_nome_publico and pf.nome_publico is not null and pf.ativo
group by pf.id, pf.nome_publico, pf.papel;

-- Painel do que está desatualizado (T-22): reforço após 7 dias, sábado após 14.
create view painel_atualizacao with (security_invoker = true) as
select p.codigo, p.nome, p.cadencia,
       greatest((select max(data) from presenca pr join turma t on t.id = pr.turma_id where t.programa_id = p.id),
                (select max(data) from presenca_agregada pa join turma t on t.id = pa.turma_id where t.programa_id = p.id))
         as ultima_presenca,
       case when greatest(
              (select max(data) from presenca pr join turma t on t.id = pr.turma_id where t.programa_id = p.id),
              (select max(data) from presenca_agregada pa join turma t on t.id = pa.turma_id where t.programa_id = p.id))
            is null then 'vazio'
            when current_date - greatest(
              (select max(data) from presenca pr join turma t on t.id = pr.turma_id where t.programa_id = p.id),
              (select max(data) from presenca_agregada pa join turma t on t.id = pa.turma_id where t.programa_id = p.id))
            > case p.cadencia when 'diaria' then 7 else 14 end then 'desatualizado'
            else 'atualizado' end as estado
from programa p where p.ativo;

grant select on publico_programas, publico_carencias, publico_reconhecimento to anon, authenticated;
grant select on presenca_mensal, avaliacao_traduzida, painel_atualizacao to authenticated;
revoke all on function public.importar, public.desfazer_lote from anon;
grant execute on function public.importar, public.desfazer_lote to authenticated;
