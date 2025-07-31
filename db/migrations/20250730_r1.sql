
-- R1 auth + quota
alter table users add column plan text default 'free';
alter table users add column remaining_credits int default 100;

-- datasets storage
create table datasets (
  id uuid primary key default gen_random_uuid(),
  owner uuid references users(id) on delete cascade,
  filename text,
  url text,
  created_at timestamptz default now()
);

-- assistant settings
create table assistant_settings (
  owner uuid primary key references users(id) on delete cascade,
  strict_prompt text,
  creative_prompt text,
  strict_tasks text[],
  creative_tasks text[],
  strict_temp numeric default 0.2,
  creative_temp numeric default 0.7
);

-- function to decrement user credits
create or replace function decrement_credit(uid uuid)
returns void as $$
begin
  update users 
  set remaining_credits = remaining_credits - 1 
  where id = uid and remaining_credits > 0;
end;
$$ language plpgsql;
