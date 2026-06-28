import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLeaderboardStore } from '../../store';
import { useAuthStore } from '../../store';
import { LeaderboardRow } from '../../components/leaderboard/LeaderboardRow';
import { Colors } from '../../constants/theme';

type Tab = 'global' | 'friends';

export default function LeaderboardScreen() {
  const [tab, setTab] = useState<Tab>('global');
  const { global, friends, isLoading, fetchGlobal, fetchFriends } = useLeaderboardStore();
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (tab === 'global') {
      fetchGlobal();
    } else {
      fetchFriends([]);
    }
  }, [tab, fetchGlobal, fetchFriends]);

  const entries = tab === 'global' ? global : friends;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🏆 Leaderboard</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'friends' && styles.tabActive]}
          onPress={() => setTab('friends')}
        >
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'global' && styles.tabActive]}
          onPress={() => setTab('global')}
        >
          <Text style={[styles.tabText, tab === 'global' && styles.tabTextActive]}>
            Global
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <LeaderboardRow
              entry={item}
              isCurrentUser={item.user_id === profile?.id}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No rankings yet. Be the first!</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tabs: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.text,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
