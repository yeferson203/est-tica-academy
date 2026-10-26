create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join auth.users u on u.id = ur.user_id
    where ur.user_id = _user_id
      and ur.role = _role
      and (
        _role <> 'admin'
        or lower(btrim(u.email)) = 'yeffersonrosero15@gmail.com'
      )
  )
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  if lower(btrim(coalesce(new.email, ''))) = 'yeffersonrosero15@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

delete from public.user_roles
where role = 'admin'
  and user_id not in (
    select id
    from auth.users
    where lower(btrim(email)) = 'yeffersonrosero15@gmail.com'
  );

insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where lower(btrim(email)) = 'yeffersonrosero15@gmail.com'
on conflict (user_id, role) do nothing;
