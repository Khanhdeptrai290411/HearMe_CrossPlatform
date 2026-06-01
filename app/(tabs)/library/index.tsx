import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';

import { getDictionaryListUrl } from '@/constants/config';
import { NB } from '@/constants/theme';
import BrutalSearch from '@/components/ui/ds/SearchInput';
import BrutalBadge from '@/components/ui/ds/Badge';
import BrutalEmptyState from '@/components/ui/ds/EmptyState';
import BrutalLoader from '@/components/ui/ds/PageLoader';
import BrutalCard from '@/components/ui/ds/Card';
import BrutalIcon from '@/components/ui/ds/BrutalIcon';
import PageHeader from '@/components/ui/ds/PageHeader';

const isTablet = Dimensions.get('window').width >= 768;

type Vocab = {
  word: string;
  meaning?: string;
  topic_name?: string;
  image_url?: string;
  video_url?: string;
};

export default function LibraryIndexScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [items, setItems] = useState<Vocab[]>([]);
  const [search, setSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(getDictionaryListUrl(), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load dictionary');
      const data = await res.json();
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error('Load dictionary failed', e);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Unique topics for filter chips
  const topics = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.topic_name) set.add(i.topic_name); });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (activeTopic) list = list.filter(i => i.topic_name === activeTopic);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.word?.toLowerCase().includes(q) ||
        i.meaning?.toLowerCase().includes(q) ||
        i.topic_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, search, activeTopic]);

  const renderItem = ({ item }: { item: Vocab }) => (
    <View style={styles.cardWrap}>
      <BrutalCard
        style={styles.card}
        hoverable
        onPress={() => router.push({ pathname: '/(tabs)/library/[word]', params: { word: item.word } })}
        padded={false}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardLeft}>
            <View style={styles.cardIconWrap}>
              <BrutalIcon name="hand" size={22} color={NB.color.text} />
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardWord}>{item.word}</Text>
            {item.topic_name ? (
              <BrutalBadge label={item.topic_name} variant="primary" style={styles.cardBadge} />
            ) : null}
            {item.meaning ? (
              <Text style={styles.cardMeaning} numberOfLines={2}>{item.meaning}</Text>
            ) : null}
          </View>
          <View style={styles.cardArrow}>
            <BrutalIcon name="arrow-right" size={16} color={NB.color.text} strokeWidth={3} />
          </View>
        </View>
      </BrutalCard>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>

        {/* Header */}
        <PageHeader
          title={t('library.title')}
          subtitle={isLoading ? t('common.loading') : (locale === 'vi' ? `${items.length} ${t('library.subtitle')}` : `${t('library.subtitle')} (${items.length})`)}
          icon="library"
          accentColor={NB.color.primary}
        />

        {/* Search */}
        <BrutalSearch
          value={search}
          onChangeText={setSearch}
          placeholder={t('library.searchPlaceholder')}
          style={styles.search}
        />

        {/* Topic filter chips */}
        {topics.length > 0 && (
          <View style={styles.filterWrap}>
            <FlatList
              horizontal
              data={[null, ...topics]}
              keyExtractor={(t, i) => t ?? `__all__${i}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              renderItem={({ item: topic }) => {
                const isActive = topic === activeTopic;
                return (
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      isActive && styles.chipActive,
                      Platform.OS === 'web' && (isActive
                        ? { boxShadow: '3px 3px 0px #111111' } as any
                        : { boxShadow: '1.5px 1.5px 0px #111111' } as any),
                    ]}
                    onPress={() => setActiveTopic(topic)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {topic ?? t('library.filterAll')}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Results count */}
        {!isLoading && (search || activeTopic) && (
          <Text style={styles.resultCount}>
            {t('library.resultCount', { count: filtered.length })}{activeTopic ? (locale === 'ja' ? `（カテゴリ：${activeTopic}）` : ` trong "${activeTopic}"`) : ''}{search ? (locale === 'ja' ? `（キーワード：${search}）` : ` cho "${search}"`) : ''}
          </Text>
        )}

        {/* List */}
        {isLoading ? (
          <BrutalLoader />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(it, idx) => `${it.word}-${idx}`}
            renderItem={renderItem}
            numColumns={isTablet ? 2 : 1}
            key={isTablet ? 'two-col' : 'one-col'}
            contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
            columnWrapperStyle={isTablet ? styles.colWrapper : undefined}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <BrutalEmptyState
                icon="library"
                title={t('library.emptyTitle')}
                description={t('library.emptyDesc')}
                ctaLabel={t('library.emptyCta')}
                onCta={() => { setSearch(''); setActiveTopic(null); }}
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

  search: { margin: 16, marginBottom: 8 },

  // Filter chips
  filterWrap: { paddingVertical: 8 },
  filterList: { paddingHorizontal: 16, gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.surface,
    borderWidth: NB.border.thin,
    borderColor: NB.color.border,
    ...(Platform.OS !== 'web' ? {
      shadowColor: '#111111',
      shadowOffset: { width: 1.5, height: 1.5 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 2,
    } : {}),
  },
  chipActive: {
    backgroundColor: NB.color.secondary,
    ...(Platform.OS !== 'web' ? {
      shadowOffset: { width: 3, height: 3 },
      elevation: 4,
    } : {}),
  },
  chipText: { fontSize: 13, fontWeight: '800', color: NB.color.text },
  chipTextActive: { color: NB.color.text },

  resultCount: {
    fontSize: 13,
    color: NB.color.muted,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  // Cards
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  colWrapper: { gap: 16 },

  cardWrap: {
    flex: isTablet ? 1 : undefined,
    marginBottom: 16,
  },
  card: {
    // Overriding card padding so we can control inside structure
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  cardLeft: {},
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.primaryLight,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardWord: { fontSize: 18, fontWeight: '900', color: NB.color.text },
  cardBadge: { marginTop: 2 },
  cardMeaning: { fontSize: 14, color: NB.color.text, fontWeight: '600', lineHeight: 20, marginTop: 2 },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    backgroundColor: NB.color.mutedBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
