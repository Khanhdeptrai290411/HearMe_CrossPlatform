# 📸 Nguyên Lý Chụp 60 Frames

## 🎯 Tại sao cần 60 frames?

### Sign Language là **ĐỘNG TÁC**, không phải ảnh tĩnh

```
❌ SAI: Chụp 1 ảnh
✅ ĐÚNG: Chụp 60 ảnh (2 giây video @ 30fps)
```

**Ví dụ:** Động tác "HELLO"
```
Frame 1-10:   Tay ở dưới
Frame 11-30:  Giơ tay lên ✋
Frame 31-50:  Vẫy tay 👋👋
Frame 51-60:  Hạ tay xuống
```

→ AI cần xem **quỹ đạo chuyển động** qua 60 frames để nhận diện

---

## 🔄 Quy Trình Chụp

### Step 1: Loop chụp 60 lần

```typescript
const frames: string[] = [];
const frameCount = 60;

while (frames.length < frameCount) {
  // Chụp 1 frame
  const photo = await cameraRef.current.takePictureAsync({
    base64: true,      // Trả về base64 string
    quality: 0.7,      // 70% quality (cân bằng size vs chất lượng)
    skipProcessing: true // Skip post-processing để nhanh
  });
  
  // Lưu vào array
  frames.push(`data:image/jpeg;base64,${photo.base64}`);
  
  // Delay 30ms để camera kịp xử lý
  await new Promise(resolve => setTimeout(resolve, 30));
}
```

**Timeline:**
```
0ms    → Frame 1  (base64: ~50KB)
30ms   → Frame 2
60ms   → Frame 3
...
1800ms → Frame 60 ✅

Total: ~3MB data (60 × 50KB)
```

### Step 2: Gửi lên backend

```typescript
fetch("/api/process-video", {
  method: "POST",
  body: JSON.stringify({
    frames: frames,        // Array of 60 base64 strings
    lessonPath: "/Family_video2/HELLO.mp4",
    modelId: 1
  })
});
```

### Step 3: Backend xử lý

```python
# Backend: app/api/video.py

user_landmarks = []

# Loop qua 60 frames
for frame_data in frames[:60]:
    # 1. Decode base64 → numpy array
    img_data = base64.b64decode(frame_data.split(',')[1])
    frame = cv2.imdecode(np.frombuffer(img_data, np.uint8))
    
    # 2. Extract landmarks từ frame (MediaPipe)
    landmarks = landmark_service.get_frame_landmarks(frame)
    #    → 21 keypoints cho mỗi tay [x, y, z]
    #    → Ví dụ: [[0.5, 0.3, 0.1], [0.52, 0.31, 0.11], ...]
    
    user_landmarks.append(landmarks)

# user_landmarks giờ là array of 60 landmark arrays
# Shape: (60 frames, 21 keypoints, 3 coordinates) = (60, 21, 3)

# 3. LSTM Model xử lý chuỗi
user_embedding = model_service.extract_embedding(user_landmarks)
#    → Vector 128D đại diện cho toàn bộ động tác

# 4. So sánh với reference
reference_embedding = np.load("HELLO_embedding.npy")
similarity = cosine_similarity(user_embedding, reference_embedding)
#    → 0.85 (85% giống)

# 5. Trả về kết quả
if similarity > 0.7:
    return "Match!"
else:
    return "No match"
```

---

## 🧠 Tại sao AI cần chuỗi frames?

### LSTM (Long Short-Term Memory) Neural Network

```
Input:  60 frames × 21 keypoints × 3 coords = (60, 21, 3)
        ↓
    [LSTM Layer]  ← Học pattern theo thời gian
        ↓
    [Dense Layer]
        ↓
Output: 128D embedding vector
```

**LSTM có "bộ nhớ":**
- Nhớ vị trí tay ở frame trước
- So sánh với vị trí hiện tại
- Nhận biết **hướng chuyển động**
- Nhận biết **tốc độ chuyển động**

**Ví dụ:**
```
HELLO:  Tay lên nhanh → vẫy → xuống chậm
BYE:    Tay lên chậm → vẫy → xuống nhanh

→ Cùng "vẫy tay" nhưng khác nhau về pattern!
```

---

## ⚠️ Vấn Đề "Camera Unmounted"

### Nguyên nhân:

```typescript
// Timeline:
[0s]   Bắt đầu chụp 60 frames
[1s]   Đang chụp frame 30/60...
[1.5s] Match! → Countdown 3s...
[2s]   Đang chụp frame 50/60...
[2.5s] 🔥 Component re-render → Camera unmount!
       ❌ ERROR: Camera unmounted during taking photo
```

