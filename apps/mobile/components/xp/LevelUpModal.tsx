import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { Colors } from '../../constants/theme';
import { Button } from '../ui/Button';

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ visible, level, onClose }: LevelUpModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          damping: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.content, { transform: [{ scale: scaleAnim }] }]}
        >
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Level Up!</Text>
          <Text style={styles.level}>Level {level}</Text>
          <Text style={styles.subtitle}>You're getting stronger every day!</Text>
          <Button title="Continue Questing" onPress={onClose} style={styles.button} />
        </Animated.View>
      </View>
    </Modal>
  );
}

interface XPCelebrationProps {
  amount: number;
  visible: boolean;
}

export function XPCelebration({ amount, visible }: XPCelebrationProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateYAnim.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateYAnim, {
          toValue: -40,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, translateYAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.xpFloat,
        { opacity: opacityAnim, transform: [{ translateY: translateYAnim }] },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.xpText}>+{amount} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    width: '100%',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  level: {
    color: Colors.primaryLight,
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
  xpFloat: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    zIndex: 100,
  },
  xpText: {
    color: Colors.accent,
    fontSize: 32,
    fontWeight: '900',
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
