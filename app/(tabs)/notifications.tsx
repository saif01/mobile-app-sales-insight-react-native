import { Bell } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/navigation/AppBar';

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppBar title="Notifications" subtitle="Recent alerts" showBottomBorder backgroundColor="#ffffff" />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Bell size={30} color="#0f3567" strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>No new notifications right now.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dde8f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0c2445',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#546a88',
    textAlign: 'center',
  },
});
