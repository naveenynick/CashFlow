alter table public.daily_cash_entries
add column if not exists bank_deposit_cash numeric default 0,
add column if not exists bank_deposit_ssc numeric default 0;
