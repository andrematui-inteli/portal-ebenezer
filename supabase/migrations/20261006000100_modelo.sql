-- Portal Ebenézer · Migração 1 · Modelo de dados
-- Princípio de minimização: o portal não guarda endereço, documento, renda,
-- dado de saúde, registro clínico nem foto de criança. Nenhuma tabela abaixo
-- tem coluna para isso, por construção.

create extension if not exists pgcrypto;

-- ───────────────────────── Tipos ─────────────────────────
create type papel as enum ('responsavel','estudante','educacao','doador_pf','empresa','gestao');
create type cadencia as enum ('diaria','semanal');
create type disciplina as enum ('leitura','matematica','ingles');
create type tipo_importacao as enum ('presenca','presenca_agregada','avaliacao');
create type status_publicacao as enum ('rascunho','aguardando_aprovacao','publicado','arquivado');
create type categoria_carencia as enum ('material_pedagogico','alimentacao','infraestrutura','experiencias');
create type status_carencia as enum ('aberta','parcial','atendida','encerrada');
create type status_resumo as enum ('rascunho','aprovado','descartado');
create type status_solicitacao as enum ('pendente','aprovada','recusada');

-- ───────────────────────── Programas e turmas ─────────────────────────
create table programa (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique,
  nome        text not null,
  descricao   text,
  cadencia    cadencia not null,
  idade_min   smallint not null,
  idade_max   smallint not null,
  -- Programa sensível (ex.: Vivências Terapêuticas): participação individual
  -- nunca é registrada; só entra presença agregada por turma.
  sensivel    boolean not null default false,
  ativo       boolean not null default true
);

create table turma (
  id           uuid primary key default gen_random_uuid(),
  programa_id  uuid not null references programa(id),
  nome         text not null,
  turno        text,                 -- 'manhã', 'tarde', 'sábado 12h–16h'…
  capacidade   smallint,
  ativo        boolean not null default true,
  unique (programa_id, nome)
);

-- ───────────────────────── Crianças ─────────────────────────
create table crianca (
  id               uuid primary key default gen_random_uuid(),
  nome_exibicao    text not null,     -- primeiro nome + inicial; nunca nome completo
  ano_nascimento   smallint not null, -- ano basta para faixa etária
  codigo_parceiro  text unique,       -- chave usada para casar arquivos importados
  criado_em        timestamptz not null default now(),
  ativo            boolean not null default true
);

create table matricula (
  id          uuid primary key default gen_random_uuid(),
  crianca_id  uuid not null references crianca(id) on delete cascade,
  turma_id    uuid not null references turma(id),
  inicio      date not null default current_date,
  fim         date,
  unique (crianca_id, turma_id, inicio)
);

-- ───────────────────────── Pessoas e acessos ─────────────────────────
-- Um perfil por usuário do Supabase Auth. O visitante não tem perfil.
create table perfil (
  id                    uuid primary key references auth.users(id) on delete cascade,
  papel                 papel not null,
  nome                  text not null,
  telefone              text,
  ativo                 boolean not null default true,
  criado_em             timestamptz not null default now(),
  ultimo_acesso_em      timestamptz,
  -- Reconhecimento público (RF-06): desmarcado por padrão e revogável.
  exibir_nome_publico   boolean not null default false,
  nome_publico          text,
  exibicao_autorizada_em timestamptz
);

-- Vínculo responsável ↔ criança, com consentimento LGPD Art. 14 (RF-03).
-- Revogar suspende a exibição sem desfazer o vínculo.
create table responsavel_crianca (
  responsavel_id            uuid not null references perfil(id) on delete cascade,
  crianca_id                uuid not null references crianca(id) on delete cascade,
  parentesco                text,
  consentimento_em          timestamptz,
  consentimento_revogado_em timestamptz,
  primary key (responsavel_id, crianca_id)
);

-- Acesso da criança à área do estudante, liberado pelo responsável (RF-04).
create table acesso_estudante (
  crianca_id    uuid primary key references crianca(id) on delete cascade,
  perfil_id     uuid not null unique references perfil(id) on delete cascade,
  liberado_por  uuid not null references perfil(id),
  liberado_em   timestamptz not null default now(),
  suspenso_em   timestamptz
);

