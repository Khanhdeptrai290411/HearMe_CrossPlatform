import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { getDictionaryListUrl } from '@/constants/config';

type Vocab = {
  word: string;
  meaning?: string;
  topic_name?: string;
  image_url?: string;
  video_url?: string;
};

export default function LibraryIndexScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Vocab[]>([]);
  const [search, setSearch] = useState('');
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

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      it =>
        it.word?.toLowerCase().includes(q) ||
        it.meaning?.toLowerCase().includes(q) ||
        it.topic_name?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const renderItem = ({ item }: { item: Vocab }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/(tabs)/library/[word]', params: { word: item.word } })}
    >
      <Text style={styles.cardTitle}>{item.word}</Text>
      {item.topic_name ? <Text style={styles.cardTopic}>{item.topic_name}</Text> : null}
      {item.meaning ? <Text style={styles.cardDesc} numberOfLines={2}>{item.meaning}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Thư viện ký hiệu</Text>
        <Text style={styles.subtitle}>Tìm kiếm và xem hướng dẫn động tác</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm từ..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.centerText}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(it, idx) => `${it.word}-${idx}`}
            renderItem={renderItem}
            contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
            ListEmptyComponent={<Text style={styles.emptyText}>Không có kết quả</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f5ff' },
  container: { flex: 1, backgroundColor: '#f4f5ff', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardTopic: { marginTop: 4, color: '#4f46e5', fontWeight: '600' },
  cardDesc: { marginTop: 6, color: '#6b7280' },
  center: { alignItems: 'center', paddingVertical: 24 },
  centerText: { marginTop: 8, color: '#6b7280' },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#6b7280' },
});


