import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, TextInput, ActivityIndicator, Platform, Dimensions,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NB } from "@/constants/theme";
import BrutalProgress from "@/components/ui/ds/ProgressBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl, API_CONFIG } from "@/constants/config";
import BrutalButton from "@/components/ui/ds/Button";
import BrutalCard from "@/components/ui/ds/Card";
import BrutalBadge from "@/components/ui/ds/Badge";
import BrutalIcon from "@/components/ui/ds/BrutalIcon";

const isTablet = Dimensions.get('window').width >= 768;

export default function ProfileScreen() {
  const { user, signOut, isLoading, updateUser } = useAuth();
  const { t, locale } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });

  // Local state for visual-only accessibility settings
  const [highContrast, setHighContrast] = useState(true);
  const [largerText, setLargerText] = useState(false);
  const [subtitles, setSubtitles] = useState(true);

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        if (token && userStr) {
          const u = JSON.parse(userStr);
          if (u?.id) {
            const res = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.USER_PROGRESS}/${u.id}`), {
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (res.ok) {
              const ids = await res.json();
              setCompletedCount(Array.isArray(ids) ? ids.length : 0);
            }
          }
        }
        // Load total from roadmap
        const roadmapRes = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ROADMAP));
        if (roadmapRes.ok) {
          const roadmap = await roadmapRes.json();
          const total = Object.values(roadmap as Record<string, any[]>).reduce((s: number, ls: any[]) => s + ls.length, 0);
          setTotalLessons(total);
        }
      } catch {}
    };
    loadStats();
  }, []);

  const handleLogout = () => {
    Alert.alert(t('profile.alertLogoutTitle'), t('profile.alertLogoutDesc'), [
      { text: t('common.cancel'), style: "cancel" },
      { text: t('profile.logout'), style: "destructive", onPress: async () => { await signOut(); } },
    ]);
  };

  const handleEdit = () => {
    setFormData({ fullName: user?.fullName || '', email: user?.email || '', password: '', confirmPassword: '' });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ fullName: user?.fullName || '', email: user?.email || '', password: '', confirmPassword: '' });
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) { Alert.alert(t('common.error'), t('profile.alertNameError')); return; }
    if (!formData.email.trim()) { Alert.alert(t('common.error'), t('profile.alertEmailError')); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { Alert.alert(t('common.error'), t('profile.alertEmailInvalid')); return; }
    if (formData.password) {
      if (formData.password.length < 6) { Alert.alert(t('common.error'), t('profile.alertPassLength')); return; }
      if (formData.password !== formData.confirmPassword) { Alert.alert(t('common.error'), t('profile.alertPassMismatch')); return; }
    }
    setIsUpdating(true);
    try {
      await updateUser(formData.fullName.trim(), formData.email.trim(), formData.password || undefined);
      Alert.alert(t('common.success'), t('profile.alertSuccess'));
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.tryAgain'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NB.color.primary} />
        <Text style={styles.centerText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>{locale === 'ja' ? 'リダイレクト中...' : 'Đang chuyển hướng...'}</Text>
      </View>
    );
  }

  const initials = user.fullName
    ? user.fullName.split(' ').filter(Boolean).map(w => w[0]).slice(-2).join('').toUpperCase()
    : 'U';
  const progress = totalLessons > 0 ? completedCount / totalLessons : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero header */}
        <View style={styles.heroHeader}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeIcon}>✓</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{user.fullName}</Text>
          <Text style={styles.heroEmail}>{user.email}</Text>
          <BrutalBadge label={user.role || t('profile.roleLearner')} variant="primary" style={{ marginTop: 6 }} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <BrutalCard style={styles.statCard} color={NB.color.surface} padded={false}>
              <Text style={styles.statNum}>{completedCount}</Text>
              <Text style={styles.statLabel}>{t('profile.completedSigns')}</Text>
            </BrutalCard>
          </View>
          <View style={styles.statCol}>
            <BrutalCard style={styles.statCard} color={NB.color.surface} padded={false}>
              <Text style={styles.statNum}>{totalLessons}</Text>
              <Text style={styles.statLabel}>{t('profile.statTotal')}</Text>
            </BrutalCard>
          </View>
          <View style={styles.statCol}>
            <BrutalCard style={styles.statCard} color={NB.color.surface} padded={false}>
              <Text style={styles.statNum}>{Math.round(progress * 100)}%</Text>
              <Text style={styles.statLabel}>{t('profile.statProgress')}</Text>
            </BrutalCard>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.cardPadding}>
          <BrutalCard style={styles.progressCard}>
            <BrutalProgress
              progress={progress}
              label={t('profile.progressLabel')}
              showPercent
              height={12}
              color={NB.color.primary}
            />
            <Text style={styles.progressNote}>
              {t('profile.progressNote', { completed: completedCount, total: totalLessons })}
            </Text>
          </BrutalCard>
        </View>

        {/* Account info */}
        <View style={styles.cardPadding}>
          <BrutalCard style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <BrutalIcon name="profile" size={18} color={NB.color.text} />
              </View>
              <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
              {!isEditing ? (
                <BrutalButton label={t('profile.editInfo')} variant="ghost" size="sm" onPress={handleEdit} />
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn} disabled={isUpdating}>
                    <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.saveBtn, isUpdating && { opacity: 0.6 }]}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t('common.save')}</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.infoList}>
              <InfoRow
                label={t('profile.fullName')}
                value={user.fullName}
                isEditing={isEditing}
                editValue={formData.fullName}
                onChangeText={(v: string) => setFormData({ ...formData, fullName: v })}
                placeholder={t('profile.fullName')}
                editable={!isUpdating}
              />
              <InfoRow
                label={t('profile.email')}
                value={user.email}
                isEditing={isEditing}
                editValue={formData.email}
                onChangeText={(v: string) => setFormData({ ...formData, email: v })}
                placeholder={t('profile.email')}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isUpdating}
              />
              {isEditing && (
                <>
                  <InfoRow
                    label={t('profile.password')}
                    value=""
                    isEditing
                    editValue={formData.password}
                    onChangeText={(v: string) => setFormData({ ...formData, password: v })}
                    placeholder={t('profile.passPlaceholder')}
                    secureTextEntry
                    editable={!isUpdating}
                  />
                  {formData.password ? (
                    <InfoRow
                      label={t('profile.confirmPassword')}
                      value=""
                      isEditing
                      editValue={formData.confirmPassword}
                      onChangeText={(v: string) => setFormData({ ...formData, confirmPassword: v })}
                      placeholder={t('profile.confirmPassPlaceholder')}
                      secureTextEntry
                      editable={!isUpdating}
                    />
                  ) : null}
                </>
              )}
            </View>
          </BrutalCard>
        </View>

        {/* Accessibility settings (visual only) */}
        <View style={styles.cardPadding}>
          <BrutalCard style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <BrutalIcon name="spark" size={18} color={NB.color.text} />
              </View>
              <Text style={styles.sectionTitle}>{t('profile.accessSectionTitle')}</Text>
            </View>
            <View style={styles.accessList}>
              {/* High Contrast Toggle */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setHighContrast(!highContrast)}
                activeOpacity={0.8}
              >
                <View style={styles.toggleLeft}>
                  <Text style={styles.toggleLabel}>{t('profile.toggleContrast')}</Text>
                  <Text style={styles.toggleDesc}>{t('profile.toggleContrastDesc')}</Text>
                </View>
                <View style={[styles.toggleSwitch, highContrast && styles.toggleSwitchActive]}>
                  {highContrast && <BrutalIcon name="check" size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </TouchableOpacity>

              {/* Larger Text Toggle */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setLargerText(!largerText)}
                activeOpacity={0.8}
              >
                <View style={styles.toggleLeft}>
                  <Text style={styles.toggleLabel}>{t('profile.toggleSize')}</Text>
                  <Text style={styles.toggleDesc}>{t('profile.toggleSizeDesc')}</Text>
                </View>
                <View style={[styles.toggleSwitch, largerText && styles.toggleSwitchActive]}>
                  {largerText && <BrutalIcon name="check" size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </TouchableOpacity>

              {/* Subtitles Toggle */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setSubtitles(!subtitles)}
                activeOpacity={0.8}
              >
                <View style={styles.toggleLeft}>
                  <Text style={styles.toggleLabel}>{t('profile.toggleSubs')}</Text>
                  <Text style={styles.toggleDesc}>{t('profile.toggleSubsDesc')}</Text>
                </View>
                <View style={[styles.toggleSwitch, subtitles && styles.toggleSwitchActive]}>
                  {subtitles && <BrutalIcon name="check" size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            </View>
          </BrutalCard>
        </View>

        {/* Logout */}
        <View style={styles.logoutWrap}>
          <BrutalButton
            label={t('profile.logout')}
            variant="danger"
            size="lg"
            onPress={handleLogout}
            disabled={isEditing}
            fullWidth
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>🤟 HearMe</Text>
          <Text style={styles.footerVer}>v1.0 — Making sign language accessible</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Info row sub-component ─────────────────────────────────────────────────
function InfoRow({
  label, value, isEditing, editValue, onChangeText,
  placeholder, keyboardType, autoCapitalize, secureTextEntry, editable,
}: any) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={infoStyles.input}
          value={editValue}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={NB.color.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          secureTextEntry={secureTextEntry}
          editable={editable}
        />
      ) : (
        <Text style={infoStyles.value}>{value}</Text>
      )}
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    borderBottomWidth: NB.border.thin,
    borderBottomColor: NB.color.border,
  },
  label: { fontSize: 12, color: NB.color.muted, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, color: NB.color.text, fontWeight: '700' },
  input: {
    fontSize: 15,
    color: NB.color.text,
    fontWeight: '700',
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    borderRadius: NB.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: NB.color.mutedBg,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: NB.color.bg },
  scroll: { flex: 1, backgroundColor: NB.color.bg },
  center: { flex: 1, backgroundColor: NB.color.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  centerText: { fontSize: 15, color: NB.color.text, fontWeight: '700' },

  // Hero header
  heroHeader: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    backgroundColor: NB.color.surface,
    borderBottomWidth: NB.border.thick,
    borderBottomColor: NB.color.border,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 0 #111111' } : {}),
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: NB.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    ...(Platform.OS === 'web' ? { boxShadow: '3px 3px 0px #111111' } : {}),
  },
  avatarText: { fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: NB.color.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
  },
  avatarBadgeIcon: { fontSize: 12, color: '#FFFFFF', fontWeight: '900' },
  heroName: { fontSize: 26, fontWeight: '900', color: NB.color.text, marginBottom: 4 },
  heroEmail: { fontSize: 14, color: NB.color.muted, fontWeight: '700', marginBottom: 10 },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCol: {
    flex: 1,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNum: { fontSize: 28, fontWeight: '900', color: NB.color.primary, marginBottom: 4 },
  statLabel: { fontSize: 13, color: NB.color.text, fontWeight: '700', textAlign: 'center' },

  // Card padding
  cardPadding: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  // Progress
  progressCard: {
    gap: 12,
  },
  progressNote: { fontSize: 13, color: NB.color.muted, fontWeight: '700', textAlign: 'right' },

  // Info
  infoCard: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.secondaryLight,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: NB.color.text },
  editActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.mutedBg,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
  },
  cancelBtnText: { fontSize: 13, color: NB.color.text, fontWeight: '700' },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.primary,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    minWidth: 48,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '900' },
  infoList: {},

  // Accessibility toggle list
  accessList: {
    gap: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: NB.border.thin,
    borderBottomColor: NB.color.border,
    gap: 16,
  },
  toggleLeft: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: NB.color.text,
  },
  toggleDesc: {
    fontSize: 12,
    color: NB.color.muted,
    fontWeight: '700',
    marginTop: 2,
  },
  toggleSwitch: {
    width: 32,
    height: 32,
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    backgroundColor: NB.color.mutedBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 0px #111111' } : {}),
  },
  toggleSwitchActive: {
    backgroundColor: NB.color.accent,
  },

  // Logout
  logoutWrap: { paddingHorizontal: 16, marginBottom: 16 },

  // Footer
  footer: { paddingVertical: 32, alignItems: 'center', gap: 6 },
  footerLogo: { fontSize: 18, fontWeight: '900', color: NB.color.primary },
  footerVer: { fontSize: 12, color: NB.color.muted, fontWeight: '700' },
});
