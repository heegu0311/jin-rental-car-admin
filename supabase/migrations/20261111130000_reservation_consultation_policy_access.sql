-- RLS policies evaluate this predicate as the authenticated database role.
-- Grant only this schema access and this function's execution right; the
-- SECURITY DEFINER function returns only whether the caller is an admin.
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
