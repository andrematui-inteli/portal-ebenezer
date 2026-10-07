-- Portal Ebenézer · Migração 6 · Vida escolar
-- Agenda por público, tarefas, links de estudo, biblioteca com reserva,
-- necessidades com vaquinha, intenção de doação, ranking de apoiadores,
-- notas e observações por aluno, desempenho por turma e tipo de feedback.
-- Mesmo princípio das migrações anteriores: quem garante o acesso é o banco.

-- ───────────────────────── Tipos ─────────────────────────
create type tipo_evento as enum (
  'aula','prova','entrega','esportiva',                     -- equipe de educação marca
  'reuniao_pais','reuniao_individual',                      -- equipe marca; responsável pede a individual
  'visita_empresa','workshop_responsaveis','passeio','encontro_patrocinadores','institucional'  -- só a gestão
);
create type status_evento as enum ('confirmado','solicitado','recusado','cancelado');
create type tipo_tarefa as enum ('tarefa','dica','resumo');
create type status_reserva as enum ('reservado','retirado','devolvido','cancelado');
create type tipo_observacao as enum ('comportamento','dificuldade','recomendacao','elogio');
create type tipo_feedback as enum ('sugestao','reclamacao','elogio');
create type status_compromisso as enum ('pendente','confirmado','cancelado');

-- ───────────────────────── Agenda ─────────────────────────
-- Quem vê cada evento:
--   participantes preenchido → só os participantes (e a gestão);
--   senão publico (papéis) nulo = todos os perfis logados;
--   turma_id preenchido restringe estudante e responsável às crianças da turma.
create table evento (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  descricao      text,
  tipo           tipo_evento not null,
  inicio         timestamptz not null,
  fim            timestamptz,
  local          text,
  turma_id       uuid references turma(id) on delete cascade,
  publico        papel[],
  participantes  uuid[],
  crianca_id     uuid references crianca(id) on delete cascade,  -- assunto da reunião individual
  status         status_evento not null default 'confirmado',
  criado_por     uuid not null references perfil(id) on delete cascade,
  criado_em      timestamptz not null default now(),
  check (fim is null or fim >= inicio),
  check (tipo <> 'reuniao_individual' or participantes is not null)
);
create index on evento (inicio);

