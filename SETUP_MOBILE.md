# Hướng dẫn chạy app trên điện thoại thật với Expo Go

## Bước 1: Cài đặt dependencies

```bash
cd ReactNative_Frontend/HearMeApp
npm install expo-video expo-camera
```

## Bước 2: Tìm địa chỉ IP của máy tính

### Windows:
1. Mở Command Prompt (CMD)
2. Chạy lệnh: `ipconfig`
3. Tìm dòng "IPv4 Address" (thường có dạng 192.168.x.x hoặc 10.0.x.x)
4. Ví dụ: `192.168.1.100`

### Mac/Linux:
1. Mở Terminal
2. Chạy lệnh: `ifconfig` hoặc `ip addr`
3. Tìm địa chỉ IP (thường ở phần en0 hoặc wlan0)
4. Ví dụ: `192.168.1.100`

## Bước 3: Cấu hình IP trong code

Mở file `constants/config.ts` và thay đổi dòng này:

```typescript
return '192.168.1.100'; // THAY ĐỔI IP NÀY thành IP máy tính của bạn
```

Ví dụ, nếu IP máy bạn là `192.168.0.105`, thay thành:

```typescript
return '192.168.0.105';
```

## Bước 4: Đảm bảo Backend đang chạy

```bash
cd BackEndHearMe_Version2
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Quan trọng**: Phải dùng `--host 0.0.0.0` để backend lắng nghe trên tất cả network interfaces, không chỉ localhost!

## Bước 5: Đảm bảo Firewall không chặn

### Windows Firewall:
1. Mở Windows Defender Firewall
2. Chọn "Allow an app through firewall"
3. Tìm Python và cho phép cả Private và Public networks
4. Hoặc tạm thời tắt firewall để test

### Mac:
1. Mở System Preferences → Security & Privacy → Firewall
2. Đảm bảo Python được cho phép accept incoming connections

## Bước 6: Khởi động Expo

```bash
cd ReactNative_Frontend/HearMeApp
npm start
```

## Bước 7: Quét QR Code

1. Mở Expo Go app trên điện thoại
2. Quét QR code hiển thị trong terminal hoặc trình duyệt
3. Đợi app load

## Kiểm tra kết nối

Khi app mở, hãy xem Console logs. Bạn sẽ thấy:

```
=== API Configuration ===
Platform: ios (hoặc android)
Backend URL: http://192.168.1.100:8000
Metro URL: http://192.168.1.100:8081
Local IP: 192.168.1.100
========================
```

Nếu thấy log này, có nghĩa là cấu hình đã đúng!

## Troubleshooting

### Lỗi "Network request failed"

**Nguyên nhân**: Backend không kết nối được từ điện thoại

**Giải pháp**:
1. Kiểm tra máy tính và điện thoại cùng WiFi
2. Kiểm tra IP trong `config.ts` đúng chưa
3. Kiểm tra backend chạy với `--host 0.0.0.0`
4. Kiểm tra firewall không chặn port 8000
5. Thử ping từ điện thoại đến máy tính:
   - iOS: Dùng app "Network Ping Lite"
   - Android: Dùng app "Ping & Net"

### Lỗi "Unable to resolve module"

**Giải pháp**:
```bash
# Xóa cache và cài lại
rm -rf node_modules
npm install
npm start -- --clear
```

### Video không phát

**Nguyên nhân**: Video path không đúng hoặc Metro bundler không serve được

**Giải pháp**:
1. Kiểm tra file video có trong thư mục `public/Family_video2/`
2. Restart Metro bundler với `npm start -- --clear`
3. Kiểm tra console log "Video source:" để xem URL có đúng không

### Camera không hoạt động

**Giải pháp**:
1. Cấp quyền camera cho Expo Go app trong Settings điện thoại
2. Restart Expo Go app

## Test Backend từ trình duyệt điện thoại

Để chắc chắn backend kết nối được, mở trình duyệt trên điện thoại và truy cập:

```
http://[YOUR_IP]:8000/docs
```

Ví dụ: `http://192.168.1.100:8000/docs`

Nếu thấy Swagger UI, backend đã kết nối thành công!

## Kiểm tra nhanh IP có đúng không

Trong app, mở tab "Lessons", console sẽ log:

```
Fetching roadmap from: http://192.168.1.100:8000/api/roadmap
```

Nếu thấy log này và không có lỗi, IP đã đúng!

