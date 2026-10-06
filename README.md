# Portal Ebenézer

Portal de monitoramento, engajamento e avisos do Instituto Ebenézer — MVP do Módulo 3 do MBA em IA e Dados para Negócios (Inteli).

Todo o desenvolvimento e toda a demonstração usam **somente dados sintéticos**.

## Arquitetura

- **Banco, autenticação e permissões:** Supabase (Postgres, região São Paulo), com Row Level Security por perfil.
- **Front-end:** React + Vite, mobile-first, publicado na Cloudflare Pages ou Netlify (plano gratuito).

## Estado atual

- [x] Modelo de dados, permissões por perfil, importação com prévia e desfazer, conquistas automáticas — `supabase/migrations/`
- [x] Testes de permissão — `supabase/tests/`
- [x] Gerador de dados sintéticos — `supabase/seed/dados_sinteticos.sql`
- [x] Front-end, parte 1: área pública, família, estudante e equipe de educação — `web/`
- [ ] Front-end, parte 2: apoiadores, gestão, publicação de avisos e carências, resumos de IA
- [ ] Documentação de handover

## Como aplicar o banco no Supabase

1. Crie um projeto no Supabase na região São Paulo (`sa-east-1`).
2. No SQL Editor, rode os arquivos de `supabase/migrations/` em ordem numérica (são cinco).

3. Rode `supabase/seed/dados_sinteticos.sql` para popular o banco. Ele pode ser rodado de novo a qualquer momento: apaga os dados sintéticos anteriores e gera tudo outra vez, com datas relativas ao dia. **Rode de novo antes de cada demonstração**, para os painéis aparecerem atualizados.

### Contas de demonstração

Senha de todas: `Ebenezer#2026`. PIN de saída do espaço do Kauã: `1234`.

| E-mail | Perfil | O que mostra |
| --- | --- | --- |
| gestao@ebenezer.test | Gestão (Elias) | Painel completo, fila de aprovação, acessos |
| educacao@ebenezer.test | Educação (Beatriz) | Turmas, importação, Primeira Infância desatualizada |
| responsavel@ebenezer.test | Responsável (Adriana) | Dois filhos: Kauã (reforço e Sonhos) e Ana (Primeira Infância) |
| pendente@ebenezer.test | Responsável (Rosa) | Primeiro acesso, ainda sem autorização (tela T-11) |
| estudante@ebenezer.test | Estudante (Kauã, 9 anos) | Trilha de leitura, conquistas, turma |
| doador@ebenezer.test | Doadora (Marisa) | Doação mensal desde fevereiro, nome autorizado no reconhecimento |
| empresa@ebenezer.test | Empresa (Roberto, TechNorte) | Painel de patrocinador |

### O que o gerador cria

129 crianças em 4 programas e 7 turmas, 110 famílias, 26 estudantes com acesso, cerca de 9 mil registros de presença (média de 86%), avaliações mensais de leitura que levam o nível inicial de 75% em fevereiro para 43% em setembro, conquistas, 68 apoiadores, cerca de 290 doações, carências, avisos, sugestões e indicadores mensais calculados a partir dos próprios dados. Quatro crianças têm queda de presença nas últimas três semanas, e a Primeira Infância está sem importação há quatro semanas, para demonstrar os alertas e o estado "desatualizado". Nomes, valores e empresas são fictícios.

Detalhes do modelo: [docs/modelo-de-dados.md](docs/modelo-de-dados.md).

## Como rodar os testes de permissão localmente

Com Postgres 15 ou superior:

```bash
createdb portal
psql -d portal -f supabase/tests/00_stub_supabase_local.sql
for f in supabase/migrations/*.sql; do psql -d portal -v ON_ERROR_STOP=1 -f "$f"; done
psql -d portal -f supabase/tests/permissoes_test.sql
```

## Como rodar o front-end

Requer Node 20 ou superior.

```bash
cd web
npm install
cp .env.example .env.local   # preencha com a URL e a chave anon do projeto (Project Settings > API)
npm run dev                  # abre em http://localhost:5173
```

Para revisar as telas sem Supabase, com dados de exemplo locais: `npm run dev:mock`.

## Como publicar (Netlify ou Cloudflare Pages, plano gratuito)

1. Suba este repositório no GitHub.
2. Crie um site novo apontando para o repositório, com estas configurações:
   - Diretório base: `web`
   - Comando de build: `npm run build`
   - Pasta publicada: `web/dist` (na Netlify, com diretório base `web`, informe só `dist`)
   - Variáveis de ambiente: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. O arquivo `web/public/_redirects` já faz as rotas funcionarem em links diretos.
4. No Supabase, em Authentication > URL Configuration, coloque o endereço do site em Site URL.

Cada commit na branch principal publica uma versão nova automaticamente.
