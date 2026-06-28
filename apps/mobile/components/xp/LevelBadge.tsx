import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';
import { getRankTitle } from '../../types';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const sizes = {
    sm: { container: 32, text: 12, title: 10 },
    md: { container: 48, text: 16, title: 11 },
    lg: { container: 64, text: 22, title: 13 },
  };

  const s = sizes[size];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.badge,
          { width: s.container, height: s.container, borderRadius: s.container / 2 },
        ]}
      >
        <Text style={[styles.level, { fontSize: s.text }]}>{level}</Text>
      </View>
      <Text style={[styles.rank, { fontSize: s.title }]}>{getRankTitle(level)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  level: {
    color: Colors.text,
    fontWeight: '800',
  },
  rank: {
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
});
