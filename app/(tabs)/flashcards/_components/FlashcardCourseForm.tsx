import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import {
  API_CONFIG,
  getApiUrl,
  getCourseCreateUrl,
  getCourseDetailUrl,
  getCourseQuizzesUrl,
  getQuizDetailUrl,
} from '@/constants/config';
import { FlashcardCourse, FlashcardQuiz } from './types';

type FlashcardCourseFormProps = {
  mode: 'create' | 'edit';
  courseId?: string;
};

const EMPTY_COURSE: FlashcardCourse = {
  title: '',
  description: '',
  nameschool: '',
  namecourse: '',
  quizzes: [],
};

const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv'];

const isVideoFileName = (filename?: string | null) => {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  return videoExtensions.some(ext => lower.endsWith(ext));
};

const getMediaUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('uploads/') ? path : `uploads/${path}`;
  return `${API_CONFIG.BASE_URL}/public/${cleanPath}`;
};

const PreviewVideo = ({ uri, style }: { uri: string; style: any }) => {
  const player = useVideoPlayer(uri);
  return (
    <VideoView
      player={player}
      style={style}
      nativeControls
      contentFit="contain"
    />
  );
};

const createMediaObject = (asset: ImagePicker.ImagePickerAsset) => {
  const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? `media-${Date.now()}`;
  const type =
    asset.type === 'video'
      ? asset.mimeType ?? 'video/mp4'
      : asset.mimeType ?? 'image/jpeg';

  return {
    uri: asset.uri,
    name: fileName,
    type,
  };
};

