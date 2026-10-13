-- Portal Ebenézer · Sair do modo demonstração
-- Apaga TODOS os dados sintéticos e as contas de demonstração, para começar o
-- uso real. Não tem volta. Antes de rodar, siga a seção "Passar para o uso real"
-- do docs/HANDOVER.md: a conta real da coordenação geral precisa existir ANTES,
-- senão ninguém consegue entrar depois.
--
-- Mantém: programas, turmas, escala de níveis, tipos de conquista, dicionário de
-- indicadores, guia de operação, links de estudo, configuração do PIX, cursos e
-- encontros das Aulas em família, e as contas reais criadas pela tela de Cadastro.

do $$
begin
  if not exists (select 1 from perfil p join auth.users u on u.id = p.id
                 where p.papel = 'gestao' and p.ativo
                   and coalesce(u.raw_app_meta_data->>'sintetico', 'false') <> 'true') then
    raise exception 'Nenhuma conta real de gestão encontrada. Crie a conta da coordenação geral em Escola > Cadastro antes de limpar.';
  end if;
end $$;

truncate presenca, presenca_agregada, conquista, avaliacao, nota, observacao_aluno, marco_turma,
  lote_alteracao, lote_importacao, aviso_visto, aviso, sugestao, solicitacao_acesso,
  compromisso_doacao, doacao, carencia, reserva_livro, livro, evento, tarefa,
  inscricao_familia, acesso_estudante, responsavel_crianca, educador_turma, matricula,
  indicador_valor, resumo_ia, crianca cascade;

delete from auth.users where raw_app_meta_data->>'sintetico' = 'true';

select 'contas que continuam' as item, count(*)::text as total from perfil
union all select 'crianças', count(*)::text from crianca
union all select 'programas e turmas', (select count(*) from programa) || ' e ' || (select count(*) from turma);