create table educador_turma (
  perfil_id  uuid not null references perfil(id) on delete cascade,
  turma_id   uuid not null references turma(id) on delete cascade,
  primary key (perfil_id, turma_id)
);

create table solicitacao_acesso (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  contato           text not null,
  papel_pretendido  papel not null,
  mensagem          text,
  criada_em         timestamptz not null default now(),
  status            status_solicitacao not null default 'pendente',
  tratada_por       uuid references perfil(id),
  tratada_em        timestamptz,
  check (papel_pretendido <> 'estudante')
);

-- ───────────────────────── Importação ─────────────────────────
create table lote_importacao (
  id            uuid primary key default gen_random_uuid(),
  tipo          tipo_importacao not null,
  arquivo_nome  text not null,
  importado_por uuid not null references perfil(id),
  importado_em  timestamptz not null default now(),
  criadas       int not null default 0,
  alteradas     int not null default 0,
  ignoradas     int not null default 0,
  desfeito_em   timestamptz,
  desfeito_por  uuid references perfil(id)
);

-- Valor anterior de cada linha alterada por um lote, para permitir desfazer.
create table lote_alteracao (
  lote_id      uuid not null references lote_importacao(id) on delete cascade,
  tabela       text not null,
  registro_id  uuid not null,
  anterior     jsonb not null,
  primary key (lote_id, tabela, registro_id)
);

-- ───────────────────────── Acompanhamento ─────────────────────────
create table presenca (
  id          uuid primary key default gen_random_uuid(),
  crianca_id  uuid not null references crianca(id) on delete cascade,
  turma_id    uuid not null references turma(id),
  data        date not null,
  presente    boolean not null,
  lote_id     uuid references lote_importacao(id) on delete set null,
  unique (crianca_id, turma_id, data)
);

-- Presença de programas sensíveis: só contagem por turma e dia.
create table presenca_agregada (
  id         uuid primary key default gen_random_uuid(),
  turma_id   uuid not null references turma(id),
  data       date not null,
  presentes  smallint not null check (presentes >= 0),
  possiveis  smallint not null check (possiveis >= presentes),
  lote_id    uuid references lote_importacao(id) on delete set null,
  unique (turma_id, data)
);

-- Escala de níveis do parceiro (Alicerce Educação), traduzida em série (RF-08).
create table nivel_parceiro (
  codigo             text primary key,
  nome               text not null,
  serie_equivalente  text not null,
  ordem              smallint not null unique
);

create table avaliacao (
  id                 uuid primary key default gen_random_uuid(),
  crianca_id         uuid not null references crianca(id) on delete cascade,
  disciplina         disciplina not null,
  data_avaliacao     date not null,
  nivel_codigo       text not null references nivel_parceiro(codigo),
  blocos_acumulados  numeric(5,2) not null check (blocos_acumulados >= 0),
  lote_id            uuid references lote_importacao(id) on delete set null,
  unique (crianca_id, disciplina, data_avaliacao)
);

-- ───────────────────────── Conquistas e marcos ─────────────────────────
create table tipo_conquista (
  codigo     text primary key,
  nome       text not null,
  criterio   text not null,     -- critério objetivo declarado (RF-09)
  icone      text not null,
  escopo     text not null check (escopo in ('individual','turma'))
);

-- Conquistas só se acumulam: não há update nem delete pela aplicação.
create table conquista (
  id           uuid primary key default gen_random_uuid(),
  crianca_id   uuid not null references crianca(id) on delete cascade,
  tipo_codigo  text not null references tipo_conquista(codigo),
  referencia   text not null default '',   -- ex.: 'bloco-3', 'nivel-navegador'
  obtida_em    timestamptz not null default now(),
  vista_em     timestamptz,                -- anunciada no acesso seguinte
  unique (crianca_id, tipo_codigo, referencia)
);

create table marco_turma (
  id           uuid primary key default gen_random_uuid(),
  turma_id     uuid not null references turma(id) on delete cascade,
  tipo_codigo  text references tipo_conquista(codigo),
  descricao    text not null,
  atingido_em  date not null default current_date
);

