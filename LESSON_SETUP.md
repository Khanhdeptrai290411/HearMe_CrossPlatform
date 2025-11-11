# Hướng dẫn sử dụng tính năng Lessons

## Cài đặt Dependencies

Đã cài đặt các package cần thiết:
- `expo-camera` - Để sử dụng camera của thiết bị
- `expo-av` - Để phát video
- `@react-native-async-storage/async-storage` - Để lưu trữ dữ liệu local

## Cấu trúc

### 1. Trang Lessons (`app/(tabs)/lessons.tsx`)
- Hiển thị danh sách các chương và bài học từ API roadmap
- Theo dõi tiến độ học tập của người dùng
- Cho phép chọn bài học để thực hành

### 2. Component Lesson (`components/Lesson.tsx`)
- Hiển thị video mẫu của bài học
- Sử dụng camera để quay video thực hành
- Tự động chụp 60 frames (2 giây) và gửi lên backend
- Backend sẽ tự động xử lý keypoints và so sánh
- Tự động chuyển bài khi làm đúng

## Cách sử dụng

### 1. Khởi động Backend
```bash
cd BackEndHearMe_Version2
python -m uvicorn app.main:app --reload
```

### 2. Khởi động React Native App
```bash
cd ReactNative_Frontend/HearMeApp
npm start
```

### 3. Cấu hình Backend URL

**Quan trọng**: Trong môi trường React Native, `localhost` không hoạt động như web browser.

- **iOS Simulator**: Sử dụng `http://localhost:8000`
- **Android Emulator**: Sử dụng `http://10.0.2.2:8000`
- **Physical Device**: Sử dụng IP máy tính của bạn (ví dụ: `http://192.168.1.100:8000`)

Cập nhật URL trong các file:
- `app/(tabs)/lessons.tsx` (dòng 16, 45, 133)
- `components/Lesson.tsx` (dòng 115)

### 4. Thực hành bài học

1. Mở app và chuyển đến tab "Lessons"
2. Chọn một chương và bài học
3. Xem video mẫu
4. Nhấn "Bật Webcam" để bắt đầu thực hành
5. Làm động tác theo video mẫu
6. App sẽ tự động chụp và gửi frames lên backend mỗi 3 giây
7. Backend xử lý keypoints và trả về kết quả
8. Nếu khớp, tự động chuyển sang bài tiếp theo sau 3 giây

## Video Path

Video được lấy từ thư mục `public/Family_video2/` và sử dụng model ID = 1 (Family model)

Format video path trong roadmap API:
```
/Family_video2/[filename].mp4
```

## API Endpoints

### 1. GET `/api/roadmap`
Lấy danh sách tất cả các chương và bài học

### 2. GET `/api/course/user-progress/{user_id}`
Lấy danh sách các bài học đã hoàn thành của user

### 3. POST `/api/process-video`
Gửi frames để xử lý
```json
{
  "frames": ["data:image/jpeg;base64,..."],
  "lessonPath": "/Family_video2/xxx.mp4",
  "modelId": 1
}
```

Response:
```json
{
  "status": "Match!" | "No match"
}
```

## Troubleshooting

### Camera không hoạt động
- Kiểm tra quyền camera đã được cấp
- Trên iOS: Kiểm tra Info.plist đã có NSCameraUsageDescription
- Trên Android: Kiểm tra AndroidManifest.xml đã có camera permission

### Video không phát
- Kiểm tra đường dẫn video có đúng không
- Kiểm tra file video có tồn tại trong thư mục public
- Đảm bảo Metro bundler đang chạy

### Không kết nối được backend
- Kiểm tra backend đang chạy
- Kiểm tra URL backend phù hợp với thiết bị
- Kiểm tra firewall không chặn kết nối

### Frames gửi lên backend bị lỗi
- Kiểm tra kích thước frames không quá lớn
- Kiểm tra định dạng base64 đúng
- Kiểm tra backend có log lỗi không

