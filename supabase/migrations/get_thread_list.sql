-- Replaces the 5-query client waterfall in threads.tsx with a single RPC.
-- Returns one row per thread the user is in, with last message preview and
-- unread count — no unbounded message fetching on the client.
create or replace function get_thread_list(p_user_id uuid)
returns table (
  thread_id          uuid,
  match_id           uuid,
  other_user_id      uuid,
  last_message_content text,
  last_message_at    timestamptz,
  unread_count       bigint,
  thread_created_at  timestamptz
)
language sql
security definer
as $$
  select
    t.id as thread_id,
    t.match_id,
    case when m.user1_id = p_user_id then m.user2_id else m.user1_id end as other_user_id,
    (
      select msg.content
      from messages msg
      where msg.thread_id = t.id
      order by msg.created_at desc
      limit 1
    ) as last_message_content,
    (
      select msg.created_at
      from messages msg
      where msg.thread_id = t.id
      order by msg.created_at desc
      limit 1
    ) as last_message_at,
    (
      select count(*)::bigint
      from messages msg
      where msg.thread_id = t.id
        and msg.sender_id != p_user_id
        and msg.read_at is null
    ) as unread_count,
    t.created_at as thread_created_at
  from threads t
  join matches m on m.id = t.match_id
  where m.user1_id = p_user_id
     or m.user2_id = p_user_id
  order by coalesce(
    (
      select msg.created_at
      from messages msg
      where msg.thread_id = t.id
      order by msg.created_at desc
      limit 1
    ),
    t.created_at
  ) desc;
$$;

grant execute on function get_thread_list(uuid) to authenticated;
