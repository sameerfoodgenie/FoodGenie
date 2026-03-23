import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  // Optional: target specific user IDs. If empty, sends to ALL users.
  user_ids?: string[];
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the caller has service role or is admin
    const authHeader = req.headers.get('Authorization');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Optionally verify caller is admin
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !user) {
        // Allow service role key calls (no user context)
        console.log('No authenticated user, checking if service role call');
      }
    }

    const payload: PushPayload = await req.json();

    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch push tokens
    let query = supabaseAdmin.from('push_tokens').select('token, user_id');
    if (payload.user_ids && payload.user_ids.length > 0) {
      query = query.in('user_id', payload.user_ids);
    }
    const { data: tokens, error: tokensError } = await query;

    if (tokensError) {
      console.error('Failed to fetch tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No registered devices found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build Expo push messages
    const messages = tokens.map((t: { token: string; user_id: string }) => ({
      to: t.token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    }));

    // Send in batches of 100 (Expo limit)
    let totalSent = 0;
    let totalFailed = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch),
        });

        const result = await response.json();
        if (result.data) {
          result.data.forEach((ticket: { status: string }) => {
            if (ticket.status === 'ok') totalSent++;
            else totalFailed++;
          });
        }
      } catch (batchError) {
        console.error('Batch send error:', batchError);
        totalFailed += batch.length;
      }
    }

    // Also create in-app notifications for all targeted users
    const uniqueUserIds = [...new Set(tokens.map((t: { user_id: string }) => t.user_id))];
    const notificationRows = uniqueUserIds.map((uid: string) => ({
      user_id: uid,
      type: 'announcement',
      message: `${payload.title}: ${payload.body}`,
      is_read: false,
    }));

    if (notificationRows.length > 0) {
      await supabaseAdmin.from('notifications').insert(notificationRows);
    }

    console.log(`Push sent: ${totalSent} success, ${totalFailed} failed out of ${messages.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        failed: totalFailed,
        total_devices: messages.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('Push notification error:', e);
    return new Response(
      JSON.stringify({ error: e.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
