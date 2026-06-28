import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, CATEGORIES } from '../../constants/theme';
import type { Task, Habit } from '../../types';

interface QuestCardProps {
  title: string;
  category?: string;
  xpReward: number;
  type: 'task' | 'habit';
  onComplete: () => void;
  loading?: boolean;
  streak?: number;
}

export function QuestCard({
  title,
  category,
  xpReward,
  type,
  onComplete,
  loading = false,
  streak,
}: QuestCardProps) {
  const cat = CATEGORIES.find((c) => c.id === category);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{cat?.icon ?? (type === 'habit' ? '🔄' : '⚔️')}</Text>
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>
            {type === 'habit' ? 'Daily Habit' : 'Quest'} · +{xpReward} XP
            {streak ? ` · 🔥 ${streak}` : ''}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onComplete}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Completing...' : 'Complete Quest'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function TaskQuestCard({
  task,
  onComplete,
  loading,
}: {
  task: Task;
  onComplete: () => void;
  loading?: boolean;
}) {
  return (
    <QuestCard
      title={task.title}
      category={task.category}
      xpReward={task.xp_reward}
      type="task"
      onComplete={onComplete}
      loading={loading}
    />
  );
}

export function HabitQuestCard({
  habit,
  onComplete,
  loading,
}: {
  habit: Habit;
  onComplete: () => void;
  loading?: boolean;
}) {
  return (
    <QuestCard
      title={habit.title}
      category={habit.category ?? undefined}
      xpReward={habit.xp_reward}
      type="habit"
      onComplete={onComplete}
      loading={loading}
      streak={habit.current_streak}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
});
