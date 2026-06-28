import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';
import { LevelBadge } from '../xp/LevelBadge';
import type { LeaderboardEntry } from '../../types';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

export function LeaderboardRow({ entry, isCurrentUser = false }: LeaderboardRowProps) {
  const medal = entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`;

  return (
    <View style={[styles.row, isCurrentUser && styles.currentUser]}>
      <Text style={styles.rank}>{medal}</Text>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {entry.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.username, isCurrentUser && styles.highlight]}>
          {entry.username}
          {isCurrentUser ? ' (You)' : ''}
        </Text>
        <Text style={styles.xp}>{entry.total_xp.toLocaleString()} XP</Text>
      </View>
      <LevelBadge level={entry.level} size="sm" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentUser: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  rank: {
    width: 36,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  username: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  highlight: {
    color: Colors.primaryLight,
  },
  xp: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
