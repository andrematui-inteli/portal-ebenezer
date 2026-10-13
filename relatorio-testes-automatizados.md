# Relatório dos testes automatizados de permissão

Executado em 13 de outubro de 2026, em banco limpo, com as 11 migrações aplicadas na ordem. Ambiente: PostgreSQL 16 local, com um stub mínimo do Supabase (`supabase/tests/00_stub_supabase_local.sql`) que imita o login e os papéis `anon` e `authenticated`.

Cada teste entra como um perfil (visitante, família, criança, educação, doador, empresa, gestão) e confere o que ele vê, o que não vê e o que não consegue fazer. As regras são impostas pelo banco, então valem para qualquer tela, presente ou futura.

**Resultado: 98 de 98 testes passaram.**

## Permissões por perfil (núcleo do portal) (35 testes)

Arquivo: `supabase/tests/permissoes_test.sql`

| # | Regra conferida | Resultado |
| --- | --- | --- |
| 1 | prévia aponta turma alheia e código inexistente, linha a linha | Passou |
| 2 | prévia não grava nada | Passou |
| 3 | confirmação com erro cancela tudo | Passou |
| 4 | linha de base não gera conquista | Passou |
| 5 | avanço de 1,5 para 3,2 blocos e novo nível geram 3 conquistas | Passou |
| 6 | Vivências recusa presença individual (e a turma nem é da Beatriz) | Passou |
| 7 | Beatriz vê avaliações só da própria turma | Passou |
| 8 | Beatriz não vê a matrícula do Kauã em Vivências | Passou |
| 9 | Beatriz não vê doações | Passou |
| 10 | Beatriz não consegue virar gestão | Passou |
| 11 | aviso aberto ao público não publica sem aprovação | Passou |
| 12 | Adriana vê a presença só do filho | Passou |
| 13 | avanço chega traduzido em série escolar | Passou |
| 14 | Adriana vê as duas matrículas do filho, inclusive Vivências | Passou |
| 15 | Adriana vê o aviso dirigido a responsáveis | Passou |
| 16 | Adriana não vê doações | Passou |
| 17 | Rosa ainda vê o vínculo com a neta | Passou |
| 18 | consentimento revogado suspende a exibição | Passou |
| 19 | Kauã vê as próprias conquistas | Passou |
| 20 | Kauã não vê avaliação de outra criança | Passou |
| 21 | Kauã não alcança avisos adultos | Passou |
| 22 | Kauã só vê o próprio perfil | Passou |
| 23 | acesso suspenso pelo responsável não vê nada | Passou |
| 24 | Marisa vê o próprio histórico de doações | Passou |
| 25 | Marisa não vê crianças | Passou |
| 26 | Jonas não vê a doação da Marisa | Passou |
| 27 | visitante vê só a carência aprovada | Passou |
| 28 | vitrine mostra o progresso da carência | Passou |
| 29 | reconhecimento por constância, só de quem autorizou | Passou |
| 30 | reconhecimento não tem coluna de valor | Passou |
| 31 | programa com menos de 5 crianças tem o número suprimido | Passou |
| 32 | visitante não vê dado individual | Passou |
| 33 | visitante consegue solicitar acesso | Passou |
| 34 | desfazer remove o lote e as conquistas ainda não vistas | Passou |
| 35 | nem a gestão grava presença individual em programa sensível | Passou |

## Vida escolar (49 testes)

Arquivo: `supabase/tests/escola_test.sql`

