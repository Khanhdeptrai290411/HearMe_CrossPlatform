import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { VideoView, useVideoPlayer } from 'expo-video';

import { getDictionaryDetailUrl, getVideoUrl } from '@/constants/config';
import { NB } from '@/constants/theme';
import BrutalBadge from '@/components/ui/ds/Badge';
import BrutalButton from '@/components/ui/ds/Button';
import BrutalCard from '@/components/ui/ds/Card';
import BrutalIcon from '@/components/ui/ds/BrutalIcon';

type WordDetail = {
  word: string;
  topic_name?: string;
  meaning?: string;
  image_url?: string;
  video_url?: string;
};

const getMetroVideoUrl = (subPath: string) => getVideoUrl(`/${subPath}`);

export default function LibraryDetailScreen() {
  const { word } = useLocalSearchParams<{ word: string }>();
  const router = useRouter();
  const { t, locale } = useLanguage();

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
        try {
          const head = await fetch(family, { method: 'HEAD' });
          setVideoUri(head.ok ? family : color);
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

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const player = useVideoPlayer(videoUri ?? '', (p: any) => {
    p.loop = true;
    p.muted = true;
    if (videoUri) p.play();
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top', 'left', 'right']}>
        <BrutalCard style={styles.loadingCard}>
          <ActivityIndicator size="large" color={NB.color.primary} />
          <Text style={styles.loadingText}>{t('library.loading')}</Text>
        </BrutalCard>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top', 'left', 'right']}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>😕</Text>
        <Text style={{ fontSize: 18, fontWeight: '900', color: NB.color.text, marginBottom: 16 }}>{t('library.emptyTitle')}</Text>
        <BrutalButton label={`← ${t('common.back')}`} variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Back button */}
        <View style={styles.backPillWrap}>
          <BrutalButton
            label={`← ${t('library.title')}`}
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          />
        </View>

        {/* Word header */}
        <View style={styles.wordHeader}>
          <View style={styles.wordIconWrap}>
            <BrutalIcon name="hand" size={32} color={NB.color.text} />
          </View>
          <View style={styles.wordHeaderText}>
            <Text style={styles.wordTitle}>{data.word}</Text>
            {data.topic_name ? <BrutalBadge label={data.topic_name} variant="primary" style={{ marginTop: 6 }} /> : null}
          </View>
        </View>

        {/* Practice CTA */}
        <View style={styles.ctaRow}>
          <BrutalButton
            label={t('library.learn')}
            variant="primary"
            size="lg"
            onPress={async () => {
              try {
                await AsyncStorage.setItem('dictionarySearchWord', String(data.word ?? ''));
                if (data?.video_url) await AsyncStorage.setItem('dictionaryVideoFile', String(data.video_url));
              } catch {}
              router.push('/lessons' as any);
            }}
          />
        </View>

        {/* Media card */}
        <View style={styles.mediaCardWrapper}>
          <BrutalCard padded={false} style={styles.mediaCard}>
            {videoUri ? (
              <VideoView
                player={player}
                style={styles.video}
                nativeControls
                contentFit="contain"
              />
            ) : data.image_url ? (
              <View style={styles.imagePlaceholder}>
                <BrutalIcon name="camera" size={48} color={NB.color.muted} />
                <Text style={styles.noMediaText}>{locale === 'ja' ? '端末で画像を表示' : 'Xem hình ảnh trên thiết bị'}</Text>
              </View>
            ) : (
              <View style={styles.noMedia}>
                <BrutalIcon name="camera" size={48} color={NB.color.muted} />
                <Text style={styles.noMediaText}>{locale === 'ja' ? 'ビデオはありません' : 'Chưa có video minh họa'}</Text>
              </View>
            )}
          </BrutalCard>
        </View>

        {/* Meaning card */}
        {data.meaning ? (
          <View style={styles.cardPadding}>
            <BrutalCard style={styles.meaningCard}>
              <View style={styles.meaningHeader}>
                <BrutalIcon name="spark" size={18} color={NB.color.primary} />
                <Text style={styles.meaningHeaderTitle}>{t('library.meaningTitle')}</Text>
              </View>
              <Text style={styles.meaningText}>{data.meaning}</Text>
            </BrutalCard>
          </View>
        ) : null}

        {/* Tips card */}
        <View style={styles.cardPadding}>
          <BrutalCard style={styles.tipCard} color={NB.color.secondaryLight}>
            <View style={styles.tipContent}>
              <BrutalIcon name="brain" size={20} color={NB.color.text} />
              <Text style={styles.tipText}>{t('library.tipDesc')}</Text>
            </View>
          </BrutalCard>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: NB.color.bg },
  scroll: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },

  loadingCard: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  loadingText: { fontSize: 14, color: NB.color.text, fontWeight: '700' },

  backPillWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },

  // Word header
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  wordIconWrap: {
    width: 64,
    height: 64,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.accentLight,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '3px 3px 0px #111111' } : {}),
  },
  wordHeaderText: { flex: 1 },
  wordTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: NB.color.text,
    letterSpacing: -0.5,
  },

  // CTA
  ctaRow: { paddingHorizontal: 20, marginBottom: 20, alignItems: 'flex-start' },

  // Media
  mediaCardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mediaCard: {
    overflow: 'hidden',
  },
  video: { width: '100%', height: 320, backgroundColor: '#0F172A' },
  imagePlaceholder: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NB.color.mutedBg,
    gap: 12,
  },
  noMedia: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NB.color.mutedBg,
    gap: 10,
  },
  noMediaText: { fontSize: 14, color: NB.color.text, fontWeight: '700' },

  // Cards padding
  cardPadding: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  // Meaning
  meaningCard: {
    gap: 12,
  },
  meaningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meaningHeaderTitle: { fontSize: 16, fontWeight: '900', color: NB.color.text },
  meaningText: { fontSize: 15, color: NB.color.text, fontWeight: '600', lineHeight: 24 },

  // Tip
  tipCard: {
    borderRadius: NB.radius.md,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: { flex: 1, fontSize: 13, color: NB.color.text, fontWeight: '700', lineHeight: 19 },
});
