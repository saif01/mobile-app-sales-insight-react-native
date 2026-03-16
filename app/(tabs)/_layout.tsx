import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { useAuth } from '@/components/auth-provider';
import { PreLoader } from '@/components/PreLoader';

export default function TabLayout() {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return <PreLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Logout',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
