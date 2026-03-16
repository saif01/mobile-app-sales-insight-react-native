import { LogOut, UserRound } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-provider';
import { AppBar } from '@/components/navigation/AppBar';
import { useLogoutConfirmation } from '@/components/logout-confirmation-provider';

export default function ProfileScreen() {
  const { userProfile } = useAuth();
  const confirmLogout = useLogoutConfirmation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppBar title="Profile" subtitle="Account details" showBottomBorder backgroundColor="#ffffff" />
      <View style={styles.content}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <UserRound size={32} color="#0f3567" strokeWidth={2.2} />
          </View>
        )}

        <Text style={styles.name}>{userProfile?.name ?? 'Guest User'}</Text>
        <Text style={styles.subtitle}>{userProfile?.image ? 'Profile image available' : 'No profile image'}</Text>

        <Pressable onPress={confirmLogout} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
          <LogOut size={18} color="#ffffff" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    marginBottom: 12,
  },
  avatarFallback: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#d8e5f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c2445',
  },
  subtitle: {
    marginTop: 6,
    color: '#556b8a',
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 20,
    height: 46,
    minWidth: 160,
    borderRadius: 12,
    backgroundColor: '#0d2d57',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.9,
  },
});
