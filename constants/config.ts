// Cấu hình API URL cho các môi trường khác nhau
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Lấy IP từ Expo hoặc sử dụng IP mặc định
const getLocalIP = (): string => {
  // Expo cung cấp debuggerHost chứa IP của máy dev
  const debuggerHost = Constants.expoConfig?.hostUri;
  
  if (debuggerHost) {
    // debuggerHost có dạng "192.168.1.100:8081", ta chỉ lấy phần IP
    return debuggerHost.split(':')[0];
  }
  
  // Fallback: Thay YOUR_LOCAL_IP bằng IP thực tế của máy tính
  // Để tìm IP:
  // - Windows: chạy `ipconfig` trong CMD, tìm IPv4 Address
  // - Mac/Linux: chạy `ifconfig` hoặc `ip addr`
  return '192.168.1.100'; // THAY ĐỔI IP NÀY
};

// Xác định Backend URL dựa trên platform
const getBackendUrl = (): string => {
  if (__DEV__) {
    // Development mode
    const localIP = getLocalIP();
    
    // Nếu có debuggerHost từ Expo, có nghĩa là đang chạy trên thiết bị thật
    if (Constants.expoConfig?.hostUri) {
      // Thiết bị thật (physical device) - dùng IP
      return `http://${localIP}:8000`;
    }
    
    // Emulator/Simulator
    if (Platform.OS === 'android') {
      // Android emulator sử dụng 10.0.2.2 để truy cập localhost của host machine
      return 'http://10.0.2.2:8000';
    } else if (Platform.OS === 'ios') {
      // iOS simulator có thể dùng localhost
      return 'http://localhost:8000';
    } else {
      // Web - dùng localhost
      return 'http://localhost:8000';
    }
  }
  
  // Production mode - thay bằng URL production của bạn
  return 'https://your-production-api.com';
};

// Xác định Metro bundler URL cho video assets
const getMetroUrl = (): string => {
  if (__DEV__) {
    const localIP = getLocalIP();
    
    // Nếu có debuggerHost từ Expo, có nghĩa là đang chạy trên thiết bị thật
    if (Constants.expoConfig?.hostUri) {
      // Thiết bị thật - dùng IP
      return `http://${localIP}:8081`;
    }
    
    // Emulator/Simulator
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8081';
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:8081';
    } else {
      return 'http://localhost:8081';
    }
  }
  return '';
};

export const API_CONFIG = {
  BASE_URL: getBackendUrl(),
  METRO_URL: getMetroUrl(),
  TIMEOUT: 30000, // 30 seconds
  
  // API Endpoints
  ENDPOINTS: {
    ROADMAP: '/api/roadmap',
    USER_PROGRESS: '/api/course/user-progress',
    PROCESS_VIDEO: '/api/process-video',
    DICTIONARY_LIST: '/api/dictionary/vocabularies',
    DICTIONARY_DETAIL_PREFIX: '/api/dictionary/words', // + /{word}
    AUTH_LOGIN: '/api/v1/auth/login',
    AUTH_REGISTER: '/api/v1/auth/register',
    AUTH_ME: '/api/v1/auth/me',
    COURSES: '/api/v1/courses',
    QUIZZES: '/api/v1/quizzes',
  },
};

// Helper function để tạo full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const getCourseListUrl = (): string => {
  return getApiUrl(`${API_CONFIG.ENDPOINTS.COURSES}/`);
};

export const getCourseCreateUrl = (): string => {
  return getCourseListUrl();
};

export const getCourseDetailUrl = (courseId: string | number): string => {
  return getApiUrl(`${API_CONFIG.ENDPOINTS.COURSES}/${courseId}`);
};

export const getCourseQuizzesUrl = (courseId: string | number): string => {
  return getApiUrl(`${API_CONFIG.ENDPOINTS.COURSES}/${courseId}/quizzes/`);
};

export const getQuizDetailUrl = (quizId: string | number): string => {
  return getApiUrl(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}`);
};

export const getVideoUrl = (path: string): string => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${API_CONFIG.METRO_URL}${path}`;
};

export const getDictionaryListUrl = (): string => getApiUrl(API_CONFIG.ENDPOINTS.DICTIONARY_LIST);
export const getDictionaryDetailUrl = (word: string): string =>
  `${getApiUrl(API_CONFIG.ENDPOINTS.DICTIONARY_DETAIL_PREFIX)}/${encodeURIComponent(word)}`;

// Log để debug
console.log('=== API Configuration ===');
console.log('Platform:', Platform.OS);
console.log('Backend URL:', API_CONFIG.BASE_URL);
console.log('Metro URL:', API_CONFIG.METRO_URL);
console.log('Local IP:', getLocalIP());
console.log('========================');

