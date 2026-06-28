import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHomeData } from '../../hooks';
import { XPBar } from '../../components/xp/XPBar';
import { LevelBadge } from '../../components/xp/LevelBadge';
import { TaskQuestCard, HabitQuestCard } from '../../components/quests/QuestCard';
import { LevelUpModal, XPCelebration } from '../../components/xp/LevelUpModal';
import { Colors } from '../../constants/theme';
import { getRankTitle } from '../../types';

export default function HomeScreen() {
  const {
    profile,
    tasks,
    habits,
    stats,
    isLoading,
    refresh,
    completeTask,
    completeHabit,
  } = useHomeData();

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [xpCelebration, setXpCelebration] = useState({ visible: false, amount: 0 });
  const [levelUp, setLevelUp] = useState({ visible: false, level: 0 });

  const handleCompleteTask = useCallback(
    async (id: string, xpReward: number) => {
      setCompletingId(id);
      try {
        const result = await completeTask(id);
        setXpCelebration({ visible: true, amount: xpReward });
        setTimeout(() => setXpCelebration({ visible: false, amount: 0 }), 1200);
        if (result?.xp?.leveledUp) {
          setLevelUp({ visible: true, level: result.xp.newLevel });
        }
        await refresh();
      } finally {
        setCompletingId(null);
      }
    },
    [completeTask, refresh]
  );

  const handleCompleteHabit = useCallback(
    async (id: string, xpReward: number) => {
      setCompletingId(id);
      try {
        const result = await completeHabit(id);
        setXpCelebration({ visible: true, amount: xpReward });
        setTimeout(() => setXpCelebration({ visible: false, amount: 0 }), 1200);
        if (result?.xp?.leveledUp) {
          setLevelUp({ visible: true, level: result.xp.newLevel });
        }
        await refresh();
      } finally {
        setCompletingId(null);
      }
    },
    [completeHabit, refresh]
  );

  const level = stats?.level ?? profile?.level ?? 1;
  const progress = stats?.progress ?? { current: 0, required: 100, percentage: 0 };
  const rankTitle = stats?.rank_title ?? getRankTitle(level);
  const streak = profile?.current_streak ?? 0;
  const username = profile?.username ?? 'Adventurer';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.rank}>{rankTitle}</Text>
          </View>
          <LevelBadge level={level} size="md" />
        </View>

        <XPBar
          current={progress.current}
          required={progress.required}
          percentage={progress.percentage}
          level={level}
        />

        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakCount}>{streak} day streak</Text>
            <Text style={styles.streakHint}>Complete a quest today to keep it alive!</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today's Quests</Text>

        {isLoading && tasks.length === 0 && habits.length === 0 ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : tasks.length === 0 && habits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>All quests complete! You're crushing it.</Text>
          </View>
        ) : (
          <>
            {tasks.map((task) => (
              <TaskQuestCard
                key={task.id}
                task={task}
                loading={completingId === task.id}
                onComplete={() => handleCompleteTask(task.id, task.xp_reward)}
              />
            ))}
            {habits.map((habit) => (
              <HabitQuestCard
                key={habit.id}
                habit={habit}
                loading={completingId === habit.id}
                onComplete={() => handleCompleteHabit(habit.id, habit.xp_reward)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <XPCelebration amount={xpCelebration.amount} visible={xpCelebration.visible} />
      <LevelUpModal
        visible={levelUp.visible}
        level={levelUp.level}
        onClose={() => setLevelUp({ visible: false, level: 0 })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  username: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  rank: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.streak,
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  streakCount: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  streakHint: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  loader: {
    marginTop: 24,
  },
  empty: {
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
