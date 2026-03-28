import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';

const APP_VERSION = '1.2.0';
const BUILD_NUMBER = '3';
const CONTACT_EMAIL = 'chocohivepvtltd@gmail.com';
const DELETION_URL = 'https://amijhtmyxspkhsuramij.backend.onspace.ai/functions/v1/delete-account';

const RELEASE_NOTES = [
  { version: '1.2.0', date: 'March 2026', items: [
    'Google Play Store publishing — now available on Play Store',
    'New Android package identity (app.onspace.foodgenie)',
    'App info screen with version details and release history',
    'In-app privacy policy viewer',
    'Account deletion request flow for compliance',
    'Store listing assets for all device types (phone, tablet, Chromebook, XR)',
    'Feature graphic and promotional branding refresh',
    'Rate us shortcut to store listing',
    'Contact support via email integration',
    'Bug fixes and stability improvements',
  ]},
  { version: '1.1.0', date: 'March 2026', items: [
    'Progressive image loading — feed photos appear instantly',
    'Pull-to-refresh on home feed',
    'Privacy policy and account deletion support',
    'Improved video recording on Android devices',
    'Push notification system for engagement updates',
    'Admin dashboard for content management',
    'Scheduled notifications with audience targeting',
    'Performance and stability improvements',
  ]},
  { version: '1.0.0', date: 'February 2026', items: [
    'Initial release of FoodGenie',
    'Instagram-style full-screen food reels',
    'Photo and video capture with one-tap recording',
    'Creator tier system with badges and milestones',
    'Social features: like, comment, save, follow',
    'Personalised dietary and budget preferences',
    'Learn tab with trending chefs and shows',
  ]},
];

interface LinkRowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  sublabel?: string;
  iconColor?: string;
  onPress: () => void;
  destructive?: boolean;
}

function LinkRow({ icon, label, sublabel, iconColor, onPress, destructive }: LinkRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7, backgroundColor: 'rgba(255,255,255,0.03)' }]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
    >
      <View style={[styles.linkIcon, destructive && { backgroundColor: 'rgba(255,59,48,0.10)', borderColor: 'rgba(255,59,48,0.20)' }]}>
        <MaterialIcons name={icon} size={20} color={destructive ? '#FF3B30' : (iconColor || '#D4AF37')} />
      </View>
      <View style={styles.linkContent}>
        <Text style={[styles.linkLabel, destructive && { color: '#FF6B6B' }]}>{label}</Text>
        {sublabel ? <Text style={styles.linkSublabel}>{sublabel}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.20)" />
    </Pressable>
  );
}

export default function AppInfoScreen() {
  const router = useRouter();

  const handleRateUs = () => {
    // Opens store listing — replace with actual store IDs when published
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/foodgenie/id0000000000',
      android: 'https://play.google.com/store/apps/details?id=com.chocohive.foodgenie',
      default: 'https://play.google.com/store/apps/details?id=com.chocohive.foodgenie',
    });
    Linking.openURL(storeUrl).catch(() => {});
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=FoodGenie Support`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>App Info</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* App Identity */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.identitySection}>
            <View style={styles.appIconWrap}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.appIcon}
                contentFit="cover"
                transition={200}
              />
            </View>
            <Text style={styles.appName}>FoodGenie</Text>
            <Text style={styles.appTagline}>Share What You Eat</Text>
            <View style={styles.versionRow}>
              <View style={styles.versionPill}>
                <Text style={styles.versionText}>v{APP_VERSION}</Text>
              </View>
              <View style={styles.buildPill}>
                <Text style={styles.buildText}>Build {BUILD_NUMBER}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Rate Us CTA */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <Pressable
              style={({ pressed }) => [styles.rateCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleRateUs(); }}
            >
              <LinearGradient
                colors={['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.04)']}
                style={styles.rateCardInner}
              >
                <View style={styles.rateIconWrap}>
                  <MaterialIcons name="star" size={28} color="#FFD700" />
                </View>
                <View style={styles.rateContent}>
                  <Text style={styles.rateTitle}>Enjoying FoodGenie?</Text>
                  <Text style={styles.rateSub}>Rate us on the store and help us grow</Text>
                </View>
                <View style={styles.rateArrow}>
                  <MaterialIcons name="open-in-new" size={18} color="#D4AF37" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Links Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.linksSection}>
            <Text style={styles.sectionTitle}>Support & Legal</Text>
            <View style={styles.linksCard}>
              <LinkRow
                icon="shield"
                label="Privacy Policy"
                sublabel="How we handle your data"
                onPress={() => router.push('/privacy-policy')}
              />
              <View style={styles.linkDivider} />
              <LinkRow
                icon="email"
                label="Contact Support"
                sublabel={CONTACT_EMAIL}
                iconColor="#4FC3F7"
                onPress={handleContactSupport}
              />
              <View style={styles.linkDivider} />
              <LinkRow
                icon="delete-forever"
                label="Delete Account"
                sublabel="Request permanent data removal"
                onPress={() => Linking.openURL(DELETION_URL).catch(() => {})}
                destructive
              />
            </View>
          </Animated.View>

          {/* Release Notes */}
          <Animated.View entering={FadeInDown.delay(300).duration(350)} style={styles.releaseSection}>
            <Text style={styles.sectionTitle}>Release Notes</Text>
            {RELEASE_NOTES.map((release, idx) => (
              <View key={release.version} style={styles.releaseCard}>
                <View style={styles.releaseHeader}>
                  <View style={styles.releaseVersionWrap}>
                    <Text style={styles.releaseVersion}>v{release.version}</Text>
                  </View>
                  <Text style={styles.releaseDate}>{release.date}</Text>
                  {idx === 0 ? (
                    <View style={styles.latestBadge}>
                      <Text style={styles.latestBadgeText}>Latest</Text>
                    </View>
                  ) : null}
                </View>
                {release.items.map((item, i) => (
                  <View key={i} style={styles.releaseItem}>
                    <View style={styles.releaseDot} />
                    <Text style={styles.releaseItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerCompany}>ChocoHive Pvt Ltd</Text>
            <Text style={styles.footerCopy}>Made with passion for food lovers everywhere</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Identity
  identitySection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    gap: 10,
  },
  appIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.25)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 4,
  },
  appIcon: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  versionPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.20)',
  },
  versionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
  },
  buildPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  buildText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.40)',
  },

  // Rate CTA
  rateCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
  },
  rateCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  rateIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,215,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.20)',
  },
  rateContent: {
    flex: 1,
    gap: 3,
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  rateSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
  },
  rateArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Links
  linksSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  linksCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  linkContent: {
    flex: 1,
    gap: 2,
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  linkSublabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
  },
  linkDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 70,
  },

  // Release Notes
  releaseSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  releaseCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
    gap: 10,
  },
  releaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  releaseVersionWrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(212,175,55,0.10)',
  },
  releaseVersion: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D4AF37',
  },
  releaseDate: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    flex: 1,
  },
  latestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.25)',
  },
  latestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ADE80',
  },
  releaseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingLeft: 4,
  },
  releaseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(212,175,55,0.40)',
    marginTop: 7,
  },
  releaseItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  footerCompany: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.30)',
  },
  footerCopy: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.18)',
  },
});