export function FlashcardCourseForm({ mode, courseId }: FlashcardCourseFormProps) {
  const { token, signOut } = useAuth();
  const router = useRouter();

  const isEditing = mode === 'edit' && Boolean(courseId);

  const [formData, setFormData] = useState<FlashcardCourse>(EMPTY_COURSE);
  const [deletedQuizIds, setDeletedQuizIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasMediaPermission(status === 'granted');
    };
    checkPermissions();
  }, []);

  useEffect(() => {
    if (isEditing && courseId && token) {
      const fetchCourse = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(getCourseDetailUrl(courseId), {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to load course ${response.status}`);
          }

          const data = await response.json();
          if (data) {
            setFormData({
              course_id: data.course_id,
              title: data.title ?? '',
              description: data.description ?? '',
              nameschool: data.nameschool ?? '',
              namecourse: data.namecourse ?? '',
              quizzes: (data.quizzes ?? []).map((quiz: any) => ({
                quizzes_id: quiz.quizzes_id,
                definition: quiz.definition ?? '',
                mota: quiz.mota ?? '',
                image: quiz.image ?? null,
              })),
            });
          }
        } catch (error) {
          console.error('Failed to fetch course', error);
          Alert.alert('Lỗi', 'Không thể tải dữ liệu khóa học. Vui lòng thử lại.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchCourse();
    }
  }, [courseId, isEditing, token]);

  const handleInputChange = useCallback((name: keyof FlashcardCourse, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleQuizChange = useCallback((index: number, field: keyof FlashcardQuiz, value: string) => {
    setFormData(prev => {
      const quizzes = [...prev.quizzes];
      const target = quizzes[index] ?? {
        definition: '',
        mota: '',
      };
      quizzes[index] = {
        ...target,
        [field]: value,
        isModified: true,
      };
      return {
        ...prev,
        quizzes,
      };
    });
  }, []);

  const handleAddQuiz = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      quizzes: [
        ...prev.quizzes,
        { definition: '', mota: '', mediaFile: null, mediaType: null },
      ],
    }));
  }, []);

  const handleRemoveQuiz = useCallback(
    (index: number) => {
      setFormData(prev => {
        const quizzes = [...prev.quizzes];
        const removed = quizzes[index];

        if (removed?.quizzes_id) {
          setDeletedQuizIds(prevDeleted => [...prevDeleted, removed.quizzes_id!]);
        }

        quizzes.splice(index, 1);

        if (isEditing && quizzes.length === 0 && courseId) {
          Alert.alert(
            'Xóa khóa học?',
            'Bạn đã xóa tất cả flashcard. Bạn có muốn xóa luôn khóa học này không?',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Xóa khóa học',
                style: 'destructive',
                onPress: () => handleDeleteCourse(courseId),
              },
            ],
          );
        }

        return {
          ...prev,
          quizzes,
        };
      });
    },
    [courseId, isEditing],
  );

  const handlePickMedia = useCallback(
    async (index: number) => {
      if (hasMediaPermission === false) {
        Alert.alert('Thiếu quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện để chọn media.');
        return;
      }

      try {
        // Ensure permission (and upgrade from 'limited' if user just changed settings)
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Thiếu quyền truy cập', 'Vui lòng cấp quyền thư viện ảnh để chọn media.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          allowsMultipleSelection: false,
          selectionLimit: 1,
          quality: 1,
          // iOS reliability tweaks for videos (avoid failing exports/icloud)
          videoExportPreset: ImagePicker.VideoExportPreset.Passthrough,
          presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
          preferredAssetRepresentationMode:
            ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        } as ImagePicker.ImagePickerOptions as any);

        if (result.canceled || result.assets.length === 0) return;

        const asset = result.assets[0];
        const mediaFile = createMediaObject(asset);
        const mediaType = asset.type === 'video' ? 'video' : 'image';

        setFormData(prev => {
          const quizzes = [...prev.quizzes];
          const target = quizzes[index] ?? {
            definition: '',
            mota: '',
          };
          quizzes[index] = {
            ...target,
            mediaFile,
            mediaType,
            isModified: true,
          };

          return {
            ...prev,
            quizzes,
          };
        });
      } catch (error: any) {
        console.error('Failed to pick media', error);
        // Common iOS Photos error when asset is only in iCloud or not locally available
        const message =
          typeof error?.message === 'string' && error.message.includes('PHPhotosErrorDomain')
            ? 'Không thể truy cập video từ iCloud. Vui lòng mở video trong Ảnh để tải về máy rồi thử lại.'
            : 'Không thể chọn file này. Vui lòng thử lại hoặc chọn tệp khác.';
        Alert.alert('Lỗi', message);
      }
    },
    [],
  );

  const handleDeleteCourse = useCallback(
    async (targetCourseId: string | number) => {
      if (!token) return;

      try {
        setIsSubmitting(true);
        const response = await fetch(getCourseDetailUrl(targetCourseId), {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete course');
        }

        Alert.alert('Thành công', 'Đã xóa khóa học.');
        router.replace('/flashcards');
      } catch (error) {
        console.error('Failed to delete course', error);
        Alert.alert('Lỗi', 'Không thể xóa khóa học.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, token],
  );

  const handleSubmit = useCallback(async () => {
    if (!token) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và mô tả khóa học.');
      return;
    }

    if (formData.quizzes.length === 0) {
      Alert.alert('Thiếu flashcard', 'Vui lòng thêm ít nhất một flashcard.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Save or update course
      const courseUrl = isEditing ? getCourseDetailUrl(courseId!) : getCourseCreateUrl();
      const courseResponse = await fetch(courseUrl, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          nameschool: formData.nameschool,
          namecourse: formData.namecourse,
        }),
      });

      if (!courseResponse.ok) {
        const errorText = await courseResponse.text();
        let errorMessage = 'Failed to save course';
        
        if (courseResponse.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          console.warn('401 Unauthorized - Token may be expired');
        } else {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
        }
        
        console.error(`Failed to save course (${courseResponse.status}):`, errorMessage);
        throw new Error(errorMessage);
      }

      const savedCourse = await courseResponse.json();
      const savedCourseId = savedCourse?.course_id ?? courseId;

      // Delete removed quizzes
      await Promise.all(
        deletedQuizIds.map(async quizId => {
          try {
            const res = await fetch(getQuizDetailUrl(quizId), {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
              console.warn(`Failed to delete quiz ${quizId}`);
            }
          } catch (error) {
            console.warn(`Error deleting quiz ${quizId}`, error);
          }
        }),
      );

      // Create or update quizzes
      for (const quiz of formData.quizzes) {
        if (quiz.quizzes_id && !quiz.mediaFile && !quiz.isModified) {
          continue;
        }

        const quizFormData = new FormData();
        quizFormData.append('definition', quiz.definition);
        quizFormData.append('mota', quiz.mota);

        if (quiz.mediaFile) {
          quizFormData.append('media_file', quiz.mediaFile as any);
          quizFormData.append('media_type', quiz.mediaType ?? 'image');
        }

        const endpoint = quiz.quizzes_id
          ? getQuizDetailUrl(quiz.quizzes_id)
          : getCourseQuizzesUrl(savedCourseId);

        const method = quiz.quizzes_id ? 'PUT' : 'POST';

        const quizResponse = await fetch(endpoint, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: quizFormData,
        });

        if (!quizResponse.ok) {
          const errorText = await quizResponse.text();
          let errorMessage = `Failed to ${quiz.quizzes_id ? 'update' : 'create'} quiz`;
          
          if (quizResponse.status === 401) {
            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            console.warn('401 Unauthorized when saving quiz - Token may be expired');
          } else {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
          }
          
          console.error(`Failed to ${quiz.quizzes_id ? 'update' : 'create'} quiz (${quizResponse.status}):`, errorMessage);
          throw new Error(errorMessage);
        }
      }

      Alert.alert('Thành công', isEditing ? 'Đã cập nhật khóa học.' : 'Đã tạo khóa học mới.');
      router.replace('/flashcards');
    } catch (error: any) {
      console.error('Failed to save course', error);
      const errorMessage = error?.message || 'Không thể lưu khóa học. Vui lòng thử lại.';
      
      // Nếu là lỗi 401, đề xuất đăng nhập lại
      if (errorMessage.includes('hết hạn') || errorMessage.includes('401')) {
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục.',
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Đăng nhập lại',
              onPress: () => {
                signOut();
              },
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [courseId, deletedQuizIds, formData, isEditing, router, token]);

  const headerTitle = useMemo(
    () => (isEditing ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'),
    [isEditing],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.centerText}>Đang tải dữ liệu khóa học...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>{headerTitle}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Tiêu đề *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={value => handleInputChange('title', value)}
          placeholder="Ví dụ: ASL cơ bản"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Mô tả *</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={formData.description}
          onChangeText={value => handleInputChange('description', value)}
          placeholder="Mô tả tổng quan về khóa học"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.section, styles.rowItem]}>
          <Text style={styles.label}>Tên trường</Text>
          <TextInput
            style={styles.input}
            value={formData.nameschool ?? ''}
            onChangeText={value => handleInputChange('nameschool', value)}
            placeholder="Ví dụ: HearMe Academy"
          />
        </View>

        <View style={[styles.section, styles.rowItem]}>
          <Text style={styles.label}>Tên khóa học</Text>
          <TextInput
            style={styles.input}
            value={formData.namecourse ?? ''}
            onChangeText={value => handleInputChange('namecourse', value)}
            placeholder="Ví dụ: Khóa học cơ bản"
          />
        </View>
      </View>

      <View style={styles.flashcardHeader}>
        <Text style={styles.flashcardTitle}>Flashcards</Text>
      </View>

      {formData.quizzes.map((quiz, index) => (
        <View key={index} style={styles.flashcard}>
          <View style={styles.flashcardHeaderRow}>
            <Text style={styles.cardIndex}>Thẻ #{index + 1}</Text>
            <TouchableOpacity onPress={() => handleRemoveQuiz(index)} activeOpacity={0.7}>
              <Text style={styles.deleteText}>Xóa</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Từ khóa *</Text>
          <TextInput
            style={styles.input}
            value={quiz.definition}
            onChangeText={value => handleQuizChange(index, 'definition', value)}
            placeholder="Nội dung mặt trước"
          />

          <Text style={styles.label}>Giải thích *</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={quiz.mota}
            onChangeText={value => handleQuizChange(index, 'mota', value)}
            placeholder="Nội dung mặt sau"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={styles.mediaPicker}
            onPress={() => handlePickMedia(index)}
            activeOpacity={0.8}
          >
            <Text style={styles.mediaPickerText}>
              {quiz.mediaFile || quiz.image ? 'Thay đổi media' : 'Thêm hình ảnh hoặc video'}
            </Text>
          </TouchableOpacity>

          <View style={styles.previewContainer}>
            {quiz.mediaFile ? (
              quiz.mediaType === 'video' ? (
                <PreviewVideo uri={quiz.mediaFile.uri} style={styles.previewVideo} />
              ) : (
                <Image source={{ uri: quiz.mediaFile.uri }} style={styles.previewImage} />
              )
            ) : quiz.image ? (
              isVideoFileName(quiz.image) ? (
                <PreviewVideo uri={getMediaUrl(quiz.image)} style={styles.previewVideo} />
              ) : (
                <Image source={{ uri: getMediaUrl(quiz.image) }} style={styles.previewImage} />
              )
            ) : null}
          </View>
        </View>
      ))}

      {/* Spacer to avoid being covered by floating buttons */}
      <View style={{ height: 120 }} />

    </ScrollView>

    {/* Floating actions bottom-right */}
    <View style={styles.fabRow}>
      {isEditing && courseId ? (
        <TouchableOpacity
          style={[styles.fabButton, styles.fabDelete]}
          onPress={() =>
            Alert.alert(
              'Xóa khóa học',
              'Bạn có chắc chắn muốn xóa khóa học này?',
              [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xóa', style: 'destructive', onPress: () => handleDeleteCourse(courseId) },
              ],
            )
          }
          activeOpacity={0.85}
          disabled={isSubmitting}
        >
          <Text style={styles.fabDeleteText}>Xóa</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[styles.fabButton, styles.fabSecondary]}
        onPress={handleAddQuiz}
        activeOpacity={0.85}
        disabled={isSubmitting}
      >
        <Text style={styles.fabSecondaryText}>＋ Thêm thẻ</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fabButton, styles.fabSecondary]}
        onPress={() => router.back()}
        activeOpacity={0.85}
        disabled={isSubmitting}
      >
        <Text style={styles.fabSecondaryText}>Hủy</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fabButton, styles.fabPrimary]}
        onPress={handleSubmit}
        activeOpacity={0.9}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.fabPrimaryText}>{isEditing ? 'Lưu thay đổi' : 'Tạo khóa học'}</Text>
        )}
      </TouchableOpacity>
    </View>
    </View>
  );
}

export default FlashcardCourseForm;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f5ff',
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 1,
    backgroundColor: '#f4f5ff',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  flashcardHeader: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flashcardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  flashcard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  flashcardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIndex: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
  },
  deleteText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  mediaPicker: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  mediaPickerText: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: '#00000011',
  },
  previewVideo: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  fabRow: {
    position: 'absolute',
    right: 16,
    bottom: 35,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fabButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  fabSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  fabSecondaryText: {
    color: '#374151',
    fontWeight: '600',
  },
  fabPrimary: {
    backgroundColor: '#6366f1',
  },
  fabPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  fabDelete: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  fabDeleteText: {
    color: '#dc2626',
    fontWeight: '700',
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
});

