-- Portal Ebenézer · Migração 7 · Ajustes da vida escolar pedidos pelo Instituto
-- 1. Só professores e diretoria suspendem o acesso de um aluno (o responsável não).
--    O responsável continua definindo o PIN de saída e pode pausar a exibição dos dados
--    (revogar consentimento é direito garantido pela LGPD, art. 18).
-- 2. Não há aula, prova nem entrega no fim de semana: sábado e domingo ficam para
--    visitas, passeios, workshops e atividades extracurriculares.

-- ── 1. Suspensão de acesso do aluno ──
drop policy responsavel on acesso_estudante;
create policy equipe on acesso_estudante for update
  using (privado.eh('gestao') or privado.educa_crianca(crianca_id))
  with check (privado.eh('gestao') or privado.educa_crianca(crianca_id));
drop policy leitura on acesso_estudante;
create policy leitura on acesso_estudante for select using (
  perfil_id = auth.uid() or privado.eh_responsavel_de(crianca_id)
  or privado.eh('gestao') or privado.educa_crianca(crianca_id));

-- ── 2. Agenda: nada acadêmico no fim de semana (horário de São Paulo) ──
create or replace function privado.trava_evento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tipo in ('aula','prova','entrega')
     and extract(isodow from new.inicio at time zone 'America/Sao_Paulo') in (6, 7) then
    raise exception 'Não há aulas, provas nem entregas no fim de semana. Escolha um dia de segunda a sexta.';
  end if;
  -- Sem usuário = SQL Editor ou seed (o anônimo já é barrado pela RLS).
  if auth.uid() is null or privado.eh('gestao') then return new; end if;
  if new.tipo in ('visita_empresa','workshop_responsaveis','passeio','encontro_patrocinadores','institucional') then
    raise exception 'Só a diretoria marca eventos institucionais (passeios, visitas, workshops, encontros com patrocinadores).';
  end if;
  if privado.eh('educacao') then
    if new.turma_id is not null and not privado.educa_turma(new.turma_id) then
      raise exception 'Você só marca eventos nas suas turmas.';
    end if;
    return new;
  end if;
  if tg_op = 'INSERT' and new.tipo = 'reuniao_individual' and new.status = 'solicitado'
     and auth.uid() = any (new.participantes) and new.criado_por = auth.uid() then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.status = 'cancelado' and old.criado_por = auth.uid() then
    return new;
  end if;
  raise exception 'A agenda só é editada pela equipe. Use "Pedir conversa" para marcar um horário.';
end $$;
