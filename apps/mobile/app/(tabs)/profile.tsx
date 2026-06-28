import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store';
import { LevelBadge } from '../../components/xp/LevelBadge';
import { XPBar } from '../../components/xp/XPBar';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/theme';
import { xpProgressInCurrentLevel, getRankTitle } from '../../types';

export default function ProfileScreen() {
  const { profile, logout } = useAuthStore();

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const progress = xpProgressInCurrentLevel(profile.total_xp);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <LevelBadge level={profile.level} size="lg" />
        </View>

        <View style={styles.statsCard}>
          <XPBar
            current={progress.current}
            required={progress.required}
            percentage={progress.percentage}
            level={profile.level}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatBox label="Total XP" value={profile.total_xp.toLocaleString()} />
          <StatBox label="Streak" value={`🔥 ${profile.current_streak}`} />
          <StatBox label="Best Streak" value={`${profile.longest_streak} days`} />
          <StatBox label="Rank" value={getRankTitle(profile.level)} />
        </View>

        {profile.badges && profile.badges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.badgesGrid}>
              {profile.badges.map((badge) => (
                <View key={badge.id} style={styles.badge}>
                  <Text style={styles.badgeIcon}>{badge.icon ?? '🏅'}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Button title="Sign Out" onPress={logout} variant="ghost" style={styles.logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  loading: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  username: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  email: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  badgesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '30%',
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeName: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  logout: {
    marginTop: 8,
  },
});
