import Groq from 'groq-sdk';
import { getSupabaseAdmin, type DatabaseCoachMessage } from '../db/client';

const COACH_SYSTEM_PROMPT = `You are a personal life coach inside a gamified self-improvement app called Epicly. You have access to the user's task completion history, XP, streaks, and goals. Be encouraging, specific, and concise. Detect if the user seems burned out (low completion, missed streaks) and suggest reducing difficulty. Celebrate wins. Always end with one concrete next action.`;

const MODEL = 'llama-3.3-70b-versatile';

export interface UserContext {
  username: string;
  level: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  recentTasksCompleted: number;
  recentTasksTotal: number;
  completionRate: number;
  activeHabits: number;
  habitsCompletedToday: number;
  burnoutRisk: boolean;
}

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

async function loadUserContext(userId: string): Promise<{
  context: UserContext;
  history: DatabaseCoachMessage[];
}> {
  const supabase = getSupabaseAdmin();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const today = new Date().toISOString().split('T')[0];

  const [userResult, tasksResult, habitsResult, completionsResult, historyResult] =
    await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase
        .from('tasks')
        .select('is_completed')
        .eq('user_id', userId)
        .gte('created_at', threeDaysAgo.toISOString()),
      supabase.from('habits').select('id').eq('user_id', userId),
      supabase
        .from('habit_completions')
        .select('id')
        .eq('user_id', userId)
        .gte('completed_at', `${today}T00:00:00`),
      supabase
        .from('coach_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(20),
    ]);

  const user = userResult.data;
  const tasks = tasksResult.data ?? [];
  const completed = tasks.filter((t) => t.is_completed).length;
  const total = tasks.length;
  const completionRate = total > 0 ? completed / total : 0;

  const context: UserContext = {
    username: (user?.username as string) ?? 'Adventurer',
    level: (user?.level as number) ?? 1,
    totalXP: (user?.total_xp as number) ?? 0,
    currentStreak: (user?.current_streak as number) ?? 0,
    longestStreak: (user?.longest_streak as number) ?? 0,
    recentTasksCompleted: completed,
    recentTasksTotal: total,
    completionRate,
    activeHabits: habitsResult.data?.length ?? 0,
    habitsCompletedToday: completionsResult.data?.length ?? 0,
    burnoutRisk: total >= 3 && completionRate < 0.4,
  };

  return {
    context,
    history: (historyResult.data ?? []) as DatabaseCoachMessage[],
  };
}

function buildSystemPrompt(ctx: UserContext): string {
  return `${COACH_SYSTEM_PROMPT}

Current user stats:
- Name: ${ctx.username}, Level ${ctx.level}, ${ctx.totalXP} XP total
- Streak: ${ctx.currentStreak} days (best ever: ${ctx.longestStreak})
- Task completion (last 3 days): ${ctx.recentTasksCompleted}/${ctx.recentTasksTotal} (${Math.round(ctx.completionRate * 100)}%)
- Active habits: ${ctx.activeHabits}, completed today: ${ctx.habitsCompletedToday}
- Burnout risk: ${ctx.burnoutRisk ? 'YES — gently suggest easier tasks and rest' : 'No'}`;
}

export async function saveCoachMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('coach_messages').insert({ user_id: userId, role, content });
}

export async function getCoachHistory(
  userId: string,
  limit = 50
): Promise<DatabaseCoachMessage[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('coach_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as DatabaseCoachMessage[];
}

export async function sendCoachMessage(
  userId: string,
  userMessage: string
): Promise<string> {
  await saveCoachMessage(userId, 'user', userMessage);

  const groq = getGroqClient();

  if (!groq) {
    const fallback =
      "I'm your Epicly coach! Add a GROQ_API_KEY (free at console.groq.com) to unlock full AI coaching. For now: pick one small quest today and complete it to keep your streak alive! 💪";
    await saveCoachMessage(userId, 'assistant', fallback);
    return fallback;
  }

  const { context, history } = await loadUserContext(userId);
  const systemPrompt = buildSystemPrompt(context);

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((msg) => ({
      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content as string,
    })),
    { role: 'user', content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 512,
  });

  const response = completion.choices[0]?.message?.content ?? 'Keep pushing forward! 💪';
  await saveCoachMessage(userId, 'assistant', response);
  return response;
}

export async function* streamCoachMessage(
  userId: string,
  userMessage: string
): AsyncGenerator<string> {
  await saveCoachMessage(userId, 'user', userMessage);

  const groq = getGroqClient();

  if (!groq) {
    const fallback =
      "Add a GROQ_API_KEY (free at console.groq.com) to unlock AI coaching. Meanwhile: complete one quest today to earn XP! 🎯";
    yield fallback;
    await saveCoachMessage(userId, 'assistant', fallback);
    return;
  }

  const { context, history } = await loadUserContext(userId);
  const systemPrompt = buildSystemPrompt(context);

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((msg) => ({
      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content as string,
    })),
    { role: 'user', content: userMessage },
  ];

  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 512,
    stream: true,
  });

  let fullResponse = '';

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) {
      fullResponse += text;
      yield text;
    }
  }

  if (fullResponse) {
    await saveCoachMessage(userId, 'assistant', fullResponse);
  }
}
