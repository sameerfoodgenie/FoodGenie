import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const LAST_UPDATED = 'March 28, 2026';
const APP_NAME = 'FoodGenie';
const CONTACT_EMAIL = 'chocohivepvtltd@gmail.com';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children }: { children: string }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function BulletItem({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();

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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="shield" size={32} color="#D4AF37" />
            </View>
            <Text style={styles.heroTitle}>{APP_NAME} Privacy Policy</Text>
            <Text style={styles.heroDate}>Last updated: {LAST_UPDATED}</Text>
          </View>

          <Paragraph>
            {`${APP_NAME} ("we", "our", or "us") is operated by ChocoHive Pvt Ltd. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this policy carefully. By using ${APP_NAME}, you agree to the collection and use of information in accordance with this policy.`}
          </Paragraph>

          <Section title="1. Information We Collect">
            <Text style={styles.subHeading}>a) Information You Provide</Text>
            <BulletItem>Account information: email address, username, and profile details (name, bio, avatar) you provide during registration and profile setup.</BulletItem>
            <BulletItem>Content you create: food posts, photos, videos, captions, recipe instructions, comments, and likes.</BulletItem>
            <BulletItem>Preferences: dietary preferences, budget range, spice level, health goals, cuisine preferences, and other settings you configure.</BulletItem>
            <BulletItem>Communications: messages you send to us for support or feedback.</BulletItem>

            <Text style={[styles.subHeading, { marginTop: 16 }]}>b) Information Collected Automatically</Text>
            <BulletItem>Device information: device type, operating system, unique device identifiers, and mobile network information.</BulletItem>
            <BulletItem>Usage data: features used, pages viewed, actions taken, time and date of visits, and interaction patterns.</BulletItem>
            <BulletItem>Push notification tokens: device tokens for delivering notifications, stored securely on our servers.</BulletItem>

            <Text style={[styles.subHeading, { marginTop: 16 }]}>c) Camera and Media</Text>
            <BulletItem>Photos and videos captured through the app are processed locally on your device and uploaded to our servers only when you choose to create a post.</BulletItem>
            <BulletItem>We request camera and microphone permissions solely for capturing food content. These permissions can be revoked at any time through your device settings.</BulletItem>
          </Section>

          <Section title="2. How We Use Your Information">
            <BulletItem>To create and manage your account, and personalize your experience.</BulletItem>
            <BulletItem>To display your posts, comments, and interactions in the social feed.</BulletItem>
            <BulletItem>To provide meal recommendations and food insights based on your preferences.</BulletItem>
            <BulletItem>To send push notifications about activity on your posts, new followers, and app updates (with your consent).</BulletItem>
            <BulletItem>To improve our app, analyze usage trends, and develop new features.</BulletItem>
            <BulletItem>To detect, prevent, and address technical issues or policy violations.</BulletItem>
            <BulletItem>To facilitate the creator program, including tracking milestones and badges.</BulletItem>
          </Section>

          <Section title="3. Information Sharing and Disclosure">
            <Paragraph>We do not sell your personal information to third parties. We may share information in the following circumstances:</Paragraph>
            <BulletItem>Public content: Posts, comments, likes, and profile information you make public are visible to other users of the app.</BulletItem>
            <BulletItem>Service providers: We use trusted third-party services (cloud hosting, analytics, push notification delivery) that process data on our behalf under strict confidentiality agreements.</BulletItem>
            <BulletItem>Legal requirements: We may disclose information if required by law, regulation, legal process, or government request.</BulletItem>
            <BulletItem>Business transfers: In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction.</BulletItem>
          </Section>

          <Section title="4. Data Storage and Security">
            <Paragraph>Your data is stored on secure cloud servers with encryption in transit and at rest. We implement industry-standard security measures including:</Paragraph>
            <BulletItem>Row-level security policies ensuring users can only access their own private data.</BulletItem>
            <BulletItem>Encrypted authentication tokens and secure session management.</BulletItem>
            <BulletItem>Regular security audits and monitoring.</BulletItem>
            <Paragraph>While we strive to protect your information, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.</Paragraph>
          </Section>

          <Section title="5. Your Rights and Choices">
            <BulletItem>Access and update: You can view and update your profile information, preferences, and settings at any time through the app.</BulletItem>
            <BulletItem>Delete content: You can delete your posts, comments, and other content you have created.</BulletItem>
            <BulletItem>Account deletion: You may request deletion of your account and associated data at https://amijhtmyxspkhsuramij.backend.onspace.ai/functions/v1/delete-account or by contacting us at {CONTACT_EMAIL}.</BulletItem>
            <BulletItem>Notifications: You can manage push notification preferences through your device settings.</BulletItem>
            <BulletItem>Camera permissions: You can revoke camera and microphone access at any time through your device settings.</BulletItem>
          </Section>

          <Section title="6. Data Retention">
            <Paragraph>We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal data within 30 days, except where retention is required by law or for legitimate business purposes.</Paragraph>
          </Section>

          <Section title="7. Children's Privacy">
            <Paragraph>{`${APP_NAME} is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided us with personal information, we will delete it promptly. If you believe a child under 13 has provided us with personal data, please contact us at ${CONTACT_EMAIL}.`}</Paragraph>
          </Section>

          <Section title="8. Third-Party Services">
            <Paragraph>Our app may contain links to or integrations with third-party services (e.g., food delivery platforms, social sharing). These third parties have their own privacy policies, and we are not responsible for their practices. We encourage you to review their privacy policies before engaging with them.</Paragraph>
          </Section>

          <Section title="9. Changes to This Policy">
            <Paragraph>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy within the app and updating the "Last updated" date. Your continued use of the app after changes constitutes acceptance of the updated policy.</Paragraph>
          </Section>

          <Section title="10. Contact Us">
            <Paragraph>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</Paragraph>
            <View style={styles.contactCard}>
              <View style={styles.contactRow}>
                <MaterialIcons name="business" size={18} color="#D4AF37" />
                <Text style={styles.contactText}>ChocoHive Pvt Ltd</Text>
              </View>
              <View style={styles.contactRow}>
                <MaterialIcons name="email" size={18} color="#D4AF37" />
                <Text style={styles.contactText}>{CONTACT_EMAIL}</Text>
              </View>
            </View>
          </Section>

          <View style={{ height: 40 }} />
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 10,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212,175,55,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.20)',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  heroDate: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.40)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 12,
  },
  subHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(212,175,55,0.50)',
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.60)',
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.70)',
  },
});
