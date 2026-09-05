-- Verified Google accounts, private drafts, moderated publications and server-counted votes.
create schema if not exists study_private;
revoke all on schema study_private from public, anon;
grant usage on schema study_private to authenticated;

create table public.study_members (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create table public.study_guides (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.study_members(id) on delete cascade,
  title text not null check (length(title) between 1 and 160),
  description text not null default '' check (length(description) <= 2000),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 1 and 200),
  status text not null default 'draft' check (status in ('draft','pending','published','rejected')),
  moderation_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.study_members(id)
);
create index study_guides_owner on public.study_guides(owner_id, updated_at desc);
create index study_guides_status on public.study_guides(status, updated_at desc);
create index study_guides_reviewer on public.study_guides(reviewed_by);
create table public.study_answer_votes (
  deck_id uuid not null references public.study_guides(id) on delete cascade,
  question_id uuid not null,
  user_id uuid not null references public.study_members(id) on delete cascade,
  answer text not null check (answer ~ '^[A-F]{1,6}$'),
  updated_at timestamptz not null default now(),
  primary key(deck_id, question_id, user_id)
);
create index study_answer_votes_user on public.study_answer_votes(user_id);
create table public.study_deck_votes (
  deck_id uuid not null references public.study_guides(id) on delete cascade,
  user_id uuid not null references public.study_members(id) on delete cascade,
  value smallint not null check(value in (-1,1)),
  primary key(deck_id, user_id)
);
create index study_deck_votes_user on public.study_deck_votes(user_id);
create table public.study_activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.study_members(id) on delete cascade,
  kind text not null check (kind in ('study','exam','download')),
  deck_id uuid references public.study_guides(id) on delete set null,
  created_at timestamptz not null default now()
);
create index study_activity_user_time on public.study_activity(user_id, created_at desc);
create index study_activity_time on public.study_activity(created_at desc);
create index study_activity_deck on public.study_activity(deck_id);

alter table public.study_members enable row level security;
alter table public.study_guides enable row level security;
alter table public.study_answer_votes enable row level security;
alter table public.study_deck_votes enable row level security;
alter table public.study_activity enable row level security;

-- No browser role can write tables, assign roles, set publication status or edit tallies.
revoke all on public.study_members, public.study_guides, public.study_answer_votes, public.study_deck_votes, public.study_activity from anon, authenticated;
-- All reads and writes go through the checked RPC; tables stay closed under RLS.

create function study_private.guide_document(g public.study_guides, viewer uuid) returns jsonb
language sql stable set search_path = '' as $$
  select to_jsonb(g) || jsonb_build_object(
    'author', (select m.display_name from public.study_members m where m.id = g.owner_id),
    'score', coalesce((select sum(v.value) from public.study_deck_votes v where v.deck_id = g.id),0),
    'my_vote', (select v.value from public.study_deck_votes v where v.deck_id = g.id and v.user_id = viewer),
    'questions', (select jsonb_agg(q || jsonb_build_object(
      'answer_community', coalesce((select v.answer from public.study_answer_votes v
        where v.deck_id=g.id and v.question_id=(q->>'id')::uuid group by v.answer
        having count(*) > (select count(*) from public.study_answer_votes a where a.deck_id=g.id and a.question_id=(q->>'id')::uuid)/2.0), ''),
      'vote_count', (select count(*) from public.study_answer_votes v where v.deck_id=g.id and v.question_id=(q->>'id')::uuid),
      'my_answer', (select v.answer from public.study_answer_votes v where v.deck_id=g.id and v.question_id=(q->>'id')::uuid and v.user_id=viewer),
      'distribution', coalesce((select jsonb_object_agg(answer,n) from (select v.answer,count(*) n from public.study_answer_votes v
        where v.deck_id=g.id and v.question_id=(q->>'id')::uuid group by v.answer) counts),'{}'::jsonb)
    ) order by position) from jsonb_array_elements(g.questions) with ordinality e(q,position))
  );
$$;

