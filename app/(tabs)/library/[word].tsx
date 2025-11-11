import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';

import { API_CONFIG, getDictionaryDetailUrl, getVideoUrl } from '@/constants/config';

type WordDetail = {
  word: string;
  topic_name?: string;
  meaning?: string;
  image_url?: string;
  video_url?: string;
};

// Use Metro bundler like Lessons: videos are served at /Family_video2 and /Color_video2
const getMetroVideoUrl = (subPath: string) => getVideoUrl(`/${subPath}`);

export default function LibraryDetailScreen() {
  const { word } = useLocalSearchParams<{ word: string }>();
  const router = useRouter();

  const [data, setData] = useState<WordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!word) return;
    try {
      setIsLoading(true);
      const res = await fetch(getDictionaryDetailUrl(word), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load word detail');
      const json = await res.json();
      setData(json);
      if (json?.video_url) {
        const filename = String(json.video_url);
        const family = getMetroVideoUrl(`Family_video2/${filename}`);
        const color = getMetroVideoUrl(`Color_video2/${filename}`);
        // Prefer Family; verify availability, then fallback to Color
        try {
          const head = await fetch(family, { method: 'HEAD' });
          if (head.ok) {
            setVideoUri(family);
          } else {
            setVideoUri(color);
          }
        } catch {
          setVideoUri(color);
        }
      } else {
        setVideoUri(null);
      }
    } catch (e) {
      console.error('Load word failed', e);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [word]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const player = useVideoPlayer(videoUri ?? '', (p: any) => {
    p.loop = true;
    p.muted = true;
    if (videoUri) p.play();
  });

  const onVideoError = () => {};

  if (isLoading || !data) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.centerText}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Trở lại</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{data.word}</Text>
        {data.topic_name ? <Text style={styles.topic}>{data.topic_name}</Text> : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.practiceButton}
            activeOpacity={0.85}
            onPress={async () => {
              try {
                await AsyncStorage.setItem('dictionarySearchWord', String(data.word ?? ''));
                if (data?.video_url) {
                  await AsyncStorage.setItem('dictionaryVideoFile', String(data.video_url));
                }
              } catch {}
              router.push('/lessons' as any);
            }}
          >
            <Text style={styles.practiceText}>Học động tác này</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mediaCard}>
          {videoUri ? (
            <VideoView
              player={player}
              style={styles.video}
              nativeControls
              contentFit="contain"
            />
          ) : data.image_url ? (
            <Image source={{ uri: data.image_url }} style={styles.image} resizeMode="contain" />
          ) : null}
        </View>

        {data.meaning ? (
          <View style={styles.meaningCard}>
            <Text style={styles.meaningTitle}>Nghĩa</Text>
            <Text style={styles.meaningText}>{data.meaning}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f5ff' },
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f4f5ff' },
  backText: { color: '#6366f1', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#1f2937' },
  topic: { marginTop: 4, color: '#4f46e5', fontWeight: '700' },
  actionRow: { marginTop: 8, marginBottom: 6, alignItems: 'flex-start' },
  practiceButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  practiceText: { color: '#ffffff', fontWeight: '700' },
  mediaCard: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    overflow: 'hidden',
  },
  video: { width: '100%', height: 240, backgroundColor: '#000' },
  image: { width: '100%', height: 240, backgroundColor: '#00000010' },
  meaningCard: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    padding: 14,
  },
  meaningTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 6 },
  meaningText: { color: '#4b5563', fontSize: 15, lineHeight: 22 },
  center: { alignItems: 'center', justifyContent: 'center' },
  centerText: { marginTop: 8, color: '#6b7280' },
});


