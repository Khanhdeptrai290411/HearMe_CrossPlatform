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
const WebVideoElement: any = 'video';

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
  const webCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const webCameraStreamRef = useRef<MediaStream | null>(null);
  const webCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webCameraError, setWebCameraError] = useState<string | null>(null);
  const [webVideoUrl, setWebVideoUrl] = useState<string | null>(null);
  const [webVideoStatus, setWebVideoStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const isMountedRef = useRef(true); // Track component mounted state
  const isCapturingRef = useRef(false); // Track if already capturing
  const cameraReadyRef = useRef(false); // Track camera ready state (use ref for immediate updates)
  const statusResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // track delayed status reset
  const currentApiAbortControllerRef = useRef<AbortController | null>(null); // Track current API call to cancel if needed
  const currentLessonPathRef = useRef<string>(apiLessonPath || ''); // Track current lesson path to ignore stale responses
  const isApiCallPendingRef = useRef(false); // Track if API call is pending (more reliable than isProcessing state)

  const lessonTitle = `${lessonInfo.chapterName}: ${lessonName}`;
  // Model Family (id: 1) cần 120 frame, Color (id: 2) cần 60 frame
  const REQUIRED_FRAME_COUNT = lessonInfo.modelId === 1 ? 120 : 60;

  const stopWebCameraStream = () => {
    if (webCameraStreamRef.current) {
      webCameraStreamRef.current.getTracks().forEach((track) => track.stop());
      webCameraStreamRef.current = null;
    }
    if (webCameraVideoRef.current) {
      try {
        webCameraVideoRef.current.srcObject = null;
      } catch {}
    }
  };

  const startWebCameraStream = async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setWebCameraError("Trình duyệt không hỗ trợ camera");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      webCameraStreamRef.current = stream;
      if (webCameraVideoRef.current) {
        try {
          (webCameraVideoRef.current as HTMLVideoElement).srcObject = stream;
          await webCameraVideoRef.current.play();
        } catch {}
      }
      cameraReadyRef.current = true;
      setWebCameraError(null);
      return true;
    } catch (error: any) {
      console.error("Failed to start web camera:", error);
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        setWebCameraError("Bạn đã chặn quyền camera. Hãy cho phép trong trình duyệt.");
      } else {
        setWebCameraError("Không thể mở camera trên trình duyệt.");
      }
      return false;
    }
  };

  // Tối ưu tốc độ chụp khác nhau giữa iPad và điện thoại
  const CAPTURE_QUALITY = isTablet ? 0.6 : 0.35; // giảm chất lượng trên điện thoại để chụp nhanh hơn
  const FRAME_DELAY_MS = isTablet ? 20 : 40; // giãn nhịp trên điện thoại để camera kịp xử lý

  // Helper function để safely stop recording
  const safeStopRecording = () => {
    if (!isMountedRef.current || !cameraRef.current) {
      return;
    }
    try {
      if ((cameraRef.current as any)?.stopRecording) {
        (cameraRef.current as any).stopRecording();
      }
    } catch (error) {
      // Ignore errors - camera might already be unmounted
      console.log("Error stopping recording (safe):", error);
    }
  };

  // Track component mount/unmount per lesson
  useEffect(() => {
    console.log("Lesson component mounted:", lessonName);
    isMountedRef.current = true;
    isCapturingRef.current = false; // Reset capture flag
    
    // Cancel any pending API calls khi chuyển bài
    if (currentApiAbortControllerRef.current) {
      currentApiAbortControllerRef.current.abort();
      currentApiAbortControllerRef.current = null;
    }
    isApiCallPendingRef.current = false;
    
    // Update current lesson path
    currentLessonPathRef.current = apiLessonPath || '';
    
    // Reset camera state khi chuyển bài
    setCameraEnabled(false);
    cameraReadyRef.current = false;
    setStatus("Hãy làm hành động");
    setIsProcessing(false);
    setIsRecording(false);
    setCountdown(3);
    
    // Reset camera ref để đảm bảo camera mới được khởi tạo
    // Không set null trực tiếp, để React tự quản lý qua key prop
    
    return () => {
      console.log("Lesson component unmounting:", lessonName);
      isMountedRef.current = false;
      isCapturingRef.current = false;
      
      // Cancel any pending API calls
      if (currentApiAbortControllerRef.current) {
        currentApiAbortControllerRef.current.abort();
        currentApiAbortControllerRef.current = null;
      }
      isApiCallPendingRef.current = false;
      
      // Tắt camera trước khi unmount
      setCameraEnabled(false);
      cameraReadyRef.current = false;
      setIsProcessing(false);
      setIsRecording(false);
      
      // Clear timers
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = null;
      }
      
      // Reset camera ref - safely stop recording
      safeStopRecording();
      if (isWeb) {
        stopWebCameraStream();
      }
    };
  }, [lessonPath]); // Re-mount khi đổi bài

  // Request camera permission
  useEffect(() => {
    if (!permission?.granted && cameraEnabled) {
      requestPermission();
    }
  }, [cameraEnabled]);

  // Cleanup khi camera tắt
  useEffect(() => {
    if (!cameraEnabled) {
      // Reset tất cả state khi camera tắt
      isCapturingRef.current = false;
      setIsProcessing(false);
      setIsRecording(false);
      cameraReadyRef.current = false;
      
      // Clear timers
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = null;
      }
      
      // Dừng recording nếu có
      safeStopRecording();
      if (isWeb) {
        stopWebCameraStream();
      }
    } else {
      // Khi bật camera, reset ready state và đợi callback
      cameraReadyRef.current = false;
      // Không cần delay ở đây vì onCameraReady sẽ set cameraReadyRef.current = true
    }
  }, [cameraEnabled]);

  // Gửi khung hình đến API
  const sendFramesToAPI = async () => {
    if (isWeb) {
      await sendWebFrames();
      return;
    }

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

    // Kiểm tra camera ref sẵn sàng
    if (!cameraRef.current) {
      console.log("Camera ref not ready, skipping capture");
      return;
    }

    // Đợi camera ready (đặc biệt quan trọng sau khi chuyển bài)
    // iPad cần đợi lâu hơn
    if (!cameraReadyRef.current) {
      console.log("Waiting for camera to be ready...");
      // Đợi tối đa: iPad 5 giây, phone 3 giây
      const maxWaitTime = isTablet ? 50 : 30;
      for (let i = 0; i < maxWaitTime; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (cameraReadyRef.current || !isMountedRef.current || !cameraEnabled) break;
      }
      if (!cameraReadyRef.current) {
        console.warn("Camera not ready after waiting, proceeding anyway");
        // Vẫn tiếp tục nhưng có thể sẽ fail - user cần bật lại camera
      }
    }
    
    // Thêm delay sau khi camera ready để đảm bảo camera hoàn toàn sẵn sàng
    // iPad cần delay lâu hơn
    if (cameraReadyRef.current) {
      const additionalDelay = isTablet ? 1500 : 500;
      console.log(`Camera ready, waiting additional ${additionalDelay}ms for stability...`);
      await new Promise(resolve => setTimeout(resolve, additionalDelay));
    }
    
    // Kiểm tra lại camera ref và permission trước khi capture
    if (!cameraRef.current || !permission?.granted || !cameraEnabled) {
      console.log("Camera not available for capture:", {
        hasRef: !!cameraRef.current,
        hasPermission: !!permission?.granted,
        enabled: cameraEnabled,
      });
      isCapturingRef.current = false;
      setIsProcessing(false);
      setIsRecording(false);
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
      const frameCount = REQUIRED_FRAME_COUNT;
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 5;
      
      // Thời gian dự kiến: frameCount × 30ms
      const estimatedTime = frameCount * 30; // ms
      const startTime = Date.now();
      
      console.log(`Starting capture ${frameCount} frames...`);
      
      // Đếm ngược từ 3
      const countdownSeconds = 1;
      for (let i = countdownSeconds; i > 0; i--) {
        if (isMountedRef.current) {
          setStatus(`${i}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (isMountedRef.current) {
        setStatus("Đang quay... 📸");
        // Đảm bảo video chạy khi bắt đầu capture
        try {
          if ((player as any)?.play) {
            (player as any).play();
          }
        } catch (error) {
          console.log("Error playing video at capture start:", error);
        }
      }
      
      let usedVideoPipeline = false;

      // Prefer: quay video và trích frameCount frame trên iOS (cả iPad và iPhone - nhanh và ổn định hơn)
      // Android: skip vì recordAsync không ổn định, dùng fallback (chụp ảnh liên tiếp)
      if (Platform.OS === 'ios' && (cameraRef.current as any)?.recordAsync && getThumbnailAsync) {
        try {
          const recPromise = (cameraRef.current as any).recordAsync?.({
            maxDuration: Math.ceil(estimatedTime / 1000),
            quality: '480p',
          });
          setTimeout(() => {
            safeStopRecording();
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
        // Luôn test capture trên iPad để đảm bảo camera thực sự sẵn sàng
        // Trên phone chỉ test nếu camera chưa ready
        const shouldTest = isTablet || !cameraReadyRef.current;
        
        if (cameraRef.current && permission?.granted && cameraEnabled && shouldTest) {
          try {
            console.log("Testing camera capture before starting...");
            const testPhoto = await cameraRef.current.takePictureAsync({
              base64: true,
              quality: CAPTURE_QUALITY,
              skipProcessing: true,
              imageType: 'jpg',
            });
            if (testPhoto?.base64) {
              console.log("✅ Test capture successful, camera is ready");
              cameraReadyRef.current = true;
              // Đợi thêm một chút để camera ổn định - iPad cần lâu hơn
              const stabilityDelay = isTablet ? 1000 : 200;
              await new Promise(resolve => setTimeout(resolve, stabilityDelay));
            } else {
              console.warn("Test capture returned no base64, but continuing...");
              // Vẫn tiếp tục, có thể camera sẽ hoạt động
              const continueDelay = isTablet ? 1200 : 300;
              await new Promise(resolve => setTimeout(resolve, continueDelay));
            }
          } catch (testError: any) {
            console.warn("❌ Test capture failed, but continuing:", testError?.message || testError);
            // Không dừng lại, chỉ đợi thêm một chút - iPad cần lâu hơn
            const errorDelay = isTablet ? 2000 : 500;
            await new Promise(resolve => setTimeout(resolve, errorDelay));
            // Không retry nữa để tránh delay quá lâu
            // Camera có thể vẫn hoạt động trong loop chính
          }
        } else if (cameraReadyRef.current && !isTablet) {
          console.log("Camera already ready, skipping test capture");
        }
        
        while (frames.length < frameCount && consecutiveErrors < maxConsecutiveErrors) {
          if (!isMountedRef.current || !cameraRef.current || !cameraEnabled) {
            console.log("Component/Camera unmounted during capture, stopping...");
            break;
          }
          
          // Đảm bảo video vẫn chạy trong quá trình capture
          if (frames.length % 10 === 0) {
            try {
              // Player được định nghĩa sau, nhưng sẽ có trong scope khi function được gọi
              if ((player as any)?.play) {
                (player as any).play();
              }
            } catch (error) {
              // Ignore
            }
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
      
      await processCapturedFrames(frames, frameCount);
    } catch (error) {
      console.error("Lỗi gửi khung hình đến API:", error);
      setStatus("Lỗi gửi khung hình");
      setIsProcessing(false);
      isCapturingRef.current = false; // Reset flag on error
    }
  };

  const sendWebFrames = async () => {
    if (!isMountedRef.current || !cameraEnabled || !apiLessonPath) {
      console.log("Web capture skipped - invalid state");
      return;
    }
    const videoEl = webCameraVideoRef.current;
    if (!videoEl) {
      if (isMountedRef.current) {
        setStatus("Bật camera để luyện tập");
      }
      return;
    }
    if (videoEl.readyState < 2) {
      console.log("Web camera video not ready");
      if (isMountedRef.current) {
        setStatus("Camera đang khởi động...");
      }
      return;
    }
    if (isCapturingRef.current) {
      console.log("Already capturing on web, skipping...");
      return;
    }

    isCapturingRef.current = true;
    setIsProcessing(true);
    setIsRecording(true);

    try {
      const frames: string[] = [];
      const frameCount = REQUIRED_FRAME_COUNT;
      const canvas =
        webCanvasRef.current ??
        (typeof document !== "undefined" ? document.createElement("canvas") : null);
      if (!canvas) {
        throw new Error("Không thể tạo canvas trên web");
      }
      if (!webCanvasRef.current) {
        webCanvasRef.current = canvas;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Canvas context không khả dụng");
      }
      const width = videoEl.videoWidth || 640;
      const height = videoEl.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      for (let i = 3; i > 0; i--) {
        if (!isMountedRef.current) break;
        setStatus(`${i}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (isMountedRef.current) {
        setStatus("Đang quay... 📸");
      }

      const FRAME_DELAY_MS = 10;
      for (let i = 0; i < frameCount; i++) {
        if (!isMountedRef.current || !cameraEnabled) {
          break;
        }
        ctx.drawImage(videoEl, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        frames.push(dataUrl);
        await new Promise(resolve => setTimeout(resolve, FRAME_DELAY_MS));
      }

      await processCapturedFrames(frames, frameCount);
    } catch (error) {
      console.error("Web capture error:", error);
      setStatus("Lỗi camera web");
      setIsProcessing(false);
      isCapturingRef.current = false;
      setIsRecording(false);
    }
  };

  const processCapturedFrames = async (frames: string[], frameCount: number) => {
    setIsRecording(false);
    isCapturingRef.current = false;

    if (!isMountedRef.current) {
      console.log("Component unmounted, aborting send");
      setIsProcessing(false);
      return;
    }

    // Clear any pending status reset timeout khi bắt đầu process mới
    if (statusResetTimeoutRef.current) {
      clearTimeout(statusResetTimeoutRef.current);
      statusResetTimeoutRef.current = null;
    }

    console.log(`Total frames captured: ${frames.length}/${frameCount}`);

    if (frames.length < REQUIRED_FRAME_COUNT) {
      setStatus(`Chụp lại (${frames.length}/${REQUIRED_FRAME_COUNT})`);
      setIsProcessing(false);
      statusResetTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && !isProcessing) {
          setStatus("Hãy làm hành động");
        }
      }, 2000);
      return;
    }

    // Đảm bảo isProcessing vẫn true khi đang gửi API
    setStatus("Đang gửi...");

    const modelId = lessonInfo.modelId;
    if (!modelId) {
      console.error("Missing modelId in lessonInfo:", lessonInfo);
      throw new Error("Missing modelId");
    }

    console.log("Sending frames with modelId:", modelId, "lessonPath:", apiLessonPath);

    // Cancel any previous API call
    if (currentApiAbortControllerRef.current) {
      currentApiAbortControllerRef.current.abort();
    }

    // Create new AbortController for this API call
    const abortController = new AbortController();
    currentApiAbortControllerRef.current = abortController;
    const currentLessonPath = apiLessonPath || '';
    
    // Mark API call as pending
    isApiCallPendingRef.current = true;

    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log("No authentication token found");
    }

    const processVideoUrl = getApiUrl(API_CONFIG.ENDPOINTS.PROCESS_VIDEO);
    console.log("Sending to:", processVideoUrl);

    let response: Response;
    try {
      response = await fetch(processVideoUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          frames,
          lessonPath: apiLessonPath,
          modelId: parseInt(String(modelId))
        }),
        signal: abortController.signal
      });
    } catch (error: any) {
      // Handle abort or network errors
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        console.log("API call aborted, ignoring");
        setIsProcessing(false);
        if (currentApiAbortControllerRef.current === abortController) {
          isApiCallPendingRef.current = false;
          currentApiAbortControllerRef.current = null;
        }
        return;
      }
      // Check if lesson changed
      if (currentLessonPathRef.current !== currentLessonPath || !isMountedRef.current) {
        console.log("Lesson changed during fetch, ignoring error");
        setIsProcessing(false);
        if (currentApiAbortControllerRef.current === abortController) {
          isApiCallPendingRef.current = false;
          currentApiAbortControllerRef.current = null;
        }
        return;
      }
      // Mark API call as failed
      if (currentApiAbortControllerRef.current === abortController) {
        isApiCallPendingRef.current = false;
      }
      throw error;
    }

    // Check if this API call was aborted or lesson changed
    if (abortController.signal.aborted || currentLessonPathRef.current !== currentLessonPath || !isMountedRef.current) {
      console.log("API call aborted or lesson changed, ignoring response");
      setIsProcessing(false);
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    const rawPayload = await response.text();
    let parsedPayload: any = null;
    if (rawPayload && contentType.includes('application/json')) {
      try {
        parsedPayload = JSON.parse(rawPayload);
      } catch (parseError) {
        console.warn("Không thể parse JSON từ API:", parseError, rawPayload);
      }
    } else if (rawPayload) {
      try {
        parsedPayload = JSON.parse(rawPayload);
      } catch {
        parsedPayload = null;
      }
    }

    // Double check after async operations
    if (abortController.signal.aborted || currentLessonPathRef.current !== currentLessonPath || !isMountedRef.current) {
      console.log("API call aborted or lesson changed after fetch, ignoring response");
      setIsProcessing(false);
      if (currentApiAbortControllerRef.current === abortController) {
        isApiCallPendingRef.current = false;
        currentApiAbortControllerRef.current = null;
      }
      return;
    }

    if (!response.ok) {
      console.error("API Error:", parsedPayload ?? rawPayload);
      if (isMountedRef.current && currentLessonPathRef.current === currentLessonPath) {
        setStatus("Lỗi xử lý video");
      }
      setIsProcessing(false);
      if (currentApiAbortControllerRef.current === abortController) {
        isApiCallPendingRef.current = false;
        currentApiAbortControllerRef.current = null;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = parsedPayload ?? {};
    console.log("API Response:", result);

    // Final check before updating UI
    if (!isMountedRef.current || currentLessonPathRef.current !== currentLessonPath) {
      console.log("Component unmounted or lesson changed, ignoring API response");
      setIsProcessing(false);
      if (currentApiAbortControllerRef.current === abortController) {
        isApiCallPendingRef.current = false;
        currentApiAbortControllerRef.current = null;
      }
      return;
    }

    const match = result.status === "Match!" || result.status === "match" || result.match === true;

    setStatus(match ? "Khớp!" : "Không khớp");
    setIsProcessing(false);
    
    // Clear abort controller after successful processing
    if (currentApiAbortControllerRef.current === abortController) {
      isApiCallPendingRef.current = false;
      currentApiAbortControllerRef.current = null;
    }

    if (match) {
      console.log("✅ Match successful! Moving to next lesson...");
      
      // Cancel any pending API calls
      if (currentApiAbortControllerRef.current) {
        currentApiAbortControllerRef.current.abort();
        currentApiAbortControllerRef.current = null;
      }
      isApiCallPendingRef.current = false;
      
      safeStopRecording();
      stopWebCameraStream();
      setCameraEnabled(false);

      let time = 3;
      setCountdown(time);
      const countdownInterval = setInterval(() => {
        time -= 1;
        if (isMountedRef.current) {
          setCountdown(time);
        }
        if (time <= 0) {
          clearInterval(countdownInterval);
          if (isMountedRef.current) {
            isCapturingRef.current = false;
            setIsProcessing(false);
            setIsRecording(false);
            goToNextLesson();
          }
        }
      }, 1000);
    } else {
      console.log("❌ No match. Try again!");
      // Chỉ reset status nếu không đang processing
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = null;
      }
      statusResetTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && !isProcessing && !isCapturingRef.current) {
          setStatus("Hãy làm hành động");
        }
      }, 2000);
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
      const cameraSourceReady = () => (isWeb ? !!webCameraVideoRef.current : !!cameraRef.current);
      console.log("Setting up capture timer for lesson:", lessonName);
      
      // Đợi sau khi bật camera để camera sẵn sàng
      // iPad cần delay lâu hơn (8s) vì camera khởi tạo chậm hơn và cần thời gian ổn định
      const initialDelay = isWeb ? 1000 : isTablet ? 8000 : 4000;
      startDelay = setTimeout(() => {
        if (isMountedRef.current && cameraEnabled && !isProcessing && !isCapturingRef.current && !isApiCallPendingRef.current && cameraSourceReady()) {
          console.log("First capture triggered");
          sendFramesToAPI();
        } else {
          console.log("Skipping first capture - not ready (processing:", isProcessing, "capturing:", isCapturingRef.current, "apiPending:", isApiCallPendingRef.current, ")");
        }
      }, initialDelay);
      
      // Sau đó chụp mỗi 10 giây (đủ thời gian: 3s countdown + 2s capture + 5s buffer)
      interval = setInterval(() => {
        if (isMountedRef.current && cameraEnabled && !isProcessing && !isCapturingRef.current && !isApiCallPendingRef.current && cameraSourceReady()) {
          console.log("Interval capture triggered");
          sendFramesToAPI();
        } else {
          console.log("Interval capture skipped - processing:", isProcessing, "capturing:", isCapturingRef.current, "apiPending:", isApiCallPendingRef.current);
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
    if (!isWeb && !cameraEnabled && !permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Quyền camera", "Cần quyền truy cập camera để thực hành");
        return;
      }
    }
    
    // Nếu đang chụp, dừng lại trước
    if (isProcessing || isRecording || isCapturingRef.current) {
      // Dừng mọi capture đang chạy
      isCapturingRef.current = false;
      setIsProcessing(false);
      setIsRecording(false);
      
      // Dừng recording nếu có
      if (!isWeb && cameraRef.current) {
        try {
          if ((cameraRef.current as any)?.stopRecording) {
            (cameraRef.current as any).stopRecording();
          }
        } catch (error) {
          console.log("Error stopping recording:", error);
        }
      }
      
      // Clear timers
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = null;
      }
      
      // Đợi một chút để process dừng hoàn toàn
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (isWeb) {
      if (!cameraEnabled) {
        const started = await startWebCameraStream();
        if (started) {
          setCameraEnabled(true);
          setStatus("Hãy làm hành động");
        }
      } else {
        stopWebCameraStream();
        setCameraEnabled(false);
        cameraReadyRef.current = false;
        setStatus("Hãy làm hành động");
      }
      return;
    }
    
    setCameraEnabled((prev) => {
      if (prev) {
        // Đang tắt camera - reset tất cả state
        isCapturingRef.current = false;
        setIsProcessing(false);
        setIsRecording(false);
        cameraReadyRef.current = false;
        setStatus("Hãy làm hành động");
      } else {
        // Đang bật camera - reset ready state để đợi callback
        cameraReadyRef.current = false;
      }
      return !prev;
    });
  };

  // Tạo đường dẫn video từ public folder - memoize để tránh re-render
  const videoSource = useMemo(() => {
    const url = getVideoUrl(lessonPath);
    console.log("Video source:", url);
    return url;
  }, [lessonPath]);

  useEffect(() => {
    if (!isWeb) {
      return;
    }
    const controller = new AbortController();
    let objectUrl: string | null = null;

    setWebVideoStatus('loading');
    setWebVideoUrl(null);

    const preload = async () => {
      try {
        const response = await fetch(videoSource, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!controller.signal.aborted) {
          setWebVideoUrl(objectUrl);
          setWebVideoStatus('idle');
        } else if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to preload video for web:", videoSource, error);
        setWebVideoStatus('error');
      }
    };

    preload();

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setWebVideoUrl(null);
    };
  }, [videoSource]);

  // Memoize player để tránh tạo lại mỗi render
  const player = useVideoPlayer(videoSource, (player: any) => {
    if (player) {
      player.loop = true;
      player.muted = true; // tránh xung đột audio khi camera ghi video
      // Play ngay khi player được tạo
      setTimeout(() => {
        try {
          player.play();
        } catch (error) {
          console.log("Error playing video in callback:", error);
        }
      }, 100);
    }
  });

  // Đảm bảo video chạy liên tục khi lessonPath thay đổi
  useEffect(() => {
    if (player) {
      player.loop = true;
      player.muted = true;
      // Đảm bảo video chạy ngay khi lesson thay đổi
      const playVideo = () => {
        try {
          if (player && isMountedRef.current) {
            player.play();
          }
        } catch (error) {
          console.log("Error playing video:", error);
        }
      };
      // Play ngay
      playVideo();
      // Retry nhiều lần để đảm bảo video start
      const retryTimer = setTimeout(playVideo, 200);
      const retryTimer2 = setTimeout(playVideo, 500);
      const retryTimer3 = setTimeout(playVideo, 1000);
      return () => {
        clearTimeout(retryTimer);
        clearTimeout(retryTimer2);
        clearTimeout(retryTimer3);
      };
    }
  }, [lessonPath, player]);

  // Đảm bảo video luôn chạy (check định kỳ và restart nếu cần)
  useEffect(() => {
    if (!player) return;
    
    const checkAndPlay = () => {
      try {
        // Kiểm tra và play nếu video bị pause
        if (player && isMountedRef.current) {
          // Không có cách trực tiếp check playing state, nên cứ play lại
          // expo-video sẽ tự handle nếu đang play rồi
          player.play();
        }
      } catch (error) {
        // Ignore errors
      }
    };
    
    // Check mỗi 1 giây (tăng tần suất) để đảm bảo video không bị pause
    const interval = setInterval(checkAndPlay, 1000);
    
    return () => clearInterval(interval);
  }, [player]);

  // Đảm bảo video play khi camera được bật
  useEffect(() => {
    if (player && cameraEnabled) {
      // Khi camera bật, đảm bảo video vẫn chạy
      const playVideo = () => {
        try {
          if (player && isMountedRef.current) {
            player.play();
          }
        } catch (error) {
          console.log("Error playing video when camera enabled:", error);
        }
      };
      playVideo();
      // Retry sau một chút
      const timer = setTimeout(playVideo, 500);
      return () => clearTimeout(timer);
    }
  }, [cameraEnabled, player]);

  return (
    <View style={styles.container}>
      {/* Tiêu đề bài học */}
      <Text style={styles.mainTitle}>{lessonTitle}</Text>
      
      {/* Layout ngang cho iPad, dọc cho mobile */}
      <View style={styles.contentRow}>
        {/* Video mẫu */}
        <View style={styles.videoSection}>
          <Text style={styles.sectionTitle}>📺 Video Mẫu</Text>
          {isWeb ? (
            <View style={styles.webVideoWrapper}>
              {webVideoStatus === 'loading' && (
                <Text style={styles.webVideoStatus}>Đang tải video mẫu...</Text>
              )}
              {webVideoStatus === 'error' && (
                <Text style={styles.webVideoStatusError}>Không tải được video mẫu</Text>
              )}
              {webVideoUrl && webVideoStatus === 'idle' && (
                <WebVideoElement
                  key={webVideoUrl}
                  src={webVideoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                  style={styles.webVideo as any}
                  onError={(event: any) => {
                    console.error('Web video failed to load', videoSource, event);
                    setWebVideoStatus('error');
                  }}
                />
              )}
            </View>
          ) : (
            <VideoView
              player={player}
              style={styles.video}
              nativeControls={false}
              allowsPictureInPicture={false}
              contentFit="contain"
            />
          )}
        </View>

        {/* Camera thực hành */}
        <View style={styles.cameraSection}>
          <Text style={styles.sectionTitle}>🎥 Thực Hành</Text>
          <View style={styles.cameraContainer}>
            {isWeb ? (
              cameraEnabled ? (
                <View style={styles.webCameraWrapper}>
                  <WebVideoElement
                    ref={(node: any) => {
                      webCameraVideoRef.current = node;
                      if (node && webCameraStreamRef.current && node.srcObject !== webCameraStreamRef.current) {
                        node.srcObject = webCameraStreamRef.current;
                        node.play?.().catch(() => {});
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    controls={false}
                    style={styles.webCamera as any}
                  />
                  {webCameraError && (
                    <Text style={styles.webCameraError}>{webCameraError}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <Text style={styles.placeholderIcon}>💻</Text>
                  <Text style={styles.placeholderText}>
                    {webCameraError ?? "Nhấn nút bên dưới để bật camera"}
                  </Text>
                </View>
              )
            ) : cameraEnabled && permission?.granted ? (
              <CameraView
                key={`camera-${lessonPath}`}
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                mode="video"
                videoQuality="480p"
                onCameraReady={() => {
                  console.log("Camera ready callback fired");
                  // Delay trước khi set ready để đảm bảo camera hoàn toàn khởi tạo
                  // iPad cần delay lâu hơn
                  const delay = isTablet ? 2000 : 800;
                  setTimeout(() => {
                    if (isMountedRef.current && cameraRef.current) {
                      cameraReadyRef.current = true;
                      console.log(`Camera fully ready and set (after ${delay}ms delay)`);
                      // Thêm delay nữa sau khi set ready, đặc biệt trên iPad
                      if (isTablet) {
                        setTimeout(() => {
                          if (isMountedRef.current) {
                            console.log("Camera stability period completed on iPad");
                          }
                        }, 500);
                      }
                    }
                  }, delay);
                }}
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
  webVideoWrapper: {
    width: '100%',
    height: isSmallScreen ? 250 : isTablet ? SCREEN_HEIGHT * 0.7 : 220,
    backgroundColor: '#000',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as any,
    backgroundColor: '#000',
  },
  webCameraWrapper: {
    width: '100%',
    height: isSmallScreen ? 300 : isTablet ? '100%' : 340,
    backgroundColor: '#000',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  webCamera: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as any,
    transform: 'scaleX(-1)' as any,
  },
  webCameraError: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    color: '#f87171',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  webVideoStatus: {
    color: '#f3f4f6',
    fontWeight: '600',
  },
  webVideoStatusError: {
    color: '#f87171',
    fontWeight: '700',
    textAlign: 'center',
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

