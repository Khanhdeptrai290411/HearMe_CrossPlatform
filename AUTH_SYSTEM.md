# 🔐 Hệ Thống Authentication

## Tổng quan

Ứng dụng sử dụng **AuthContext** để quản lý authentication state và **protected routes** để bảo vệ các trang cần đăng nhập.

## Kiến trúc

```
app/
├── _layout.tsx              # Root layout với AuthProvider
├── auth/                    # Auth routes (public)
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
└── (tabs)/                  # Protected routes (require login)
    ├── index.tsx
    ├── lessons.tsx
    ├── explore.tsx
    └── profile.tsx

contexts/
└── AuthContext.tsx          # Authentication context & logic
```

## Flow Authentication

### 1. **Khởi động app:**
```
[Mở app]
    ↓
[AuthProvider mount]
    ↓
[Load token từ AsyncStorage]
    ├─ Có token → Load user info → Navigate to (tabs)
    └─ Không có → Navigate to auth/login
```

### 2. **Đăng nhập:**
```
[auth/login]
    ↓
[Nhập email + password]
    ↓
[Call signIn(email, password)]
    ↓
[AuthContext: POST /auth/login]
    ↓
[Lưu token + user]
    ↓
[Auto navigate to (tabs)]
```

### 3. **Đăng ký:**
```
[auth/register]
    ↓
[Nhập fullName, email, password]
    ↓
[Call signUp(fullName, email, password)]
    ↓
[AuthContext: POST /auth/register]
    ↓
[Auto signIn(email, password)]
    ↓
[Auto navigate to (tabs)]
```

### 4. **Đăng xuất:**
```
[profile tab]
    ↓
[Bấm "Đăng xuất"]
    ↓
[Call signOut()]
    ↓
[Xóa token + user]
    ↓
[Auto navigate to auth/login]
```

## AuthContext API

### State
```typescript
interface AuthContextType {
  user: User | null;          // Current user info
  token: string | null;       // JWT token
  isLoading: boolean;         // Loading state
  signIn: (email, password) => Promise<void>;
  signUp: (fullName, email, password) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

### Usage
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, token, signIn, signOut, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  
  if (!user) {
    // Not logged in
    return <LoginButton onPress={() => signIn(email, password)} />;
  }
  
  // Logged in
  return <Profile user={user} onLogout={signOut} />;
}
```

## Protected Routes

**Tự động chuyển hướng:**
- Chưa đăng nhập → Truy cập `(tabs)/*` → Redirect to `auth/login`
- Đã đăng nhập → Truy cập `auth/*` → Redirect to `(tabs)`

**Được quản lý bởi:**
```typescript
// contexts/AuthContext.tsx
useEffect(() => {
  if (isLoading) return;

  const inAuthGroup = segments[0] === 'auth';
  
  if (!user && !inAuthGroup) {
    // Not logged in, redirect to login
    router.replace('/auth/login');
  } else if (user && inAuthGroup) {
    // Logged in, redirect to app
    router.replace('/(tabs)');
  }
}, [user, segments, isLoading]);
```

## Backend Integration

### Endpoints sử dụng:
```typescript
POST /auth/login       // OAuth2 Form login
POST /auth/register    // JSON registration
GET  /auth/me          // Get current user info
```

### Login Request (FormData - OAuth2):
```typescript
const formData = new FormData();
formData.append('username', email);  // FastAPI requires 'username'
formData.append('password', password);

fetch('/auth/login', {
  method: 'POST',
  body: formData
});
```

### Register Request (JSON):
```typescript
fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullName, email, password })
});
```

### Authenticated Requests:
```typescript
fetch('/api/some-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Storage

**AsyncStorage keys:**
- `token` - JWT access token
- `user` - Serialized user object (JSON)

**Tự động lưu khi:**
- Đăng nhập thành công
- Đăng ký thành công

**Tự động xóa khi:**
- Đăng xuất
- Token expired (cần implement refresh logic)

## Security

✅ **Token storage** - AsyncStorage (secure on device)
✅ **Auto navigation** - Protected routes
✅ **Form validation** - Email format, password length
✅ **Error handling** - User-friendly messages
✅ **Loading states** - Prevent double submissions

⚠️ **TODO:**
- [ ] Refresh token logic
- [ ] Token expiry handling
- [ ] Biometric authentication
- [ ] Remember me option
- [ ] Session timeout

## Testing

```bash
# Test login flow
1. Open app → Should show login screen
2. Enter valid credentials → Should navigate to (tabs)
3. Close & reopen app → Should stay logged in
4. Logout → Should navigate to login screen

# Test registration flow
1. Click "Tạo tài khoản mới"
2. Fill in all fields → Click "Đăng ký"
3. Should auto login and navigate to (tabs)

# Test protected routes
1. Try to access (tabs) without login → Should redirect to login
2. Login → Try to access /auth/login → Should redirect to (tabs)
```

## Error Messages

**Login:**
- "Vui lòng điền đầy đủ thông tin" - Missing fields
- "Incorrect email or password" - Invalid credentials

**Register:**
- "Email không hợp lệ" - Invalid email format
- "Mật khẩu phải có ít nhất 6 ký tự" - Password too short
- "Mật khẩu xác nhận không khớp" - Passwords don't match
- "Email đã được đăng ký" - Email already exists

## FAQ

**Q: Làm sao để bỏ qua đăng nhập?**
A: Hiện tại bắt buộc phải đăng nhập. Để cho phép guest mode, sửa logic trong `AuthContext.tsx`:
```typescript
if (!user && !inAuthGroup && !isGuestMode) {
  router.replace('/auth/login');
}
```

**Q: Token hết hạn xử lý như nào?**
A: Hiện tại chưa implement refresh token. Khi API trả 401, nên signOut và yêu cầu đăng nhập lại.

**Q: Có thể lưu thêm data vào user object không?**
A: Có, sửa trong `AuthContext` khi fetch `/auth/me`:
```typescript
const userData = await userResponse.json();
const enhancedUser = {
  ...userData,
  customField: 'value'
};
await AsyncStorage.setItem('user', JSON.stringify(enhancedUser));
```


