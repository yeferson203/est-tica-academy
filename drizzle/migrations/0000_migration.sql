create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

-- first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  image_url text,
  price_cop integer not null default 0,
  duration text,
  level text,
  pass_score integer not null default 70,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.courses to anon;
grant select, insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy "public published" on public.courses for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admin write courses" on public.courses for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  payment_id text,
  amount integer,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
grant select on public.enrollments to authenticated;
grant all on public.enrollments to service_role;
alter table public.enrollments enable row level security;
create policy "own enrollments" on public.enrollments for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.is_enrolled(_course_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.enrollments where course_id = _course_id and user_id = auth.uid()) or public.has_role(auth.uid(),'admin') $$;

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  video_url text,
  content text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.lessons to authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "enrolled read lessons" on public.lessons for select to authenticated using (public.is_enrolled(course_id));
create policy "admin write lessons" on public.lessons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.course_outline(_course_id uuid)
returns table (id uuid, title text, "position" integer)
language sql stable security definer set search_path = public
as $$ select l.id, l.title, l.position from public.lessons l join public.courses c on c.id = l.course_id where l.course_id = _course_id and c.published order by l.position $$;
grant execute on function public.course_outline(uuid) to anon, authenticated;

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null default 0,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_index integer not null default 0
);
grant select, insert, update, delete on public.quiz_questions to authenticated;
grant all on public.quiz_questions to service_role;
alter table public.quiz_questions enable row level security;
create policy "admin quiz" on public.quiz_questions for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.course_quiz(_course_id uuid)
returns table (id uuid, question text, options jsonb, "position" integer)
language sql stable security definer set search_path = public
as $$ select q.id, q.question, q.options, q.position from public.quiz_questions q where q.course_id = _course_id and public.is_enrolled(_course_id) order by q.position $$;
grant execute on function public.course_quiz(uuid) to authenticated;

create table public.lesson_progress (
  user_id uuid not null default auth.uid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
grant select, insert, delete on public.lesson_progress to authenticated;
grant all on public.lesson_progress to service_role;
alter table public.lesson_progress enable row level security;
create policy "own progress read" on public.lesson_progress for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own progress insert" on public.lesson_progress for insert to authenticated with check (user_id = auth.uid() and public.is_enrolled(course_id));
create policy "own progress delete" on public.lesson_progress for delete to authenticated using (user_id = auth.uid());

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  score integer not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
grant select on public.quiz_attempts to authenticated;
grant all on public.quiz_attempts to service_role;
alter table public.quiz_attempts enable row level security;
create policy "own attempts" on public.quiz_attempts for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  user_id uuid not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  full_name text not null,
  course_title text not null,
  score integer,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);
grant select on public.certificates to anon, authenticated;
grant all on public.certificates to service_role;
alter table public.certificates enable row level security;
create policy "certificates verifiable" on public.certificates for select to anon, authenticated using (true);

-- seed
with c as (
  insert into public.courses (slug, title, subtitle, description, price_cop, duration, level) values
  ('cuidado-facial-esencial','Cuidado Facial Esencial','Rutinas, tipos de piel y protocolos básicos','Aprende a reconocer cada tipo de piel y a diseñar rutinas faciales personalizadas con fundamento profesional: limpieza, exfoliación, hidratación y protección.',180000,'6 horas','Principiante'),
  ('limpieza-facial-profunda','Limpieza Facial Profunda','Protocolo profesional paso a paso','Domina el protocolo completo de limpieza facial profunda: diagnóstico, vapor, extracción segura, mascarillas y cuidados post tratamiento.',250000,'8 horas','Intermedio'),
  ('masaje-facial-drenaje','Masaje Facial y Drenaje Linfático','Técnicas manuales para una piel luminosa','Técnicas de masaje facial relajante, drenaje linfático manual y gua sha para mejorar la circulación y el tono de la piel.',220000,'5 horas','Todos los niveles')
  returning id, slug
)
, l as (
  insert into public.lessons (course_id, position, title, video_url, content)
  select c.id, v.pos, v.title, v.video, v.content from c join (values
    ('cuidado-facial-esencial',1,'Anatomía y funciones de la piel','https://www.youtube.com/embed/0Nk4QnkJZ0E','La piel está formada por epidermis, dermis e hipodermis. En esta lección conocerás sus funciones de protección, regulación y sensibilidad, y por qué entenderlas es la base de cualquier tratamiento.'),
    ('cuidado-facial-esencial',2,'Tipos de piel y diagnóstico','https://www.youtube.com/embed/0Nk4QnkJZ0E','Aprende a identificar piel normal, seca, grasa, mixta y sensible mediante observación, tacto y preguntas clave a la clienta.'),
    ('cuidado-facial-esencial',3,'Diseño de una rutina personalizada','https://www.youtube.com/embed/0Nk4QnkJZ0E','Limpieza, tónico, sérum, hidratante y protector solar: el orden importa. Construye rutinas de día y de noche según cada diagnóstico.'),
    ('limpieza-facial-profunda',1,'Preparación de cabina y bioseguridad','https://www.youtube.com/embed/0Nk4QnkJZ0E','Higiene, desinfección de instrumentos y preparación del espacio para garantizar un tratamiento seguro.'),
    ('limpieza-facial-profunda',2,'Desmaquillado, vapor y exfoliación','https://www.youtube.com/embed/0Nk4QnkJZ0E','Fases iniciales del protocolo y cómo adaptar el tiempo de vapor y el exfoliante a cada piel.'),
    ('limpieza-facial-profunda',3,'Extracción segura y mascarilla','https://www.youtube.com/embed/0Nk4QnkJZ0E','Técnica correcta de extracción, errores frecuentes y elección de la mascarilla calmante final.'),
    ('masaje-facial-drenaje',1,'Bases del drenaje linfático','https://www.youtube.com/embed/0Nk4QnkJZ0E','El sistema linfático facial, ganglios principales y la dirección correcta de las maniobras.'),
    ('masaje-facial-drenaje',2,'Secuencia de masaje facial','https://www.youtube.com/embed/0Nk4QnkJZ0E','Paso a paso de una secuencia relajante de 20 minutos con presión, ritmo y respiración.')
  ) as v(slug,pos,title,video,content) on v.slug = c.slug
  returning id
)
insert into public.quiz_questions (course_id, position, question, options, correct_index)
select c.id, v.pos, v.q, v.opts::jsonb, v.ci from c join (values
  ('cuidado-facial-esencial',1,'¿Cuál es la capa más externa de la piel?','["Dermis","Epidermis","Hipodermis"]',1),
  ('cuidado-facial-esencial',2,'¿Qué paso no debe faltar en la rutina de día?','["Protector solar","Mascarilla de arcilla","Exfoliación"]',0),
  ('cuidado-facial-esencial',3,'Una piel con brillo en la zona T y seca en mejillas es:','["Grasa","Seca","Mixta"]',2),
  ('limpieza-facial-profunda',1,'¿Qué se hace antes de la extracción?','["Mascarilla final","Vapor y exfoliación","Protector solar"]',1),
  ('limpieza-facial-profunda',2,'La desinfección de instrumentos sirve para:','["Ahorrar tiempo","Garantizar bioseguridad","Hidratar la piel"]',1),
  ('masaje-facial-drenaje',1,'El drenaje linfático se dirige hacia:','["Los ganglios","La frente","Cualquier dirección"]',0),
  ('masaje-facial-drenaje',2,'La presión en el drenaje linfático debe ser:','["Muy fuerte","Suave y rítmica","Irregular"]',1)
) as v(slug,pos,q,opts,ci) on v.slug = c.slug;