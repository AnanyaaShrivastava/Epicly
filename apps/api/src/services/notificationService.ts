import { getSupabaseAdmin } from '../db/client';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function saveFCMToken(userId: string, token: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('users')
    .update({ fcm_token: token })
    .eq('id', userId);

  if (error) throw error;
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data: user } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', userId)
    .single();

  const token = user?.fcm_token as string | null;
  if (!token) return false;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[notifications] Firebase not configured, skipping push');
    return false;
  }

  try {
    // FCM v1 requires OAuth2 — full implementation when Firebase credentials are provided
    console.log(`[notifications] Would send to ${userId}: ${payload.title}`);
    return true;
  } catch (error) {
    console.error('[notifications] Push failed:', error);
    return false;
  }
}

export async function sendDailyNudge(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: user } = await supabase
    .from('users')
    .select('username, current_streak')
    .eq('id', userId)
    .single();

  if (!user) return;

  const streak = user.current_streak as number;
  const body =
    streak > 0
      ? `Keep your ${streak}-day streak alive! Complete a quest today.`
      : 'Start a new streak today — pick one quest and crush it!';

  await sendPushNotification(userId, {
    title: `Hey ${user.username as string}! ⚔️`,
    body,
    data: { screen: 'home' },
  });
}

export async function sendLevelUpNotification(
  userId: string,
  newLevel: number
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Level Up! 🎉',
    body: `Congratulations! You've reached Level ${newLevel}!`,
    data: { screen: 'profile', level: String(newLevel) },
  });
}

export async function scheduleDailyNudges(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  const { data: users } = await supabase
    .from('users')
    .select('id, last_active_date, fcm_token')
    .not('fcm_token', 'is', null);

  for (const user of users ?? []) {
    if (user.last_active_date !== today) {
      await sendDailyNudge(user.id as string);
    }
  }
}
