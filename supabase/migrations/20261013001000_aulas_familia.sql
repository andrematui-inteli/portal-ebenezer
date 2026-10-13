-- Portal Ebenézer · Migração 10 · Aulas em família
-- Cursos curtos para um adulto fazer junto com o filho adolescente (letramento
-- em IA, educação financeira). Inscrição separada das demais iniciativas: não
-- liga a nenhuma criança cadastrada, não gera presença, avaliação nem
-- acompanhamento. Aberta à comunidade, com ou sem conta no portal.
--
-- Minimização: do adolescente guardamos só a idade, para conferir a faixa do
-- curso. Nome, contato e quantidade de pessoas são do adulto que inscreve.

create type status_curso_familia as enum ('rascunho', 'inscricoes_abertas', 'em_andamento', 'encerrado');
create type status_inscricao_familia as enum ('inscrita', 'lista_espera', 'confirmada', 'cancelada');

create table curso_familia (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9-]+$'),
  titulo          text not null,
  chamada         text not null,          -- uma frase para o cartão e o WhatsApp
  descricao       text not null,
  tema            text not null check (tema in ('ia', 'financas', 'outro')),
  idade_min       smallint not null default 12,
  idade_max       smallint not null default 17,
  vagas_familias  smallint not null check (vagas_familias > 0),
  local           text not null default 'Instituto Ebenézer, Jardim Ângela',
  o_que_levar     text,
  inscricoes_ate  date,
  status          status_curso_familia not null default 'rascunho',
  criado_por      uuid references perfil(id) on delete set null,
  criado_em       timestamptz not null default now(),
  check (idade_max >= idade_min)
);

create table encontro_familia (
  id        uuid primary key default gen_random_uuid(),
  curso_id  uuid not null references curso_familia(id) on delete cascade,
  numero    smallint not null,
  titulo    text not null,
  resumo    text not null,
  inicio    timestamptz not null,
  duracao_min smallint not null default 120,
  unique (curso_id, numero)
);

create table inscricao_familia (
  id               uuid primary key default gen_random_uuid(),
  curso_id         uuid not null references curso_familia(id) on delete cascade,
  nome_adulto      text not null check (length(nome_adulto) between 2 and 120),
  contato          text not null check (length(contato) between 8 and 120),
  idades_jovens    smallint[] not null check (cardinality(idades_jovens) between 1 and 3),
  adultos          smallint not null default 1 check (adultos between 1 and 2),
  ja_participa     boolean not null default false,   -- autodeclarado: família já atendida pelo Instituto
  perfil_id        uuid references perfil(id) on delete set null,  -- preenchido se inscreveu logado
  status           status_inscricao_familia not null default 'inscrita',
  consentimento_em timestamptz not null default now(),
  criada_em        timestamptz not null default now(),
  tratada_por      uuid references perfil(id) on delete set null,
  tratada_em       timestamptz
);
create index on inscricao_familia (curso_id, status);

alter table curso_familia enable row level security;
alter table encontro_familia enable row level security;
alter table inscricao_familia enable row level security;

-- Cursos e encontros publicados são vitrine pública; rascunho só a gestão vê.
create policy publico on curso_familia for select using (status <> 'rascunho' or privado.eh('gestao'));
create policy gestao on curso_familia for all using (privado.eh('gestao')) with check (privado.eh('gestao'));
create policy publico on encontro_familia for select using (
  exists (select 1 from curso_familia c where c.id = curso_id and (c.status <> 'rascunho' or privado.eh('gestao'))));
create policy gestao on encontro_familia for all using (privado.eh('gestao')) with check (privado.eh('gestao'));

-- Inscrições: só a gestão lê a lista; quem se inscreveu logado vê a própria.
create policy gestao on inscricao_familia for all using (privado.eh('gestao')) with check (privado.eh('gestao'));
create policy propria on inscricao_familia for select using (perfil_id is not null and perfil_id = auth.uid());

