-- Fix infinite recursion in RLS policy for pod_members and harden membership checks across key policies

-- 1) Create a SECURITY DEFINER helper to check pod membership safely
create or replace function public.is_member_of_pod(_user_id uuid, _pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pod_members pm
    where pm.user_id = _user_id
      and pm.pod_id = _pod_id
  );
$$;

-- Make sure only authenticated users can execute it
revoke all on function public.is_member_of_pod(uuid, uuid) from public;
grant execute on function public.is_member_of_pod(uuid, uuid) to authenticated;

-- 2) Replace the recursive SELECT policy on pod_members
-- Drop existing policy if present
drop policy if exists "Users can view pod members for pods they belong to" on public.pod_members;

-- Recreate using the helper function (avoids self-referencing subquery)
create policy "Users can view pod members for pods they belong to"
  on public.pod_members
  for select
  using (
    public.is_member_of_pod(auth.uid(), pod_members.pod_id)
  );

-- 3) Reduce cross-table dependencies on pod_members in other policies where safe
-- Pods: simplify SELECT policy to use helper
drop policy if exists "Users can view pods they are members of" on public.pods;
create policy "Users can view pods they are members of"
  on public.pods
  for select
  using (
    public.is_member_of_pod(auth.uid(), pods.id)
  );

-- Sessions: simplify SELECT policy (membership check only)
drop policy if exists "Pod members can view sessions" on public.sessions;
create policy "Pod members can view sessions"
  on public.sessions
  for select
  using (
    public.is_member_of_pod(auth.uid(), sessions.pod_id)
  );

-- pod_whiteboards: update policies to use helper
-- Drop and recreate SELECT policy
drop policy if exists "Pod members can view whiteboards" on public.pod_whiteboards;
create policy "Pod members can view whiteboards"
  on public.pod_whiteboards
  for select
  using (
    public.is_member_of_pod(auth.uid(), pod_whiteboards.pod_id)
  );

-- Drop and recreate INSERT policy
drop policy if exists "Pod members can update whiteboards" on public.pod_whiteboards;
create policy "Pod members can update whiteboards"
  on public.pod_whiteboards
  for insert
  with check (
    auth.uid() = updated_by
    and public.is_member_of_pod(auth.uid(), pod_whiteboards.pod_id)
  );

-- Drop and recreate UPDATE policy
drop policy if exists "Pod members can modify whiteboards" on public.pod_whiteboards;
create policy "Pod members can modify whiteboards"
  on public.pod_whiteboards
  for update
  using (
    public.is_member_of_pod(auth.uid(), pod_whiteboards.pod_id)
  );

-- pod_materials: update policies to use helper
-- SELECT
drop policy if exists "Pod members can view materials" on public.pod_materials;
create policy "Pod members can view materials"
  on public.pod_materials
  for select
  using (
    public.is_member_of_pod(auth.uid(), pod_materials.pod_id)
  );

-- INSERT
drop policy if exists "Pod members can upload materials" on public.pod_materials;
create policy "Pod members can upload materials"
  on public.pod_materials
  for insert
  with check (
    auth.uid() = uploaded_by
    and public.is_member_of_pod(auth.uid(), pod_materials.pod_id)
  );

-- DELETE (uploader still owns delete)
drop policy if exists "Uploaders can delete their materials" on public.pod_materials;
create policy "Uploaders can delete their materials"
  on public.pod_materials
  for delete
  using (
    auth.uid() = uploaded_by
  );

-- pod_chats: update policies
drop policy if exists "Pod members can view chat messages" on public.pod_chats;
create policy "Pod members can view chat messages"
  on public.pod_chats
  for select
  using (
    public.is_member_of_pod(auth.uid(), pod_chats.pod_id)
  );

drop policy if exists "Pod members can send chat messages" on public.pod_chats;
create policy "Pod members can send chat messages"
  on public.pod_chats
  for insert
  with check (
    auth.uid() = user_id
    and public.is_member_of_pod(auth.uid(), pod_chats.pod_id)
  );

-- quizzes: relax to helper for published visibility
drop policy if exists "Pod members can view published quizzes" on public.quizzes;
create policy "Pod members can view published quizzes"
  on public.quizzes
  for select
  using (
    is_published = true
    and public.is_member_of_pod(auth.uid(), quizzes.pod_id)
  );

-- quiz_questions: keep teacher manage policy, adjust member visibility via helper
drop policy if exists "Users can view questions of accessible quizzes" on public.quiz_questions;
create policy "Users can view questions of accessible quizzes"
  on public.quiz_questions
  for select
  using (
    exists (
      select 1
      from public.quizzes q
      where q.id = quiz_questions.quiz_id
        and q.is_published = true
        and public.is_member_of_pod(auth.uid(), q.pod_id)
    )
  );

-- notes and messages policies involve session joins; these remain unchanged for now to avoid overreach.
-- This migration focuses on eliminating recursion and simplifying common membership checks.
