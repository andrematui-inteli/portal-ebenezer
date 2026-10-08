-- Portal Ebenézer · Migração 9 · Agenda só para quem está logado
-- A regra anterior deixava o visitante anônimo ver eventos abertos (passeio, visita a empresa)
-- com data e local: informação de onde as crianças estarão não pode ficar pública.
-- Também tira o EXECUTE padrão (PUBLIC) das funções de cadastro e doação; elas já
-- conferiam o perfil por dentro, agora nem o anônimo chega a chamá-las.

create or replace function privado.ve_evento(e evento) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and privado.papel_atual() is not null and (
    privado.eh('gestao') or e.criado_por = auth.uid()
    or (e.participantes is not null and auth.uid() = any (e.participantes))
    or (e.participantes is null and e.status = 'confirmado'
        and (e.publico is null or privado.papel_atual() = any (e.publico))
        and (e.turma_id is null or privado.papel_atual() not in ('estudante','responsavel','educacao')
             or privado.ve_turma(e.turma_id))))
$$;

revoke execute on function public.reservar_livro, public.confirmar_compromisso, public.cadastrar_pessoa,
  public.cadastrar_crianca, public.vincular_responsavel, public.liberar_acesso_estudante from public, anon;
grant execute on function public.reservar_livro, public.confirmar_compromisso, public.cadastrar_pessoa,
  public.cadastrar_crianca, public.vincular_responsavel, public.liberar_acesso_estudante to authenticated;