| # | Regra conferida | Resultado |
| --- | --- | --- |
| 1 | Kauã vê a prova da turma dele e o passeio; não vê conversa, reunião de pais, encontro nem prova de outra turma | Passou |
| 2 | Kauã vê só a própria nota | Passou |
| 3 | aluno não vê o ranking de doações | Passou |
| 4 | aluno vê as tarefas | Passou |
| 5 | Adriana vê a turma do filho, a própria conversa e a reunião de pais; não vê o encontro de patrocinadores | Passou |
| 6 | Adriana vê a nota do filho e não vê a nota nem o comentário da Lia | Passou |
| 7 | Adriana vê com quem pode pedir conversa | Passou |
| 8 | Adriana consegue pedir conversa | Passou |
| 9 | responsável não marca prova na agenda | Passou |
| 10 | reserva ocupa o exemplar | Passou |
| 11 | responsável não lança nota | Passou |
| 12 | Marisa vê o encontro de patrocinadores e o passeio; não vê provas, reuniões nem conversas | Passou |
| 13 | Marisa não vê notas nem comentários | Passou |
| 14 | quadro de apoiadores: Marisa com nome autorizado e 2 meses; Jonas aparece anônimo | Passou |
| 15 | Marisa vê o próprio total, mas não o valor doado pelos outros | Passou |
| 16 | livro sem exemplar livre não é reservado | Passou |
| 17 | doadora não confirma a própria doação | Passou |
| 18 | Beatriz não vê prova de turma alheia e vê as conversas em que participa | Passou |
| 19 | Beatriz vê só as notas da própria turma | Passou |
| 20 | Beatriz marca aula na própria turma em dia útil | Passou |
| 21 | não há prova no fim de semana | Passou |
| 22 | Beatriz vê só a responsável do aluno da turma dela, para marcar conversa | Passou |
| 23 | professora marca conversa com a família | Passou |
| 24 | professora não suspende aluno de outra turma | Passou |
| 25 | professora não edita o PIX | Passou |
| 26 | professora não cadastra pessoas | Passou |
| 27 | professora não marca passeio | Passou |
| 28 | professora não marca prova em turma alheia | Passou |
| 29 | Beatriz lança nota de aluno da turma | Passou |
| 30 | professora não lança nota de aluno de outra turma | Passou |
| 31 | confirmação vira doação e soma na vaquinha | Passou |
| 32 | diretoria marca visita a empresa | Passou |
| 33 | diretoria cadastra o PIX | Passou |
| 34 | diretoria cadastra responsável com login | Passou |
| 35 | diretoria cadastra criança, matrícula e vínculo | Passou |
| 36 | diretoria libera o acesso da aluna | Passou |
| 37 | cadastro recusa nome completo de criança | Passou |
| 38 | e-mail repetido é recusado | Passou |
| 39 | nova mãe vê o vínculo e autoriza no primeiro acesso | Passou |
| 40 | quem vai doar vê o PIX do Instituto | Passou |
| 41 | visitante não vê agenda nem notas | Passou |
| 42 | visitante não acessa o ranking | Passou |
| 43 | visitante não vê a lista da equipe | Passou |
| 44 | vitrine pública já mostra a vaquinha | Passou |
| 45 | Kauã não lê os comentários dos professores sobre ele | Passou |
| 46 | Adriana lê o comentário sobre o filho | Passou |
| 47 | Adriana suspende o acesso do filho | Passou |
| 48 | a professora não suspende o acesso de aluno; quem decide é a família | Passou |
| 49 | a gestão vê os valores de todos os apoiadores | Passou |

## Aulas em família (14 testes)

Arquivo: `supabase/tests/aulas_familia_test.sql`

| # | Regra conferida | Resultado |
| --- | --- | --- |
| 1 | visitante vê o curso aberto e não vê o rascunho | Passou |
| 2 | vitrine mostra as vagas restantes | Passou |
| 3 | visitante se inscreve sem conta | Passou |
| 4 | idade fora da faixa é recusada com mensagem clara | Passou |
| 5 | mesmo contato não se inscreve duas vezes | Passou |
| 6 | visitante não lê a lista de inscritos | Passou |
| 7 | rascunho não recebe inscrição | Passou |
| 8 | Adriana inscreve a família com dois filhos adolescentes | Passou |
| 9 | Adriana vê só a própria inscrição | Passou |
| 10 | curso lotado manda para a lista de espera, com a posição | Passou |
| 11 | a equipe de educação não vê os inscritos (inscrição separada) | Passou |
| 12 | a gestão vê todas as inscrições | Passou |
| 13 | ao cancelar uma inscrição, a primeira da lista de espera ganha a vaga | Passou |
| 14 | do jovem, o banco guarda só a idade | Passou |

## Como repetir

Com PostgreSQL 15 ou superior, a partir da raiz do repositório:

```bash
createdb portal
psql -d portal -f supabase/tests/00_stub_supabase_local.sql
for f in supabase/migrations/*.sql; do psql -d portal -v ON_ERROR_STOP=1 -f "$f"; done
psql -d portal -f supabase/tests/permissoes_test.sql -f supabase/tests/escola_test.sql -f supabase/tests/aulas_familia_test.sql
```

Se alguma regra falhar, o script para e mostra `FALHOU:` com a descrição do teste.

## Desempenho

Com os dados sintéticos completos (cerca de 9,5 mil registros de presença), as consultas de cada tela foram medidas depois da migração 11. A mais pesada, a lista de crianças com queda de presença vista pela educação, caiu de 6,5 segundos para 17 milissegundos; todas as demais ficaram abaixo de 10 milissegundos. O limite do Supabase é de 8 segundos por consulta.
