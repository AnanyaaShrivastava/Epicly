import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { taskService, habitService } from '../../services';
import { Colors, CATEGORIES, DIFFICULTIES } from '../../constants/theme';
import type { TaskCategory, TaskDifficulty } from '../../types';

type QuestType = 'task' | 'habit';

export default function CreateQuestScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [questType, setQuestType] = useState<QuestType>('task');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const xpPreview =
    questType === 'task'
      ? DIFFICULTIES.find((d) => d.id === difficulty)?.xp ?? 50
      : frequency === 'daily'
        ? 30
        : 80;

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (questType === 'task') {
        await taskService.create({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          difficulty,
          due_date: dueDate || undefined,
        });
      } else {
        await habitService.create({
          title: title.trim(),
          category,
          frequency,
        });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create quest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Input
          label="Quest Title"
          value={title}
          onChangeText={setTitle}
          placeholder="What do you want to accomplish?"
        />
        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Add details..."
          multiline
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.row}>
          {(['task', 'habit'] as QuestType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, questType === type && styles.typeActive]}
              onPress={() => setQuestType(type)}
            >
              <Text style={[styles.typeText, questType === type && styles.typeTextActive]}>
                {type === 'task' ? '⚔️ One-off Task' : '🔄 Habit'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryItem,
                category === cat.id && { borderColor: cat.color, backgroundColor: `${cat.color}22` },
              ]}
              onPress={() => setCategory(cat.id as TaskCategory)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {questType === 'task' ? (
          <>
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.row}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.diffButton, difficulty === d.id && { borderColor: d.color }]}
                  onPress={() => setDifficulty(d.id as TaskDifficulty)}
                >
                  <Text style={[styles.diffText, difficulty === d.id && { color: d.color }]}>
                    {d.label}
                  </Text>
                  <Text style={styles.diffXp}>+{d.xp} XP</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input
              label="Due Date (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2026-06-30"
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.row}>
              {(['daily', 'weekly'] as const).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[styles.typeButton, frequency === freq && styles.typeActive]}
                  onPress={() => setFrequency(freq)}
                >
                  <Text style={[styles.typeText, frequency === freq && styles.typeTextActive]}>
                    {freq === 'daily' ? 'Daily (+30 XP)' : 'Weekly (+80 XP)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.xpPreview}>
          <Text style={styles.xpPreviewText}>XP Reward Preview</Text>
          <Text style={styles.xpPreviewValue}>+{xpPreview} XP</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Create Quest" onPress={handleCreate} loading={loading} />
      </ScrollView>
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
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  typeText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  typeTextActive: {
    color: Colors.primaryLight,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryItem: {
    width: '30%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  diffButton: {
    width: '23%',
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  diffText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  diffXp: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  xpPreview: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  xpPreviewText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  xpPreviewValue: {
    color: Colors.accent,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  error: {
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
});
