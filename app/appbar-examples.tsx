import { Bell, Menu, Search, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBar } from '@/components/navigation/AppBar';
import { useScreenPreloader } from '@/hooks/use-screen-preloader';

function DemoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AppBarExamplesScreen() {
  const router = useRouter();
  useScreenPreloader();

  return (
    <View style={styles.container}>
      <AppBar
        showBackButton
        title="Back Button Example"
        subtitle="Custom right content + actions"
        shadow
        actions={[
          {
            icon: Search,
            accessibilityLabel: 'Search on this screen',
            onPress: () => {},
          },
        ]}
        customRightComponent={
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [styles.profileMenuButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open profile menu">
            <Text style={styles.profileMenuButtonText}>Profile</Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DemoCard title="Menu Button Example">
          <AppBar
            showMenuButton
            title="Menu Header"
            subtitle="Opens drawer via React Navigation"
            showBottomBorder
            actions={[
              {
                icon: Bell,
                accessibilityLabel: 'Notifications',
                badgeCount: 8,
                onPress: () => {},
              },
            ]}
          />
        </DemoCard>

        <DemoCard title="Multiple Actions Example">
          <AppBar
            title="Sales Dashboard"
            subtitle="3 right-side actions"
            showBottomBorder
            actions={[
              {
                icon: Search,
                accessibilityLabel: 'Search',
                onPress: () => {},
              },
              {
                icon: Bell,
                accessibilityLabel: 'Notifications',
                badgeCount: 2,
                onPress: () => {},
              },
              {
                icon: Settings,
                accessibilityLabel: 'Settings',
                onPress: () => {},
              },
            ]}
          />
        </DemoCard>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backToHome, pressed && styles.pressed]}>
          <Menu size={18} color="#0f3567" />
          <Text style={styles.backToHomeText}>Back to previous screen</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f6fd',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d5e1f0',
  },
  cardTitle: {
    paddingHorizontal: 16,
    paddingTop: 14,
    fontSize: 14,
    fontWeight: '700',
    color: '#334e73',
  },
  backToHome: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#aac3e6',
    backgroundColor: '#e6f0fd',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  backToHomeText: {
    color: '#0f3567',
    fontWeight: '700',
    fontSize: 14,
  },
  profileMenuButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: '#0d2d57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMenuButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
