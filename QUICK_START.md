# Quick Start - Chạy app trên điện thoại với Expo Go

## 📱 Bước 1: Cài đặt dependencies

```bash
cd ReactNative_Frontend/HearMeApp
npm install
```

## 🔍 Bước 2: Tìm IP máy tính

### Windows:
```bash
ipconfig
```
Tìm dòng **IPv4 Address**, ví dụ: `192.168.1.100`

### Mac/Linux:
```bash
ifconfig | grep "inet "
```
Hoặc
```bash
ip addr show
```

## ⚙️ Bước 3: Cấu hình IP

Mở file: `constants/config.ts`

Tìm dòng:
```typescript
return '192.168.1.100'; // THAY ĐỔI IP NÀY
```

Thay bằng IP máy tính của bạn, ví dụ:
```typescript
return '192.168.0.105'; // IP của bạn
```

## 🚀 Bước 4: Khởi động Backend

```bash
cd BackEndHearMe_Version2
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**⚠️ Quan trọng**: Phải dùng `--host 0.0.0.0` để điện thoại kết nối được!

## 📲 Bước 5: Khởi động Expo

```bash
cd ReactNative_Frontend/HearMeApp
npm start
```

## 📱 Bước 6: Quét QR Code

1. Cài **Expo Go** app trên điện thoại:
   - iOS: App Store
   - Android: Google Play

2. Quét QR code từ terminal

3. Đợi app load

## ✅ Kiểm tra

Khi app mở, bạn sẽ thấy log trong console:

```
=== API Configuration ===
Platform: ios (hoặc android)
Backend URL: http://192.168.1.100:8000
Metro URL: http://192.168.1.100:8081
Local IP: 192.168.1.100
========================
```

## 🧪 Test Backend

Mở trình duyệt trên điện thoại, truy cập:
```
http://[IP_CUA_BAN]:8000/docs
```

Ví dụ: `http://192.168.1.100:8000/docs`

Nếu thấy Swagger UI → Backend OK! ✅

## 🎯 Sử dụng

1. Chọn tab **Lessons**
2. Chọn một chương và bài học
3. Nhấn **Bật Webcam**
4. Làm động tác theo video mẫu
5. App tự động nhận diện và chuyển bài

## ⚠️ Lưu ý

- Máy tính và điện thoại phải **cùng WiFi**
- Tắt VPN nếu có
- Firewall có thể chặn, cần cho phép Python qua firewall

## 🐛 Lỗi thường gặp

### "Network request failed"
- ✅ Kiểm tra cùng WiFi
- ✅ Kiểm tra IP trong `config.ts`
- ✅ Backend chạy với `--host 0.0.0.0`
- ✅ Tắt firewall thử

### Video không phát
- ✅ Restart Metro: `npm start -- --clear`
- ✅ Kiểm tra video trong `public/Family_video2/`

### Camera không hoạt động
- ✅ Cấp quyền camera cho Expo Go trong Settings

## 📞 Cần hỗ trợ?

Xem chi tiết trong file: `SETUP_MOBILE.md`

