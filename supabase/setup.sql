-- Jalankan di Supabase SQL Editor, satu kali untuk project baru.
create table if not exists public.wedding_wishes (
 id bigint generated always as identity primary key,
 guest_name text not null check (char_length(guest_name) between 1 and 80),
 attendance text not null check (attendance in ('Hadir','Tidak hadir')),
 guest_count integer not null check (guest_count between 1 and 4),
 message text not null check (char_length(message) between 1 and 500),
 created_at timestamptz not null default now()
);
alter table public.wedding_wishes enable row level security;
grant select on public.wedding_wishes to anon;
grant insert (guest_name,attendance,guest_count,message) on public.wedding_wishes to anon;
create policy "Public read wishes" on public.wedding_wishes for select to anon using (true);
create policy "Public submit wishes" on public.wedding_wishes for insert to anon with check (
 char_length(guest_name) between 1 and 80 and
 attendance in ('Hadir','Tidak hadir') and guest_count between 1 and 4 and
 char_length(message) between 1 and 500
);
-- No public UPDATE or DELETE policy. Add spam prevention/moderation before wide sharing.
