-- SUPERLEGA V1.2
-- Eseguire una sola volta nel Supabase SQL Editor prima di pubblicare la V1.2.
-- Aggiunge il ruolo/posizione del giocatore alla formazione.

alter table public.appearances
add column if not exists role text;

update public.appearances
set role = 'striker'
where role is null;

alter table public.appearances
alter column role set default 'striker';
