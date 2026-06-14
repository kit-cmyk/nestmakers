-- RPC so authenticated users can self-delete.
-- security definer gives the function postgres-level rights to remove the
-- auth.users row; the profiles row cascades automatically.
create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- Only the owning user may call this.
revoke all on function delete_my_account() from public;
grant execute on function delete_my_account() to authenticated;
