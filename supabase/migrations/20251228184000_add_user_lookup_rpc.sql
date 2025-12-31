-- Secure RPC function to lookup user ID by email
-- This is required because Edge Functions can't efficiently filter auth.users by email without full list access
-- accessible only to service_role (by default, if we don't grant execute to anon)

create or replace function public.get_user_id_by_email(email_input text)
returns uuid
language plpgsql
security definer -- Runs with privileges of creator (postgres/admin), allowing access to auth.users
set search_path = public -- Secure search path
as $$
declare
  found_id uuid;
begin
  select id into found_id
  from auth.users
  where email = email_input
  limit 1;
  
  return found_id;
end;
$$;

-- Revoke execute from public to ensure only Service Role (admin) can call it
revoke execute on function public.get_user_id_by_email(text) from public;
revoke execute on function public.get_user_id_by_email(text) from anon;
revoke execute on function public.get_user_id_by_email(text) from authenticated;

-- Grant execute to service_role only
grant execute on function public.get_user_id_by_email(text) to service_role;
