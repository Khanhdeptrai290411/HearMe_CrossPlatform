import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Platform, ScrollView } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, getApiUrl, getVideoUrl } from "../constants/config";
import { NB } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import BrutalCard from "@/components/ui/ds/Card";
import BrutalButton from "@/components/ui/ds/Button";
import BrutalBadge from "@/components/ui/ds/Badge";
import BrutalIcon from "@/components/ui/ds/BrutalIcon";

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
  const { t } = useLanguage();
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
  const REQUIRED_FRAME_COUNT = lessonInfo.modelId === 1 ? 120 : 60;

  // Set default status translation once context is available
  useEffect(() => {
    setStatus(t('practice.stateIdle'));
  }, [t]);

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
        setWebCameraError(t('practice.webCameraError'));
      } else {
        setWebCameraError("Không thể mở camera trên trình duyệt.");
      }
      return false;
    }
  };

  const CAPTURE_QUALITY = isTablet ? 0.6 : 0.35;
  const FRAME_DELAY_MS = isTablet ? 20 : 40;

  const safeStopRecording = () => {
    if (!isMountedRef.current || !cameraRef.current) {
      return;
    }
    try {
      if ((cameraRef.current as any)?.stopRecording) {
        (cameraRef.current as any).stopRecording();
      }
    } catch (error) {
      console.log("Error stopping recording (safe):", error);
    }
  };

  useEffect(() => {
    console.log("Lesson component mounted:", lessonName);
    isMountedRef.current = true;
    isCapturingRef.current = false;
    
    if (currentApiAbortControllerRef.current) {
      currentApiAbortControllerRef.current.abort();
      currentApiAbortControllerRef.current = null;
    }
    isApiCallPendingRef.current = false;
    currentLessonPathRef.current = apiLessonPath || '';
    
    setCameraEnabled(false);
    cameraReadyRef.current = false;
    setStatus(t('practice.stateIdle'));
    setIsProcessing(false);
    setIsRecording(false);
    setCountdown(3);
    
    return () => {
      console.log("Lesson component unmounting:", lessonName);
      isMountedRef.current = false;
      isCapturingRef.current = false;
      
      if (currentApiAbortControllerRef.current) {
        currentApiAbortControllerRef.current.abort();
        currentApiAbortControllerRef.current = null;
      }
      isApiCallPendingRef.current = false;
      
      setCameraEnabled(false);
      cameraReadyRef.current = false;
      setIsProcessing(false);
      setIsRecording(false);
      
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = null;
      }
      
      safeStopRecording();
      if (isWeb) {
        stopWebCameraStream();
      }
    };
  }, [lessonPath]);

  useEffect(() => {
    if (!permission?.granted && cameraEnabled) {
      requestPermission();
    }
  }, [cameraEnabled]);

  useEffect(() => {
    if (!cameraEnabled) {
      isCapturingRef.current = false;
      setIsProcessing(false);
      setIsRecording(false);
      cameraReadyRef.current = false;
      
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = null;
      }
      
      safeStopRecording();
      if (isWeb) {
        stopWebCameraStream();
      }
    } else {
      cameraReadyRef.current = false;
    }
  }, [cameraEnabled]);

  const sendFramesToAPI = async () => {
    if (isWeb) {
      await sendWebFrames();
      return;
    }

    if (!isMountedRef.current || !cameraRef.current || !apiLessonPath || !cameraEnabled) {
      console.log("Component/Camera not mounted or disabled");
      return;
    }

    if (isCapturingRef.current) {
      console.log("Already capturing, skipping...");
      return;
    }

    if (!cameraRef.current) {
      console.log("Camera ref not ready, skipping capture");
      return;
    }

    if (!cameraReadyRef.current) {
      console.log("Waiting for camera to be ready...");
      const maxWaitTime = isTablet ? 50 : 30;
      for (let i = 0; i < maxWaitTime; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (cameraReadyRef.current || !isMountedRef.current || !cameraEnabled) break;
      }
      if (!cameraReadyRef.current) {
        console.warn("Camera not ready after waiting, proceeding anyway");
      }
    }
    
    if (cameraReadyRef.current) {
      const additionalDelay = isTablet ? 1500 : 500;
      console.log(`Camera ready, waiting additional ${additionalDelay}ms for stability...`);
      await new Promise(resolve => setTimeout(resolve, additionalDelay));
    }
    
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

    isCapturingRef.current = true;
    setIsProcessing(true);
    setIsRecording(true);

    if (statusResetTimeoutRef.current) {
      clearTimeout(statusResetTimeoutRef.current);
      statusResetTimeoutRef.current = null;
    }

    try {
      const frames: string[] = [];
      const frameCount = REQUIRED_FRAME_COUNT;
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 5;
      const estimatedTime = frameCount * 30;
      const startTime = Date.now();
      
      console.log(`Starting capture ${frameCount} frames...`);
      
      const countdownSeconds = 1;
      for (let i = countdownSeconds; i > 0; i--) {
        if (isMountedRef.current) {
          setStatus(`${i}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (isMountedRef.current) {
        setStatus(t('practice.stateProcessing')); // "Đang quay... 📸" or similar
        try {
          if ((player as any)?.play) {
            (player as any).play();
          }
        } catch (error) {
          console.log("Error playing video at capture start:", error);
        }
      }
      
      let usedVideoPipeline = false;

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

      if (!usedVideoPipeline) {
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
              const stabilityDelay = isTablet ? 1000 : 200;
              await new Promise(resolve => setTimeout(resolve, stabilityDelay));
            } else {
              console.warn("Test capture returned no base64, but continuing...");
              const continueDelay = isTablet ? 1200 : 300;
              await new Promise(resolve => setTimeout(resolve, continueDelay));
            }
          } catch (testError: any) {
            console.warn("❌ Test capture failed, but continuing:", testError?.message || testError);
            const errorDelay = isTablet ? 2000 : 500;
            await new Promise(resolve => setTimeout(resolve, errorDelay));
          }
        } else if (cameraReadyRef.current && !isTablet) {
          console.log("Camera already ready, skipping test capture");
        }
        
        while (frames.length < frameCount && consecutiveErrors < maxConsecutiveErrors) {
          if (!isMountedRef.current || !cameraRef.current || !cameraEnabled) {
            console.log("Component/Camera unmounted during capture, stopping...");
            break;
          }
          
          if (frames.length % 10 === 0) {
            try {
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
                setStatus(`${t('practice.stateProcessing')} ${estimatedRemaining}s`);
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
      setStatus(t('common.error'));
      setIsProcessing(false);
      isCapturingRef.current = false;
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
        setStatus(t('practice.cameraEmpty'));
      }
      return;
    }
    if (videoEl.readyState < 2) {
      console.log("Web camera video not ready");
      if (isMountedRef.current) {
        setStatus("Camera is starting...");
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
        setStatus(t('practice.stateProcessing'));
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
      setStatus("Web camera error");
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
          setStatus(t('practice.stateIdle'));
        }
      }, 2000);
      return;
    }

    setStatus(t('practice.stateSending'));

    const modelId = lessonInfo.modelId;
    if (!modelId) {
      console.error("Missing modelId in lessonInfo:", lessonInfo);
      throw new Error("Missing modelId");
    }

    if (currentApiAbortControllerRef.current) {
      currentApiAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    currentApiAbortControllerRef.current = abortController;
    const currentLessonPath = apiLessonPath || '';
    isApiCallPendingRef.current = true;

    const token = await AsyncStorage.getItem('token');
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
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        console.log("API call aborted, ignoring");
        setIsProcessing(false);
        if (currentApiAbortControllerRef.current === abortController) {
          isApiCallPendingRef.current = false;
          currentApiAbortControllerRef.current = null;
        }
        return;
      }
      if (currentLessonPathRef.current !== currentLessonPath || !isMountedRef.current) {
        console.log("Lesson changed during fetch, ignoring error");
        setIsProcessing(false);
        if (currentApiAbortControllerRef.current === abortController) {
          isApiCallPendingRef.current = false;
          currentApiAbortControllerRef.current = null;
        }
        return;
      }
      if (currentApiAbortControllerRef.current === abortController) {
        isApiCallPendingRef.current = false;
      }
      throw error;
    }

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
        setStatus(t('practice.errorProcessing'));
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

    setStatus(match ? t('practice.nextSign') : t('practice.tryAgain'));
    setIsProcessing(false);
    
    if (currentApiAbortControllerRef.current === abortController) {
      isApiCallPendingRef.current = false;
      currentApiAbortControllerRef.current = null;
    }

    if (match) {
      console.log("✅ Match successful! Moving to next lesson...");
      
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
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = null;
      }
      statusResetTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && !isProcessing && !isCapturingRef.current) {
          setStatus(t('practice.stateIdle'));
        }
      }, 2000);
    }
  };

  const goToNextLesson = () => {
    const { fullChapterName, lesson, modelId } = lessonInfo;
    console.log("Current lesson info:", lessonInfo);
    
    if (!fullChapterName || !modelId) {
      console.error("Invalid chapter info:", { fullChapterName, modelId });
      setStatus(t('practice.errorChangeLesson'));
      return;
    }

    if (onNextLesson) {
      console.log("Chuyển sang bài tiếp theo - Chapter:", fullChapterName, "Next Lesson:", lesson + 1);
      onNextLesson(fullChapterName, lesson + 1);
    } else {
      console.error("Missing onNextLesson callback");
      setStatus(t('practice.errorChangeLesson'));
    }
  };

  // Gửi định kỳ
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let startDelay: ReturnType<typeof setTimeout> | null = null;
    
    if (cameraEnabled && apiLessonPath && !isProcessing && isMountedRef.current) {
      const cameraSourceReady = () => (isWeb ? !!webCameraVideoRef.current : !!cameraRef.current);
      console.log("Setting up capture timer for lesson:", lessonName);
      
      const initialDelay = isWeb ? 1000 : isTablet ? 8000 : 4000;
      startDelay = setTimeout(() => {
        if (isMountedRef.current && cameraEnabled && !isProcessing && !isCapturingRef.current && !isApiCallPendingRef.current && cameraSourceReady()) {
          console.log("First capture triggered");
          sendFramesToAPI();
        } else {
          console.log("Skipping first capture - not ready (processing:", isProcessing, "capturing:", isCapturingRef.current, "apiPending:", isApiCallPendingRef.current, ")");
        }
      }, initialDelay);
      
      interval = setInterval(() => {
        if (isMountedRef.current && cameraEnabled && !isProcessing && !isCapturingRef.current && !isApiCallPendingRef.current && cameraSourceReady()) {
          console.log("Interval capture triggered");
          sendFramesToAPI();
        } else {
          console.log("Interval capture skipped - processing:", isProcessing, "capturing:", isCapturingRef.current, "apiPending:", isApiCallPendingRef.current);
        }
      }, 10000);
    }
    
    return () => {
      console.log("Cleaning up timers for lesson:", lessonName);
      if (startDelay) clearTimeout(startDelay);
      if (interval) clearInterval(interval);
    };
  }, [cameraEnabled, apiLessonPath, lessonPath, t]);

  const handleToggleCamera = async () => {
    if (!isWeb && !cameraEnabled && !permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(t('practice.permissionTitle'), t('practice.permissionMessage'));
        return;
      }
    }
    
    if (isProcessing || isRecording || isCapturingRef.current) {
      isCapturingRef.current = false;
      setIsProcessing(false);
      setIsRecording(false);
      
      if (!isWeb && cameraRef.current) {
        try {
          if ((cameraRef.current as any)?.stopRecording) {
            (cameraRef.current as any).stopRecording();
          }
        } catch (error) {
          console.log("Error stopping recording:", error);
        }
      }
      
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = null;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (isWeb) {
      if (!cameraEnabled) {
        const started = await startWebCameraStream();
        if (started) {
          setCameraEnabled(true);
          setStatus(t('practice.stateIdle'));
        }
      } else {
        stopWebCameraStream();
        setCameraEnabled(false);
        cameraReadyRef.current = false;
        setStatus(t('practice.stateIdle'));
      }
      return;
    }
    
    setCameraEnabled((prev) => {
      if (prev) {
        isCapturingRef.current = false;
        setIsProcessing(false);
        setIsRecording(false);
        cameraReadyRef.current = false;
        setStatus(t('practice.stateIdle'));
      } else {
        cameraReadyRef.current = false;
      }
      return !prev;
    });
  };

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

  const player = useVideoPlayer(videoSource, (player: any) => {
    if (player) {
      player.loop = true;
      player.muted = true;
      setTimeout(() => {
        try {
          player.play();
        } catch (error) {
          console.log("Error playing video in callback:", error);
        }
      }, 100);
    }
  });

  useEffect(() => {
    if (player) {
      player.loop = true;
      player.muted = true;
      const playVideo = () => {
        try {
          if (player && isMountedRef.current) {
            player.play();
          }
        } catch (error) {
          console.log("Error playing video:", error);
        }
      };
      playVideo();
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

  useEffect(() => {
    if (!player) return;
    
    const checkAndPlay = () => {
      try {
        if (player && isMountedRef.current) {
          player.play();
        }
      } catch (error) {
        // Ignore
      }
    };
    const interval = setInterval(checkAndPlay, 1000);
    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    if (player && cameraEnabled) {
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
      const timer = setTimeout(playVideo, 500);
      return () => clearTimeout(timer);
    }
  }, [cameraEnabled, player]);

  const statusColors = useMemo(() => {
    if (status === t('practice.nextSign')) {
      return { bg: NB.color.accentLight, text: NB.color.text, border: NB.color.border };
    }
    if (status === t('practice.tryAgain')) {
      return { bg: NB.color.dangerLight, text: NB.color.danger, border: NB.color.danger };
    }
    if (status.includes("Đang quay") || status.includes(t('practice.stateSending')) || status.includes("⏳")) {
      return { bg: NB.color.secondaryLight, text: NB.color.text, border: NB.color.border };
    }
    return { bg: NB.color.mutedBg, text: NB.color.text, border: NB.color.border };
  }, [status, t]);

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.titleCardWrap}>
        <BrutalCard style={styles.titleCard} color={NB.color.secondary} padded={false}>
          <Text style={styles.mainTitle}>{lessonTitle}</Text>
        </BrutalCard>
      </View>
      
      {/* Layout Row */}
      <View style={styles.contentRow}>
        {/* Video Section */}
        <View style={styles.videoSection}>
          <BrutalCard style={styles.card} color={NB.color.surface}>
            <View style={styles.sectionHeader}>
              <BrutalIcon name="play" size={18} color={NB.color.text} />
              <Text style={styles.sectionTitle}>{t('practice.sampleVideo')}</Text>
            </View>
            <View style={styles.mediaContainer}>
              {isWeb ? (
                <View style={styles.webVideoWrapper}>
                  {webVideoStatus === 'loading' && (
                    <Text style={styles.webVideoStatus}>{t('practice.webLoadingVideo')}</Text>
                  )}
                  {webVideoStatus === 'error' && (
                    <Text style={styles.webVideoStatusError}>{t('practice.webErrorVideo')}</Text>
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
          </BrutalCard>
        </View>

        {/* Camera Section */}
        <View style={styles.cameraSection}>
          <BrutalCard style={styles.card} color={NB.color.surface}>
            <View style={styles.sectionHeader}>
              <BrutalIcon name="camera" size={18} color={NB.color.text} />
              <Text style={styles.sectionTitle}>{t('practice.yourCamera')}</Text>
            </View>
            
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
                    <BrutalIcon name="camera" size={40} color={NB.color.muted} />
                    <Text style={styles.placeholderText}>
                      {webCameraError ?? t('practice.startCamera')}
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
                    const delay = isTablet ? 2000 : 800;
                    setTimeout(() => {
                      if (isMountedRef.current && cameraRef.current) {
                        cameraReadyRef.current = true;
                        console.log(`Camera fully ready and set (after ${delay}ms delay)`);
                      }
                    }, delay);
                  }}
                />
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <BrutalIcon name="camera" size={40} color={NB.color.muted} />
                  <Text style={styles.placeholderText}>
                    {permission?.granted ? t('practice.cameraEmpty') : t('practice.cameraNoPermission')}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Status Indicator */}
            <View style={[styles.statusContainer, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {status === t('practice.nextSign') && "✅ "}
                {status === t('practice.tryAgain') && "❌ "}
                {status.includes("Đang quay") && "📸 "}
                {status.includes(t('practice.stateSending')) && "⏳ "}
                {status}
              </Text>

              {status === t('practice.nextSign') && countdown > 0 && (
                <Text style={styles.countdownText}>
                  {t('practice.nextCountdown', { time: countdown })}
                </Text>
              )}
            </View>
          </BrutalCard>
        </View>
      </View>

      {/* Control float Button */}
      <TouchableOpacity
        style={[
          styles.floatButton,
          cameraEnabled ? styles.floatButtonActive : styles.floatButtonInactive,
          Platform.OS === 'web' && { boxShadow: '4px 4px 0px #111111' } as any
        ]}
        onPress={handleToggleCamera}
        activeOpacity={0.9}
      >
        <BrutalIcon name={cameraEnabled ? "close" : "play"} size={26} color="#FFFFFF" strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NB.color.bg,
    padding: isSmallScreen ? 12 : 20,
    gap: 16,
  },
  titleCardWrap: {
    width: '100%',
  },
  titleCard: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '900',
    color: NB.color.text,
    textAlign: 'center',
  },
  contentRow: {
    flex: 1,
    flexDirection: isTablet ? 'row' : 'column',
    gap: 16,
  },
  videoSection: {
    flex: isTablet ? 1 : undefined,
    height: isTablet ? '100%' : undefined,
  },
  cameraSection: {
    flex: isTablet ? 1 : 1.2,
    height: isTablet ? '100%' : undefined,
  },
  card: {
    flex: 1,
    height: '100%',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: NB.color.text,
  },
  mediaContainer: {
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    overflow: 'hidden',
    backgroundColor: '#000000',
    flex: 1,
  },
  webVideoWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 240,
  },
  webVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as any,
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    minHeight: 240,
  },
  cameraContainer: {
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    overflow: 'hidden',
    backgroundColor: '#000000',
    flex: 1,
    minHeight: 240,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  webCameraWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
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
    color: NB.color.danger,
    fontWeight: '800',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: NB.border.thin,
    borderColor: NB.color.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: NB.radius.xs,
  },
  cameraPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: NB.color.mutedBg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: NB.color.text,
    textAlign: 'center',
  },
  webVideoStatus: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  webVideoStatusError: {
    color: NB.color.danger,
    fontWeight: '900',
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    marginTop: 8,
    ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 0px #111111' } : {}),
  },
  statusText: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    color: NB.color.text,
  },
  // FLOAT BUTTON
  floatButton: {
    position: 'absolute',
    bottom: isSmallScreen ? 20 : 30,
    right: isSmallScreen ? 20 : 30,
    width: isSmallScreen ? 60 : 72,
    height: isSmallScreen ? 60 : 72,
    borderRadius: isSmallScreen ? 30 : 36,
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    ...(Platform.OS !== 'web' ? {
      shadowColor: '#111111',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 6,
    } : {}),
  },
  floatButtonInactive: {
    backgroundColor: NB.color.accent,
  },
  floatButtonActive: {
    backgroundColor: NB.color.danger,
  },
});