-- ───────────────────────── Captação ─────────────────────────
create table carencia (
  id                     uuid primary key default gen_random_uuid(),
  titulo                 text not null,
  descricao              text,
  categoria              categoria_carencia not null,
  quantidade_necessaria  int,
  quantidade_atendida    int not null default 0,
  valor_estimado         numeric(12,2),
  prazo                  date,
  status                 status_carencia not null default 'aberta',
  publicacao             status_publicacao not null default 'aguardando_aprovacao',
  imagem_url             text,                      -- só espaços e objetos, nunca crianças
  criado_por             uuid not null references perfil(id),
  criado_em              timestamptz not null default now(),
  aprovado_por           uuid references perfil(id),
  aprovado_em            timestamptz
);

-- Valor doado: visível só ao próprio apoiador e à gestão (princípio 2).
create table doacao (
  id              uuid primary key default gen_random_uuid(),
  apoiador_id     uuid not null references perfil(id),
  carencia_id     uuid references carencia(id),
  valor           numeric(12,2),           -- nulo para doação em bens
  quantidade      int,                     -- doação em bens
  data            date not null,
  forma           text not null check (forma in ('pix','transferencia','bens','outro')),
  registrado_por  uuid not null references perfil(id),
  registrado_em   timestamptz not null default now(),
  check (valor is not null or quantidade is not null)
);

-- ───────────────────────── Comunicação ─────────────────────────
create table aviso (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  corpo          text not null,
  publico_alvo   papel[],          -- nulo = todos, inclusive visitantes
  data_evento    timestamptz,
  o_que_levar    text,
  imagem_url     text,
  publicacao     status_publicacao not null default 'publicado',
  autor_id       uuid not null references perfil(id),
  criado_em      timestamptz not null default now(),
  aprovado_por   uuid references perfil(id),
  aprovado_em    timestamptz
);

create table aviso_visto (
  aviso_id   uuid not null references aviso(id) on delete cascade,
  perfil_id  uuid not null references perfil(id) on delete cascade,
  visto_em   timestamptz not null default now(),
  primary key (aviso_id, perfil_id)
);

create table sugestao (
  id              uuid primary key default gen_random_uuid(),
  autor_id        uuid not null references perfil(id),
  texto           text not null check (length(texto) <= 1000),
  criada_em       timestamptz not null default now(),
  resposta        text,
  respondida_por  uuid references perfil(id),
  respondida_em   timestamptz
);

-- ───────────────────────── Indicadores e IA ─────────────────────────
-- Dicionário de indicadores: todo número exibido tem fonte, frequência e dono.
create table indicador (
  codigo             text primary key,
  nome               text not null,
  definicao          text not null,
  fonte              text not null,
  frequencia         text not null,
  responsavel_papel  papel not null,
  publico            boolean not null default false
);

create table indicador_valor (
  id                uuid primary key default gen_random_uuid(),
  indicador_codigo  text not null references indicador(codigo) on delete cascade,
  periodo           date not null,
  valor             numeric not null,
  atualizado_em     timestamptz not null default now(),
  unique (indicador_codigo, periodo)
);

-- Resumos narrativos gerados por IA: só aparecem depois de aprovação humana.
create table resumo_ia (
  id            uuid primary key default gen_random_uuid(),
  escopo        text not null,      -- 'programa:reforco', 'patrocinador', 'alerta-meta'
  periodo       date not null,
  texto         text not null,
  status        status_resumo not null default 'rascunho',
  gerado_em     timestamptz not null default now(),
  aprovado_por  uuid references perfil(id),
  aprovado_em   timestamptz
);

-- Páginas editáveis pela equipe (ex.: guia de operação de uma página).
create table pagina (
  slug            text primary key,
  titulo          text not null,
  conteudo        text not null,
  atualizado_por  uuid references perfil(id),
  atualizado_em   timestamptz not null default now()
);

-- ───────────────────────── Índices ─────────────────────────
create index on matricula (turma_id) where fim is null;
create index on presenca (turma_id, data);
create index on avaliacao (crianca_id, disciplina, data_avaliacao desc);
create index on conquista (crianca_id);
create index on doacao (apoiador_id);
create index on responsavel_crianca (crianca_id);
