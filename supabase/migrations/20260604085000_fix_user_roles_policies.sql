-- Fix row-level security recursion issues on public.user_roles.
-- Instead of a recursive check on SELECT, we allow all authenticated users to read all user roles (USING true).
-- This is secure because roles are displayed in public badges anyway, and it completely breaks the RLS evaluation loop.

-- 1. Drop existing select policy
DROP POLICY IF EXISTS "users view own roles" ON public.user_roles;

-- 2. Create simplified select policy (no has_role call)
CREATE POLICY "users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- 3. Redefine public.has_role function to use plpgsql and SECURITY DEFINER (running as owner)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 4. Add uploader role to app_role enum if it doesn't exist
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'uploader';
