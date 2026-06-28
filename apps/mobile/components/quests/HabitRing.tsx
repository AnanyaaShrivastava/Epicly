import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

interface HabitRingProps {
  progress: number;
  size?: number;
  label?: string;
}

export function HabitRing({ progress, size = 64, label }: HabitRingProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <View
        style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: clamped >= 100 ? Colors.success : Colors.primary,
            opacity: 0.3 + (clamped / 100) * 0.7,
          },
        ]}
      />
      <View style={styles.labelContainer}>
        <Text style={styles.progress}>{Math.round(clamped)}%</Text>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.border,
  },
  progressRing: {
    position: 'absolute',
    borderWidth: 4,
  },
  labelContainer: {
    alignItems: 'center',
  },
  progress: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
});
