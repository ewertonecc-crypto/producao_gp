-- Auto-cria tenant (empresa) + usuario na criação de auth.users
-- Execute no SQL Editor do Supabase.

create schema if not exists private;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_tenant_id uuid := gen_random_uuid();
  v_nome text := coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1));
  v_empresa text := coalesce(new.raw_user_meta_data ->> 'empresa', 'Empresa ' || split_part(new.email, '@', 1));
  v_slug_base text;
  v_slug text;
  v_suffix integer := 0;
begin
  -- Evita erro em replay do trigger para o mesmo usuário
  if exists (select 1 from public.usuarios where id = new.id) then
    return new;
  end if;

  v_slug_base := lower(regexp_replace(trim(v_empresa), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug_base := trim(both '-' from v_slug_base);
  if v_slug_base is null or v_slug_base = '' then
    v_slug_base := 'empresa';
  end if;

  v_slug := v_slug_base;
  while exists (select 1 from public.tenants where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := v_slug_base || '-' || v_suffix::text;
  end loop;

  insert into public.tenants (id, nome, slug, status, plano)
  values (v_tenant_id, v_empresa, v_slug, 'ativo', 'starter');

  insert into public.usuarios (id, tenant_id, email, nome, papel_global, is_ativo)
  values (new.id, v_tenant_id, new.email, v_nome, 'admin', true);

  insert into public.configuracoes_tenant (tenant_id)
  values (v_tenant_id)
  on conflict (tenant_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();
