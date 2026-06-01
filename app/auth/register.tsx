import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NB } from "@/constants/theme";
import BrutalCard from "@/components/ui/ds/Card";
import BrutalButton from "@/components/ui/ds/Button";
import BrutalIcon from "@/components/ui/ds/BrutalIcon";
import BrutalBadge from "@/components/ui/ds/Badge";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();
  const { t, locale } = useLanguage();

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.alertMissing')); return;
    }
    if (!validateEmail(email)) {
      Alert.alert(t('common.error'), t('auth.alertEmailInvalid')); return;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.alertPassShort')); return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.alertPassMismatch')); return;
    }
    setLoading(true);
    try {
      await signUp(fullName, email, password);
    } catch (error: any) {
      console.error("Register error:", error);
      let msg = t('auth.registerError');
      if (error.message?.includes("already registered") || error.message?.includes("Duplicate")) {
        msg = t('auth.emailTaken');
      } else if (error.message) {
        msg = error.message;
      }
      Alert.alert(locale === 'ja' ? '登録できませんでした' : 'Không thể đăng ký', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <BrutalCard style={styles.card} color={NB.color.surface}>

          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoIconBox}>
              <BrutalIcon name="hand" size={32} color={NB.color.text} />
            </View>
            <Text style={styles.logoText}>HearMe</Text>
          </View>

          <Text style={styles.formTitle}>{t('auth.registerTitle')}</Text>
          <Text style={styles.formSubtitle}>{t('auth.registerSubtitle')}</Text>

          {/* Progress steps */}
          <View style={styles.stepsRow}>
            {[t('auth.stepInfo'), t('auth.stepSecurity'), t('auth.stepConfirm')].map((s, i) => (
              <View key={s} style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  i === 0 && styles.stepDotActive,
                  Platform.OS === 'web' && { boxShadow: '2px 2px 0px #111111' } as any
                ]}>
                  <Text style={[styles.stepDotText, i === 0 && styles.stepDotTextActive]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Full name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('auth.labelName')}</Text>
            <View style={styles.inputWrap}>
              <BrutalIcon name="profile" size={16} color={NB.color.text} />
              <TextInput
                style={styles.input}
                placeholder={locale === 'ja' ? '山田 太郎' : 'Nguyễn Văn A'}
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
                placeholderTextColor={NB.color.muted}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('auth.labelEmailReg')}</Text>
            <View style={styles.inputWrap}>
              <BrutalIcon name="profile" size={16} color={NB.color.text} />
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                placeholderTextColor={NB.color.muted}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('auth.labelPass')}</Text>
            <View style={styles.inputWrap}>
              <BrutalIcon name="lock" size={16} color={NB.color.text} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('auth.passHint')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                editable={!loading}
                placeholderTextColor={NB.color.muted}
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldHint}>{t('auth.passHint')}</Text>
          </View>

          {/* Confirm password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('auth.labelConfirmPass')}</Text>
            <View style={[
              styles.inputWrap,
              confirmPassword && password !== confirmPassword && styles.inputWrapError,
            ]}>
              <BrutalIcon name="check" size={16} color={NB.color.text} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.labelConfirmPass')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPass}
                editable={!loading}
                placeholderTextColor={NB.color.muted}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>
            {confirmPassword && password !== confirmPassword && (
              <Text style={styles.errorHint}>{t('auth.passMismatchError')}</Text>
            )}
          </View>

          {/* Submit */}
          <View style={{ marginTop: 8 }}>
            <BrutalButton
              label={loading ? t('common.loading') : t('auth.submitRegister')}
              variant="primary"
              size="lg"
              onPress={handleRegister}
              disabled={loading}
              loading={loading}
              fullWidth
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{locale === 'ja' ? 'または' : 'hoặc'}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Back to login */}
          <BrutalButton
            label={t('auth.hasAccount')}
            variant="ghost"
            size="md"
            onPress={() => router.back()}
            disabled={loading}
            fullWidth
          />

        </BrutalCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NB.color.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: NB.color.bg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: NB.color.surface,
  },

  logoArea: { alignItems: 'center', marginBottom: 20 },
  logoIconBox: {
    width: 56,
    height: 56,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    ...(Platform.OS === 'web' ? { boxShadow: '3px 3px 0px #111111' } : {}),
  },
  logoText: { fontSize: 24, fontWeight: '900', color: NB.color.text, letterSpacing: -0.5, marginTop: 8 },

  formTitle: { fontSize: 22, fontWeight: '900', color: NB.color.text, marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: NB.color.muted, fontWeight: '700', marginBottom: 20, lineHeight: 20 },

  // Steps indicator
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 4 },
  stepItem: { alignItems: 'center', flex: 1, gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: NB.radius.xs,
    backgroundColor: NB.color.mutedBg,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: { backgroundColor: NB.color.primary, borderColor: NB.color.border },
  stepDotText: { fontSize: 12, fontWeight: '900', color: NB.color.text },
  stepDotTextActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 11, color: NB.color.muted, textAlign: 'center', fontWeight: '700' },
  stepLabelActive: { color: NB.color.primary, fontWeight: '800' },

  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '800', color: NB.color.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.mutedBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputWrapError: { borderColor: NB.color.danger },
  input: { flex: 1, fontSize: 15, fontWeight: '700', color: NB.color.text, padding: 0, margin: 0 },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 16 },
  fieldHint: { fontSize: 11, color: NB.color.muted, fontWeight: '700', marginTop: 5 },
  errorHint: { fontSize: 11, color: NB.color.danger, marginTop: 5, fontWeight: '800' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 12 },
  dividerLine: { flex: 1, height: NB.border.thin, backgroundColor: NB.color.border },
  dividerText: { fontSize: 13, color: NB.color.muted, fontWeight: '700' },
});
