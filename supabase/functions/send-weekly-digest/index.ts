import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    return new Response('RESEND_API_KEY not configured', { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, first_name, display_name, is_anonymous')
    .eq('notif_email_enabled', true)
    .eq('notif_email_weekly_digest', true)
    .eq('onboarding_complete', true)
    .eq('is_active', true);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  let sent = 0;

  for (const user of users ?? []) {
    if (!user.email) continue;

    const name = user.is_anonymous
      ? (user.display_name ?? 'there')
      : (user.first_name ?? 'there');

    // New matches this week
    const { count: newMatches } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .gte('created_at', sevenDaysAgo);

    // Unread messages across all their threads
    const { data: userMatches } = await supabase
      .from('matches')
      .select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    const matchIds = (userMatches ?? []).map((m: any) => m.id);
    let unreadMessages = 0;

    if (matchIds.length > 0) {
      const { data: threads } = await supabase
        .from('threads')
        .select('id')
        .in('match_id', matchIds);

      const threadIds = (threads ?? []).map((t: any) => t.id);

      if (threadIds.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('thread_id', threadIds)
          .neq('sender_id', user.id)
          .is('read_at', null);

        unreadMessages = count ?? 0;
      }
    }

    const matchWord = (newMatches ?? 0) === 1 ? 'match' : 'matches';
    const msgWord = unreadMessages === 1 ? 'message' : 'messages';

    const html = `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;color:#2A1F3D;padding:24px">
        <p style="font-size:13px;color:#8B6FC5;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Nestmakers</p>
        <h2 style="font-weight:300;font-size:28px;margin:0 0 8px">Hey ${name} 👋</h2>
        <p style="color:#7A6E8A;margin:0 0 24px">Here's your weekly snapshot.</p>

        <div style="background:#FBF7F1;border-radius:16px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 10px;font-size:16px">
            <strong style="font-size:24px">${newMatches ?? 0}</strong> new ${matchWord} this week
          </p>
          <p style="margin:0;font-size:16px">
            <strong style="font-size:24px">${unreadMessages}</strong> unread ${msgWord}
          </p>
        </div>

        <p style="font-size:14px;color:#4A3D5E;margin-bottom:32px">
          Open Nestmakers to catch up with your matches and continue your journey.
        </p>

        <p style="font-size:11px;color:#7A6E8A;border-top:1px solid rgba(42,31,61,0.08);padding-top:16px">
          You're receiving this because weekly digests are enabled in your notification settings.
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nestmakers <hello@nestmakers.app>',
        to: user.email,
        subject: `Your Nestmakers week — ${newMatches ?? 0} new ${matchWord}`,
        html,
      }),
    });

    if (res.ok) sent++;
  }

  return new Response(JSON.stringify({ sent, total: users?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
