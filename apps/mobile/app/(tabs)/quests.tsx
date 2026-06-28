import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useQuestStore } from '../../store';
import { TaskQuestCard, HabitQuestCard } from '../../components/quests/QuestCard';
import { Colors } from '../../constants/theme';

export default function QuestsScreen() {
  const { tasks, habits, isLoading, fetchAllQuests, completeTask, completeHabit } =
    useQuestStore();

  useEffect(() => {
    fetchAllQuests();
  }, [fetchAllQuests]);

  const incompleteTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Quests</Text>
        <Link href="/quests/create" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addText}>+ New</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchAllQuests} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.section}>Active Tasks ({incompleteTasks.length})</Text>
        {incompleteTasks.map((task) => (
          <TaskQuestCard
            key={task.id}
            task={task}
            onComplete={() => completeTask(task.id)}
          />
        ))}

        <Text style={styles.section}>Habits ({habits.length})</Text>
        {habits.map((habit) => (
          <HabitQuestCard
            key={habit.id}
            habit={habit}
            onComplete={() => completeHabit(habit.id)}
          />
        ))}

        {completedTasks.length > 0 && (
          <>
            <Text style={styles.section}>Completed ({completedTasks.length})</Text>
            {completedTasks.map((task) => (
              <View key={task.id} style={styles.completedCard}>
                <Text style={styles.completedTitle}>✅ {task.title}</Text>
                <Text style={styles.completedXp}>+{task.xp_reward} XP</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addText: {
    color: Colors.text,
    fontWeight: '600',
  },
  scroll: {
    padding: 20,
    paddingTop: 0,
  },
  section: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  completedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  completedTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  completedXp: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
});
