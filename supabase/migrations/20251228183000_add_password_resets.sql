-- Create password_resets table for storing OTPs
create table if not exists public.password_resets (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    otp text not null,
    expires_at timestamptz not null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.password_resets enable row level security;

-- Create index for faster lookups
create index if not exists password_resets_email_idx on public.password_resets(email);
create index if not exists password_resets_otp_idx on public.password_resets(otp);

-- Setup RLS policies (Deny all public access, only accessible via Service Role)
-- We don't create any policies that allow 'anon' or 'authenticated' roles to access this table directly.
-- This ensures that only our Edge Functions (running with service_role key) can read/write OTPs.

comment on table public.password_resets is 'Stores One-Time Passwords for password reset flow';
