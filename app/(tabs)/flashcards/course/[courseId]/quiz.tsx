import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';

import { useAuth } from '@/contexts/AuthContext';
import { FlashcardCourse } from '../../_components/types';
import { API_CONFIG, getCourseDetailUrl } from '@/constants/config';

const getMediaUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('uploads/') ? path : `uploads/${path}`;
  return `${API_CONFIG.BASE_URL}/public/${cleanPath}`;
};

const isVideoFile = (filename?: string | null) => {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.mkv');
};

const PreviewVideo = ({ uri, style }: { uri: string; style: any }) => {
  const player = useVideoPlayer(uri, (player: any) => {
    player.loop = true;
    player.play();
    player.muted = true;
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

export default function FlashcardQuizScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { token } = useAuth();

  const [course, setCourse] = useState<FlashcardCourse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

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
        throw new Error('Failed to fetch course');
      }

      const data = await response.json();
      setCourse(data);
      setCurrentIndex(0);
      setAnswers({});
      setShowResults(false);
    } catch (error) {
      console.error('Failed to load course quiz', error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const quizzes = course?.quizzes ?? [];

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: value,
    }));
  };

  const handleNext = () => {
    if (currentIndex >= quizzes.length - 1) {
      setShowResults(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const scoreInfo = useMemo(() => {
    if (!showResults || quizzes.length === 0) return { correct: 0, total: 0, percentage: 0 };

    const total = quizzes.length;
    const correct = quizzes.reduce((acc, quiz, index) => {
      return acc + (answers[index]?.trim().toLowerCase() === quiz.mota?.trim().toLowerCase() ? 1 : 0);
    }, 0);
    const percentage = Math.round((correct / total) * 100);
    return { correct, total, percentage };
  }, [answers, quizzes, showResults]);

  if (isLoading || !course) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.centerText}>Đang tải quiz...</Text>
      </SafeAreaView>
    );
  }

  if (quizzes.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top', 'left', 'right']}>
        <Text style={styles.emptyTitle}>Khóa học này chưa có quiz.</Text>
        <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
          <Text style={styles.linkText}>← Trở lại khóa học</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (showResults) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.resultsContainer]} edges={['top', 'left', 'right']}>
        <Text style={styles.resultsTitle}>Kết quả</Text>
        <Text style={styles.score}>{scoreInfo.percentage}%</Text>
        <Text style={styles.resultsSubtitle}>
          Bạn trả lời đúng {scoreInfo.correct}/{scoreInfo.total} câu hỏi
        </Text>
        <View style={styles.resultsActions}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => {
              setAnswers({});
              setCurrentIndex(0);
              setShowResults(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionText}>Làm lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/flashcards/course/[courseId]',
                params: { courseId: String(courseId ?? '') },
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionText}>Trở lại khóa học</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuiz = quizzes[currentIndex];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.quizContainer}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Trở lại</Text>
        </TouchableOpacity>

        <Text style={styles.quizTitle}>{course.title}</Text>
        <Text style={styles.quizSubtitle}>
          Câu hỏi {currentIndex + 1}/{quizzes.length}
        </Text>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuiz.definition}</Text>
          {currentQuiz.image ? (
            isVideoFile(currentQuiz.image) ? (
              <PreviewVideo uri={getMediaUrl(currentQuiz.image)} style={styles.questionVideo} />
            ) : (
              <Image
                source={{ uri: getMediaUrl(currentQuiz.image) }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            )
          ) : null}
          <TextInput
            style={styles.answerInput}
            multiline
            placeholder="Nhập câu trả lời của bạn..."
            value={answers[currentIndex] ?? ''}
            onChangeText={handleAnswerChange}
          />
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navDisabled]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navText}>← Trước</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navText}>
              {currentIndex === quizzes.length - 1 ? 'Hoàn thành' : 'Tiếp →'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f5ff',
  },
  flex: {
    flex: 1,
    backgroundColor: '#f4f5ff',
  },
  quizContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backText: {
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 12,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  quizSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4338ca',
    marginBottom: 12,
  },
  questionImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#00000015',
  },
  questionVideo: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#000000',
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    minHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  navDisabled: {
    backgroundColor: '#d1d5db',
  },
  navText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerText: {
    marginTop: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  linkButton: {
    marginTop: 8,
  },
  linkText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f4f5ff',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  score: {
    fontSize: 56,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 12,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryActionText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  primaryAction: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

