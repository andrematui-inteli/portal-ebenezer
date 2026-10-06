-- Portal Ebenézer · Migração 2 · Permissões por perfil (Row Level Security)
-- Fonte da verdade: matriz de permissões, seção 5 do REF-PROD-EBENEZER-001.
-- O isolamento é imposto pelo banco, não pela navegação (hipótese H3).

-- Funções auxiliares ficam num schema fora da API pública.
create schema if not exists privado;
grant usage on schema privado to anon, authenticated;

create or replace function privado.papel_atual() returns papel
language sql stable security definer set search_path = public as $$
  select papel from perfil where id = auth.uid() and ativo
$$;

create or replace function privado.eh(p papel) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(privado.papel_atual() = p, false)
$$;

create or replace function privado.eh_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(privado.papel_atual() in ('educacao','gestao'), false)
$$;

-- Criança do responsável logado. com_consentimento = true exige consentimento ativo.
create or replace function privado.eh_responsavel_de(c uuid, com_consentimento boolean default true)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from responsavel_crianca rc
    join perfil p on p.id = rc.responsavel_id and p.ativo
    where rc.responsavel_id = auth.uid() and rc.crianca_id = c
      and (not com_consentimento
           or (rc.consentimento_em is not null and rc.consentimento_revogado_em is null))
  )
$$;

-- Criança correspondente ao estudante logado, se o acesso não estiver suspenso.
create or replace function privado.crianca_do_estudante() returns uuid
language sql stable security definer set search_path = public as $$
  select ae.crianca_id from acesso_estudante ae
  join perfil p on p.id = ae.perfil_id and p.ativo and p.papel = 'estudante'
  where ae.perfil_id = auth.uid() and ae.suspenso_em is null
$$;

