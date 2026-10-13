-- Portal Ebenézer · Migração 9 · Correções de princípio na vida escolar
-- 1. O responsável volta a liberar e suspender o acesso da criança (RF-04).
--    A migração 7 tinha passado isso para a equipe sem pedido do Instituto.
-- 2. A criança não lê as observações dos professores sobre ela (comportamento,
--    dificuldade…): avaliação individual desse tipo fica entre família e equipe.
-- 3. Reconhecimento por constância, nunca por valor (princípio 2, RF-06): o
--    quadro de apoiadores mostra meses de apoio; o valor só aparece para o
--    próprio apoiador e para a gestão.

-- ── 1. Suspensão de acesso ──
drop policy if exists equipe on acesso_estudante;
drop policy if exists responsavel on acesso_estudante;
create policy responsavel on acesso_estudante for update
  using (privado.eh_responsavel_de(crianca_id) or privado.eh('gestao'))
  with check (privado.eh_responsavel_de(crianca_id) or privado.eh('gestao'));

-- ── 2. Observações fora do alcance da criança ──
drop policy if exists leitura on observacao_aluno;
create policy leitura on observacao_aluno for select using (
  privado.ve_crianca(crianca_id) and not privado.eh('estudante'));

-- ── 3. Quadro de apoiadores por constância ──
drop view if exists ranking_apoiadores;
create view ranking_apoiadores as
select pf.id = auth.uid() as sou_eu,
       case when pf.papel = 'empresa' then 'empresa' else 'pessoa_fisica' end as categoria,
       case when pf.exibir_nome_publico and pf.nome_publico is not null then pf.nome_publico
            when pf.id = auth.uid() then pf.nome || ' (você, anônimo)'
            else 'Apoiador anônimo' end as nome,
       -- valores: só o próprio apoiador e a gestão
       case when pf.id = auth.uid() or privado.eh('gestao') then coalesce(sum(d.valor), 0) end as total_reais,
       case when pf.id = auth.uid() or privado.eh('gestao') then coalesce(sum(d.quantidade), 0) end as itens_doados,
       count(distinct date_trunc('month', d.data)) as meses_de_apoio,
       count(distinct d.carencia_id) as carencias_apoiadas,
       rank() over (partition by (pf.papel = 'empresa') order by count(distinct date_trunc('month', d.data)) desc) as posicao
from perfil pf join doacao d on d.apoiador_id = pf.id
where pf.ativo and auth.uid() is not null and privado.eh_adulto()
group by pf.id;

revoke all on ranking_apoiadores from anon;
grant select on ranking_apoiadores to authenticated;
