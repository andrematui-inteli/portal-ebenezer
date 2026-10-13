# Portal Ebenézer · Documentação de handover

Este documento permite ao Instituto Ebenézer operar e manter o portal sem depender do grupo que o construiu. A primeira parte é para quem usa o portal no dia a dia. A segunda é para o voluntário que cuidar da parte técnica.

| | |
| --- | --- |
| Site | https://portal-ebenezer.netlify.app |
| Vídeo demonstrativo | [Assistir no Google Drive](https://drive.google.com/file/d/1-9t97KqUR_nVqe_IbLPejXfta1f6iOR9/view?usp=drive_link) |
| Repositório | https://github.com/andrematui-inteli/portal-ebenezer |
| Modelo de dados | [docs/modelo-de-dados.md](modelo-de-dados.md) |
| Evidências de teste | [Testes automatizados](testes/relatorio-testes-automatizados.md) e [roteiro do fluxo principal](testes/roteiro-testes-fluxo-principal.md) |

> Tudo o que está no portal hoje é **dado sintético**: crianças, famílias, doações e empresas são fictícias. A seção "Passar para o uso real" explica como trocar pelos dados verdadeiros.

---

# Parte 1 · Guia de operação

## Quem faz o quê

| Papel | Quem | Quanto tempo | O que faz no portal |
| --- | --- | --- | --- |
| Operação semanal | Coordenação de educação e uma suplente | 15 a 30 min por semana | Importa a presença, confere as pendências, publica tarefas e avisos da turma |
| Curadoria e captação | Coordenação geral | 30 min por semana | Aprova o que vai ao público, registra doações, cuida das inscrições das Aulas em família, cadastra pessoas |
| Manutenção técnica | Voluntário técnico | 4 h por mês | Acompanha o Supabase e a Netlify, aplica correções seguindo a Parte 2 |
| Assinatura e acessos | Tesouraria | 10 min por mês | Paga o plano do Supabase e revisa quem tem acesso |

Todo papel deve ter titular e suplente. A rotatividade de voluntários é um risco alto do Instituto.

## A rotina da semana (coordenação de educação)

1. Entre no portal. A primeira tela, **Pendências**, mostra cada programa como "Em dia", "Atrasado" ou "Sem dados". O reforço fica atrasado depois de 7 dias sem presença; os programas de sábado, depois de 14.
2. Em **Importar**, escolha o tipo de arquivo:
   - **Presença das crianças**, para o reforço, o Laboratório de Sonhos e a Primeira Infância. Colunas: `codigo`, `turma`, `data`, `presente`.
   - **Total de presentes nas Vivências**, só com números, sem nomes. Colunas: `turma`, `data`, `presentes`, `possiveis`.
   - **Avanço na leitura (Alicerce)**, uma vez por mês, com o relatório do parceiro. Colunas: `codigo`, `disciplina`, `data`, `nivel`, `blocos`.
3. Use o botão **Baixar modelo** se tiver dúvida sobre o formato. A planilha pode ser Excel (.xlsx) ou .csv.
4. O portal mostra uma **prévia** antes de gravar: quantos registros são novos, quantos mudam e quantos já estavam iguais. Se alguma linha estiver errada, ele diz qual e o que corrigir, e **não grava nada**. Corrija e envie de novo.
5. Confira a prévia e clique em **Gravar**. Se perceber um erro depois, use **Desfazer esta importação**: os registros criados somem e os alterados voltam ao valor anterior.
6. Volte a **Pendências** e olhe a lista **Crianças faltando mais**. Ela aponta quem teve queda forte de presença nas últimas semanas e vale um contato com a família.

O código de cada criança, usado na planilha, aparece em **Turmas**.

## A rotina da coordenação geral

- **Necessidades e doações:** em Escola > Necessidades, a gestão publica as carências e confirma as intenções de doação. Ao confirmar, a doação fica registrada e o progresso da carência sobe. O valor de cada doação só aparece para o próprio doador e para a gestão; o público vê apenas há quantos meses cada pessoa apoia, e só de quem autorizou.
- **Carências enviadas pela educação:** chegam como "aguardando aprovação". Ainda não há tela para aprovar; veja Pendências conhecidas na Parte 2.
- **Aulas em família:** em Escola > Aulas em família, confirme as inscrições pelo WhatsApp e marque como confirmadas. Ao cancelar uma inscrição, a primeira família da lista de espera recebe a vaga sozinha. O botão Baixar lista gera a planilha de inscritos.
- **Cadastro:** em Escola > Cadastro, crie as contas da equipe, das famílias e dos apoiadores, vincule responsáveis às crianças e libere o acesso das crianças alfabetizadas. Cada conta recebe uma senha provisória.
- **Pedidos de acesso:** quem não tem conta pode pedir pelo site. Os pedidos chegam para a gestão.

## O que as famílias e as crianças fazem

- No primeiro acesso, o responsável passa por uma **autorização em três passos**. Sem ela, nada sobre a criança aparece. Ele pode pausar a exibição quando quiser, em Minha conta.
- O responsável libera ou suspende o acesso do filho e define o **PIN de saída** do espaço da criança.
- A criança só usa o portal sozinha depois de alfabetizada. No espaço dela não há caminho para telas de adultos; para sair, é preciso o PIN do responsável.

## O que nunca entra no portal

Documento, endereço, renda, dado de saúde, registro clínico, foto de criança e qualquer avaliação socioemocional individual. Nas Vivências Terapêuticas, o portal guarda só quantas crianças estavam presentes, nunca quais. Nas Aulas em família, do jovem guarda só a idade.

## Quando algo dá errado

| O que aparece | O que fazer |
| --- | --- |
| "O servidor demorou demais para responder" | Tente de novo em alguns segundos. Se continuar, avise o voluntário técnico. |
| O site inteiro não abre ou fica parado | O Supabase pode ter pausado o banco. Veja "Pausa por inatividade" na Parte 2. |
| "Falta configurar o portal" | As chaves do Supabase sumiram da Netlify. Veja "Publicação" na Parte 2. |
| A família não vê os dados do filho | Confira em Cadastro se o vínculo existe e peça à família para conferir a autorização em Minha conta. |
| Esqueceu a senha | A gestão cria uma senha provisória nova em Cadastro. |

---

# Parte 2 · Anexo técnico

## Arquitetura

| Peça | Serviço | Plano |
| --- | --- | --- |
| Banco de dados, login e regras de acesso | Supabase (Postgres, região São Paulo) | Pro, US$ 25 por mês |
| Site | Netlify, publicado a partir do GitHub | Gratuito |
| Código | GitHub | Gratuito |

O site é uma aplicação React. Ele não guarda nenhuma regra de segurança: quem decide o que cada perfil vê é o próprio banco, com Row Level Security. A chave pública do Supabase que vai no site é pública por desenho; a chave secreta (service_role) **nunca** deve ir para o site nem para o repositório.

## Acessos que o Instituto precisa ter

- **Supabase:** conta da organização, com a coordenação geral e o voluntário técnico como membros.
- **Netlify:** site conectado ao repositório, com as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- **GitHub:** repositório transferido para uma conta do Instituto, com o voluntário técnico como colaborador.

Ao final da semana 10, o grupo transfere os três para contas do Instituto.

## Instalação do zero

1. Crie um projeto no Supabase, região São Paulo, e assine o plano Pro.
2. No SQL Editor, rode os 11 arquivos de `supabase/migrations/` em ordem numérica.
3. Para demonstração, rode em seguida `supabase/seed/dados_sinteticos.sql`, `dados_escola.sql` e `dados_aulas_familia.sql`.
4. Na Netlify, importe o repositório. O `netlify.toml` já configura o build. Cadastre as duas variáveis de ambiente e publique.
5. No Supabase, em Authentication > URL Configuration, coloque o endereço do site em Site URL.

O passo a passo detalhado, com as contas de demonstração, está no README.

## Passar para o uso real

> Só quando o Instituto for começar a usar com dados verdadeiros. Durante a avaliação do MBA e qualquer demonstração, **não rode o script de limpeza**: o portal precisa dos dados sintéticos e das contas de demonstração.

1. Entre como `gestao@ebenezer.test` e, em Escola > Cadastro, crie a conta **real** da coordenação geral.
2. No SQL Editor, rode `supabase/seed/limpar_dados_sinteticos.sql`. Ele apaga todos os dados e contas de demonstração e mantém programas, turmas, escala de níveis, indicadores, links de estudo, configuração do PIX e os cursos das Aulas em família. Ele se recusa a rodar se não houver uma conta real de gestão.
3. Entre com a conta real e cadastre a equipe, as crianças, os responsáveis e os apoiadores.
4. Revise a chave PIX do Instituto em Escola > Necessidades.
5. Nunca mais rode os geradores de dados sintéticos nesse projeto: eles apagam os dados para recriar a demonstração.

## Pausa por inatividade

No plano gratuito, o Supabase pausa o banco depois de 7 dias sem uso. Isso aconteceu com a base de demonstração em outubro de 2026. No plano Pro não há pausa. Se o banco estiver pausado, entre no painel do Supabase e clique em restaurar; leva alguns minutos.

## Publicação de mudanças

Qualquer arquivo alterado no GitHub dispara uma nova publicação na Netlify em cerca de 2 minutos. Mudanças no banco são arquivos novos em `supabase/migrations/`, rodados no SQL Editor **uma vez, em ordem**. Nunca edite uma migração já aplicada: crie uma nova.

## Principais decisões técnicas

| Decisão | Por quê |
| --- | --- |
| Supabase em vez de ferramenta no-code com cobrança por usuário | Com 129 crianças, mais de 110 famílias e os apoiadores, ferramentas cobradas por usuário ficariam caras. O Supabase tem Postgres real, login e regras de acesso no mesmo lugar. |
| Regras de acesso no banco (Row Level Security) | O isolamento entre os sete perfis não depende da tela. Mesmo que alguém acesse os dados por fora do site, o banco só entrega o que aquele perfil pode ver. |
| Importação de planilha em vez de digitação | A equipe é voluntária e já mantém a presença em planilha. Importar com prévia e desfazer cabe em 15 minutos por semana. |
| Minimização de dados | O banco não tem coluna para documento, endereço, saúde ou foto de criança. O que não é guardado não vaza. |
| Vivências Terapêuticas só com totais | Participar de um programa de saúde emocional já é um dado sensível. O banco recusa presença individual nesse programa. |
| Reconhecimento por constância, nunca por valor | Segue a política de proteção de dados do doador e evita placar entre quem doa mais e quem doa menos. |
| Conquistas que só se acumulam | A falta de uma criança muitas vezes não é escolha dela. Nada no espaço da criança pune ausência. |
| Agregados suprimidos abaixo de 5 crianças | Evita reidentificar uma criança a partir de um número pequeno. |
| Inscrição das Aulas em família separada | Não se liga ao cadastro das crianças nem gera acompanhamento; do jovem, só a idade. |
| Regras de acesso calculadas por conjunto (migração 11) | A primeira versão testava linha por linha e estourava o limite de 8 segundos do Supabase. A nova forma leva milissegundos e mantém as mesmas regras. |
| Netlify gratuita e Supabase Pro | O site não precisa de plano pago. O banco precisa, porque o gratuito pausa. Custo total de caixa: cerca de R$ 166 por mês. |

## Testes

- **Automatizados:** 98 testes de permissão em `supabase/tests/`, todos passando. Resultado e instruções para repetir em [testes/relatorio-testes-automatizados.md](testes/relatorio-testes-automatizados.md). Rode de novo sempre que criar uma migração.
- **Fluxo principal:** roteiro por perfil em [testes/roteiro-testes-fluxo-principal.md](testes/roteiro-testes-fluxo-principal.md).

## Pendências conhecidas

- **Aprovação de carências:** as que a educação envia ficam como "aguardando aprovação" e ainda não há tela para aprovar. Até lá, a gestão aprova no painel do Supabase (Table Editor > `carencia` > coluna `publicacao` = `publicado`) ou cadastra a carência ela mesma, que já publica direto.
- **Resumos de IA:** a estrutura de aprovação existe no banco, mas a geração automática ainda não foi construída. Os resumos atuais são exemplos.
- **Cursos das Aulas em família:** criar um curso novo ainda é feito por SQL, editando `dados_aulas_familia.sql`.
- **A validar com o Instituto:** escala da Alicerce em matemática e inglês; uso dos nomes dos níveis (Desbravador, Mochileiro, Navegador, Mergulhador) na área da criança; futuro do Laboratório Criativo; arquivos oficiais de marca; nome do voluntário técnico.
