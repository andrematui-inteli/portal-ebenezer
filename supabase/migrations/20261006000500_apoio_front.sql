-- Portal Ebenézer · Migração 5 · Apoio ao front-end
-- PIN de saída do modo criança e alerta de queda de presença.

-- O responsável define um PIN de 4 dígitos ao liberar o acesso da criança.
-- A criança só sai do modo criança com esse PIN, verificado no servidor.
alter table acesso_estudante add column pin_saida_hash text;

create or replace function public.definir_pin_saida(p_crianca uuid, p_pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not privado.eh_responsavel_de(p_crianca) then
    raise exception 'Só o responsável define o PIN';
  end if;
  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'O PIN precisa ter 4 números';
  end if;
  update acesso_estudante set pin_saida_hash = crypt(p_pin, gen_salt('bf')) where crianca_id = p_crianca;
end $$;

create or replace function public.verificar_pin_saida(p_pin text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  select pin_saida_hash into v_hash from acesso_estudante where perfil_id = auth.uid();
  if v_hash is null then return true; end if;   -- sem PIN definido, a saída é livre
  return v_hash = crypt(p_pin, v_hash);
end $$;

-- A criança nunca lê o hash do PIN.
revoke select on acesso_estudante from authenticated;
grant select (crianca_id, perfil_id, liberado_por, liberado_em, suspenso_em) on acesso_estudante to authenticated;

-- Último dia registrado na presença mensal: o responsável não lê os lotes de
-- importação, então a data de atualização vem do próprio registro.
create or replace view presenca_mensal with (security_invoker = true) as
select p.crianca_id, t.programa_id, date_trunc('month', p.data)::date as mes,
       count(*) filter (where p.presente) as presentes, count(*) as possiveis,
       max(l.importado_em) as atualizado_em, max(p.data) as ultimo_dia
from presenca p join turma t on t.id = p.turma_id
left join lote_importacao l on l.id = p.lote_id
group by 1, 2, 3;

-- Queda de presença: presença recente abaixo de 60% depois de pelo menos 75%
-- antes. Janela recente de 3 semanas no reforço (diário) e de 6 sábados nos
-- programas semanais, para não alarmar por uma falta isolada. Respeita a RLS.
create view alerta_presenca with (security_invoker = true) as
with base as (
  select p.crianca_id, p.turma_id,
         case pr.cadencia when 'diaria' then 21 else 42 end as janela,
         p.data, p.presente
  from presenca p join turma t on t.id = p.turma_id join programa pr on pr.id = t.programa_id),
agg as (
  select crianca_id, turma_id,
         avg(presente::int) filter (where data > current_date - janela) as recente,
         avg(presente::int) filter (where data <= current_date - janela) as anterior,
         count(*) filter (where data > current_date - janela) as registros_recentes
  from base group by 1, 2)
select a.crianca_id, c.nome_exibicao, a.turma_id, t.nome as turma,
       round(a.recente * 100) as presenca_recente, round(a.anterior * 100) as presenca_anterior
from agg a join crianca c on c.id = a.crianca_id join turma t on t.id = a.turma_id
where a.registros_recentes >= 4 and a.recente < 0.6 and a.anterior >= 0.75;

grant select on alerta_presenca to authenticated;
revoke all on function public.definir_pin_saida, public.verificar_pin_saida from anon;
grant execute on function public.definir_pin_saida, public.verificar_pin_saida to authenticated;
