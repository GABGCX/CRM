-- Permite que o app (cliente autenticado) leia o proprio perfil.
-- Sem isto, useProfile() volta vazio no navegador: o app nao descobre o role,
-- mostra "Usuario"/"BDR" e esconde features por papel (ex: menu Gestao).
-- Tambem destrava as policies de org que fazem (select org_id from profiles where id = auth.uid()).

grant select on public.profiles to authenticated;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using ( id = auth.uid() );