create or replace function privado.ve_turma(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select privado.eh('gestao') or privado.educa_turma(t) or exists (
    select 1 from matricula m where m.turma_id = t and (m.fim is null or m.fim >= current_date)
      and (privado.eh_responsavel_de(m.crianca_id, false) or privado.crianca_do_estudante() = m.crianca_id))
$$;

create or replace function privado.ve_evento(e evento) returns boolean
language sql stable security definer set search_path = public as $$
  select privado.eh('gestao') or e.criado_por = auth.uid()
      or (e.participantes is not null and auth.uid() = any (e.participantes))
      or (e.participantes is null and e.status = 'confirmado'
          and (e.publico is null or privado.papel_atual() = any (e.publico))
          and (e.turma_id is null or privado.papel_atual() not in ('estudante','responsavel','educacao')
               or privado.ve_turma(e.turma_id)))
$$;

-- Regras de quem marca o quê (RLS diz quem pode inserir; o gatilho diz qual tipo).
create or replace function privado.trava_evento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
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
  -- Responsável e apoiadores só pedem conversa: entra como "solicitado" e a equipe confirma.
  if tg_op = 'INSERT' and new.tipo = 'reuniao_individual' and new.status = 'solicitado'
     and auth.uid() = any (new.participantes) and new.criado_por = auth.uid() then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.status = 'cancelado' and old.criado_por = auth.uid() then
    return new;
  end if;
  raise exception 'A agenda só é editada pela equipe. Use "Pedir conversa" para marcar um horário.';
end $$;
create trigger trava_evento before insert or update on evento
  for each row execute function privado.trava_evento();

alter table evento enable row level security;
create policy leitura on evento for select using (privado.ve_evento(evento));
create policy cria on evento for insert with check (criado_por = auth.uid() and privado.eh_adulto());
create policy edita on evento for update using (
  privado.eh('gestao') or criado_por = auth.uid()
  or (privado.eh('educacao') and auth.uid() = any (participantes)));
create policy remove on evento for delete using (privado.eh('gestao') or criado_por = auth.uid() and privado.eh_equipe());

-- Pessoas da equipe com quem se pode pedir conversa (só nome e papel).
create view equipe_contato as
select id, nome, papel from perfil where ativo and papel in ('educacao','gestao');

-- ───────────────────────── Tarefas, dicas e resumos ─────────────────────────
create table tarefa (
  id          uuid primary key default gen_random_uuid(),
  turma_id    uuid not null references turma(id) on delete cascade,
  tipo        tipo_tarefa not null default 'tarefa',
  titulo      text not null,
  corpo       text not null,
  link        text,
  entrega     date,
  criado_por  uuid not null references perfil(id) on delete cascade,
  criado_em   timestamptz not null default now()
);
create index on tarefa (turma_id, criado_em desc);
alter table tarefa enable row level security;
-- Conteúdo escolar é aberto a todo perfil logado (responsáveis e apoiadores veem "tudo da escola").
create policy leitura on tarefa for select using (auth.uid() is not null);
create policy equipe on tarefa for insert with check (
  criado_por = auth.uid() and (privado.eh('gestao') or privado.educa_turma(turma_id)));
create policy equipe_edita on tarefa for update using (privado.eh('gestao') or criado_por = auth.uid());
create policy equipe_remove on tarefa for delete using (privado.eh('gestao') or criado_por = auth.uid());

-- ───────────────────────── Links e materiais de apoio ─────────────────────────
create table material (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text,
  url         text not null check (url ~ '^https?://'),
  area        text not null,       -- 'Leitura', 'Matemática', 'Inglês', 'Currículo e trabalho', 'Finanças da casa', 'IA e tecnologia'…
  para        text not null check (para in ('alunos','responsaveis','todos')),
  ordem       smallint not null default 0,
  criado_por  uuid references perfil(id) on delete set null,
  criado_em   timestamptz not null default now()
);
alter table material enable row level security;
create policy leitura on material for select using (true);
create policy equipe on material for all using (privado.eh_equipe()) with check (privado.eh_equipe());

-- ───────────────────────── Biblioteca ─────────────────────────
create table livro (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  autor       text not null,
  faixa       text not null,       -- '6 a 8 anos', '9 a 11 anos', 'adultos'
  tema        text,
  exemplares  smallint not null default 1 check (exemplares >= 0),
  ativo       boolean not null default true
);
create table reserva_livro (
  id            uuid primary key default gen_random_uuid(),
  livro_id      uuid not null references livro(id) on delete cascade,
  perfil_id     uuid not null references perfil(id) on delete cascade,
  reservado_em  timestamptz not null default now(),
  devolver_ate  date not null default (current_date + 14),
  status        status_reserva not null default 'reservado'
);
create index on reserva_livro (livro_id) where status in ('reservado','retirado');
alter table livro enable row level security;
alter table reserva_livro enable row level security;
create policy leitura on livro for select using (true);
create policy equipe on livro for all using (privado.eh_equipe()) with check (privado.eh_equipe());
create policy leitura on reserva_livro for select using (perfil_id = auth.uid() or privado.eh_equipe());
create policy equipe on reserva_livro for update using (privado.eh_equipe() or perfil_id = auth.uid());

create view livro_disponivel as
select l.*, l.exemplares - (select count(*) from reserva_livro r
                            where r.livro_id = l.id and r.status in ('reservado','retirado')) as disponiveis
from livro l where l.ativo;

-- Reserva atômica: confere exemplar livre e no máximo 2 reservas abertas por pessoa.
create or replace function public.reservar_livro(p_livro uuid) returns reserva_livro
language plpgsql security definer set search_path = public as $$
declare r reserva_livro; livres int;
begin
  if auth.uid() is null or privado.papel_atual() is null then raise exception 'Entre na sua conta para reservar.'; end if;
  perform 1 from livro where id = p_livro and ativo for update;
  select disponiveis into livres from livro_disponivel where id = p_livro;
  if coalesce(livres, 0) <= 0 then raise exception 'Todos os exemplares estão emprestados. Tente de novo em alguns dias.'; end if;
  if (select count(*) from reserva_livro where perfil_id = auth.uid() and status in ('reservado','retirado')) >= 2 then
    raise exception 'Você já tem 2 livros reservados. Devolva um para reservar outro.';
  end if;
  insert into reserva_livro (livro_id, perfil_id) values (p_livro, auth.uid()) returning * into r;
  return r;
end $$;

-- ───────────────────────── Necessidades e doações ─────────────────────────
-- Tabela de necessidades = carências com unidade e estado (novo, semiusado) ou vaquinha em reais.
alter table carencia add column unidade text;                         -- 'bolas', 'cadernos', 'reais'
alter table carencia add column condicao text;                        -- 'novos', 'semiusados'
alter table carencia add column vaquinha boolean not null default false;

create or replace view publico_carencias as
select id, titulo, descricao, categoria, quantidade_necessaria, quantidade_atendida,
       valor_estimado, prazo, status, imagem_url,
       case when quantidade_necessaria > 0
            then least(100, round(quantidade_atendida * 100.0 / quantidade_necessaria)) end as progresso_pct,
       unidade, condicao, vaquinha
from carencia where publicacao = 'publicado' and status <> 'encerrada';

-- Intenção de doação: o apoiador (ou responsável) se compromete; a gestão confirma
-- quando o bem ou o dinheiro chega, e só então vira doação e conta no progresso.
create table compromisso_doacao (
  id           uuid primary key default gen_random_uuid(),
  carencia_id  uuid references carencia(id) on delete set null,
  perfil_id    uuid not null references perfil(id) on delete cascade,
  valor        numeric(12,2) check (valor > 0),
  quantidade   int check (quantidade > 0),
  mensagem     text check (length(mensagem) <= 500),
  status       status_compromisso not null default 'pendente',
  criado_em    timestamptz not null default now(),
  tratado_por  uuid references perfil(id) on delete set null,
  tratado_em   timestamptz,
  check (valor is not null or quantidade is not null)
);
alter table compromisso_doacao enable row level security;
create policy leitura on compromisso_doacao for select using (perfil_id = auth.uid() or privado.eh('gestao'));
create policy cria on compromisso_doacao for insert with check (
  perfil_id = auth.uid() and status = 'pendente'
  and privado.papel_atual() in ('responsavel','doador_pf','empresa','gestao'));
create policy gestao on compromisso_doacao for update using (privado.eh('gestao') or perfil_id = auth.uid());

create or replace function public.confirmar_compromisso(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare c compromisso_doacao;
begin
  if not privado.eh('gestao') then raise exception 'Só a diretoria confirma doações recebidas.'; end if;
  select * into c from compromisso_doacao where id = p_id and status = 'pendente' for update;
  if not found then raise exception 'Compromisso não encontrado ou já tratado.'; end if;
  insert into doacao (apoiador_id, carencia_id, valor, quantidade, data, forma, registrado_por)
  values (c.perfil_id, c.carencia_id, c.valor, c.quantidade, current_date,
          case when c.valor is null then 'bens' else 'pix' end, auth.uid());
  update carencia set quantidade_atendida = quantidade_atendida + coalesce(case when vaquinha then c.valor::int else c.quantidade end, 0),
                      status = case when quantidade_atendida + coalesce(case when vaquinha then c.valor::int else c.quantidade end, 0)
                                         >= quantidade_necessaria then 'atendida' else 'parcial' end
  where id = c.carencia_id;
  update compromisso_doacao set status = 'confirmado', tratado_por = auth.uid(), tratado_em = now() where id = p_id;
end $$;

-- Ranking de apoiadores, separado em pessoa física e empresa (CNPJ).
-- Só para perfis logados; o nome só aparece com autorização (RF-06), senão "Apoiador anônimo".
-- O responsável que doa entra como pessoa física.
create view ranking_apoiadores as
select pf.id = auth.uid() as sou_eu,
       case when pf.papel = 'empresa' then 'empresa' else 'pessoa_fisica' end as categoria,
       case when pf.exibir_nome_publico and pf.nome_publico is not null then pf.nome_publico
            when pf.id = auth.uid() then pf.nome || ' (você, anônimo)'
            else 'Apoiador anônimo' end as nome,
       coalesce(sum(d.valor), 0) as total_reais,
       coalesce(sum(d.quantidade), 0) as itens_doados,
       count(distinct date_trunc('month', d.data)) as meses_de_apoio,
       rank() over (partition by (pf.papel = 'empresa') order by coalesce(sum(d.valor), 0) desc) as posicao
from perfil pf join doacao d on d.apoiador_id = pf.id
where pf.ativo and auth.uid() is not null and privado.eh_adulto()
group by pf.id;

-- ───────────────────────── Desempenho acadêmico ─────────────────────────
create table nota (
  id          uuid primary key default gen_random_uuid(),
  crianca_id  uuid not null references crianca(id) on delete cascade,
  turma_id    uuid not null references turma(id),
  disciplina  text not null check (disciplina in ('Português','Matemática','Inglês','Leitura','Projeto')),
  avaliacao   text not null,           -- 'Prova 1', 'Trabalho de ciências'…
  valor       numeric(4,2) not null check (valor between 0 and 10),
  data        date not null default current_date,
  lancado_por uuid not null references perfil(id) on delete cascade,
  lancado_em  timestamptz not null default now()
);
create index on nota (crianca_id, data);
create index on nota (turma_id, data);

create table observacao_aluno (
  id          uuid primary key default gen_random_uuid(),
  crianca_id  uuid not null references crianca(id) on delete cascade,
  tipo        tipo_observacao not null,
  texto       text not null check (length(texto) <= 1000),
  autor_id    uuid not null references perfil(id) on delete cascade,
  criado_em   timestamptz not null default now()
);

alter table nota enable row level security;
alter table observacao_aluno enable row level security;
-- Notas e observações: só o aluno, seus responsáveis, o professor da turma e a diretoria.
create policy leitura on nota for select using (privado.ve_crianca(crianca_id));
create policy equipe on nota for all using (privado.eh('gestao') or privado.educa_crianca(crianca_id))
  with check (lancado_por = auth.uid() and (privado.eh('gestao') or privado.educa_crianca(crianca_id)));
create policy leitura on observacao_aluno for select using (privado.ve_crianca(crianca_id));
create policy equipe on observacao_aluno for all using (privado.eh('gestao') or privado.educa_crianca(crianca_id))
  with check (autor_id = auth.uid() and (privado.eh('gestao') or privado.educa_crianca(crianca_id)));

-- Presença e notas por turma e mês: agregado, sem nome de criança.
-- Grupos com menos de 5 crianças ficam sem número (mesma regra das visões públicas).
create view desempenho_turma as
with n as (
  select turma_id, date_trunc('month', data)::date as mes, disciplina,
         round(avg(valor), 1) as media, count(distinct crianca_id) as criancas
  from nota group by 1, 2, 3
), p as (
  select turma_id, date_trunc('month', data)::date as mes,
         round(100.0 * count(*) filter (where presente) / nullif(count(*), 0), 1) as presenca_pct,
         count(distinct crianca_id) as criancas
  from presenca group by 1, 2
)
select t.id as turma_id, t.nome as turma, pr.nome as programa, coalesce(n.mes, p.mes) as mes, n.disciplina,
       case when n.criancas >= 5 then n.media end as media,
       case when p.criancas >= 5 then p.presenca_pct end as presenca_pct
from turma t join programa pr on pr.id = t.programa_id and not pr.sensivel
left join p on p.turma_id = t.id
left join n on n.turma_id = t.id and n.mes = p.mes
where auth.uid() is not null and privado.eh_adulto() or privado.crianca_do_estudante() is not null;

-- ───────────────────────── Feedback ─────────────────────────
alter table sugestao add column tipo tipo_feedback not null default 'sugestao';

-- ───────────────────────── Acessos às visões e funções ─────────────────────────
grant select on publico_carencias to anon, authenticated;
grant select on equipe_contato, livro_disponivel, ranking_apoiadores, desempenho_turma to authenticated;
revoke all on function public.reservar_livro, public.confirmar_compromisso from anon;
grant execute on function public.reservar_livro, public.confirmar_compromisso to authenticated;
-- O Supabase dá acesso padrão ao anônimo em objetos novos do schema public; aqui não.
revoke all on equipe_contato, livro_disponivel, ranking_apoiadores, desempenho_turma from anon;