-- One privileged gateway; authentication and ownership checks are mandatory per action.
create function study_private.community(action text, payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  member public.study_members;
  guide public.study_guides;
  gid uuid;
  q jsonb;
  opt jsonb;
  clean_questions jsonb := '[]';
  answer text;
  labels text[];
  seen_ids text[] := '{}';
  result jsonb;
  account_email text;
  account_name text;
  page_offset integer := greatest(0, least(coalesce((payload->>'offset')::integer,0),100000));
begin
  if uid is null then raise exception 'Inicia sesión con Google para continuar.' using errcode='42501'; end if;
  -- Email and provider come from verified auth records, never client-supplied profile data.
  select u.email, coalesce(nullif(u.raw_user_meta_data->>'full_name',''),'Estudiante')
    into account_email, account_name from auth.users u
    where u.id=uid and u.email_confirmed_at is not null and exists (
      select 1 from auth.identities i where i.user_id=u.id and i.provider='google'
      and lower(i.identity_data->>'email')=lower(u.email)
      and i.identity_data->>'email_verified'='true');
  if account_email is null then raise exception 'Se requiere una cuenta de Google verificada.' using errcode='42501'; end if;
  insert into public.study_members(id,display_name,email,is_admin)
    values(uid,left(account_name,120),account_email,lower(account_email)='jdmarinv@gmail.com')
    on conflict(id) do update set last_seen_at=now(), display_name=excluded.display_name, email=excluded.email,
      is_admin=excluded.is_admin;
  select * into member from public.study_members where id=uid;

  if action='profile' then return to_jsonb(member); end if;
  if action='list' then
    if payload->>'scope'='moderation' and not member.is_admin then raise exception 'Acceso de administrador requerido.' using errcode='42501'; end if;
    select coalesce(jsonb_agg(to_jsonb(d) || jsonb_build_object('author',m.display_name) order by d.updated_at desc),'[]') into result
    from (select id,owner_id,title,description,status,moderation_note,updated_at,jsonb_array_length(questions) question_count
      from public.study_guides
      where case payload->>'scope' when 'mine' then owner_id=uid when 'moderation' then status in ('pending','published','rejected') else status='published' end
      order by updated_at desc, id limit 50 offset page_offset) d join public.study_members m on m.id=d.owner_id;
    return result;
  end if;
  if action='save' then
    if length(trim(coalesce(payload->>'title',''))) not between 1 and 160 or length(coalesce(payload->>'description',''))>2000 then raise exception 'Revisa el título y la descripción.'; end if;
    if jsonb_typeof(payload->'questions') is distinct from 'array' then raise exception 'Las preguntas deben ser una lista.'; end if;
    if jsonb_array_length(payload->'questions') not between 1 and 200 or octet_length(payload::text)>2000000 then raise exception 'Máximo 200 preguntas y 2 MB por guía.'; end if;
    for q in select value from jsonb_array_elements(payload->'questions') loop
      if length(trim(coalesce(q->>'question',''))) not between 1 and 5000 or length(coalesce(q->>'explanation',''))>10000 then raise exception 'Revisa el enunciado y la explicación.'; end if;
      perform (q->>'id')::uuid;
      if q->>'id' is null or q->>'id'=any(seen_ids) then raise exception 'Cada pregunta necesita un ID único.'; end if;
      seen_ids:=array_append(seen_ids,q->>'id');
      if jsonb_typeof(q->'options') is distinct from 'array' then raise exception 'Opciones inválidas.'; end if;
      if jsonb_array_length(q->'options') not between 2 and 6 then raise exception 'Incluye entre dos y seis opciones.'; end if;
      labels:='{}';
      for opt in select value from jsonb_array_elements(q->'options') loop
        if coalesce(opt->>'letter','') !~ '^[A-F]$' or opt->>'letter'=any(labels) or length(trim(coalesce(opt->>'text',''))) not between 1 and 2000 then raise exception 'Opciones inválidas o repetidas.'; end if;
        labels:=array_append(labels,opt->>'letter');
      end loop;
      select string_agg(distinct x,'' order by x) into answer from regexp_split_to_table(upper(coalesce(q->>'answer_official','')),'') x;
      if coalesce(answer,'')='' or answer !~ '^[A-F]{1,6}$' or not string_to_array(answer,null)<@labels then raise exception 'Selecciona una respuesta válida.'; end if;
      clean_questions:=clean_questions || jsonb_build_array(jsonb_build_object('id',q->>'id','question',trim(q->>'question'),'options',q->'options','answer_official',answer,'explanation',coalesce(q->>'explanation','')));
    end loop;
    if nullif(payload->>'id','') is not null then
      select * into guide from public.study_guides where id=(payload->>'id')::uuid for update;
      if not found or guide.owner_id<>uid or guide.status not in ('draft','rejected') then raise exception 'Solo puedes editar tus borradores o guías rechazadas.' using errcode='42501'; end if;
      delete from public.study_answer_votes where deck_id=guide.id;
      delete from public.study_deck_votes where deck_id=guide.id;
      update public.study_guides set title=trim(payload->>'title'),description=coalesce(payload->>'description',''),questions=clean_questions,
        status='draft', moderation_note='', updated_at=clock_timestamp() where id=guide.id returning * into guide;
    else
      if (select count(*) from public.study_guides where owner_id=uid and created_at>now()-interval '1 day')>=50 then raise exception 'Límite diario de 50 guías alcanzado.'; end if;
      insert into public.study_guides(owner_id,title,description,questions) values(uid,trim(payload->>'title'),coalesce(payload->>'description',''),clean_questions) returning * into guide;
    end if;
    return study_private.guide_document(guide,uid);
  end if;
  if action='admin_stats' then
    if not member.is_admin then raise exception 'Acceso de administrador requerido.' using errcode='42501'; end if;
    return jsonb_build_object('users',(select count(*) from public.study_members),'active_7d',(select count(*) from public.study_members where last_seen_at>now()-interval '7 days'),
      'decks',(select count(*) from public.study_guides),'pending',(select count(*) from public.study_guides where status='pending'),
      'published',(select count(*) from public.study_guides where status='published'),'answer_votes',(select count(*) from public.study_answer_votes),
      'activity_7d',(select coalesce(jsonb_object_agg(kind,n),'{}') from (select kind,count(*) n from public.study_activity where created_at>now()-interval '7 days' group by kind) a),
      'members',(select coalesce(jsonb_agg(to_jsonb(m)),'[]') from (select display_name,email,created_at,last_seen_at from public.study_members order by created_at desc limit 50 offset page_offset) m));
  end if;
  if action='activity' then
    if coalesce(payload->>'kind','') not in ('study','exam','download') then raise exception 'Actividad inválida.'; end if;
    gid:=nullif(payload->>'deck_id','')::uuid;
    if gid is not null and not exists(select 1 from public.study_guides where id=gid and (status='published' or owner_id=uid)) then raise exception 'Guía no disponible.'; end if;
    if not exists(select 1 from public.study_activity where user_id=uid and kind=payload->>'kind' and created_at>now()-interval '1 minute') then
      insert into public.study_activity(user_id,kind,deck_id) values(uid,payload->>'kind',gid);
    end if;
    return 'true';
  end if;
  gid:=nullif(payload->>'id','')::uuid;
  -- Serialize edits, moderation and votes to avoid voting against a changed question.
  select * into guide from public.study_guides where id=gid for update;
  if not found or not (guide.status='published' or guide.owner_id=uid or member.is_admin) then raise exception 'Guía no disponible.' using errcode='42501'; end if;
  if action='get' then return study_private.guide_document(guide,uid); end if;
  if action='submit' then
    if guide.owner_id<>uid or guide.status not in ('draft','rejected') then raise exception 'Solo puedes enviar tus borradores a revisión.' using errcode='42501'; end if;
    update public.study_guides set status='pending', submitted_at=now(),updated_at=clock_timestamp(),moderation_note='' where id=gid returning * into guide;
  elsif action='moderate' then
    if not member.is_admin then raise exception 'Acceso de administrador requerido.' using errcode='42501'; end if;
    if coalesce(payload->>'status','') not in ('published','rejected') or guide.status not in ('pending','published') then raise exception 'Transición de moderación inválida.'; end if;
    if payload->>'status'='rejected' and length(trim(coalesce(payload->>'note','')))=0 then raise exception 'Escribe un motivo para devolver la guía.'; end if;
    update public.study_guides set status=payload->>'status',moderation_note=left(coalesce(payload->>'note',''),2000),reviewed_at=now(),reviewed_by=uid,updated_at=clock_timestamp() where id=gid returning * into guide;
  elsif action='answer_vote' then
    if guide.status<>'published' then raise exception 'Solo se votan guías publicadas.'; end if;
    select value into q from jsonb_array_elements(guide.questions) where value->>'id'=payload->>'question_id';
    if q is null then raise exception 'Pregunta no disponible.'; end if;
    if payload->>'answer' is null then
      delete from public.study_answer_votes where deck_id=gid and question_id=(q->>'id')::uuid and user_id=uid;
    else
      select string_agg(distinct x,'' order by x) into answer from regexp_split_to_table(upper(payload->>'answer'),'') x;
      select array_agg(value->>'letter') into labels from jsonb_array_elements(q->'options');
      if coalesce(answer,'')='' or answer !~ '^[A-F]{1,6}$' or not string_to_array(answer,null)<@labels then raise exception 'Vota por una combinación de opciones válida.'; end if;
      insert into public.study_answer_votes(deck_id,question_id,user_id,answer) values(gid,(q->>'id')::uuid,uid,answer)
        on conflict(deck_id,question_id,user_id) do update set answer=excluded.answer,updated_at=now();
    end if;
  elsif action='deck_vote' then
    if guide.status<>'published' then raise exception 'Solo se votan guías publicadas.'; end if;
    if payload->>'value' is null then delete from public.study_deck_votes where deck_id=gid and user_id=uid;
    else
      insert into public.study_deck_votes(deck_id,user_id,value) values(gid,uid,(payload->>'value')::smallint)
      on conflict(deck_id,user_id) do update set value=excluded.value;
    end if;
  else raise exception 'Acción no reconocida.'; end if;
  return study_private.guide_document(guide,uid);
end;
$$;

create function public.study_community(action text, payload jsonb default '{}') returns jsonb
language sql security invoker set search_path = '' as $$ select study_private.community(action,payload); $$;
revoke all on all functions in schema study_private from public,anon,authenticated;
grant execute on function study_private.community(text,jsonb) to authenticated;
revoke all on function public.study_community(text,jsonb) from public,anon,authenticated;
grant execute on function public.study_community(text,jsonb) to authenticated;
