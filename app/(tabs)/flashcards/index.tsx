import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';

import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG, getApiUrl, getCourseListUrl, getCourseDetailUrl } from '@/constants/config';
import { Alert } from 'react-native';

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
  const { token, isLoading: authLoading, signOut, refreshUser } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);

  const fetchCourses = useCallback(
    async (showSpinner: boolean) => {
      if (!token || authError) return;

      try {
        if (showSpinner) {
          setIsLoading(true);
        }

        const response = await fetch(getCourseListUrl(), {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            if (!authError) {
              console.warn('Không thể tải khóa học: chưa được cấp quyền hoặc phiên hết hạn (401).');
            }
            setAuthError(true);
            setCourses([]);
            return;
          }
          throw new Error(`Failed to fetch courses: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        if (showSpinner) {
          setIsLoading(false);
        }
        setIsRefreshing(false);
      }
    },
    [token, authError],
  );

  useFocusEffect(
    useCallback(() => {
      fetchCourses(true);
    }, [fetchCourses]),
  );

  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) {
      return courses;
    }
    const lowerCase = searchTerm.toLowerCase();
    return courses.filter(
      course =>
        course.title.toLowerCase().includes(lowerCase) ||
        course.description?.toLowerCase().includes(lowerCase) ||
        course.nameschool?.toLowerCase().includes(lowerCase) ||
        course.namecourse?.toLowerCase().includes(lowerCase),
    );
  }, [courses, searchTerm]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setAuthError(false);
    fetchCourses(false);
  }, [fetchCourses]);

  const renderCourse = ({ item }: { item: Course }) => {
    const renderRightActions = () => (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          activeOpacity={0.85}
          onPress={() => router.push(`/flashcards/course/${item.course_id}/edit`)}
        >
          <Text style={styles.actionText}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          activeOpacity={0.85}
          onPress={() => {
            Alert.alert('Xóa khóa học', `Bạn có chắc muốn xóa "${item.title}"?`, [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                  if (!token) return;
                  try {
                    const res = await fetch(getCourseDetailUrl(item.course_id), {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) throw new Error('Failed to delete');
                    // Refresh list
                    fetchCourses(false);
                  } catch (e) {
                    console.error('Delete course failed', e);
                    Alert.alert('Lỗi', 'Không thể xóa khóa học. Vui lòng thử lại.');
                  }
                },
              },
            ]);
          }}
        >
          <Text style={styles.actionText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <View style={styles.swipeWrapper}>
        <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push(`/flashcards/course/${item.course_id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.created_at ? (
                <Text style={styles.cardDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
            <Text style={styles.cardDescription} numberOfLines={3}>
              {item.description}
            </Text>
            <View style={styles.cardMeta}>
              {item.nameschool ? (
                <Text style={styles.metaText}>🏫 {item.nameschool}</Text>
              ) : null}
              {item.namecourse ? (
                <Text style={styles.metaText}>📘 {item.namecourse}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    );
  };

  if (authLoading || (!token && !authLoading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.centerText}>
          {authLoading ? 'Đang kiểm tra phiên đăng nhập...' : 'Bạn cần đăng nhập để xem flashcards.'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Flashcards</Text>
          <Text style={styles.subtitle}>Quản lý khóa học và thẻ học hiệu quả</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.9}
          onPress={() => router.push('/flashcards/create')}
        >
          <Text style={styles.createButtonText}>＋ Tạo khóa học</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm khóa học..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholderTextColor="#9ca3af"
      />

      {authError ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>
            Bạn chưa được cấp quyền xem Flashcards hoặc phiên đăng nhập đã hết hạn. Vui lòng tải lại
            sau hoặc liên hệ quản trị viên.
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.centerText}>Đang tải danh sách khóa học...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={item => `${item.course_id}`}
          renderItem={renderCourse}
          contentContainerStyle={filteredCourses.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Chưa có khóa học nào</Text>
              <Text style={styles.emptyDescription}>
                Hãy bắt đầu bằng cách tạo một khóa học flashcard mới!
              </Text>
            </View>
          }
        />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f5ff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f4f5ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
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
  swipeWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 8,
    backgroundColor: '#f4f5ff',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginVertical: 10,
    borderRadius: 10,
    height: '85%',
    minWidth: 72,
  },
  editButton: {
    backgroundColor: '#e0e7ff',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  actionText: {
    color: '#111827',
    fontWeight: '700',

  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#4b5563',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  listContent: {
    paddingBottom: 32,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

