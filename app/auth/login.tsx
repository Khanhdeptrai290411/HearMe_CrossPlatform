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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  const { t, locale } = useLanguage();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.alertMissing'));
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(locale === 'ja' ? 'ログイン失敗' : 'Đăng nhập thất bại', error.message || (locale === 'ja' ? 'メールアドレスまたはパスワードが正しくありません' : 'Email hoặc mật khẩu không đúng'));
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

        {/* centered BrutalCard */}
        <BrutalCard style={styles.card} color={NB.color.surface}>

          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoIconBox}>
              <BrutalIcon name="hand" size={32} color={NB.color.text} />
            </View>
            <Text style={styles.logoText}>HearMe</Text>
            <BrutalBadge label="Learn Sign Language with AI" variant="primary" style={{ marginTop: 6 }} />
          </View>

          {/* Form header */}
          <Text style={styles.formTitle}>{t('auth.loginTitle')}</Text>
          <Text style={styles.formSubtitle}>{t('auth.loginSubtitle')}</Text>

          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('auth.labelEmail')}</Text>
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

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('auth.labelPass')}</Text>
            <View style={styles.inputWrap}>
              <BrutalIcon name="lock" size={16} color={NB.color.text} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                editable={!loading}
                placeholderTextColor={NB.color.muted}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <View style={{ marginTop: 8 }}>
            <BrutalButton
              label={loading ? t('common.loading') : t('auth.submitLogin')}
              variant="primary"
              size="lg"
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
              fullWidth
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.noAccount')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register link */}
          <BrutalButton
            label={t('auth.registerLink')}
            variant="ghost"
            size="md"
            onPress={() => router.push('/auth/register')}
            disabled={loading}
            fullWidth
          />

          {/* Footer */}
          <Text style={styles.footerNote}>
            {t('auth.footerNote')}
          </Text>
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

  // Logo
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoIconBox: {
    width: 64,
    height: 64,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    ...(Platform.OS === 'web' ? { boxShadow: '3px 3px 0px #111111' } : {}),
  },
  logoText: { fontSize: 28, fontWeight: '900', color: NB.color.text, letterSpacing: -0.5, marginTop: 10 },

  formTitle: { fontSize: 22, fontWeight: '900', color: NB.color.text, marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: NB.color.muted, fontWeight: '700', marginBottom: 24, lineHeight: 20 },

  // Fields
  fieldGroup: { marginBottom: 18 },
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
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: NB.color.text,
    padding: 0,
    margin: 0,
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 16 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: NB.border.thin, backgroundColor: NB.color.border },
  dividerText: { fontSize: 13, color: NB.color.muted, fontWeight: '700' },

  footerNote: { fontSize: 12, color: NB.color.muted, fontWeight: '700', textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
