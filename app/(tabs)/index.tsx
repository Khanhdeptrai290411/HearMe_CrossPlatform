import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Dimensions, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getVideoUrl } from '@/constants/config';
import { NB } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import BrutalButton from '@/components/ui/ds/Button';
import BrutalCard from '@/components/ui/ds/Card';
import BrutalBadge from '@/components/ui/ds/Badge';
import BrutalIcon from '@/components/ui/ds/BrutalIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isWeb = Platform.OS === 'web';

const getImageUrl = (path: string) => getVideoUrl(path);

// ─── Fade-in slide-up animation hook ────────────────────────────────────────
function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

export default function HomeScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const heroAnim = useFadeIn(60);
  const feat1 = useFadeIn(160);
  const feat2 = useFadeIn(220);
  const feat3 = useFadeIn(280);

  const features = [
    {
      icon: 'ai' as const,
      title: t('home.feature1Title'),
      desc: t('home.feature1Desc'),
      anim: feat1,
      badgeColor: NB.color.primaryLight,
    },
    {
      icon: 'lesson' as const,
      title: t('home.feature2Title'),
      desc: t('home.feature2Desc'),
      anim: feat2,
      badgeColor: NB.color.secondaryLight,
    },
    {
      icon: 'flashcard' as const,
      title: t('home.feature3Title'),
      desc: t('home.feature3Desc'),
      anim: feat3,
      badgeColor: NB.color.accentLight,
    },
  ];

  const teamMembers = [
    { name: 'Quang Phát', role: 'AI Application & Platform Developer', image: '/Phat.jpg', keyword: 'Cloud & System' },
    { name: 'Quốc Khánh', role: 'Lead AI Engineer & Developer', image: '/Khanh.jpg', keyword: 'Computer Vision' },
    { name: 'Thảo Nguyên', role: 'AI UX & Product Design Researcher', image: '/Nguyen.jpg', keyword: 'Interaction Design' },
    { name: 'Hồng Anh', role: 'AI Computer Vision Scientist', image: '/HAnh.jpg', keyword: 'Deep Learning' },
    { name: 'Anh Việt', role: 'AI Curriculum & Content Director', image: '/Viet.jpg', keyword: 'Sign Language AI' },
  ];

  const testimonials = [
    {
      name: 'Anh Việt',
      role: 'Student & AI Beta Tester',
      image: '/Viet.jpg',
      quote: 'HearMe\'s AI-driven feedback is incredible. The real-time camera tracking accurately analyzes my gestures and immediately tells me how to improve.',
    },
    {
      name: 'Quốc Khánh',
      role: 'Special Education Teacher',
      image: '/Khanh.jpg',
      quote: 'Integrating interactive AI into my sign language class has been a game-changer. The computer vision model acts like a dedicated assistant for each student.',
    },
    {
      name: 'Thảo Nguyên',
      role: 'Healthcare Professional',
      image: '/Nguyen.jpg',
      quote: 'Analyzing sign language through machine learning opened a new horizon for accessible healthcare. HearMe is a remarkable blend of tech and social impact.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.heroInner, heroAnim]}>
            <View style={styles.heroLeft}>
              <View style={styles.heroBadgeWrapper}>
                <BrutalBadge label={t('home.heroPill')} variant="primary" />
              </View>
              <Text style={styles.heroTitle}>
                {t('home.heroTitle')}
                <Text style={styles.heroHighlight}>{t('home.heroHighlight')}</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                <Text style={styles.heroBrand}>HearMe</Text> {t('home.heroSubtitle')}
              </Text>
              <View style={styles.heroCTAs}>
                <BrutalButton
                  label={t('home.startLearning')}
                  variant="primary"
                  size="lg"
                  onPress={() => router.push('/lessons')}
                  style={{ marginRight: 12 }}
                />
                <BrutalButton
                  label={t('home.signLibrary')}
                  variant="ghost"
                  size="lg"
                  onPress={() => router.push('/(tabs)/library')}
                />
              </View>
              <View style={styles.heroStats}>
                {[
                  { n: '500+', label: t('home.vocabCount') },
                  { n: 'AI Real-time', label: t('home.realtimeFeedback') },
                  { n: t('home.infinitePractice'), label: '' }, // we can keep infinite label as n itself
                ].map((s, idx) => (
                  <View key={idx} style={[
                    styles.statItem,
                    { backgroundColor: idx % 3 === 0 ? NB.color.secondaryLight : idx % 3 === 1 ? NB.color.primaryLight : NB.color.accentLight }
                  ]}>
                    <Text style={styles.statNum}>{s.n}</Text>
                    {s.label ? <Text style={styles.statLabel}>{s.label}</Text> : null}
                  </View>
                ))}
              </View>
            </View>
            {isTablet && (
              <View style={styles.heroRight}>
                <BrutalCard padded={false} style={styles.heroDemoCard}>
                  <View style={styles.heroDemoHeader}>
                    <View style={styles.heroDots}>
                      <View style={[styles.heroDemoDot, { backgroundColor: NB.color.danger }]} />
                      <View style={[styles.heroDemoDot, { backgroundColor: NB.color.secondary }]} />
                      <View style={[styles.heroDemoDot, { backgroundColor: NB.color.accent }]} />
                    </View>
                    <Text style={styles.heroDemoTitle}>{t('home.practiceStudio')}</Text>
                  </View>
                  <View style={styles.heroDemoCam}>
                    <View style={styles.handSymbolWrap}>
                      <BrutalIcon name="hand" size={48} color={NB.color.primary} />
                    </View>
                    <Text style={styles.heroDemoCamText}>{t('home.cameraActive')}</Text>
                    <View style={styles.heroDemoAccuracy}>
                      <Text style={styles.heroDemoAccuracyLabel}>{t('home.accuracy')}</Text>
                      <Text style={styles.heroDemoAccuracyVal}>94%</Text>
                    </View>
                  </View>
                  <View style={styles.heroDemoFeedback}>
                    <BrutalIcon name="correct" size={20} color={NB.color.accent} />
                    <Text style={styles.heroDemoFeedbackText}>{t('home.feedbackCorrect')}</Text>
                  </View>
                </BrutalCard>
              </View>
            )}
          </Animated.View>
        </View>

        {/* ── FEATURES ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabelWrap}>
            <BrutalBadge label={t('home.featuresLabel')} variant="secondary" />
          </View>
          <Text style={styles.sectionTitle}>{t('home.featuresTitle')}</Text>
          <View style={[styles.featureGrid, isTablet && styles.featureGridRow]}>
            {features.map((f, i) => (
              <Animated.View key={i} style={[styles.featureCardWrap, f.anim]}>
                <BrutalCard hoverable style={styles.featureCard}>
                  <View style={[styles.featureIconWrap, { backgroundColor: f.badgeColor }]}>
                    <BrutalIcon name={f.icon} size={28} color={NB.color.text} />
                  </View>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </BrutalCard>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── OUR STORY ────────────────────────────────────────────────── */}
        <View style={[styles.section, styles.storySection]}>
          <View style={[styles.storyRow, isTablet && styles.storyRowTablet]}>
            <View style={styles.storyTextCol}>
              <View style={styles.sectionLabelWrap}>
                <BrutalBadge label={t('home.storyLabel')} variant="secondary" />
              </View>
              <Text style={styles.sectionTitle}>{t('home.storyTitle')}</Text>
              <Text style={styles.storyText}>{t('home.storyText1')}</Text>
              <Text style={styles.storyText}>{t('home.storyText2')}</Text>
              <View style={styles.storyBadgeRow}>
                <BrutalBadge label="🏆 AI For Life 2024 Finalist" variant="primary" style={{ marginRight: 6, marginBottom: 6 }} />
                <BrutalBadge label="🎓 VKU × KOICA Recognized" variant="accent" style={{ marginRight: 6, marginBottom: 6 }} />
              </View>
            </View>
            <View style={styles.storyImgCol}>
              <View style={styles.storyImageBorder}>
                <Image
                  source={{ uri: getImageUrl('/Team.jpg') }}
                  style={styles.storyImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── TEAM ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabelWrap}>
            <BrutalBadge label={t('home.teamLabel')} variant="secondary" />
          </View>
          <Text style={styles.sectionTitle}>{t('home.teamTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{t('home.teamSubtitle')}</Text>

          {isTablet ? (
            <View style={styles.teamGridTablet}>
              <View style={styles.teamRowTablet}>
                {teamMembers.slice(0, 3).map((m) => (
                  <BrutalCard key={m.name} style={styles.teamCardGrid} hoverable padded={false}>
                    <View style={styles.teamAvatarWrap}>
                      <Image
                        source={{ uri: getImageUrl(m.image) }}
                        style={styles.teamAvatar}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.teamInfo}>
                      <Text style={styles.teamName}>{m.name}</Text>
                      <Text style={styles.teamRole}>{m.role}</Text>
                      <BrutalBadge label={m.keyword} variant="primary" style={styles.teamBadge} />
                    </View>
                  </BrutalCard>
                ))}
              </View>
              <View style={styles.teamRowTablet}>
                {teamMembers.slice(3).map((m) => (
                  <BrutalCard key={m.name} style={styles.teamCardGrid} hoverable padded={false}>
                    <View style={styles.teamAvatarWrap}>
                      <Image
                        source={{ uri: getImageUrl(m.image) }}
                        style={styles.teamAvatar}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.teamInfo}>
                      <Text style={styles.teamName}>{m.name}</Text>
                      <Text style={styles.teamRole}>{m.role}</Text>
                      <BrutalBadge label={m.keyword} variant="primary" style={styles.teamBadge} />
                    </View>
                  </BrutalCard>
                ))}
              </View>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.teamList}
            >
              {teamMembers.map((m) => (
                <BrutalCard key={m.name} style={styles.teamCard} hoverable padded={false}>
                  <View style={styles.teamAvatarWrap}>
                    <Image
                      source={{ uri: getImageUrl(m.image) }}
                      style={styles.teamAvatar}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{m.name}</Text>
                    <Text style={styles.teamRole}>{m.role}</Text>
                    <BrutalBadge label={m.keyword} variant="primary" style={styles.teamBadge} />
                  </View>
                </BrutalCard>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── ACHIEVEMENT ──────────────────────────────────────────────── */}
        <View style={[styles.section, styles.achieveSection]}>
          <View style={styles.sectionLabelWrap}>
            <BrutalBadge label={t('home.achievementsLabel')} variant="secondary" />
          </View>
          <Text style={styles.sectionTitle}>{t('home.achievementsTitle')}</Text>

          <View style={[styles.achieveRow, isTablet && styles.achieveRowTablet]}>
            <View style={styles.achieveTextCol}>
              <BrutalCard style={styles.achieveCard} color={NB.color.surface}>
                <Text style={styles.achieveTitle}>{t('home.achievement1Title')}</Text>
                <Text style={styles.achieveDesc}>{t('home.achievement1Desc')}</Text>
              </BrutalCard>
              <BrutalCard style={styles.achieveCard} color={NB.color.surface}>
                <Text style={styles.achieveTitle}>{t('home.achievement2Title')}</Text>
                <Text style={styles.achieveDesc}>{t('home.achievement2Desc')}</Text>
              </BrutalCard>
            </View>
            <View style={styles.achieveImgCol}>
              <View style={styles.achieveImageBorder}>
                <Image
                  source={{ uri: getImageUrl('/Certificate.jpg') }}
                  style={styles.achieveImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabelWrap}>
            <BrutalBadge label={t('home.testimonialsLabel')} variant="secondary" />
          </View>
          <Text style={styles.sectionTitle}>{t('home.testimonialsTitle')}</Text>
          <View style={[styles.testimonialRow, isTablet && styles.testimonialRowTablet]}>
            {testimonials.map((t) => (
              <BrutalCard key={t.name} style={styles.testimonialCard} hoverable>
                <View style={styles.quoteIconWrap}>
                  <Text style={styles.quoteIcon}>“</Text>
                </View>
                <Text style={styles.testimonialQuote}>{t.quote}</Text>
                <View style={styles.testimonialAuthor}>
                  <Image
                    source={{ uri: getImageUrl(t.image) }}
                    style={styles.testimonialAvatar}
                    resizeMode="cover"
                  />
                  <View>
                    <Text style={styles.testimonialName}>{t.name}</Text>
                    <Text style={styles.testimonialRole}>{t.role}</Text>
                  </View>
                </View>
              </BrutalCard>
            ))}
          </View>
        </View>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <View style={styles.ctaWrapper}>
          <BrutalCard style={styles.ctaSection} color={NB.color.secondary}>
            <Text style={styles.ctaTitle}>{t('home.ctaTitle')}</Text>
            <Text style={styles.ctaDesc}>{t('home.ctaDescription')}</Text>
            <BrutalButton
              label={t('home.ctaButton')}
              variant="primary"
              size="lg"
              onPress={() => router.push('/lessons')}
            />
          </BrutalCard>
        </View>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>🤟 HearMe</Text>
          <Text style={styles.footerMembers}>
            {locale === 'ja' ? 'チームメンバー：' : 'Đội ngũ phát triển: '}Quang Phát, Quốc Khánh, Thảo Nguyên, Hồng Anh, Anh Việt
          </Text>
          <Text style={styles.footerComp}>
            {locale === 'ja' ? 'ダナン AI For Life 2024 ファイナリスト' : 'Dự án tham dự cuộc thi DaNang AI For Life 2024'}
          </Text>
          <Text style={styles.footerCopyright}>
            © 2026 HearMe. All rights reserved.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: NB.color.bg },
  scroll: { flex: 1, backgroundColor: NB.color.bg },

  // ── Hero ──
  heroSection: {
    backgroundColor: NB.color.bg,
    paddingVertical: isTablet ? 80 : 48,
    paddingHorizontal: isTablet ? 60 : 20,
    borderBottomWidth: NB.border.regular,
    borderBottomColor: NB.color.border,
  },
  heroInner: {
    flexDirection: isTablet ? 'row' : 'column',
    alignItems: isTablet ? 'center' : 'flex-start',
    gap: 40,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  heroLeft: { flex: 1.2 },
  heroBadgeWrapper: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  heroTitle: {
    fontSize: isTablet ? 54 : 36,
    fontWeight: '900',
    color: NB.color.text,
    lineHeight: isTablet ? 64 : 44,
    marginBottom: 20,
    letterSpacing: -1,
  },
  heroHighlight: {
    color: NB.color.primary,
    textDecorationLine: 'underline',
  },
  heroSubtitle: {
    fontSize: isTablet ? 18 : 15,
    color: NB.color.text,
    lineHeight: 28,
    fontWeight: '600',
    marginBottom: 32,
  },
  heroBrand: { fontWeight: '900', color: NB.color.primary },
  heroCTAs: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 36 },
  heroStats: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginTop: 8 },
  statItem: {
    flex: 1,
    minWidth: 140,
    maxWidth: isTablet ? 220 : '100%',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    borderRadius: NB.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '4px 4px 0px #111111' } : {}),
  },
  statNum: { fontSize: 26, fontWeight: '900', color: NB.color.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 13, color: NB.color.text, fontWeight: '800', marginTop: 6, textAlign: 'center' },

  // Hero right mockup
  heroRight: { flex: 0.8, maxWidth: 360, alignSelf: 'stretch', justifyContent: 'center' },
  heroDemoCard: {
    backgroundColor: NB.color.surface,
    overflow: 'hidden',
  },
  heroDemoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: NB.color.border,
    borderBottomWidth: NB.border.regular,
    borderBottomColor: NB.color.border,
  },
  heroDots: {
    flexDirection: 'row',
    gap: 6,
  },
  heroDemoDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: NB.color.border },
  heroDemoTitle: { color: NB.color.bg, fontSize: 13, fontWeight: '900', marginLeft: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroDemoCam: {
    backgroundColor: NB.color.primaryLight,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    borderRadius: NB.radius.md,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
  },
  handSymbolWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: NB.color.surface,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 0px #111111' } : {}),
  },
  heroDemoCamText: { color: NB.color.text, fontSize: 14, fontWeight: '700' },
  heroDemoAccuracy: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  heroDemoAccuracyLabel: { color: NB.color.text, fontSize: 13, fontWeight: '600' },
  heroDemoAccuracyVal: { color: NB.color.primary, fontWeight: '900', fontSize: 20 },
  heroDemoFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: NB.color.accentLight,
    margin: 16,
    marginTop: 0,
    borderRadius: NB.radius.md,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
  },
  heroDemoFeedbackText: { color: NB.color.text, fontWeight: '800', fontSize: 13 },

  // ── Common section ──
  section: {
    paddingHorizontal: isTablet ? 60 : 20,
    paddingVertical: NB.space.section,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sectionLabelWrap: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: '900',
    color: NB.color.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: NB.color.text,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 32,
  },

  // ── Features ──
  featureGrid: { gap: 20 },
  featureGridRow: { flexDirection: 'row' },
  featureCardWrap: { flex: isTablet ? 1 : undefined },
  featureCard: {
    flex: 1,
    height: '100%',
    gap: 12,
  },
  featureIconWrap: {
    width: 56,
    height: 56,
    borderRadius: NB.radius.md,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 0px #111111' } : {}),
  },
  featureTitle: { fontSize: 18, fontWeight: '900', color: NB.color.text },
  featureDesc: { fontSize: 14, color: NB.color.text, fontWeight: '600', lineHeight: 22 },

  // ── Story ──
  storySection: {
    backgroundColor: NB.color.primaryLight,
    borderTopWidth: NB.border.regular,
    borderTopColor: NB.color.border,
    borderBottomWidth: NB.border.regular,
    borderBottomColor: NB.color.border,
    maxWidth: '100%',
    width: '100%',
  },
  storyRow: { gap: 32, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  storyRowTablet: { flexDirection: 'row', alignItems: 'center' },
  storyTextCol: { flex: 1.1, gap: 8 },
  storyText: {
    fontSize: 15,
    color: NB.color.text,
    lineHeight: 26,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'justify',
  },
  storyBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  storyImgCol: { flex: isTablet ? 0.9 : 1, alignItems: 'center' },
  storyImageBorder: {
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    borderRadius: NB.radius.lg,
    overflow: 'hidden',
    width: '100%',
    ...(Platform.OS === 'web' ? { boxShadow: '6px 6px 0px #111111' } : {}),
  },
  storyImage: {
    width: '100%',
    height: isTablet ? 340 : 240,
    backgroundColor: NB.color.border,
  },

  // ── Team ──
  teamList: { gap: 16, paddingBottom: 12 },
  teamGridTablet: { gap: 20, alignItems: 'center', width: '100%', marginTop: 8 },
  teamRowTablet: { flexDirection: 'row', justifyContent: 'center', gap: 20, width: '100%' },
  teamListGrid: { flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'center' },
  teamCard: {
    width: 200,
    overflow: 'hidden',
  },
  teamCardGrid: { width: 210 },
  teamAvatarWrap: {
    borderBottomWidth: NB.border.regular,
    borderColor: NB.color.border,
    overflow: 'hidden',
    backgroundColor: NB.color.accentLight,
  },
  teamAvatar: {
    width: '100%',
    height: 180,
  },
  teamInfo: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  teamName: { fontSize: 16, fontWeight: '900', color: NB.color.text, textAlign: 'center' },
  teamRole: { fontSize: 13, color: NB.color.primary, textAlign: 'center', fontWeight: '800' },
  teamBadge: { marginTop: 4 },

  // ── Achievement ──
  achieveSection: {
    backgroundColor: NB.color.accentLight,
    borderTopWidth: NB.border.regular,
    borderTopColor: NB.color.border,
    borderBottomWidth: NB.border.regular,
    borderBottomColor: NB.color.border,
    maxWidth: '100%',
    width: '100%',
  },
  achieveRow: { gap: 32, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  achieveRowTablet: { flexDirection: 'row', alignItems: 'center' },
  achieveTextCol: { flex: 1.1, gap: 16 },
  achieveCard: {
    marginBottom: 8,
    gap: 8,
  },
  achieveTitle: { fontSize: 18, fontWeight: '900', color: NB.color.text },
  achieveDesc: { fontSize: 14, color: NB.color.text, fontWeight: '600', lineHeight: 22 },
  achieveImgCol: { flex: isTablet ? 0.9 : 1 },
  achieveImageBorder: {
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    borderRadius: NB.radius.lg,
    overflow: 'hidden',
    width: '100%',
    ...(Platform.OS === 'web' ? { boxShadow: '6px 6px 0px #111111' } : {}),
  },
  achieveImage: {
    width: '100%',
    aspectRatio: 1.4,
    backgroundColor: NB.color.border,
  },

  // ── Testimonials ──
  testimonialRow: { gap: 20 },
  testimonialRowTablet: { flexDirection: 'row' },
  testimonialCard: {
    flex: isTablet ? 1 : undefined,
    gap: 16,
    position: 'relative',
  },
  quoteIconWrap: {
    position: 'absolute',
    top: 10,
    right: 20,
    opacity: 0.1,
  },
  quoteIcon: {
    fontSize: 72,
    fontWeight: '900',
    color: NB.color.text,
  },
  testimonialQuote: {
    fontSize: 14,
    color: NB.color.text,
    lineHeight: 24,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  testimonialAuthor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  testimonialAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    backgroundColor: NB.color.border,
  },
  testimonialName: { fontSize: 15, fontWeight: '900', color: NB.color.text },
  testimonialRole: { fontSize: 13, color: NB.color.primary, fontWeight: '700' },

  // ── CTA section ──
  ctaWrapper: {
    paddingHorizontal: isTablet ? 60 : 20,
    paddingVertical: NB.space.section,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  ctaSection: {
    padding: isTablet ? 56 : 32,
    alignItems: 'center',
    gap: 20,
  },
  ctaTitle: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: '900',
    color: NB.color.text,
    textAlign: 'center',
  },
  ctaDesc: {
    fontSize: 16,
    color: NB.color.text,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 480,
  },

  // ── Footer ──
  footer: {
    paddingVertical: 40,
    alignItems: 'center',
    borderTopWidth: NB.border.regular,
    borderTopColor: NB.color.border,
    backgroundColor: NB.color.surface,
    gap: 8,
    paddingHorizontal: 20,
  },
  footerLogo: { fontSize: 22, fontWeight: '900', color: NB.color.primary, marginBottom: 4 },
  footerMembers: { fontSize: 14, color: NB.color.text, fontWeight: '800', textAlign: 'center' },
  footerComp: { fontSize: 13, color: NB.color.muted, fontWeight: '700', textAlign: 'center' },
  footerCopyright: { fontSize: 12, color: NB.color.muted, fontWeight: '600', marginTop: 8, textAlign: 'center' },
});
