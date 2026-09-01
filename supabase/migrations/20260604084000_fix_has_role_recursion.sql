-- Redefine public.has_role to use plpgsql and SECURITY DEFINER.
-- This prevents the query planner from inlining the function.
-- By preventing inlining, the function executes under the security context of the owner (postgres / superuser)
-- rather than the caller, bypassing Row Level Security (RLS) on the user_roles table itself and avoiding infinite recursion.

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