create or replace function privado.educa_turma(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select privado.eh('educacao') and exists (
    select 1 from educador_turma where perfil_id = auth.uid() and turma_id = t)
$$;

-- Educador vê crianças com matrícula ativa em turma sua, exceto programas sensíveis.
create or replace function privado.educa_crianca(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select privado.eh('educacao') and exists (
    select 1 from matricula m
    join educador_turma et on et.turma_id = m.turma_id and et.perfil_id = auth.uid()
    join turma t on t.id = m.turma_id
    join programa pr on pr.id = t.programa_id and not pr.sensivel
    where m.crianca_id = c and (m.fim is null or m.fim >= current_date))
$$;

-- Quem pode ver o acompanhamento individual de uma criança.
create or replace function privado.ve_crianca(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select privado.eh('gestao')
      or privado.eh_responsavel_de(c)
      or privado.crianca_do_estudante() = c
      or privado.educa_crianca(c)
$$;

create or replace function privado.eh_adulto() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(privado.papel_atual() <> 'estudante', false)
$$;

-- ───────────────────── Travas que RLS sozinha não cobre ─────────────────────

-- Ninguém muda o próprio papel; só a gestão altera papel e status de perfis.
create or replace function privado.trava_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not privado.eh('gestao') and (new.papel <> old.papel or new.ativo <> old.ativo) then
    raise exception 'Somente a gestão altera perfil de acesso';
  end if;
  if new.exibir_nome_publico and not old.exibir_nome_publico then
    new.exibicao_autorizada_em := now();
  end if;
  return new;
end $$;
create trigger trava_perfil before update on perfil
  for each row execute function privado.trava_perfil();

-- Programa sensível não aceita presença individual (princípio 5).
create or replace function privado.trava_presenca_sensivel() returns trigger
language plpgsql set search_path = public as $$
begin
  if exists (select 1 from turma t join programa p on p.id = t.programa_id
             where t.id = new.turma_id and p.sensivel) then
    raise exception 'Programa sensível aceita apenas presença agregada';
  end if;
  return new;
end $$;
create trigger trava_presenca_sensivel before insert or update on presenca
  for each row execute function privado.trava_presenca_sensivel();

-- Responsável só altera consentimento; o vínculo em si é da gestão.
create or replace function privado.trava_vinculo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not privado.eh('gestao') and (new.responsavel_id <> old.responsavel_id
     or new.crianca_id <> old.crianca_id or new.parentesco is distinct from old.parentesco) then
    raise exception 'O responsável só pode alterar o consentimento';
  end if;
  return new;
end $$;
create trigger trava_vinculo before update on responsavel_crianca
  for each row execute function privado.trava_vinculo();

-- ───────────────────────── Ativar RLS em todas as tabelas ─────────────────────────
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ───────────────────────── Catálogos (leitura aberta) ─────────────────────────
create policy leitura on programa       for select using (true);
create policy leitura on turma          for select using (true);
create policy leitura on nivel_parceiro for select using (true);
create policy leitura on tipo_conquista for select using (true);
create policy gestao  on programa       for all using (privado.eh('gestao')) with check (privado.eh('gestao'));
create policy gestao  on turma          for all using (privado.eh('gestao')) with check (privado.eh('gestao'));
create policy gestao  on nivel_parceiro for all using (privado.eh('gestao')) with check (privado.eh('gestao'));
create policy gestao  on tipo_conquista for all using (privado.eh('gestao')) with check (privado.eh('gestao'));

-- ───────────────────────── Crianças e matrículas ─────────────────────────
-- O responsável vê a criança mesmo sem consentimento (precisa dela na tela T-11);
-- o acompanhamento só aparece com consentimento ativo.
create policy leitura on crianca for select using (
  privado.ve_crianca(id) or privado.eh_responsavel_de(id, false));
create policy gestao  on crianca for all using (privado.eh('gestao')) with check (privado.eh('gestao'));

-- Matrícula em programa sensível só aparece para a gestão e o próprio responsável.
create policy leitura on matricula for select using (
  privado.ve_crianca(crianca_id)
  and (privado.eh('gestao') or privado.eh_responsavel_de(crianca_id)
       or not exists (select 1 from turma t join programa p on p.id = t.programa_id
                      where t.id = matricula.turma_id and p.sensivel)));
create policy gestao  on matricula for all using (privado.eh('gestao')) with check (privado.eh('gestao'));

-- ───────────────────────── Perfis e vínculos ─────────────────────────
create policy proprio on perfil for select using (id = auth.uid() or privado.eh('gestao'));
create policy proprio_edita on perfil for update using (id = auth.uid() or privado.eh('gestao'))
  with check (id = auth.uid() or privado.eh('gestao'));
create policy gestao_cria on perfil for insert with check (privado.eh('gestao'));

create policy leitura on responsavel_crianca for select using (
  responsavel_id = auth.uid() or privado.eh('gestao'));
create policy consente on responsavel_crianca for update using (
  responsavel_id = auth.uid() or privado.eh('gestao'))
  with check (responsavel_id = auth.uid() or privado.eh('gestao'));
create policy gestao on responsavel_crianca for insert with check (privado.eh('gestao'));
create policy gestao_remove on responsavel_crianca for delete using (privado.eh('gestao'));

create policy leitura on acesso_estudante for select using (
  perfil_id = auth.uid() or privado.eh_responsavel_de(crianca_id) or privado.eh('gestao'));
create policy responsavel on acesso_estudante for update using (
  privado.eh_responsavel_de(crianca_id) or privado.eh('gestao'))
  with check (privado.eh_responsavel_de(crianca_id) or privado.eh('gestao'));
-- A criação da credencial da criança passa pela função liberar_acesso_estudante.

create policy leitura on educador_turma for select using (
  perfil_id = auth.uid() or privado.eh('gestao'));
create policy gestao on educador_turma for all using (privado.eh('gestao')) with check (privado.eh('gestao'));

create policy anonimo_solicita on solicitacao_acesso for insert to anon, authenticated with check (status = 'pendente');
create policy gestao on solicitacao_acesso for select using (privado.eh('gestao'));
create policy gestao_trata on solicitacao_acesso for update using (privado.eh('gestao')) with check (privado.eh('gestao'));

-- ───────────────────────── Acompanhamento ─────────────────────────
create policy leitura on presenca for select using (privado.ve_crianca(crianca_id));
create policy equipe on presenca for all using (
  privado.eh('gestao') or privado.educa_turma(turma_id))
  with check (privado.eh('gestao') or privado.educa_turma(turma_id));

create policy equipe on presenca_agregada for all using (privado.eh_equipe()) with check (privado.eh_equipe());

create policy leitura on avaliacao for select using (privado.ve_crianca(crianca_id));
create policy equipe on avaliacao for all using (
  privado.eh('gestao') or privado.educa_crianca(crianca_id))
  with check (privado.eh('gestao') or privado.educa_crianca(crianca_id));

create policy equipe on lote_importacao for select using (privado.eh_equipe());
create policy equipe on lote_alteracao  for select using (privado.eh_equipe());

-- Conquistas: leitura por quem vê a criança; criação pelo sistema; sem exclusão.
create policy leitura on conquista for select using (privado.ve_crianca(crianca_id));
create policy marca_vista on conquista for update using (
  privado.crianca_do_estudante() = crianca_id or privado.eh_responsavel_de(crianca_id))
  with check (privado.crianca_do_estudante() = crianca_id or privado.eh_responsavel_de(crianca_id));

create policy leitura on marco_turma for select using (
  privado.eh_equipe()
  or exists (select 1 from matricula m where m.turma_id = marco_turma.turma_id
             and (m.fim is null or m.fim >= current_date)
             and (privado.eh_responsavel_de(m.crianca_id) or privado.crianca_do_estudante() = m.crianca_id)));
create policy equipe on marco_turma for all using (privado.eh_equipe()) with check (privado.eh_equipe());

-- ───────────────────────── Captação ─────────────────────────
create policy publico on carencia for select using (
  publicacao = 'publicado' or privado.eh_equipe());
create policy equipe_cria on carencia for insert with check (
  privado.eh_equipe() and criado_por = auth.uid()
  and (publicacao in ('rascunho','aguardando_aprovacao') or privado.eh('gestao')));
create policy equipe_edita on carencia for update using (
  privado.eh('gestao') or (privado.eh('educacao') and criado_por = auth.uid()))
  with check (privado.eh('gestao')
    or (privado.eh('educacao') and publicacao in ('rascunho','aguardando_aprovacao','arquivado')));

create policy proprio on doacao for select using (apoiador_id = auth.uid() or privado.eh('gestao'));
create policy gestao on doacao for all using (privado.eh('gestao')) with check (privado.eh('gestao'));

-- ───────────────────────── Comunicação ─────────────────────────
create policy leitura on aviso for select using (
  privado.eh_equipe()
  or (publicacao = 'publicado'
      and (publico_alvo is null or privado.papel_atual() = any (publico_alvo))
      and coalesce(privado.papel_atual(), 'responsavel') <> 'estudante'));
-- Aviso sem imagem e para público interno publica direto; aviso aberto ou com
-- imagem vai para a fila de aprovação, salvo se publicado pela gestão.
create policy equipe_cria on aviso for insert with check (
  privado.eh_equipe() and autor_id = auth.uid()
  and (privado.eh('gestao') or publicacao <> 'publicado'
       or (publico_alvo is not null and imagem_url is null)));
create policy equipe_edita on aviso for update using (
  privado.eh('gestao') or autor_id = auth.uid())
  with check (privado.eh('gestao') or publicacao <> 'publicado'
       or (publico_alvo is not null and imagem_url is null));

create policy proprio on aviso_visto for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create policy adulto_envia on sugestao for insert with check (
  privado.eh_adulto() and autor_id = auth.uid() and resposta is null);
create policy leitura on sugestao for select using (autor_id = auth.uid() or privado.eh_equipe());
create policy equipe_responde on sugestao for update using (privado.eh_equipe()) with check (privado.eh_equipe());

-- ───────────────────────── Indicadores, IA e páginas ─────────────────────────
create policy publico on indicador for select using (publico or privado.eh_adulto());
create policy gestao on indicador for all using (privado.eh('gestao')) with check (privado.eh('gestao'));
create policy publico on indicador_valor for select using (
  exists (select 1 from indicador i where i.codigo = indicador_codigo
          and (i.publico or privado.eh_adulto())));
create policy equipe on indicador_valor for all using (privado.eh_equipe()) with check (privado.eh_equipe());

create policy leitura on resumo_ia for select using (
  privado.eh('gestao') or (status = 'aprovado' and privado.eh_adulto()));
create policy gestao on resumo_ia for all using (privado.eh('gestao')) with check (privado.eh('gestao'));

create policy leitura on pagina for select using (privado.eh_adulto());
create policy equipe on pagina for all using (privado.eh_equipe()) with check (privado.eh_equipe());

-- ───────────────────────── Grants básicos ─────────────────────────
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on solicitacao_acesso to anon;