**Khi nào xảy ra:**
1. Component re-render (props/state thay đổi)
2. Navigation (chuyển bài)
3. User tắt camera giữa chừng

### Giải pháp: `isMountedRef`

```typescript
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false; // Cleanup khi unmount
  };
}, []);

// Trong loop chụp:
while (frames.length < frameCount) {
  // Kiểm tra component vẫn mounted
  if (!isMountedRef.current) {
    console.log("Component unmounted, stop capture");
    break; // Dừng ngay
  }
  
  try {
    const photo = await takePictureAsync(...);
    frames.push(...);
  } catch (error) {
    if (error.message.includes('unmounted')) {
      break; // Dừng khi camera unmount
    }
  }
}
```

**Tại sao dùng `useRef` thay vì `useState`?**
- `useRef` không trigger re-render
- Giá trị persist qua các render
- Access được trong async function

---

## 📊 Performance

### Thời gian xử lý:

```
📸 Chụp 60 frames:     ~2-3 giây
⏳ Encode base64:      ~0.5 giây
📤 Upload ~3MB:        ~1-2 giây (WiFi)
🧠 Backend xử lý:      ~2-3 giây
📥 Nhận kết quả:       ~0.5 giây
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  TỔNG:              ~6-11 giây
```

### Tối ưu hóa:

**Đã làm:**
- ✅ Quality 0.7 (thay vì 1.0)
- ✅ skipProcessing: true
- ✅ Delay 30ms (cân bằng tốc độ vs ổn định)
- ✅ Kiểm tra mounted để tránh crash

**Có thể làm thêm:**
- 🔄 Giảm xuống 30 frames (1 giây)
- 🔄 WebSocket streaming (real-time)
- 🔄 On-device MediaPipe (chỉ gửi landmarks, nhẹ hơn)
- 🔄 Video compression trước khi gửi

---

## 🔍 Debug & Monitoring

### Console logs hữu ích:

```typescript
console.log("Starting capture 60 frames...");
// Bắt đầu chụp

console.log(`Đang chụp ${frames.length}/${frameCount}`);
// Tiến trình: 10/60, 20/60, ...

console.log(`Total frames captured: ${frames.length}`);
// Kết quả: 60/60 hoặc 45/60 (thiếu)

console.log("Component unmounted, stopping capture");
// Camera bị unmount giữa chừng

console.log("Stopping capture due to unmount");
// Dừng vì component unmount
```

### Kiểm tra frames:

```typescript
// Frame thứ nhất:
console.log(frames[0].substring(0, 50));
// "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."

// Kích thước:
console.log(`Frame size: ${frames[0].length} chars`);
// ~66,000 chars = ~50KB

// Tổng size:
const totalSize = frames.reduce((sum, f) => sum + f.length, 0);
console.log(`Total: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
// ~3.0MB
```

---

## 💡 Best Practices

### 1. **Đợi camera ổn định**
```typescript
// Đợi 3 giây sau khi bật camera
setTimeout(() => {
  sendFramesToAPI(); // Chụp lần đầu
}, 3000);
```

### 2. **Interval đủ dài**
```typescript
// Mỗi 6 giây (đủ thời gian chụp 60 frames)
setInterval(() => {
  if (!isProcessing) {
    sendFramesToAPI();
  }
}, 6000);
```

### 3. **Cleanup khi unmount**
```typescript
useEffect(() => {
  return () => {
    isMountedRef.current = false;
    // Các async operation sẽ tự dừng
  };
}, []);
```

### 4. **Không spam error log**
```typescript
if (consecutiveErrors <= 2) {
  console.warn(`Capture error (${consecutiveErrors}/5)`);
}
// Chỉ log 2 lỗi đầu, không spam console
```

---

## 📝 Summary

| Aspect | Detail |
|--------|--------|
| **Số frames** | 60 ảnh |
| **Thời gian** | 2 giây @ 30fps |
| **Kích thước** | ~3MB total |
| **Delay** | 30ms giữa các frame |
| **Quality** | 0.7 (70%) |
| **Backend** | MediaPipe + LSTM |
| **Output** | 128D embedding vector |
| **Similarity** | Cosine similarity (0-1) |
| **Threshold** | 0.7 (70%) để Match |

**Kết luận:** 60 frames là cần thiết để AI nhận diện chính xác động tác sign language! 🎯

