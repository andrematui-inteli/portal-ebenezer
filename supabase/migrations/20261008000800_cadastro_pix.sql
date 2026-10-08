-- Portal Ebenézer · Migração 8 · Cadastro, PIX e conversa marcada pela equipe
-- 1. Corrige confirmar_compromisso (status da carência precisava de conversão de tipo).
-- 2. PIX do Instituto editável pela diretoria e visível para quem vai doar.
-- 3. Equipe vê os responsáveis das crianças que acompanha, para marcar conversa.
-- 4. Cadastro de pessoas, crianças, vínculos e acesso do aluno, só pela diretoria.

-- ── 1. Correção ──
create or replace function public.confirmar_compromisso(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare c compromisso_doacao; soma int;
begin
  if not privado.eh('gestao') then raise exception 'Só a diretoria confirma doações recebidas.'; end if;
  select * into c from compromisso_doacao where id = p_id and status = 'pendente' for update;
  if not found then raise exception 'Compromisso não encontrado ou já tratado.'; end if;
  insert into doacao (apoiador_id, carencia_id, valor, quantidade, data, forma, registrado_por)
  values (c.perfil_id, c.carencia_id, c.valor, c.quantidade, current_date,
          case when c.valor is null then 'bens' else 'pix' end, auth.uid());
  select coalesce(case when vaquinha then c.valor::int else c.quantidade end, 0) into soma from carencia where id = c.carencia_id;
  update carencia set quantidade_atendida = quantidade_atendida + soma,
         status = (case when quantidade_atendida + soma >= quantidade_necessaria then 'atendida' else 'parcial' end)::status_carencia
  where id = c.carencia_id;
  update compromisso_doacao set status = 'confirmado', tratado_por = auth.uid(), tratado_em = now() where id = p_id;
end $$;

-- ── 2. PIX do Instituto (uma linha só) ──
create table config_pix (
  id              boolean primary key default true check (id),
  chave           text not null,
  tipo_chave      text not null check (tipo_chave in ('cnpj','email','telefone','aleatoria')),
  titular         text not null,          -- nome que aparece no app do banco
  cidade          text not null default 'SAO PAULO',
  instrucoes      text,                    -- ex.: "Mande o comprovante no WhatsApp da secretaria"
  atualizado_por  uuid references perfil(id) on delete set null,
  atualizado_em   timestamptz not null default now()
);
alter table config_pix enable row level security;
create policy leitura on config_pix for select using (true);   -- dado público de quem recebe doação
create policy gestao on config_pix for all using (privado.eh('gestao')) with check (privado.eh('gestao'));
grant select on config_pix to anon, authenticated;
grant insert, update on config_pix to authenticated;

-- ── 3. Responsáveis que a equipe pode chamar para conversa ──
create view responsaveis_visiveis as
select rc.crianca_id, p.id as perfil_id, p.nome, rc.parentesco
from responsavel_crianca rc join perfil p on p.id = rc.responsavel_id and p.ativo
where privado.eh('gestao') or privado.educa_crianca(rc.crianca_id);
revoke all on responsaveis_visiveis from anon;
grant select on responsaveis_visiveis to authenticated;

-- ── 4. Cadastro (diretoria) ──
-- Cria a conta de login e o perfil. Contas reais não levam a marca "sintetico",
-- então o gerador de dados de demonstração nunca as apaga.
create or replace function privado.criar_login(p_email text, p_senha text) returns uuid
language plpgsql security definer set search_path = public, extensions, auth as $$
declare v_id uuid := gen_random_uuid();
begin
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  if length(coalesce(p_senha, '')) < 8 then raise exception 'A senha provisória precisa ter pelo menos 8 caracteres.'; end if;
  if exists (select 1 from auth.users where lower(email) = lower(p_email)) then raise exception 'Já existe uma conta com este e-mail.'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
    email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', lower(p_email),
    crypt(p_senha, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', lower(p_email), 'email_verified', true), 'email', now(), now(), now());
  return v_id;
end $$;

create or replace function public.cadastrar_pessoa(p_email text, p_senha text, p_nome text, p_papel papel,
  p_telefone text default null, p_turmas uuid[] default '{}') returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not privado.eh('gestao') then raise exception 'Só a diretoria cadastra pessoas.'; end if;
  if p_papel = 'estudante' then raise exception 'Aluno se cadastra em "Crianças", com o acesso liberado.'; end if;
  if length(trim(coalesce(p_nome, ''))) < 2 then raise exception 'Informe o nome.'; end if;
  v_id := privado.criar_login(p_email, p_senha);
  insert into perfil (id, papel, nome, telefone) values (v_id, p_papel, trim(p_nome), p_telefone);
  if p_papel = 'educacao' then
    insert into educador_turma (perfil_id, turma_id) select v_id, unnest(p_turmas);
  end if;
  return v_id;
end $$;

create or replace function public.cadastrar_crianca(p_nome text, p_ano smallint, p_turma uuid,
  p_codigo text default null, p_responsavel uuid default null, p_parentesco text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not privado.eh('gestao') then raise exception 'Só a diretoria cadastra crianças.'; end if;
  if p_nome !~ '^\S+ \S\.?$' then raise exception 'Use só o primeiro nome e a inicial do sobrenome (ex.: Kauã R.). O portal não guarda nome completo.'; end if;
  if p_ano < extract(year from current_date) - 18 or p_ano > extract(year from current_date) then raise exception 'Ano de nascimento inválido.'; end if;
  insert into crianca (nome_exibicao, ano_nascimento, codigo_parceiro) values (trim(p_nome), p_ano, nullif(trim(p_codigo), ''))
  returning id into v_id;
  if p_turma is not null then insert into matricula (crianca_id, turma_id) values (v_id, p_turma); end if;
  if p_responsavel is not null then
    -- Sem consentimento ainda: o responsável autoriza no primeiro acesso (fluxo da tela Autorizar).
    insert into responsavel_crianca (responsavel_id, crianca_id, parentesco) values (p_responsavel, v_id, p_parentesco);
  end if;
  return v_id;
end $$;

create or replace function public.vincular_responsavel(p_responsavel uuid, p_crianca uuid, p_parentesco text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not privado.eh('gestao') then raise exception 'Só a diretoria liga responsável e criança.'; end if;
  if not exists (select 1 from perfil where id = p_responsavel and papel = 'responsavel') then
    raise exception 'Esta pessoa não está cadastrada como responsável.';
  end if;
  insert into responsavel_crianca (responsavel_id, crianca_id, parentesco) values (p_responsavel, p_crianca, p_parentesco)
  on conflict do nothing;
end $$;

create or replace function public.liberar_acesso_estudante(p_crianca uuid, p_email text, p_senha text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_nome text;
begin
  if not privado.eh('gestao') then raise exception 'Só a diretoria libera o acesso do aluno.'; end if;
  if exists (select 1 from acesso_estudante where crianca_id = p_crianca) then raise exception 'Esta criança já tem acesso.'; end if;
  select split_part(nome_exibicao, ' ', 1) into v_nome from crianca where id = p_crianca;
  if v_nome is null then raise exception 'Criança não encontrada.'; end if;
  v_id := privado.criar_login(p_email, p_senha);
  insert into perfil (id, papel, nome) values (v_id, 'estudante', v_nome);
  insert into acesso_estudante (crianca_id, perfil_id, liberado_por) values (p_crianca, v_id, auth.uid());
  return v_id;
end $$;

revoke all on function public.cadastrar_pessoa, public.cadastrar_crianca, public.vincular_responsavel,
  public.liberar_acesso_estudante from anon;
grant execute on function public.cadastrar_pessoa, public.cadastrar_crianca, public.vincular_responsavel,
  public.liberar_acesso_estudante to authenticated;
revoke all on function privado.criar_login from anon, authenticated;
