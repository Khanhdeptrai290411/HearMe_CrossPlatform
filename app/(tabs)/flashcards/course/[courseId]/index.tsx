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
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { FlashcardCourse } from '../../_components/types';
import { API_CONFIG, getCourseDetailUrl } from '@/constants/config';

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
      // screen focused
      return () => {
        // screen blurred
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
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.centerText}>Đang tải khóa học...</Text>
      </SafeAreaView>
    );
  }

  const quizzes = course?.quizzes ?? [];
  const currentQuiz = quizzes[currentIndex];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/flashcards')} activeOpacity={0.7}>
          <Text style={styles.backText}>← Trở lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.description}>{course.description}</Text>
        <View style={styles.metaRow}>
          {course.nameschool ? <Text style={styles.metaText}>🏫 {course.nameschool}</Text> : null}
          {course.namecourse ? <Text style={styles.metaText}>📘 {course.namecourse}</Text> : null}
        </View>
      </View>

      {quizzes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Chưa có flashcard nào</Text>
          <Text style={styles.emptyDescription}>
            Hãy thêm flashcard để bắt đầu luyện tập.
          </Text>
        </View>
      ) : (
        <>
          <TouchableOpacity activeOpacity={0.9} onPress={toggleFlip}>
            <View style={styles.flipContainer}>
              <Animated.View style={[styles.flipCard, frontAnimatedStyle]}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{currentQuiz.definition}</Text>
                  {currentQuiz.image ? (
                    isVideoFile(currentQuiz.image) ? (
                      <PreviewVideo uri={getMediaUrl(currentQuiz.image)} style={styles.cardVideo} />
                    ) : (
                      <Image
                        source={{ uri: getMediaUrl(currentQuiz.image) }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    )
                  ) : null}
                  <Text style={styles.flipHint}>Nhấn để xem mặt sau</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.flipCard, styles.flipCardBack, backAnimatedStyle]}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardDescription}>{currentQuiz.mota}</Text>
                  <Text style={styles.flipHint}>Nhấn để xem lại mặt trước</Text>
                </View>
              </Animated.View>
            </View>
          </TouchableOpacity>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, currentIndex === 0 && styles.controlDisabled]}
              onPress={handlePrev}
              disabled={currentIndex === 0}
            >
              <Text style={styles.controlText}>← Trước</Text>
            </TouchableOpacity>
            <Text style={styles.counter}>
              {currentIndex + 1} / {quizzes.length}
            </Text>
            <TouchableOpacity
              style={[
                styles.controlButton,
                currentIndex === quizzes.length - 1 && styles.controlDisabled,
              ]}
              onPress={handleNext}
              disabled={currentIndex === quizzes.length - 1}
            >
              <Text style={styles.controlText}>Sau →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/flashcards/course/[courseId]/quiz',
              params: { courseId: String(courseId ?? '') },
            } as never)
          }
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryText}>Luyện tập Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/flashcards/course/[courseId]/edit',
              params: { courseId: String(courseId ?? '') },
            } as never)
          }
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f5ff',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f4f5ff',
  },
  header: {
    marginBottom: 16,
  },
  backText: {
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#4b5563',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  flipContainer: {
    height: 380,
    marginBottom: 16,
  },
  flipCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  flipCardBack: {
    backgroundColor: '#eef2ff',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4338ca',
    textAlign: 'center',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 18,
    color: '#312e81',
    textAlign: 'center',
    lineHeight: 26,
  },
  cardImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#00000010',
  },
  cardVideo: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#000000',
  },
  flipHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  controlDisabled: {
    backgroundColor: '#d1d5db',
  },
  controlText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  counter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#e0e7ff',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    marginTop: 12,
    color: '#6b7280',
  },
});

