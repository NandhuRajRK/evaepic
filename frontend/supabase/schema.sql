create table if not exists public.user_profiles (
  clerk_user_id text primary key,
  email text,
  full_name text,
  job_title text,
  notifications jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_user_profiles_timestamp on public.user_profiles;

create trigger set_user_profiles_timestamp
before update on public.user_profiles
for each row
execute function public.set_timestamp();
