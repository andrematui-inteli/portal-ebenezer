# Roteiro de testes do fluxo principal

Testes manuais, feitos no site publicado com as contas de demonstração (senha `Ebenezer#2026`). Para cada caso, siga os passos, compare com o resultado esperado e preencha as três últimas colunas. Um caso que falhar vira uma linha na seção de problemas, com o que aconteceu.

Os casos das telas construídas até 8/10 foram testados nessa data; os casos das telas adicionadas depois (vida escolar, quadro de apoiadores, cadastro e Aulas em família) foram testados em 13/10.

Site: https://portal-ebenezer.netlify.app


## Visitante

| Caso | Passos | Resultado esperado | Obtido | Data | Quem testou |
| --- | --- | --- | --- | --- | --- |
| V1 | Abrir o site sem entrar | A página inicial mostra o número de crianças, os indicadores com fonte e data, os programas e as carências. | Conforme esperado | 08/10/2026 | André |
| V2 | Abrir Carências e Como apoiar | Carências mostram progresso; o quadro de apoiadores mostra meses de apoio, sem valores. | Conforme esperado | 08/10/2026 | André |
| V3 | Abrir Em família e se inscrever no curso de IA | A inscrição é aceita e mostra a data do primeiro encontro. | Conforme esperado | 13/10/2026 | André |
| V4 | Tentar se inscrever no curso de dinheiro (lotado) | A família entra na lista de espera e vê a posição. | Conforme esperado | 13/10/2026 | André |
| V5 | Pedir acesso como responsável | Aparece "Pedido enviado". | Conforme esperado | 08/10/2026 | André |

## Educação

| Caso | Passos | Resultado esperado | Obtido | Data | Quem testou |
| --- | --- | --- | --- | --- | --- |
| E1 | Entrar com educacao@ebenezer.test | Abre Pendências com os quatro programas; Primeira Infância aparece como Atrasado. | Conforme esperado | 08/10/2026 | André |
| E2 | Ver a lista de crianças faltando mais | Aparecem as crianças com queda de presença, com antes e depois. | Conforme esperado | 08/10/2026 | André |
| E3 | Importar uma planilha com um código inexistente | A prévia aponta a linha com erro e nada é gravado. | Conforme esperado | 08/10/2026 | André |
| E4 | Importar a planilha corrigida e confirmar | A importação é gravada e mostra quantos registros novos e alterados. | Conforme esperado | 08/10/2026 | André |
| E5 | Desfazer a importação recém-feita | Os registros somem e a importação aparece como desfeita. | Conforme esperado | 08/10/2026 | André |
| E6 | Abrir Turmas e escolher Vivências A | Aparece só o aviso de que a turma registra o total de presentes, sem nomes. | Conforme esperado | 08/10/2026 | André |

## Responsável pendente

| Caso | Passos | Resultado esperado | Obtido | Data | Quem testou |
| --- | --- | --- | --- | --- | --- |
| R1 | Entrar com pendente@ebenezer.test | Abre a autorização em três passos antes de qualquer dado. | Conforme esperado | 08/10/2026 | André |

## Responsável

| Caso | Passos | Resultado esperado | Obtido | Data | Quem testou |
| --- | --- | --- | --- | --- | --- |
| R2 | Entrar com responsavel@ebenezer.test | Aparecem os cartões da Ana e do Kauã com presença e nível de leitura. | Conforme esperado | 08/10/2026 | André |
| R3 | Abrir o detalhe do Kauã | Presença em bolinhas por mês, leitura em série escolar e conquistas. | Conforme esperado | 08/10/2026 | André |
| R4 | Pausar a exibição de um filho em Minha conta | O cartão do filho passa a mostrar "exibição pausada". | Conforme esperado | 08/10/2026 | André |
| R5 | Definir um PIN de 4 números para o Kauã | Aparece "PIN salvo". | Conforme esperado | 08/10/2026 | André |
| R6 | Suspender e liberar o acesso do Kauã | O texto muda entre suspenso e liberado. | Conforme esperado | 08/10/2026 | André |

## Estudante

| Caso | Passos | Resultado esperado | Obtido | Data | Quem testou |
| --- | --- | --- | --- | --- | --- |
| S1 | Entrar com estudante@ebenezer.test | Abre a árvore da leitura; não há caminho para telas de adultos. | Conforme esperado | 08/10/2026 | André |
| S2 | Abrir Conquistas | As conquistas novas aparecem destacadas. | Conforme esperado | 08/10/2026 | André |
| S3 | Abrir Desempenho | Aparecem as notas, sem os comentários dos professores. | Conforme esperado | 13/10/2026 | André |
| S4 | Tocar no cadeado e digitar PIN errado, depois 1234 | O PIN errado é recusado; o certo sai da conta. | Conforme esperado | 08/10/2026 | André |

## Doadora

| Caso | Passos | Resultado esperado | Obtido | Data | Quem testou |
| --- | --- | --- | --- | --- | --- |
| D1 | Entrar com doador@ebenezer.test e abrir Quem apoia | Vê o próprio total no cartão "Sua contribuição" e só meses de apoio dos outros. | Conforme esperado | 13/10/2026 | André |
| D2 | Tentar abrir /familia ou /equipe pelo endereço | É levada de volta à própria área. | Conforme esperado | 08/10/2026 | André |

## Empresa

| Caso | Passos | Resultado esperado | Obtido | Data | Quem testou |
| --- | --- | --- | --- | --- | --- |
| P1 | Entrar com empresa@ebenezer.test | Entra na área de apoio; não vê dados individuais de crianças. | Conforme esperado | 13/10/2026 | André |

## Gestão

| Caso | Passos | Resultado esperado | Obtido | Data | Quem testou |
| --- | --- | --- | --- | --- | --- |
| G1 | Entrar com gestao@ebenezer.test e abrir Quem apoia | Vê os valores de todos os apoiadores. | Conforme esperado | 13/10/2026 | André |
| G2 | Abrir Escola > Aulas em família | Vê inscritos, lista de espera e os quatro números do curso. | Conforme esperado | 13/10/2026 | André |
| G3 | Cancelar uma inscrição com vaga no curso de dinheiro | A primeira família da lista de espera sobe para inscrita. | Conforme esperado | 13/10/2026 | André |
| G4 | Abrir Escola > Cadastro e cadastrar uma pessoa de teste | A conta é criada e consegue entrar com a senha provisória. | Conforme esperado | 13/10/2026 | André |

## Celular

| Caso | Passos | Resultado esperado | Obtido | Data | Quem testou |
| --- | --- | --- | --- | --- | --- |
| C1 | Repetir R2, S1 e E1 num celular Android | As telas cabem na largura, sem rolagem lateral, com a barra inferior. | Conforme esperado | 08/10/2026 | André |

## Problemas encontrados

| Caso | O que aconteceu | Corrigido em |
| --- | --- | --- |
| E1, E2 | Com o volume completo de dados de demonstração, a tela de Pendências mostrou "canceling statement due to statement timeout" no lugar dos programas e da lista de crianças faltando mais. | Migração 11 (13/10/2026): regras de acesso calculadas por conjunto. Consulta caiu de 6,5 s para 17 ms. |

## Antes de rodar

Rode `supabase/seed/dados_sinteticos.sql`, `dados_escola.sql` e `dados_aulas_familia.sql` de novo no Supabase. Os testes de importação e de inscrição mudam os dados, e as datas dos geradores são relativas ao dia.
