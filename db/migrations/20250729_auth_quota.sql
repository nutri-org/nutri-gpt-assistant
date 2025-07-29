
alter table users
  add column plan text default 'free',
  add column remaining_credits int default 30;

create table assistant_settings (
  owner uuid primary key references users(id) on delete cascade,
  strict_prompt text,
  creative_prompt text,
  strict_tasks text[],
  creative_tasks text[],
  strict_temp numeric default 0.1,
  creative_temp numeric default 0.7
);

create table datasets (
  id uuid primary key default gen_random_uuid(),
  owner uuid references users(id) on delete cascade,
  filename text,
  url text,
  created_at timestamptz default now()
);