-- Vagas restantes por curso, sem nenhum dado pessoal.
create view publico_cursos_familia as
select c.id, c.slug, c.titulo, c.chamada, c.descricao, c.tema, c.idade_min, c.idade_max,
       c.vagas_familias, c.local, c.o_que_levar, c.inscricoes_ate, c.status,
       greatest(0, c.vagas_familias - (select count(*) from inscricao_familia i
         where i.curso_id = c.id and i.status in ('inscrita', 'confirmada')))::int as vagas_restantes,
       (select min(inicio) from encontro_familia e where e.curso_id = c.id) as primeiro_encontro,
       (select count(*) from encontro_familia e where e.curso_id = c.id)::int as encontros
from curso_familia c
where c.status <> 'rascunho';

-- Inscrição pública: valida a faixa etária e decide entre vaga e lista de espera.
-- Devolve o status e, na lista de espera, a posição.
create or replace function public.inscrever_familia(
  p_curso uuid, p_nome text, p_contato text, p_idades smallint[],
  p_adultos smallint default 1, p_ja_participa boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c curso_familia; ocupadas int; v_status status_inscricao_familia; v_id uuid; idade smallint; pos int;
begin
  select * into c from curso_familia where id = p_curso for update;
  if c.id is null or c.status <> 'inscricoes_abertas' then
    raise exception 'As inscrições deste curso não estão abertas.';
  end if;
  if c.inscricoes_ate is not null and current_date > c.inscricoes_ate then
    raise exception 'O prazo de inscrição deste curso já terminou.';
  end if;
  if p_idades is null or cardinality(p_idades) = 0 then
    raise exception 'Informe a idade de pelo menos um jovem.';
  end if;
  foreach idade in array p_idades loop
    if idade < c.idade_min or idade > c.idade_max then
      raise exception 'Este curso é para jovens de % a % anos.', c.idade_min, c.idade_max;
    end if;
  end loop;
  if exists (select 1 from inscricao_familia where curso_id = p_curso and status <> 'cancelada'
             and regexp_replace(contato, '\D', '', 'g') = regexp_replace(p_contato, '\D', '', 'g')
             and length(regexp_replace(p_contato, '\D', '', 'g')) >= 8) then
    raise exception 'Já existe uma inscrição com este contato. Se quiser mudar algo, fale com o Instituto.';
  end if;

  select count(*) into ocupadas from inscricao_familia where curso_id = p_curso and status in ('inscrita', 'confirmada');
  v_status := case when ocupadas < c.vagas_familias then 'inscrita' else 'lista_espera' end;

  insert into inscricao_familia (curso_id, nome_adulto, contato, idades_jovens, adultos, ja_participa, perfil_id, status)
  values (p_curso, trim(p_nome), trim(p_contato), p_idades, coalesce(p_adultos, 1), coalesce(p_ja_participa, false),
          auth.uid(), v_status)
  returning id into v_id;

  if v_status = 'lista_espera' then
    select count(*) into pos from inscricao_familia where curso_id = p_curso and status = 'lista_espera';
  end if;
  return jsonb_build_object('status', v_status, 'posicao_espera', pos);
end $$;

-- Ao cancelar uma inscrição, a primeira da lista de espera sobe automaticamente.
create or replace function privado.promover_lista_espera() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelada' and old.status in ('inscrita', 'confirmada') then
    update inscricao_familia set status = 'inscrita', tratada_em = now()
    where id = (select id from inscricao_familia where curso_id = new.curso_id and status = 'lista_espera'
                order by criada_em limit 1);
  end if;
  return new;
end $$;
create trigger promover_lista_espera after update of status on inscricao_familia
  for each row execute function privado.promover_lista_espera();

grant select on curso_familia, encontro_familia, publico_cursos_familia to anon, authenticated;
grant select, insert, update, delete on curso_familia, encontro_familia, inscricao_familia to authenticated;
grant execute on function public.inscrever_familia to anon, authenticated;
