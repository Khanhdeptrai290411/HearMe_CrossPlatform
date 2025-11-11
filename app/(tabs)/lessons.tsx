import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Lesson from "../../components/Lesson";
import { API_CONFIG, getApiUrl } from "../../constants/config";
import React, { useEffect as useEffectReact } from "react";
import { useFocusEffect } from "expo-router";

// Quiet logs in production
const DEBUG_LOG = false;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isWeb = Platform.OS === 'web';

interface LessonData {
  id: number;
  name: string;
  path: string;
}

interface Roadmap {
  [key: string]: LessonData[];
}

interface SelectedLesson extends LessonData {
  chapterName: string;
  lessonIndex: number;
  modelId: number;
  fullChapterName: string;
}

export default function LessonsScreen() {
  const [roadmap, setRoadmap] = useState<Roadmap>({});
  const [expandedChapter, setExpandedChapter] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<SelectedLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false); // Sidebar ẩn trên iPad

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy roadmap từ backend
        DEBUG_LOG && console.log("Fetching roadmap from:", getApiUrl(API_CONFIG.ENDPOINTS.ROADMAP));
        const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ROADMAP));
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setRoadmap(data);
        

        // Lấy danh sách bài học đã hoàn thành
        const token = await AsyncStorage.getItem('token');
        DEBUG_LOG && console.log("Token from AsyncStorage:", token ? "Found" : "Not found");
        
        const userStr = await AsyncStorage.getItem('user');
        DEBUG_LOG && console.log("User data from AsyncStorage:", userStr);
        
        if (token) {
          let user;
          try {
            user = userStr ? JSON.parse(userStr) : null;
            DEBUG_LOG && console.log("Parsed user data:", user);
          } catch (parseError) {
            console.error("Error parsing user data:", parseError);
            await AsyncStorage.removeItem('user');
            return;
          }
          
          if (user && user.id) {
            DEBUG_LOG && console.log("Fetching progress for user ID:", user.id);
            try {
              const progressUrl = getApiUrl(`${API_CONFIG.ENDPOINTS.USER_PROGRESS}/${user.id}`);
              DEBUG_LOG && console.log("Fetching progress from:", progressUrl);
              const progressResponse = await fetch(progressUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });
            
              DEBUG_LOG && console.log("Progress response status:", progressResponse.status);
              const responseText = await progressResponse.text();
              DEBUG_LOG && console.log("Raw response:", responseText);
              
              if (progressResponse.ok) {
                try {
                  const completedVideoIds = JSON.parse(responseText);
                  DEBUG_LOG && console.log("Raw completed video IDs:", completedVideoIds);
                  const normalizedIds = completedVideoIds.map((id: any) => String(id));
                  DEBUG_LOG && console.log("Completed video IDs (normalized):", normalizedIds);
                  setCompletedLessons(normalizedIds);
                } catch (parseError) {
                  console.error("Error parsing response:", parseError);
                }
              } else {
                console.error("Error response:", responseText);
              }
            } catch (fetchError) {
              console.error("Error fetching progress:", fetchError);
            }
          } else {
            DEBUG_LOG && console.log("No valid user data in AsyncStorage");
          }
        } else {
          DEBUG_LOG && console.log("No token found - user not logged in");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Điều hướng từ Thư viện: nếu có từ khóa cần học thì tự chọn bài tương ứng
  const selectFromDictionary = async () => {
    try {
      const word = await AsyncStorage.getItem('dictionarySearchWord');
      const videoFile = await AsyncStorage.getItem('dictionaryVideoFile');
      if (!word && !videoFile) return;
      if (Object.keys(roadmap).length === 0) return;
      const target = (word ?? '').trim().toUpperCase();
      const targetFile = (videoFile ?? '').trim();
      let found: { chapterName: string; lesson: LessonData; index: number } | null = null;
      for (const [chapterName, lessons] of Object.entries(roadmap)) {
        const idx = lessons.findIndex(l => {
          const byName =
            target.length > 0 &&
            (l.name?.toUpperCase() === target || l.name?.toUpperCase().includes(target));
          const byFile =
            targetFile.length > 0 && typeof l.path === 'string' && l.path.endsWith(targetFile);
          return byName || byFile;
        });
        if (idx !== -1) {
          found = { chapterName, lesson: lessons[idx], index: idx + 1 };
          break;
        }
      }
      if (found) {
        handleLessonSelect(found.lesson, found.chapterName, found.index);
        setExpandedChapter(found.chapterName);
      }
      await AsyncStorage.removeItem('dictionarySearchWord');
      await AsyncStorage.removeItem('dictionaryVideoFile');
    } catch {}
  };

  useEffectReact(() => {
    const run = async () => {
      try {
        await selectFromDictionary();
      } catch {}
    };
    run();
  }, [roadmap]);

  // Cũng kiểm tra mỗi lần màn hình Lessons được focus (đi từ Thư viện qua lần 2+)
  useFocusEffect(
    React.useCallback(() => {
      selectFromDictionary();
      return () => {};
    }, [roadmap])
  );

  // Cập nhật progress định kỳ
  useEffect(() => {
    const updateProgress = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        let user;
        try {
          user = userStr ? JSON.parse(userStr) : null;
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          await AsyncStorage.removeItem('user');
          return;
        }
      
        if (token && user?.id) {
          // Silently fetch progress update every 5 seconds
          
          const progressUrl = getApiUrl(`${API_CONFIG.ENDPOINTS.USER_PROGRESS}/${user.id}`);
          const progressResponse = await fetch(progressUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          const responseText = await progressResponse.text();
          
          if (progressResponse.ok) {
            try {
              const completedVideoIds = JSON.parse(responseText);
              
              if (Array.isArray(completedVideoIds)) {
                const normalizedIds = completedVideoIds.map((id: any) => String(id));
                
                setCompletedLessons(prev => {
                  const prevIds = new Set(prev);
                  const newIds = new Set(normalizedIds);
                  
                  const hasChanges = prevIds.size !== newIds.size || 
                    [...prevIds].some(id => !newIds.has(id)) ||
                    [...newIds].some(id => !prevIds.has(id));
                    
                  if (hasChanges) {
                    console.log("Updating state with new values:", normalizedIds);
                    return normalizedIds;
                  }
                  return prev;
                });
              }
            } catch (parseError) {
              console.error("Error parsing response:", parseError);
            }
          }
        }
      } catch (error) {
        console.error("Network or other error:", error);
      }
    };

    const interval = setInterval(updateProgress, 5000);
    updateProgress();
    
    return () => clearInterval(interval);
  }, []);

  const toggleChapter = (chapter: string) => {
    setExpandedChapter((prev) => (prev === chapter ? "" : chapter));
  };

  const handleLessonSelect = (lesson: LessonData, chapterName: string, lessonIndex: number) => {
    console.log("Selecting lesson:", { lesson, chapterName, lessonIndex });
    const [modelId] = chapterName.split('-');
    
    setSelectedLesson({
      ...lesson,
      chapterName: chapterName.split('-')[1] || chapterName,
      lessonIndex,
      modelId: parseInt(modelId),
      fullChapterName: chapterName
    });
    setExpandedChapter(chapterName);
  };

  const handleNextLesson = (currentChapter: string, nextLessonIndex: number) => {
    console.log("handleNextLesson called with chapter:", currentChapter, "lesson index:", nextLessonIndex);
    
    const chapters = Object.entries(roadmap).sort((a, b) => {
      const [modelIdA] = a[0].split('-');
      const [modelIdB] = b[0].split('-');
      const modelCompare = parseInt(modelIdA) - parseInt(modelIdB);
      if (modelCompare !== 0) return modelCompare;
      return a[0].localeCompare(b[0]);
    });
    
    if (chapters.length === 0) {
      console.log("Roadmap is empty");
      return;
    }

    const currentChapterEntry = chapters.find(([name]) => name === currentChapter);
    if (!currentChapterEntry) {
      console.log("Chapter not found:", currentChapter);
      return;
    }

    const [chapterName, lessons] = currentChapterEntry;

    if (nextLessonIndex <= lessons.length) {
      console.log("Moving to lesson", nextLessonIndex, "in chapter", chapterName);
      const lesson = lessons[nextLessonIndex - 1];
      if (!lesson) {
        console.log("Lesson not found");
        return;
      }

      const [modelId] = chapterName.split('-');

      setSelectedLesson({
        ...lesson,
        chapterName: chapterName.split('-')[1] || chapterName,
        lessonIndex: nextLessonIndex,
        modelId: parseInt(modelId),
        fullChapterName: chapterName
      });
      setExpandedChapter(chapterName);
      return;
    }

    const currentIndex = chapters.indexOf(currentChapterEntry);
    if (currentIndex < chapters.length - 1) {
      const [nextChapterName, nextChapterLessons] = chapters[currentIndex + 1];
      
      if (nextChapterLessons.length > 0) {
        console.log("Starting first lesson of chapter", nextChapterName);
        const [modelId] = nextChapterName.split('-');
        
        const firstLesson = nextChapterLessons[0];
        setSelectedLesson({
          ...firstLesson,
          chapterName: nextChapterName.split('-')[1] || nextChapterName,
          lessonIndex: 1,
          modelId: parseInt(modelId),
          fullChapterName: nextChapterName
        });
        setExpandedChapter(nextChapterName);
      }
    } else {
      console.log("Completed all lessons!");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    <View style={styles.container}>
      {/* Hamburger button - chỉ hiện khi sidebar ẩn */}
      {isTablet && !sidebarVisible && (
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
      )}

      {/* Sidebar - mobile: ẩn khi có selectedLesson, iPad: chỉ hiện khi sidebarVisible */}
      {(!isTablet && !selectedLesson) || (isTablet && sidebarVisible) ? (
        <>
          {/* Backdrop cho iPad */}
          {isTablet && sidebarVisible && (
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => setSidebarVisible(false)}
            />
          )}
          <ScrollView style={[
            styles.sidebar,
            isTablet && styles.sidebarTabletOverlay
          ]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Lộ Trình Học</Text>
              {isTablet && (
                <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
        {Object.entries(roadmap).map(([chapter, lessons]) => {
          const displayName = chapter.split('-')[1] || chapter;
          
          const completedInChapter = lessons.filter(lesson => 
            completedLessons.includes(String(lesson.id))
          ).length;
          
          return (
            <View key={chapter} style={styles.chapterContainer}>
              <TouchableOpacity
                style={styles.chapterButton}
                onPress={() => toggleChapter(chapter)}
              >
                <Text style={styles.chapterTitle}>{displayName}</Text>
                <View style={styles.chapterInfo}>
                  <Text style={styles.progressText}>
                    {completedInChapter}/{lessons.length}
                  </Text>
                  <Text style={styles.expandIcon}>
                    {expandedChapter === chapter ? "▼" : "▶"}
                  </Text>
                </View>
              </TouchableOpacity>
              {expandedChapter === chapter && (
                <View style={styles.lessonsList}>
                  {lessons.map((lesson, idx) => {
                    const isCompleted = completedLessons.includes(String(lesson.id));
                    const isSelected = selectedLesson?.path === lesson.path;
                    
                    return (
                      <TouchableOpacity
                        key={lesson.path}
                        style={[
                          styles.lessonItem,
                          isSelected && styles.lessonItemSelected,
                          isCompleted && !isSelected && styles.lessonItemCompleted
                        ]}
                        onPress={() => handleLessonSelect(lesson, chapter, idx + 1)}
                      >
                        <Text style={[
                          styles.lessonText,
                          isSelected && styles.lessonTextSelected,
                          isCompleted && !isSelected && styles.lessonTextCompleted
                        ]}>
                          {lesson.name}
                        </Text>
                        {isCompleted && (
                          <Text style={[
                            styles.checkmark,
                            isSelected && styles.checkmarkSelected
                          ]}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
        </ScrollView>
        </>
      ) : null}

      {/* Main Content */}
      <View
        style={[
          styles.mainContent,
          selectedLesson && styles.mainContentFullWidth,
          !isTablet && !selectedLesson && styles.mainContentHiddenMobile,
        ]}
      >
        {selectedLesson ? (
          <>
            {/* Nút Back cho mobile */}
            {!isTablet && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setSelectedLesson(null)}
              >
                <Text style={styles.backButtonText}>← Quay lại</Text>
              </TouchableOpacity>
            )}
            
            <Lesson
            lessonPath={selectedLesson.path}
            lessonName={selectedLesson.name}
            apiLessonPath={selectedLesson.path}
            lessonInfo={{
              modelId: selectedLesson.modelId,
              chapterName: selectedLesson.chapterName,
              fullChapterName: selectedLesson.fullChapterName,
              lesson: selectedLesson.lessonIndex,
              totalLessonsInChapter: roadmap[selectedLesson.fullChapterName]?.length || 0,
              totalChapters: Object.keys(roadmap).length,
            }}
            onNextLesson={handleNextLesson}
            />
          </>
        ) : isTablet ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeIcon}>📚</Text>
            <Text style={styles.welcomeTitle}>Chào mừng bạn!</Text>
            <Text style={styles.welcomeText}>
              Hãy chọn một chương và bài học từ thanh bên trái để bắt đầu hành trình học tập của bạn.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    flexDirection: isTablet ? 'row' : 'column',
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6366f1',
  },
  // Hamburger button
  hamburgerButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 9999,
    backgroundColor: '#6366f1',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // Backdrop overlay
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  // Sidebar
  sidebar: {
    width: isTablet ? 320 : SCREEN_WIDTH,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarTabletOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    zIndex: 1000,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4338ca',
  },
  closeButton: {
    fontSize: 28,
    color: '#6366f1',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  chapterContainer: {
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  chapterButton: {
    backgroundColor: '#c7d2fe',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3730a3',
    flex: 1,
  },
  chapterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#4f46e5',
  },
  expandIcon: {
    fontSize: 12,
    color: '#3730a3',
  },
  lessonsList: {
    backgroundColor: '#e0e7ff',
    padding: 8,
  },
  lessonItem: {
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 6,
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonItemSelected: {
    backgroundColor: '#818cf8',
  },
  lessonItemCompleted: {
    backgroundColor: '#bbf7d0',
  },
  lessonText: {
    fontSize: 14,
    color: '#1e1b4b',
  },
  lessonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  lessonTextCompleted: {
    color: '#166534',
  },
  checkmark: {
    fontSize: 18,
    color: '#16a34a',
  },
  checkmarkSelected: {
    color: '#ffffff',
  },
  mainContent: {
    flex: 1,
    padding: isTablet ? 12 : 8,
    width: '100%',
  },
  mainContentFullWidth: {
    flex: 1,
    width: '100%',
  },
  mainContentHiddenMobile: {
    display: 'none',
    height: 0,
    padding: 0,
    margin: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 24,
  },
});

