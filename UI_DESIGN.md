# 📱 Thiết Kế UI Responsive

## Tổng quan

App được thiết kế để hoạt động tốt trên:
- 📱 **Điện thoại** (< 600px)
- 📱 **Điện thoại lớn** (600-768px)
- 📱 **Máy tính bảng** (>= 768px)
- 💻 **Web browser**

## Tính năng Responsive

### 1. **Trang Lessons**

#### Mobile (< 768px):
- **Sidebar full-width**: Chiếm toàn bộ màn hình
- **Ẩn sidebar khi chọn bài**: Chỉ hiển thị nội dung bài học
- **Nút "Quay lại"**: Để quay về danh sách bài học
- **Layout dọc**: Video và camera xếp dọc

#### Tablet/Desktop (>= 768px):
- **Sidebar cố định**: Rộng 320px, luôn hiển thị
- **Layout 2 cột**: Sidebar bên trái, nội dung bên phải
- **Không có nút back**: Luôn thấy cả sidebar và nội dung

### 2. **Component Lesson**

#### Mobile nhỏ (< 600px):
- Video height: **200px**
- Camera height: **200px**
- Padding: **12px**
- Font size nhỏ hơn
- **Scrollable**: Cuộn dọc để xem hết nội dung

#### Mobile lớn (600-768px):
- Video height: **280px**
- Camera height: **280px**
- Padding: **16px**

#### Tablet (>= 768px):
- Video height: **400px**
- Camera height: **400px**
- Padding: **24px**
- Layout rộng rãi hơn

## Giao Diện Cải Tiến

### 1. **Card-based Design**
- Video và Camera trong các card riêng biệt
- Bo tròn góc, shadow nhẹ
- Màu nền trắng, dễ nhìn

### 2. **Icon & Emoji**
- 📺 Video Mẫu
- 🎥 Thực Hành
- ✅ Khớp!
- ❌ Không khớp
- ⏳ Đang xử lý...
- 🔴 Tắt Camera
- ▶️ Bật Camera
- 🔄 Lật Camera

### 3. **Status Container**
- Nền xám nhạt
- Text to, màu sắc rõ ràng:
  - Xanh lá: Khớp
  - Đỏ: Không khớp
  - Cam: Đang xử lý

### 4. **Nút bấm**
- **Nút chính** (Bật Camera): Xanh lá (#10b981)
- **Nút phụ** (Lật Camera): Xanh tím (#6366f1)
- **Nút nguy hiểm** (Tắt Camera): Đỏ (#dc2626)
- Bo tròn 10px, padding rộng rãi

## Cách Hoạt Động

### Trên Mobile:

1. **Mở app** → Thấy danh sách các chương
2. **Chọn chương** → Mở ra các bài học
3. **Chọn bài học** → Sidebar ẩn, hiện nội dung bài
4. **Nút "Quay lại"** → Quay về danh sách
5. **Cuộn dọc** → Xem video mẫu và camera

### Trên Tablet/Desktop:

1. **Mở app** → Thấy sidebar và màn hình chính cùng lúc
2. **Chọn bài** → Nội dung hiện bên phải, sidebar vẫn ở bên trái
3. **Không cần cuộn nhiều** → Tất cả hiển thị thoải mái

## Breakpoints

```typescript
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 600;  // Mobile nhỏ
const isTablet = SCREEN_WIDTH >= 768;       // Tablet+
```

## Màu Sắc

### Primary Colors:
- **Indigo**: `#6366f1` - Chủ đạo
- **Blue**: `#3b82f6` - Phụ
- **Green**: `#10b981` - Success
- **Red**: `#dc2626` - Error
- **Orange**: `#f59e0b` - Processing

### Neutral Colors:
- Background: `#f9fafb`
- Card: `#ffffff`
- Text Dark: `#1f2937`
- Text Gray: `#6b7280`
- Border: `#e5e7eb`

## ScrollView

- **Lesson Component**: Có ScrollView để cuộn nội dung
- **Sidebar**: Có ScrollView để cuộn danh sách bài
- **Ẩn scrollbar indicator**: Giao diện sạch sẽ hơn

## Platform-specific

```typescript
Platform.OS === 'ios'     // iOS
Platform.OS === 'android' // Android
Platform.OS === 'web'     // Web browser
```

## Testing

### Test trên các kích thước:
- **iPhone SE**: 375px (Small mobile)
- **iPhone 14**: 390px (Standard mobile)
- **iPhone 14 Pro Max**: 430px (Large mobile)
- **iPad Mini**: 768px (Tablet)
- **iPad Pro**: 1024px (Large tablet)
- **Desktop**: 1920px (Desktop)

### Cách test:
1. **React Native**: Thay đổi kích thước simulator
2. **Expo Go**: Test trên thiết bị thật
3. **Web**: Resize browser window

