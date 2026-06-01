import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Animated } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Lesson from "../../components/Lesson";
import { API_CONFIG, getApiUrl } from "../../constants/config";
import React, { useEffect as useEffectReact, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { NB } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import BrutalProgress from "@/components/ui/ds/ProgressBar";
import BrutalLoader from "@/components/ui/ds/PageLoader";
import BrutalButton from "@/components/ui/ds/Button";
import BrutalCard from "@/components/ui/ds/Card";
import BrutalBadge from "@/components/ui/ds/Badge";
import BrutalIcon from "@/components/ui/ds/BrutalIcon";
import PageHeader from "@/components/ui/ds/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

const DEBUG_LOG = false;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isWeb = Platform.OS === 'web';

interface LessonData {
  id: number;
  name: string;
  path: string;
}
interface Roadmap { [key: string]: LessonData[]; }
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const sidebarAnim = useRef(new Animated.Value(-320)).current;

  const showSidebar = () => {
    setSidebarVisible(true);
    Animated.spring(sidebarAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  };
  const hideSidebar = () => {
    Animated.spring(sidebarAnim, { toValue: -320, useNativeDriver: true, tension: 80, friction: 12 }).start(() => {
      setSidebarVisible(false);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ROADMAP));
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setRoadmap(data);

        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        if (token) {
          let u;
          try { u = userStr ? JSON.parse(userStr) : null; } catch { await AsyncStorage.removeItem('user'); return; }
          if (u?.id) {
            try {
              const progressUrl = getApiUrl(`${API_CONFIG.ENDPOINTS.USER_PROGRESS}/${u.id}`);
              const progressResponse = await fetch(progressUrl, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
              });
              const responseText = await progressResponse.text();
              if (progressResponse.ok) {
                const completedVideoIds = JSON.parse(responseText);
                setCompletedLessons(completedVideoIds.map((id: any) => String(id)));
              }
            } catch (e) { DEBUG_LOG && console.error(e); }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          const byName = target.length > 0 && (l.name?.toUpperCase() === target || l.name?.toUpperCase().includes(target));
          const byFile = targetFile.length > 0 && typeof l.path === 'string' && l.path.endsWith(targetFile);
          return byName || byFile;
        });
        if (idx !== -1) { found = { chapterName, lesson: lessons[idx], index: idx + 1 }; break; }
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
    const run = async () => { try { await selectFromDictionary(); } catch {} };
    run();
  }, [roadmap]);

  useFocusEffect(
    React.useCallback(() => {
      selectFromDictionary();
      return () => {};
    }, [roadmap])
  );

  useEffect(() => {
    const updateProgress = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        let u;
        try { u = userStr ? JSON.parse(userStr) : null; } catch { await AsyncStorage.removeItem('user'); return; }
        if (token && u?.id) {
          const progressUrl = getApiUrl(`${API_CONFIG.ENDPOINTS.USER_PROGRESS}/${u.id}`);
          const progressResponse = await fetch(progressUrl, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
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
                    [...prevIds].some(id => !newIds.has(id)) || [...newIds].some(id => !prevIds.has(id));
                  return hasChanges ? normalizedIds : prev;
                });
              }
            } catch {}
          }
        }
      } catch {}
    };
    const interval = setInterval(updateProgress, 5000);
    updateProgress();
    return () => clearInterval(interval);
  }, []);

  const toggleChapter = (chapter: string) => {
    setExpandedChapter((prev) => (prev === chapter ? "" : chapter));
  };

  const handleLessonSelect = (lesson: LessonData, chapterName: string, lessonIndex: number) => {
    const [modelId] = chapterName.split('-');
    setSelectedLesson({
      ...lesson,
      chapterName: chapterName.split('-')[1] || chapterName,
      lessonIndex,
      modelId: parseInt(modelId),
      fullChapterName: chapterName,
    });
    setExpandedChapter(chapterName);
  };

  const handleNextLesson = (currentChapter: string, nextLessonIndex: number) => {
    const chapters = Object.entries(roadmap).sort((a, b) => {
      const [modelIdA] = a[0].split('-'); const [modelIdB] = b[0].split('-');
      const modelCompare = parseInt(modelIdA) - parseInt(modelIdB);
      return modelCompare !== 0 ? modelCompare : a[0].localeCompare(b[0]);
    });
    if (!chapters.length) return;
    const currentChapterEntry = chapters.find(([name]) => name === currentChapter);
    if (!currentChapterEntry) return;
    const [chapterName, lessons] = currentChapterEntry;
    if (nextLessonIndex <= lessons.length) {
      const lesson = lessons[nextLessonIndex - 1];
      if (!lesson) return;
      const [modelId] = chapterName.split('-');
      setSelectedLesson({ ...lesson, chapterName: chapterName.split('-')[1] || chapterName, lessonIndex: nextLessonIndex, modelId: parseInt(modelId), fullChapterName: chapterName });
      setExpandedChapter(chapterName);
      return;
    }
    const currentIndex = chapters.indexOf(currentChapterEntry);
    if (currentIndex < chapters.length - 1) {
      const [nextChapterName, nextChapterLessons] = chapters[currentIndex + 1];
      if (nextChapterLessons.length > 0) {
        const [modelId] = nextChapterName.split('-');
        setSelectedLesson({ ...nextChapterLessons[0], chapterName: nextChapterName.split('-')[1] || nextChapterName, lessonIndex: 1, modelId: parseInt(modelId), fullChapterName: nextChapterName });
        setExpandedChapter(nextChapterName);
      }
    }
  };

  // Total progress
  const totalLessons = Object.values(roadmap).reduce((s, ls) => s + ls.length, 0);
  const totalCompleted = completedLessons.length;
  const overallProgress = totalLessons > 0 ? totalCompleted / totalLessons : 0;

  // Find first incomplete lesson
  const firstIncomplete = (() => {
    for (const [ch, lessons] of Object.entries(roadmap)) {
      for (let i = 0; i < lessons.length; i++) {
        if (!completedLessons.includes(String(lessons[i].id))) {
          return { lesson: lessons[i], chapter: ch, index: i + 1 };
        }
      }
    }
    return null;
  })();

  if (loading) return <BrutalLoader />;

  const SidebarContent = () => (
    <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sidebarHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sidebarTitle}>{t('lessons.title')}</Text>
          <Text style={styles.sidebarSubtitle}>{totalCompleted}/{totalLessons} {t('lessons.subtitle')}</Text>
        </View>
        {isTablet && (
          <TouchableOpacity onPress={hideSidebar} style={styles.closeBtn}>
            <BrutalIcon name="close" size={16} color={NB.color.text} />
          </TouchableOpacity>
        )}
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <BrutalProgress progress={overallProgress} height={6} showPercent />
      </View>

      {Object.entries(roadmap).map(([chapter, lessons]) => {
        const displayName = chapter.split('-')[1] || chapter;
        const completedInChapter = lessons.filter(l => completedLessons.includes(String(l.id))).length;
        const chapterProgress = lessons.length > 0 ? completedInChapter / lessons.length : 0;
        const isExpanded = expandedChapter === chapter;

        return (
          <View key={chapter} style={[styles.chapterWrap, isExpanded && styles.chapterWrapExpanded]}>
            <TouchableOpacity style={styles.chapterBtn} onPress={() => toggleChapter(chapter)} activeOpacity={0.8}>
              <View style={styles.chapterBtnLeft}>
                <Text style={styles.chapterTitle}>{displayName}</Text>
                <BrutalProgress progress={chapterProgress} height={4} style={{ marginTop: 6 }} color={NB.color.accent} />
              </View>
              <View style={styles.chapterBtnRight}>
                <BrutalBadge label={`${completedInChapter}/${lessons.length}`} variant="secondary" />
                <Text style={styles.chapterArrow}>{isExpanded ? '▼' : '▶'}</Text>
              </View>
            </TouchableOpacity>

            {isExpanded && (
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
                      onPress={() => { handleLessonSelect(lesson, chapter, idx + 1); if (isTablet) hideSidebar(); }}
                      activeOpacity={0.85}
                    >
                      <View style={[
                        styles.lessonStatusIcon,
                        isSelected && styles.statusIconSelected,
                        isCompleted && !isSelected && styles.statusIconCompleted
                      ]}>
                        {isCompleted
                          ? <BrutalIcon name="check" size={12} color={isSelected ? '#FFFFFF' : '#00C2A8'} strokeWidth={3} />
                          : <Text style={[styles.statusTextDot, isSelected && { color: '#FFFFFF' }]}>○</Text>
                        }
                      </View>
                      <Text
                        style={[
                          styles.lessonText,
                          isSelected && styles.lessonTextSelected,
                          isCompleted && !isSelected && styles.lessonTextCompleted
                        ]}
                        numberOfLines={1}
                      >
                        {lesson.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Hamburger FAB */}
        {isTablet && !sidebarVisible && (
          <TouchableOpacity style={styles.fab} onPress={showSidebar} activeOpacity={0.88}>
            <BrutalIcon name="menu" size={24} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Sidebar — mobile: always visible if no lesson selected */}
        {(!isTablet && !selectedLesson) ? (
          <View style={styles.sidebarFixed}>
            <SidebarContent />
          </View>
        ) : null}

        {/* Sidebar overlay — tablet */}
        {isTablet && sidebarVisible && (
          <>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={hideSidebar} />
            <Animated.View style={[styles.sidebarOverlay, { transform: [{ translateX: sidebarAnim }] }]}>
              <SidebarContent />
            </Animated.View>
          </>
        )}

        {/* Main Content */}
        <View style={[styles.main, !isTablet && !selectedLesson && styles.mainHidden]}>
          {selectedLesson ? (
            <>
              {!isTablet && (
                <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedLesson(null)} activeOpacity={0.8}>
                  <Text style={styles.backBtnText}>{t('lessons.backToRoadmap')}</Text>
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
            /* Welcome dashboard */
            <View style={styles.welcomeWrap}>
              <Text style={styles.welcomeGreet}>
                {t('lessons.welcome')}{user?.fullName ? `, ${user.fullName.split(' ').pop()}` : ''}! 👋
              </Text>
              <Text style={styles.welcomeTitle}>{t('lessons.selectLesson')}</Text>
              
              <BrutalCard style={styles.welcomeProgressCard}>
                <BrutalProgress
                  progress={overallProgress}
                  label={t('lessons.progressCardTitle')}
                  showPercent
                  height={12}
                />
                <Text style={styles.welcomeProgressNote}>
                  {t('lessons.overallProgressNote', { completed: totalCompleted, total: totalLessons })}
                </Text>
              </BrutalCard>

              {firstIncomplete && (
                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={() => handleLessonSelect(firstIncomplete.lesson, firstIncomplete.chapter, firstIncomplete.index)}
                  activeOpacity={0.9}
                >
                  <View style={styles.continueBtnContent}>
                    <BrutalIcon name="play" size={24} color="#FFF" />
                    <View style={styles.continueBtnTextWrap}>
                      <Text style={styles.continueBtnLabel}>{t('lessons.continueLearning')}</Text>
                      <Text style={styles.continueBtnSub}>{firstIncomplete.lesson.name}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              <BrutalCard style={styles.hintCard} color={NB.color.secondaryLight}>
                <View style={styles.hintContent}>
                  <BrutalIcon name="menu" size={20} color={NB.color.text} />
                  <Text style={styles.hintText}>{t('lessons.selectLessonHint')}</Text>
                </View>
              </BrutalCard>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: NB.color.bg },
  container: { flex: 1, flexDirection: isTablet ? 'row' : 'column', backgroundColor: NB.color.bg },

  // FAB
  fab: {
    position: 'absolute', top: 20, left: 20, zIndex: 200,
    width: 52, height: 52, borderRadius: NB.radius.sm,
    backgroundColor: NB.color.primary,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center', alignItems: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '4px 4px 0px #111111' } : {}),
  },

  // Backdrop
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,17,17,0.4)', zIndex: 150 },

  // Sidebar — fixed (mobile)
  sidebarFixed: {
    width: '100%',
    flex: 1,
    backgroundColor: NB.color.surface,
  },
  // Sidebar — overlay (tablet)
  sidebarOverlay: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: 320, zIndex: 160,
    backgroundColor: NB.color.surface,
    borderRightWidth: NB.border.thick,
    borderRightColor: NB.color.border,
    ...(Platform.OS === 'web' ? { boxShadow: '5px 0 0px #111111' } : {}),
  },
  sidebarScroll: { flex: 1, backgroundColor: NB.color.bg },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  sidebarTitle: { fontSize: 20, fontWeight: '900', color: NB.color.text },
  sidebarSubtitle: { fontSize: 13, color: NB.color.muted, fontWeight: '700', marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: NB.radius.sm,
    backgroundColor: NB.color.mutedBg,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center', alignItems: 'center',
  },

  // Chapter
  chapterWrap: {
    backgroundColor: NB.color.surface,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: NB.radius.md,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { boxShadow: '3px 3px 0px #111111' } : {}),
  },
  chapterWrapExpanded: {
    backgroundColor: NB.color.surface,
  },
  chapterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  chapterBtnLeft: { flex: 1 },
  chapterTitle: { fontSize: 15, fontWeight: '900', color: NB.color.text },
  chapterBtnRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chapterArrow: { fontSize: 14, color: NB.color.text, fontWeight: '900' },

  // Lessons list
  lessonsList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
    borderTopWidth: NB.border.thin,
    borderTopColor: NB.color.border,
    paddingTop: 12,
    backgroundColor: NB.color.bg,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    backgroundColor: NB.color.surface,
    gap: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 0px #111111' } : {}),
  },
  lessonItemSelected: {
    backgroundColor: NB.color.primary,
  },
  lessonItemCompleted: {
    backgroundColor: NB.color.accentLight,
  },
  lessonStatusIcon: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    backgroundColor: NB.color.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  statusIconSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: NB.color.primary,
  },
  statusIconCompleted: {
    borderColor: NB.color.border,
    backgroundColor: NB.color.accent,
  },
  statusTextDot: {
    fontSize: 10,
    fontWeight: '800',
    color: NB.color.muted,
  },
  lessonText: { flex: 1, fontSize: 14, fontWeight: '700', color: NB.color.text },
  lessonTextSelected: { color: '#FFFFFF', fontWeight: '900' },
  lessonTextCompleted: { color: NB.color.text },

  // Main
  main: { flex: 1, backgroundColor: NB.color.bg },
  mainHidden: { display: 'none' },

  // Back button (mobile)
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: NB.color.surface,
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    alignSelf: 'flex-start',
    ...(Platform.OS === 'web' ? { boxShadow: '3px 3px 0px #111111' } : {}),
  },
  backBtnText: { color: NB.color.text, fontWeight: '900', fontSize: 14 },

  // Welcome dashboard
  welcomeWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 24,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeGreet: { fontSize: 16, color: NB.color.primary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  welcomeTitle: { fontSize: 32, fontWeight: '900', color: NB.color.text, textAlign: 'center', letterSpacing: -0.5 },
  welcomeProgressCard: {
    width: '100%',
    gap: 12,
  },
  welcomeProgressNote: { fontSize: 13, color: NB.color.muted, fontWeight: '700', textAlign: 'right' },
  continueBtn: {
    width: '100%',
    backgroundColor: NB.color.primary,
    borderRadius: NB.radius.md,
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    padding: 20,
    ...(Platform.OS === 'web' ? { boxShadow: '6px 6px 0px #111111', cursor: 'pointer' } : {}),
  },
  continueBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  continueBtnTextWrap: {
    flex: 1,
  },
  continueBtnLabel: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  continueBtnSub: { fontSize: 14, color: '#EBEBFF', fontWeight: '700', marginTop: 2 },
  hintCard: {
    width: '100%',
    borderRadius: NB.radius.sm,
  },
  hintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hintText: { fontSize: 13, color: NB.color.text, fontWeight: '700', flex: 1 },
});
