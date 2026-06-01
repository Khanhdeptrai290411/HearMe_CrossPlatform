import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FlashcardCourse } from '../../_components/types';
import { API_CONFIG, getCourseDetailUrl } from '@/constants/config';
import { NB } from '@/constants/theme';
import BrutalCard from '@/components/ui/ds/Card';
import BrutalButton from '@/components/ui/ds/Button';
import BrutalBadge from '@/components/ui/ds/Badge';
import BrutalIcon from '@/components/ui/ds/BrutalIcon';

const isVideoFile = (filename?: string | null) => {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.mkv');
};

const getMediaUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('uploads/') ? path : `uploads/${path}`;
  return `${API_CONFIG.BASE_URL}/public/${cleanPath}`;
};

const PreviewVideo = ({ uri, style }: { uri: string; style: any }) => {
  const player = useVideoPlayer(uri, (player: any) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        try {
          player.pause();
        } catch {}
      };
    }, [player]),
  );

  React.useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={style}
      nativeControls
      contentFit="contain"
    />
  );
};

export default function FlashcardCourseDetailScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { token } = useAuth();
  const { t } = useLanguage();

  const [course, setCourse] = useState<FlashcardCourse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Reset flip when card changes
  useEffect(() => {
    setIsFlipped(false);
    Animated.timing(flipAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, flipAnim]);

  const fetchCourse = useCallback(async () => {
    if (!courseId || !token) return;

    try {
      setIsLoading(true);
      const response = await fetch(getCourseDetailUrl(courseId), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch course ${response.status}`);
      }

      const data = await response.json();
      setCourse(data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to load course', error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const toggleFlip = () => {
    const toValue = isFlipped ? 0 : 180;
    Animated.timing(flipAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(prev => !prev);
    });
  };

  const handlePrev = () => {
    if (!course?.quizzes) return;
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if (!course?.quizzes) return;
    setCurrentIndex(prev => Math.min(prev + 1, course.quizzes.length - 1));
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  if (isLoading || !course) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top', 'left', 'right']}>
        <BrutalCard style={styles.loadingCard}>
          <ActivityIndicator size="large" color={NB.color.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </BrutalCard>
      </SafeAreaView>
    );
  }

  const quizzes = course?.quizzes ?? [];
  const currentQuiz = quizzes[currentIndex];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.backButtonWrap}>
            <BrutalButton
              label={`← ${t('common.back')}`}
              variant="ghost"
              size="sm"
              onPress={() => router.replace('/(tabs)/flashcards')}
            />
          </View>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.description}>{course.description}</Text>
          <View style={styles.metaRow}>
            {course.nameschool ? <BrutalBadge label={`🏫 ${course.nameschool}`} variant="primary" style={{ marginRight: 6 }} /> : null}
            {course.namecourse ? <BrutalBadge label={`📘 ${course.namecourse}`} variant="accent" /> : null}
          </View>
        </View>

        {quizzes.length === 0 ? (
          <View style={styles.emptyState}>
            <BrutalIcon name="flashcard" size={48} color={NB.color.text} />
            <Text style={styles.emptyTitle}>{t('flashcards.emptyQuizTitle')}</Text>
            <Text style={styles.emptyDescription}>
              {t('flashcards.emptyQuizDesc')}
            </Text>
          </View>
        ) : (
          <>
            {/* Flip Card Container */}
            <TouchableOpacity activeOpacity={0.95} onPress={toggleFlip}>
              <View style={styles.flipContainer}>
                {/* Front Side */}
                <Animated.View style={[styles.flipCard, frontAnimatedStyle]}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{currentQuiz.definition}</Text>
                    {currentQuiz.image ? (
                      <View style={styles.mediaFrame}>
                        {isVideoFile(currentQuiz.image) ? (
                          <PreviewVideo uri={getMediaUrl(currentQuiz.image)} style={styles.cardVideo} />
                        ) : (
                          <Image
                            source={{ uri: getMediaUrl(currentQuiz.image) }}
                            style={styles.cardImage}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    ) : null}
                    <BrutalBadge label={t('flashcards.flipHintFront')} variant="secondary" style={styles.flipHint} />
                  </View>
                </Animated.View>

                {/* Back Side */}
                <Animated.View style={[styles.flipCard, styles.flipCardBack, backAnimatedStyle]}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardDescription}>{currentQuiz.mota}</Text>
                    <BrutalBadge label={t('flashcards.flipHintBack')} variant="neutral" style={styles.flipHint} />
                  </View>
                </Animated.View>
              </View>
            </TouchableOpacity>

            {/* Pagination Controls */}
            <View style={styles.controls}>
              <BrutalButton
                label={`← ${t('common.previous')}`}
                variant="ghost"
                size="sm"
                onPress={handlePrev}
                disabled={currentIndex === 0}
              />
              <BrutalCard style={styles.counterCard} color={NB.color.mutedBg} padded={false}>
                <Text style={styles.counter}>
                  {currentIndex + 1} / {quizzes.length}
                </Text>
              </BrutalCard>
              <BrutalButton
                label={`${t('common.next')} →`}
                variant="ghost"
                size="sm"
                onPress={handleNext}
                disabled={currentIndex === quizzes.length - 1}
              />
            </View>
          </>
        )}

        {/* Footer Actions */}
        <View style={styles.actionRow}>
          <View style={styles.actionCol}>
            <BrutalButton
              label={t('flashcards.quiz')}
              variant="secondary"
              size="lg"
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/flashcards/course/[courseId]/quiz',
                  params: { courseId: String(courseId ?? '') },
                } as never)
              }
              fullWidth
            />
          </View>
          <View style={styles.actionCol}>
            <BrutalButton
              label={t('flashcards.edit')}
              variant="primary"
              size="lg"
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/flashcards/course/[courseId]/edit',
                  params: { courseId: String(courseId ?? '') },
                } as never)
              }
              fullWidth
            />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NB.color.bg,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: NB.color.bg,
  },
  header: {
    marginBottom: 24,
    gap: 8,
  },
  backButtonWrap: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: NB.color.text,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: NB.color.text,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  flipContainer: {
    height: 400,
    marginBottom: 24,
  },
  flipCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: NB.radius.md,
    backgroundColor: NB.color.surface,
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { boxShadow: '6px 6px 0px #111111' } : {}),
  },
  flipCardBack: {
    backgroundColor: NB.color.primaryLight,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: NB.color.text,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 20,
    fontWeight: '800',
    color: NB.color.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  mediaFrame: {
    width: '100%',
    height: 220,
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: NB.color.mutedBg,
  },
  cardVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  flipHint: {
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  counterCard: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
  },
  counter: {
    fontSize: 15,
    fontWeight: '900',
    color: NB.color.text,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  actionCol: {
    flex: 1,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NB.color.surface,
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    borderRadius: NB.radius.md,
    gap: 12,
    padding: 24,
    ...(Platform.OS === 'web' ? { boxShadow: '4px 4px 0px #111111' } : {}),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: NB.color.text,
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: NB.color.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NB.color.bg,
  },
  loadingCard: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: NB.color.text,
  },
});
