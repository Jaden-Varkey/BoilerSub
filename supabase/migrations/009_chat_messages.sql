create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_key text not null,
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_user_id uuid not null references public.users(id) on delete cascade,
  recipient_user_id uuid not null references public.users(id) on delete cascade,
  text text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (conversation_key, created_at asc);

create index if not exists chat_messages_sender_idx
  on public.chat_messages (sender_user_id, created_at desc);

create index if not exists chat_messages_recipient_idx
  on public.chat_messages (recipient_user_id, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_participants" on public.chat_messages;
create policy "chat_messages_select_participants"
  on public.chat_messages
  for select
  to authenticated
  using (auth.uid() = sender_user_id or auth.uid() = recipient_user_id);

drop policy if exists "chat_messages_insert_sender" on public.chat_messages;
create policy "chat_messages_insert_sender"
  on public.chat_messages
  for insert
  to authenticated
  with check (auth.uid() = sender_user_id);
