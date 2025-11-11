import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Platform, ScrollView } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, getApiUrl, getVideoUrl } from "../constants/config";

// Dynamic requires (avoid hard type deps)
let getThumbnailAsync: any;
try { getThumbnailAsync = require("expo-video-thumbnails").getThumbnailAsync; } catch {}
const FileSystemLegacy: any = (() => {
  try {
    return require("expo-file-system/legacy");
  } catch {
    return null;
  }
})();
const ExpoFileSystem: any = (() => {
  try {
    return require("expo-file-system");
  } catch {
    return null;
  }
})();

const readFileAsBase64 = async (uri: string): Promise<string | null> => {
  if (FileSystemLegacy?.readAsStringAsync) {
    return FileSystemLegacy.readAsStringAsync(uri, { encoding: 'base64' });
  }
  if (ExpoFileSystem?.readAsStringAsync) {
    const encoding = ExpoFileSystem.EncodingType?.Base64 ?? 'base64';
    return ExpoFileSystem.readAsStringAsync(uri, { encoding });
  }
  return null;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isWeb = Platform.OS === 'web';
const isSmallScreen = SCREEN_WIDTH < 600;

interface LessonInfo {
  modelId: number;
  chapterName: string;
  fullChapterName: string;
  lesson: number;
  totalLessonsInChapter: number;
  totalChapters: number;
}

interface LessonProps {
  lessonPath: string;
  lessonName: string;
  apiLessonPath: string;
  lessonInfo: LessonInfo;
  onNextLesson: (currentChapter: string, nextLessonIndex: number) => void;
}

export default function Lesson({
  lessonPath,
  lessonName,
  apiLessonPath,
  lessonInfo,
  onNextLesson,
}: LessonProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [status, setStatus] = useState("Hãy làm hành động");
  const [countdown, setCountdown] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState<CameraType>("front");
  const isMountedRef = useRef(true); // Track component mounted state
  const isCapturingRef = useRef(false); // Track if already capturing
  const statusResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // track delayed status reset

  const lessonTitle = `${lessonInfo.chapterName}: ${lessonName}`;

  // Tối ưu tốc độ chụp khác nhau giữa iPad và điện thoại
  const CAPTURE_QUALITY = isTablet ? 0.6 : 0.35; // giảm chất lượng trên điện thoại để chụp nhanh hơn
  const FRAME_DELAY_MS = isTablet ? 20 : 40; // giãn nhịp trên điện thoại để camera kịp xử lý

  // Track component mount/unmount per lesson
  useEffect(() => {
    console.log("Lesson component mounted:", lessonName);
    isMountedRef.current = true;
    isCapturingRef.current = false; // Reset capture flag
    
    return () => {
      console.log("Lesson component unmounting:", lessonName);
      isMountedRef.current = false;
      isCapturingRef.current = false;
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = null;
      }
      // Stop any ongoing capture
      setIsProcessing(false);
      setIsRecording(false);
    };
  }, [lessonPath]); // Re-mount khi đổi bài

  // Request camera permission
  useEffect(() => {
    if (!permission?.granted && cameraEnabled) {
      requestPermission();
    }
  }, [cameraEnabled]);

  // Gửi khung hình đến API
  const sendFramesToAPI = async () => {
    // Kiểm tra component và camera còn mounted không
    if (!isMountedRef.current || !cameraRef.current || !apiLessonPath || !cameraEnabled) {
      console.log("Component/Camera not mounted or disabled");
      return;
    }

    // CHẶN NẾU ĐANG CHỤP RỒI
    if (isCapturingRef.current) {
      console.log("Already capturing, skipping...");
      return;
    }

    isCapturingRef.current = true; // Đánh dấu đang chụp
    setIsProcessing(true);
    setIsRecording(true);
    // Hủy mọi hẹn giờ reset trạng thái trước đó để tránh đè status mới
    if (statusResetTimeoutRef.current) {
      clearTimeout(statusResetTimeoutRef.current);
      statusResetTimeoutRef.current = null;
    }

    try {
      const frames: string[] = [];
      const frameCount = 60;
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 5;
      
      // Thời gian dự kiến: 60 frames × 30ms = 1800ms ≈ 2 giây
      const estimatedTime = 2000; // ms
      const startTime = Date.now();
      
      console.log("Starting capture 60 frames...");
      
      // Đếm ngược từ 3
      for (let i = 3; i > 0; i--) {
        if (isMountedRef.current) {
          setStatus(`${i}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (isMountedRef.current) {
        setStatus("Đang quay... 📸");
        try { (player as any)?.play?.(); } catch {}
      }
      
      let usedVideoPipeline = false;

      // Prefer: quay video 2s và trích 60 frame trên điện thoại (nhanh hơn)
      if (!isTablet && (cameraRef.current as any)?.recordAsync && getThumbnailAsync) {
        try {
          const recPromise = (cameraRef.current as any).recordAsync?.({
            maxDuration: Math.ceil(estimatedTime / 1000),
            quality: '480p',
          });
          setTimeout(() => {
            try { (cameraRef.current as any)?.stopRecording?.(); } catch {}
          }, estimatedTime + 200);
          const videoObj = await recPromise;
          const videoUri = videoObj?.uri ?? '';

          if (videoUri) {
            const step = estimatedTime / frameCount;
            for (let i = 0; i < frameCount; i++) {
              const t = Math.min(estimatedTime - 1, Math.floor(i * step));
              try {
                const thumb = await getThumbnailAsync(videoUri, { time: t, quality: 0.6 });
                if (thumb?.uri) {
                  const b64 = await readFileAsBase64(thumb.uri);
                  if (b64) {
                    frames.push(`data:image/jpeg;base64,${b64}`);
                  }
                }
              } catch {}
            }
            usedVideoPipeline = frames.length >= 30;
          }
        } catch {
          // fallback
        }
      }

      // Fallback: chụp ảnh liên tiếp như cũ
      if (!usedVideoPipeline) {
        while (frames.length < frameCount && consecutiveErrors < maxConsecutiveErrors) {
          if (!isMountedRef.current || !cameraRef.current || !cameraEnabled) {
            console.log("Component/Camera unmounted during capture, stopping...");
            break;
          }
          try {
            const photo = await cameraRef.current.takePictureAsync({
              base64: true,
              quality: CAPTURE_QUALITY,
              skipProcessing: true,
              imageType: 'jpg',
            });
            if (photo?.base64) {
              frames.push(`data:image/jpeg;base64,${photo.base64}`);
              consecutiveErrors = 0;
              const elapsed = Date.now() - startTime;
              const estimatedRemaining = Math.ceil((estimatedTime - elapsed) / 1000);
              if (frames.length % 15 === 0 && isMountedRef.current && estimatedRemaining > 0) {
                setStatus(`Đang quay... ${estimatedRemaining}s`);
              }
            }
            await new Promise(resolve => setTimeout(resolve, FRAME_DELAY_MS));
          } catch (error: any) {
            if (!isMountedRef.current || error?.message?.includes('unmounted')) {
              console.log("Stopping capture due to unmount");
              break;
            }
            consecutiveErrors++;
            if (consecutiveErrors <= 2) console.warn(`Capture error (${consecutiveErrors}/${maxConsecutiveErrors})`);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
      
      setIsRecording(false);
      isCapturingRef.current = false; // Reset flag

      // Kiểm tra component vẫn mounted
      if (!isMountedRef.current) {
        console.log("Component unmounted, aborting send");
        return;
      }

      console.log(`Total frames captured: ${frames.length}/${frameCount}`);
      
      // CHỈ GỬI KHI ĐỦ 60 FRAMES
      if (frames.length < 60) {
        if (isMountedRef.current) {
          setStatus(`Chụp lại (${frames.length}/60)`);
          setIsProcessing(false);
          // Tự động reset sau 2 giây
          statusResetTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setStatus("Hãy làm hành động");
            }
          }, 2000);
          // clear ref sau khi chạy
          statusResetTimeoutRef.current && setTimeout(() => (statusResetTimeoutRef.current = null), 0);
        }
        return;
      }
      
      if (isMountedRef.current) {
        setStatus("Đang gửi...");
      }

      const modelId = lessonInfo.modelId;
      if (!modelId) {
        console.error("Missing modelId in lessonInfo:", lessonInfo);
        throw new Error("Missing modelId");
      }

      console.log("Sending frames with modelId:", modelId, "lessonPath:", apiLessonPath);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log("No authentication token found");
      }
      
      const processVideoUrl = getApiUrl(API_CONFIG.ENDPOINTS.PROCESS_VIDEO);
      console.log("Sending to:", processVideoUrl);
      
      const response = await fetch(processVideoUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          frames,
          lessonPath: apiLessonPath,
          modelId: parseInt(String(modelId))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        setStatus("Lỗi xử lý video");
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);
      
      const match = result.status === "Match!" || result.status === "match" || result.match === true;

      if (isMountedRef.current) {
        setStatus(match ? "Khớp!" : "Không khớp");
      }
      setIsProcessing(false);

      if (match) {
        console.log("✅ Match successful! Moving to next lesson...");
        // Tắt camera khi khớp
        setCameraEnabled(false);
        
        // Bắt đầu đếm ngược chuyển bài
        let time = 3;
        if (isMountedRef.current) {
          setCountdown(time);
        }
        const countdownInterval = setInterval(() => {
          time -= 1;
          if (isMountedRef.current) {
            setCountdown(time);
          }
          if (time <= 0) {
            clearInterval(countdownInterval);
            if (isMountedRef.current) {
              goToNextLesson();
              setStatus("Hãy làm hành động");
              setCountdown(3);
            }
          }
        }, 1000);
      } else {
        console.log("❌ No match. Try again!");
        // Không khớp thì giữ nguyên, để user thử lại
        if (isMountedRef.current) {
          // Clear hẹn giờ cũ nếu có
          if (statusResetTimeoutRef.current) {
            clearTimeout(statusResetTimeoutRef.current);
            statusResetTimeoutRef.current = null;
          }
          statusResetTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setStatus("Hãy làm hành động");
            }
          }, 2000);
          // clear ref sau khi chạy
          statusResetTimeoutRef.current && setTimeout(() => (statusResetTimeoutRef.current = null), 0);
        }
      }
    } catch (error) {
      console.error("Lỗi gửi khung hình đến API:", error);
      setStatus("Lỗi gửi khung hình");
      setIsProcessing(false);
      isCapturingRef.current = false; // Reset flag on error
    }
  };

  // Chuyển sang bài tiếp theo
  const goToNextLesson = () => {
    const { fullChapterName, lesson, modelId } = lessonInfo;
    console.log("Current lesson info:", lessonInfo);
    
    if (!fullChapterName || !modelId) {
      console.error("Invalid chapter info:", { fullChapterName, modelId });
      setStatus("Lỗi chuyển bài");
      return;
    }

    if (onNextLesson) {
      console.log("Chuyển sang bài tiếp theo - Chapter:", fullChapterName, "Next Lesson:", lesson + 1);
      onNextLesson(fullChapterName, lesson + 1);
    } else {
      console.error("Missing onNextLesson callback");
      setStatus("Lỗi chuyển bài");
    }
  };

  // Gửi định kỳ
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let startDelay: ReturnType<typeof setTimeout> | null = null;
    
    if (cameraEnabled && apiLessonPath && !isProcessing && isMountedRef.current) {
      console.log("Setting up capture timer for lesson:", lessonName);
      
      // Đợi 3 giây sau khi bật camera, sau đó chụp ngay lần đầu
      startDelay = setTimeout(() => {
        if (isMountedRef.current && cameraEnabled && !isCapturingRef.current) {
          console.log("First capture triggered");
          sendFramesToAPI();
        }
      }, 3000);
      
      // Sau đó chụp mỗi 10 giây (đủ thời gian: 3s countdown + 2s capture + 5s buffer)
      interval = setInterval(() => {
        if (isMountedRef.current && cameraEnabled && !isCapturingRef.current) {
          console.log("Interval capture triggered");
          sendFramesToAPI();
        }
      }, 10000); // 10 giây
    }
    
    return () => {
      console.log("Cleaning up timers for lesson:", lessonName);
      if (startDelay) clearTimeout(startDelay);
      if (interval) clearInterval(interval);
    };
  }, [cameraEnabled, apiLessonPath, lessonPath]); // Thêm lessonPath để reset khi đổi bài

  const handleToggleCamera = async () => {
    if (!cameraEnabled && !permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Quyền camera", "Cần quyền truy cập camera để thực hành");
        return;
      }
    }
    
    // Nếu đang chụp, dừng lại trước
    if (isProcessing || isRecording) {
      setIsProcessing(false);
      setIsRecording(false);
      // Đợi một chút để process dừng hoàn toàn
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setCameraEnabled((prev) => !prev);
    setStatus("Hãy làm hành động");
  };

  // Tạo đường dẫn video từ public folder - memoize để tránh re-render
  const videoSource = useMemo(() => {
    const url = getVideoUrl(lessonPath);
    console.log("Video source:", url);
    return url;
  }, [lessonPath]);

  // Memoize player để tránh tạo lại mỗi render
  const player = useVideoPlayer(videoSource, (player: any) => {
    player.loop = true;
    player.muted = true; // tránh xung đột audio khi camera ghi video
    player.play();
  });

  return (
    <View style={styles.container}>
      {/* Tiêu đề bài học */}
      <Text style={styles.mainTitle}>{lessonTitle}</Text>
      
      {/* Layout ngang cho iPad, dọc cho mobile */}
      <View style={styles.contentRow}>
        {/* Video mẫu */}
        <View style={styles.videoSection}>
        <Text style={styles.sectionTitle}>📺 Video Mẫu</Text>
          <VideoView
            player={player}
            style={styles.video}
            nativeControls={false}
            allowsPictureInPicture={false}
          />
          
        </View>

        {/* Camera thực hành */}
        <View style={styles.cameraSection}>
          <Text style={styles.sectionTitle}>🎥 Thực Hành</Text>
          <View style={styles.cameraContainer}>
            {cameraEnabled && permission?.granted ? (
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                mode="video"
                videoQuality="480p"
              />
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text style={styles.placeholderText}>
                  {permission?.granted ? "Nhấn nút bên dưới để bật camera" : "Cần quyền truy cập camera"}
                </Text>
              </View>
            )}
          </View>
          
          {/* Trạng thái */}
          <View style={styles.statusContainer}>
            <Text
              style={[
                styles.statusText,
                status === "Khớp!" && styles.statusSuccess,
                status === "Không khớp" && styles.statusError,
                (status === "Đang xử lý..." || status === "Đang chụp...") && styles.statusProcessing,
              ]}
            >
              {status === "Khớp!" && "✅ "}
              {status === "Không khớp" && "❌ "}
              {status === "Đang chụp..." && "📸 "}
              {status === "Đang xử lý..." && "⏳ "}
              {status}
            </Text>

            {/* Đếm ngược chuyển bài */}
            {status === "Khớp!" && countdown > 0 && (
              <Text style={styles.countdownText}>
                Chuyển bài trong {countdown}s...
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Nút điều khiển FLOAT góc dưới phải */}
      {!cameraEnabled ? (
        <TouchableOpacity
          style={styles.floatButton}
          onPress={handleToggleCamera}
          activeOpacity={0.7}
        >
          <Text style={styles.floatButtonText}>▶️</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.floatButton, styles.floatButtonActive]}
          onPress={handleToggleCamera}
          activeOpacity={0.7}
        >
          <Text style={styles.floatButtonText}>⏹</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: isSmallScreen ? 8 : isTablet ? 8 : 12,
  },
  mainTitle: {
    fontSize: isSmallScreen ? 18 : isTablet ? 20 : 24,
    fontWeight: 'bold',
    marginBottom: isSmallScreen ? 8 : isTablet ? 6 : 12,
    color: '#1f2937',
    textAlign: 'center',
  },
  contentRow: {
    flex: 1,
    flexDirection: isTablet ? 'row' : 'column',
    gap: isTablet ? 12 : 0,
  },
  videoSection: {
    flex: isTablet ? 1 : 0,
    marginTop: isSmallScreen ? 8 : isTablet ? 12 : 0,
    marginBottom: isSmallScreen ? 8 : isTablet ? 0 : 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: isSmallScreen ? 8 : isTablet ? 8 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  cameraSection: {
    flex: isTablet ? 1 : 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: isSmallScreen ? 8 : isTablet ? 8 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#374151',
  },
  video: {
    width: '100%',
    height: isSmallScreen ? 250 : isTablet ? SCREEN_HEIGHT * 0.7 : 220,
    backgroundColor: '#000',
    borderRadius: 6,
  },
  cameraContainer: {
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
    flex: 1,
  },
  camera: {
    width: '100%',
    height: isSmallScreen ? 300 : isTablet ? '100%' : 340,
  },
  cameraPlaceholder: {
    width: '100%',
    height: isSmallScreen ? 300 : isTablet ? '100%' : 340,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderIcon: {
    fontSize: 40,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  statusText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statusSuccess: {
    color: '#16a34a',
  },
  statusError: {
    color: '#dc2626',
  },
  statusProcessing: {
    color: '#f59e0b',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    color: '#6b7280',
  },
  // Nút FLOAT góc dưới phải
  floatButton: {
    position: 'absolute',
    bottom: isSmallScreen ? 20 : 30,
    right: isSmallScreen ? 20 : 30,
    width: isSmallScreen ? 60 : 70,
    height: isSmallScreen ? 60 : 70,
    borderRadius: isSmallScreen ? 30 : 35,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
  floatButtonActive: {
    backgroundColor: '#dc2626',
  },
  floatButtonText: {
    fontSize: isSmallScreen ? 28 : 32,
  },
});

