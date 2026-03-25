import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type AboutCardProps = {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
};

export function AboutCard({ title, icon: Icon, children }: AboutCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardGlow} />
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon size={18} color="#0f3567" strokeWidth={2.1} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 22,
    backgroundColor: '#fbfdff',
    borderWidth: 1,
    borderColor: '#d9e5f4',
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#0f2748',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    elevation: 4,
    gap: 14,
  },
  cardGlow: {
    position: 'absolute',
    top: -18,
    right: -10,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(78, 129, 199, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef5ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d7e5f8',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2445',
    letterSpacing: 0.2,
  },
  body: {
    gap: 12,
  },
});
