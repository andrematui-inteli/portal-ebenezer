-- Portal Ebenézer · Migração 11 · Desempenho das regras de acesso
-- As regras de leitura de presença, avaliação, conquista e nota chamavam uma
-- função por linha (ve_crianca), que faz várias consultas cada vez. Com milhares
-- de registros de presença, a tela de pendências passava do limite de tempo do
-- Supabase ("canceling statement due to statement timeout").
-- Agora o conjunto de crianças visíveis é calculado uma vez por consulta e a
-- regra só confere se a linha está nesse conjunto. O que cada perfil vê não muda:
-- as mesmas regras de ve_crianca e educa_turma, escritas em forma de conjunto.

-- Crianças cujo acompanhamento o usuário atual pode ver (equivale a ve_crianca).
create or replace function privado.criancas_visiveis() returns setof uuid
language sql stable security definer set search_path = public as $$
  select c.id from crianca c where privado.eh('gestao')
  union
  select rc.crianca_id from responsavel_crianca rc
    join perfil p on p.id = rc.responsavel_id and p.ativo
  where rc.responsavel_id = auth.uid()
    and rc.consentimento_em is not null and rc.consentimento_revogado_em is null
  union
  select privado.crianca_do_estudante() where privado.crianca_do_estudante() is not null
  union
  select m.crianca_id from matricula m
    join educador_turma et on et.turma_id = m.turma_id and et.perfil_id = auth.uid()
    join turma t on t.id = m.turma_id
    join programa pr on pr.id = t.programa_id and not pr.sensivel
  where privado.eh('educacao') and (m.fim is null or m.fim >= current_date)
$$;

-- Crianças que o educador atual acompanha (equivale a educa_crianca).
create or replace function privado.criancas_educadas() returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.crianca_id from matricula m
    join educador_turma et on et.turma_id = m.turma_id and et.perfil_id = auth.uid()
    join turma t on t.id = m.turma_id
    join programa pr on pr.id = t.programa_id and not pr.sensivel
  where privado.eh('educacao') and (m.fim is null or m.fim >= current_date)
$$;

-- Turmas do educador atual (equivale a educa_turma).
create or replace function privado.turmas_educadas() returns setof uuid
language sql stable security definer set search_path = public as $$
  select turma_id from educador_turma where perfil_id = auth.uid() and privado.eh('educacao')
$$;

grant execute on function privado.criancas_visiveis(), privado.criancas_educadas(), privado.turmas_educadas() to anon, authenticated;

-- ── Presença ──
drop policy if exists leitura on presenca;
drop policy if exists equipe on presenca;
create policy leitura on presenca for select using (crianca_id in (select privado.criancas_visiveis()));
create policy equipe on presenca for all
  using ((select privado.eh('gestao')) or turma_id in (select privado.turmas_educadas()))
  with check ((select privado.eh('gestao')) or turma_id in (select privado.turmas_educadas()));

-- ── Avaliação ──
drop policy if exists leitura on avaliacao;
drop policy if exists equipe on avaliacao;
create policy leitura on avaliacao for select using (crianca_id in (select privado.criancas_visiveis()));
create policy equipe on avaliacao for all
  using ((select privado.eh('gestao')) or crianca_id in (select privado.criancas_educadas()))
  with check ((select privado.eh('gestao')) or crianca_id in (select privado.criancas_educadas()));

-- ── Conquista ──
drop policy if exists leitura on conquista;
create policy leitura on conquista for select using (crianca_id in (select privado.criancas_visiveis()));

-- ── Nota (vida escolar) ──
drop policy if exists leitura on nota;
drop policy if exists equipe on nota;
create policy leitura on nota for select using (crianca_id in (select privado.criancas_visiveis()));
create policy equipe on nota for all
  using ((select privado.eh('gestao')) or crianca_id in (select privado.criancas_educadas()))
  with check (lancado_por = auth.uid()
    and ((select privado.eh('gestao')) or crianca_id in (select privado.criancas_educadas())));

-- ── Painel de atualização: uma passada por tabela, em vez de seis subconsultas ──
create or replace view painel_atualizacao with (security_invoker = true) as
with ultimas as (
  select t.programa_id, max(p.data) as dia from presenca p join turma t on t.id = p.turma_id group by 1
  union all
  select t.programa_id, max(pa.data) from presenca_agregada pa join turma t on t.id = pa.turma_id group by 1
), por_programa as (
  select programa_id, max(dia) as dia from ultimas group by 1
)
select p.codigo, p.nome, p.cadencia, u.dia as ultima_presenca,
       case when u.dia is null then 'vazio'
            when current_date - u.dia > case p.cadencia when 'diaria' then 7 else 14 end then 'desatualizado'
            else 'atualizado' end as estado
from programa p left join por_programa u on u.programa_id = p.id
where p.ativo;

