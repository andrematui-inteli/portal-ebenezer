-- Portal Ebenézer · Aulas em família (dados de exemplo)
-- Dois cursos-piloto com programa proposto e inscrições fictícias. Rode depois
-- de dados_sinteticos.sql. Pode rodar de novo: apaga e recria os cursos, com
-- datas relativas ao dia de hoje.
--   IA em família: inscrições abertas, com vagas.
--   Dinheiro em família: vagas esgotadas e lista de espera (para demonstrar).

delete from curso_familia where slug in ('ia-em-familia', 'dinheiro-em-familia');

do $$
declare
  hoje date := current_date;
  sabado date := current_date + ((6 - extract(isodow from current_date)::int + 7) % 7) + 14;  -- sábado daqui a 2–3 semanas
  quarta date := current_date + ((3 - extract(isodow from current_date)::int + 7) % 7) + 14;
  gestao uuid := (select id from perfil where papel = 'gestao' order by criado_em limit 1);
  c_ia uuid; c_fin uuid; i int;
  nomes text[] := array['Jéssica','Patrícia','Fernanda','Aline','Daiane','Simone','Rosângela','Cláudia','Tatiane','Viviane',
                        'Carlos','Edson','Rogério','Anderson','Wellington','Marcos','Reginaldo','Juliana','Priscila','Elaine'];
  ini text[] := array['A.','B.','C.','D.','F.','G.','L.','M.','N.','P.','R.','S.','T.'];
  em_sp constant text := 'America/Sao_Paulo';
begin
  insert into curso_familia (slug, titulo, chamada, descricao, tema, idade_min, idade_max, vagas_familias, o_que_levar, inscricoes_ate, status, criado_por)
  values ('ia-em-familia', 'IA em família',
    'Quatro sábados para pais e filhos adolescentes entenderem, testarem e combinarem juntos como usar inteligência artificial.',
    'A inteligência artificial já está no celular de todo mundo: no buscador, no WhatsApp, nos vídeos que aparecem para o seu filho. Neste curso, um adulto e um jovem de 12 a 17 anos aprendem juntos o que ela faz bem, onde ela erra e como usar sem cair em golpe. Ninguém precisa saber nada de tecnologia: a gente aprende fazendo, em duplas e trios.',
    'ia', 12, 17, 15, 'Celular com internet, se tiver. Quem não tiver faz em dupla com outra família.', sabado - 3,
    'inscricoes_abertas', gestao)
  returning id into c_ia;

  insert into encontro_familia (curso_id, numero, titulo, resumo, inicio) values
    (c_ia, 1, 'O que é e o que não é inteligência artificial', 'Onde a IA já aparece no nosso dia e a primeira conversa com um assistente, feita em família.', ((sabado) + time '09:00') at time zone em_sp),
    (c_ia, 2, 'Perguntar bem', 'Como pedir ajuda à IA para estudar, planejar a semana e resolver problemas da casa juntos.', ((sabado + 7) + time '09:00') at time zone em_sp),
    (c_ia, 3, 'Verdade ou invenção?', 'Vídeos falsos, golpes e notícias inventadas: como checar em família antes de acreditar ou repassar.', ((sabado + 14) + time '09:00') at time zone em_sp),
    (c_ia, 4, 'Os combinados da nossa família', 'Privacidade, tempo de tela e um pequeno projeto feito pela dupla para apresentar às outras famílias.', ((sabado + 21) + time '09:00') at time zone em_sp);

  insert into curso_familia (slug, titulo, chamada, descricao, tema, idade_min, idade_max, vagas_familias, o_que_levar, inscricoes_ate, status, criado_por)
  values ('dinheiro-em-familia', 'Dinheiro em família',
    'Quatro noites para conversar sobre dinheiro sem vergonha: orçamento, consumo, golpes e um sonho com prazo.',
    'Falar de dinheiro em casa nem sempre é fácil, e o jovem já está exposto a propaganda, compras pelo celular e apostas online. Neste curso, um adulto e um jovem de 12 a 17 anos montam juntos o orçamento da casa do jeito que ela é, aprendem a se proteger de golpes e terminam com um plano de poupança da família. Sem planilha complicada e sem julgamento.',
    'financas', 12, 17, 12, 'Caderno e caneta. Não é preciso levar extrato nem nenhum dado do banco.', quarta - 2,
    'inscricoes_abertas', gestao)
  returning id into c_fin;

  insert into encontro_familia (curso_id, numero, titulo, resumo, inicio) values
    (c_fin, 1, 'Para onde vai o dinheiro da casa?', 'O orçamento da família com papel e caneta: o que entra, o que sai e o que dá para mudar.', ((quarta) + time '19:00') at time zone em_sp),
    (c_fin, 2, 'Querer e precisar', 'Propaganda, influenciadores e a pressão para comprar: como decidir juntos.', ((quarta + 7) + time '19:00') at time zone em_sp),
    (c_fin, 3, 'Pix, golpes e apostas', 'Como os golpes mais comuns funcionam e por que as apostas online são um risco para o jovem e para a casa.', ((quarta + 14) + time '19:00') at time zone em_sp),
    (c_fin, 4, 'Um sonho com prazo', 'Plano de poupança da família e o primeiro dinheiro do jovem: quanto, até quando e como acompanhar.', ((quarta + 21) + time '19:00') at time zone em_sp);

  -- Inscrições fictícias: 11 no curso de IA; Dinheiro em família lotado, com 3 na lista de espera.
  for i in 1..11 loop
    insert into inscricao_familia (curso_id, nome_adulto, contato, idades_jovens, ja_participa, status, criada_em)
    values (c_ia, nomes[i] || ' ' || ini[1 + i % 13], '119' || lpad((81000000 + i * 977)::text, 8, '0'),
            array[(12 + i % 6)::smallint], i % 3 <> 0, (case when i <= 6 then 'confirmada' else 'inscrita' end)::status_inscricao_familia,
            now() - (i || ' days')::interval);
  end loop;
  for i in 1..15 loop
    insert into inscricao_familia (curso_id, nome_adulto, contato, idades_jovens, adultos, ja_participa, status, criada_em)
    values (c_fin, nomes[1 + (i + 5) % 20] || ' ' || ini[1 + (i + 3) % 13], '119' || lpad((82000000 + i * 1213)::text, 8, '0'),
            case when i % 4 = 0 then array[13::smallint, 16::smallint] else array[(12 + i % 6)::smallint] end,
            case when i % 5 = 0 then 2 else 1 end, i % 2 = 0,
            (case when i <= 12 then 'inscrita' else 'lista_espera' end)::status_inscricao_familia,
            now() - ((20 - i) || ' days')::interval);
  end loop;
end $$;

select titulo, vagas_familias, vagas_restantes, primeiro_encontro::date from publico_cursos_familia order by titulo;
