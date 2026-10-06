-- Portal Ebenézer · Migração 4 · Dados de referência
-- Estrutura real dos programas segundo o Relatório Anual 2025. Não é dado
-- pessoal: são catálogos que a gestão pode editar depois.

insert into programa (codigo, nome, descricao, cadencia, idade_min, idade_max, sensivel) values
 ('reforco',   'Reforço Escolar', 'Leitura, escrita, matemática e inglês com a Alicerce Educação, no contraturno.', 'diaria', 6, 12, false),
 ('sonhos',    'Laboratório de Sonhos', 'Oficinas temáticas, atividades criativas, rodas de conversa e vivências culturais.', 'semanal', 6, 11, false),
 ('infancia',  'Primeira Infância', 'Atividades lúdicas, brincadeiras dirigidas e estímulos sensoriais e motores.', 'semanal', 3, 5, false),
 ('vivencias', 'Vivências Terapêuticas', 'Encontros em grupo para trabalhar emoções, convivência e autoestima.', 'semanal', 3, 12, true);

insert into turma (programa_id, nome, turno, capacidade)
select p.id, t.nome, t.turno, t.cap from (values
  ('reforco',   'Reforço Manhã',     'Segunda a sexta, 8h–11h30',  20),
  ('reforco',   'Reforço Tarde',     'Segunda a sexta, 13h30–17h', 20),
  ('sonhos',    'Sonhos A',          'Sábado, 12h–16h',            30),
  ('sonhos',    'Sonhos B',          'Sábado, 12h–16h',            30),
  ('infancia',  'Primeira Infância', 'Sábado, 12h–14h',            20),
  ('vivencias', 'Vivências A',       'Sábado, 9h–12h',             12),
  ('vivencias', 'Vivências B',       'Sábado, 9h–12h',             12)
) as t(prog, nome, turno, cap) join programa p on p.codigo = t.prog;

insert into nivel_parceiro (codigo, nome, serie_equivalente, ordem) values
 ('desbravador', 'Desbravador', '1º e 2º ano', 1),
 ('mochileiro',  'Mochileiro',  '3º ano',      2),
 ('navegador',   'Navegador',   '4º ano',      3),
 ('mergulhador', 'Mergulhador', '5º ano',      4);

insert into tipo_conquista (codigo, nome, criterio, icone, escopo) values
 ('bloco',    'Bloco concluído',     'Completar um bloco pedagógico na avaliação do parceiro', 'leaf',      'individual'),
 ('nivel',    'Novo nível de leitura','Subir de nível na escala de leitura do parceiro',        'tree-pine', 'individual'),
 ('cultural', 'Vivência cultural',   'Participar de uma saída cultural registrada pela equipe', 'ticket',    'individual'),
 ('turma-presenca', 'Turma presente','A turma atingir 85% de presença no mês',                  'users',     'turma'),
 ('turma-blocos',   'Turma avançando','A turma somar a meta de blocos do mês',                  'sprout',    'turma');

insert into indicador (codigo, nome, definicao, fonte, frequencia, responsavel_papel, publico) values
 ('criancas_atendidas', 'Crianças atendidas', 'Crianças com matrícula ativa em ao menos um programa', 'Cadastro do portal', 'Semanal', 'gestao', true),
 ('taxa_presenca', 'Taxa de presença', 'Presenças sobre dias possíveis nos últimos 90 dias, todos os programas', 'Planilhas de presença importadas', 'Semanal', 'educacao', true),
 ('avanco_medio_blocos', 'Avanço médio em blocos', 'Média de blocos avançados por criança no reforço desde a linha de base', 'Relatório de evolução da Alicerce', 'Quinzenal', 'educacao', true),
 ('criancas_com_avanco', 'Crianças com avanço pedagógico', 'Percentual de crianças do reforço com ao menos um bloco avançado', 'Relatório de evolução da Alicerce', 'Quinzenal', 'educacao', true),
 ('carencias_atendidas', 'Carências atendidas', 'Carências publicadas com status atendida no ano', 'Cadastro de carências do portal', 'Semanal', 'gestao', true),
 ('experiencias_culturais', 'Acessos culturais', 'Ingressos para experiências culturais, educativas e recreativas', 'Registro da equipe de ações externas', 'Mensal', 'gestao', true),
 ('sroi', 'Retorno social (SROI)', 'Valor social gerado por real investido, metodologia SROI Network', 'Relatório SROI 2025', 'Anual', 'gestao', true);

insert into pagina (slug, titulo, conteudo) values
 ('guia-operacao', 'Guia de operação do portal',
  'Toda semana: 1) importar a presença do reforço; 2) importar a presença dos programas de sábado; 3) conferir o painel do que está pendente. A cada relatório da Alicerce: importar o avanço pedagógico. Dúvidas: fale com a coordenação de educação.');
