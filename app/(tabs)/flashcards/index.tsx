import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Dimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { Alert } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCourseListUrl, getCourseDetailUrl } from '@/constants/config';
import { NB } from '@/constants/theme';
import BrutalSearch from '@/components/ui/ds/SearchInput';
import BrutalBadge from '@/components/ui/ds/Badge';
import BrutalEmptyState from '@/components/ui/ds/EmptyState';
import BrutalLoader from '@/components/ui/ds/PageLoader';
import BrutalButton from '@/components/ui/ds/Button';
import BrutalCard from '@/components/ui/ds/Card';
import BrutalIcon from '@/components/ui/ds/BrutalIcon';
import PageHeader from '@/components/ui/ds/PageHeader';

const isTablet = Dimensions.get('window').width >= 768;

type Course = {
  course_id: number;
  title: string;
  description: string;
  nameschool?: string | null;
  namecourse?: string | null;
  created_at?: string;
};

export default function FlashcardCoursesScreen() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);

  const fetchCourses = useCallback(async (showSpinner: boolean) => {
    if (!token || authError) return;
    try {
      if (showSpinner) setIsLoading(true);
      const response = await fetch(getCourseListUrl(), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        if (response.status === 401) { setAuthError(true); setCourses([]); return; }
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      if (showSpinner) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, authError]);

  useFocusEffect(useCallback(() => { fetchCourses(true); }, [fetchCourses]));

  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;
    const lc = searchTerm.toLowerCase();
    return courses.filter(c =>
      c.title.toLowerCase().includes(lc) ||
      c.description?.toLowerCase().includes(lc) ||
      c.nameschool?.toLowerCase().includes(lc) ||
      c.namecourse?.toLowerCase().includes(lc)
    );
  }, [courses, searchTerm]);

  const handleRefresh = useCallback(() => { setIsRefreshing(true); setAuthError(false); fetchCourses(false); }, [fetchCourses]);

  const handleDelete = (item: Course) => {
    Alert.alert(t('flashcards.deleteConfirmTitle'), t('flashcards.deleteConfirmDesc', { title: item.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            const res = await fetch(getCourseDetailUrl(item.course_id), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to delete');
            fetchCourses(false);
          } catch {
            Alert.alert(t('common.error'), t('flashcards.deleteError'));
          }
        },
      },
    ]);
  };

  const renderCourse = ({ item }: { item: Course }) => {
    const renderRightActions = () => (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeBtn, styles.swipeBtnEdit]}
          activeOpacity={0.85}
          onPress={() => router.push(`/flashcards/course/${item.course_id}/edit`)}
        >
          <BrutalIcon name="edit" size={16} color={NB.color.text} />
          <Text style={styles.swipeBtnLabel}>{t('flashcards.swipeEdit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeBtn, styles.swipeBtnDelete]}
          activeOpacity={0.85}
          onPress={() => handleDelete(item)}
        >
          <BrutalIcon name="trash" size={16} color={NB.color.danger} />
          <Text style={[styles.swipeBtnLabel, { color: NB.color.danger }]}>{t('flashcards.swipeDelete')}</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <View style={styles.cardWrap}>
        <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
          <BrutalCard
            style={styles.card}
            hoverable
            onPress={() => router.push(`/flashcards/course/${item.course_id}`)}
          >
            {/* Card top row */}
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrap}>
                <BrutalIcon name="flashcard" size={20} color={NB.color.text} />
              </View>
              <View style={styles.cardMeta}>
                {item.namecourse && <BrutalBadge label={item.namecourse} variant="primary" />}
                {item.created_at && (
                  <Text style={styles.cardDate}>
                    {t('flashcards.cardDatePrefix')}{new Date(item.created_at).toLocaleDateString('vi-VN')}
                  </Text>
                )}
              </View>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>

            <View style={styles.cardFooter}>
              {item.nameschool ? (
                <BrutalBadge label={`🏫 ${item.nameschool}`} variant="neutral" />
              ) : <View />}
              <Text style={styles.cardCTA}>{t('flashcards.studyNow')}</Text>
            </View>
          </BrutalCard>
        </Swipeable>
      </View>
    );
  };

  if (authLoading || (!token && !authLoading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NB.color.primary} />
        <Text style={styles.centerText}>
          {authLoading ? 'Đang kiểm tra phiên đăng nhập...' : 'Bạn cần đăng nhập để xem Flashcards.'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <PageHeader
          title={t('flashcards.title')}
          subtitle={courses.length > 0 ? t('flashcards.subtitle', { count: courses.length }) : t('flashcards.defaultSubtitle')}
          icon="flashcard"
          accentColor={NB.color.secondary}
          rightSlot={
            <BrutalButton
              label={t('flashcards.createCourse')}
              variant="primary"
              size="sm"
              onPress={() => router.push('/flashcards/create')}
            />
          }
        />

        {/* Search */}
        <BrutalSearch
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder={t('flashcards.searchPlaceholder')}
          style={styles.search}
        />

        {/* Content */}
        {authError ? (
          <BrutalEmptyState
            icon="lock"
            title={t('flashcards.authErrorTitle')}
            description={t('flashcards.authErrorDesc')}
            ctaLabel={t('common.tryAgain')}
            onCta={() => { setAuthError(false); fetchCourses(true); }}
          />
        ) : isLoading ? (
          <BrutalLoader />
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={item => `${item.course_id}`}
            renderItem={renderCourse}
            numColumns={isTablet ? 2 : 1}
            key={isTablet ? 'two-col' : 'one-col'}
            contentContainerStyle={filteredCourses.length === 0 ? styles.emptyContainer : styles.listContent}
            columnWrapperStyle={isTablet ? styles.colWrapper : undefined}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={NB.color.primary} />
            }
            ListEmptyComponent={
              <BrutalEmptyState
                icon="flashcard"
                title={searchTerm ? t('library.emptyTitle') : t('flashcards.emptyTitle')}
                description={searchTerm
                  ? `Không có kết quả cho "${searchTerm}"`
                  : t('flashcards.emptyDesc')}
                ctaLabel={searchTerm ? undefined : t('flashcards.emptyCta')}
                onCta={searchTerm ? undefined : () => router.push('/flashcards/create')}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: NB.color.bg },
  container: { flex: 1, backgroundColor: NB.color.bg },

  search: { margin: 16 },

  // Cards
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  colWrapper: { gap: 16 },
  cardWrap: { flex: isTablet ? 1 : undefined, marginBottom: 16 },
  card: {
    gap: 12,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: NB.radius.sm,
    backgroundColor: NB.color.secondaryLight,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center', alignItems: 'center',
  },
  cardMeta: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', alignItems: 'center' },
  cardDate: { fontSize: 12, color: NB.color.muted, fontWeight: '700' },
  cardTitle: { fontSize: 18, fontWeight: '900', color: NB.color.text },
  cardDesc: { fontSize: 14, color: NB.color.text, fontWeight: '600', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardCTA: { fontSize: 14, fontWeight: '900', color: NB.color.primary },

  // Swipe actions
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  swipeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    height: '80%',
    gap: 4,
    backgroundColor: NB.color.surface,
    ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 0px #111111' } : {}),
  },
  swipeBtnEdit: { backgroundColor: NB.color.primaryLight },
  swipeBtnDelete: { backgroundColor: NB.color.dangerLight },
  swipeBtnLabel: { fontSize: 12, fontWeight: '900', color: NB.color.text },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: NB.color.bg },
  centerText: { marginTop: 12, fontSize: 14, color: NB.color.text, fontWeight: '700', textAlign: 'center', paddingHorizontal: 32 },
});
