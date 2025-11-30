import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { getApiUrl } from '../constants/config';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (fullName?: string, email?: string, password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const segments = useSegments();

  // Load saved auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Navigate based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // User not logged in, redirect to login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // User logged in but on auth page, redirect to app
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user')
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // FastAPI OAuth2PasswordRequestForm requires form-data
      const formData = new FormData();
      formData.append('username', email); // FastAPI uses 'username' field
      formData.append('password', password);

      const response = await fetch(getApiUrl('/api/v1/auth/login'), {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Đăng nhập thất bại');
      }

      // Save token
      await AsyncStorage.setItem('token', data.access_token);
      setToken(data.access_token);

      // Get user info
      const userResponse = await fetch(getApiUrl('/api/v1/auth/me'), {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error('Không thể lấy thông tin người dùng');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (fullName: string, email: string, password: string) => {
    try {
      const response = await fetch(getApiUrl('/api/v1/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Đăng ký thất bại');
      }

      // After successful registration, auto sign in
      await signIn(email, password);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const userResponse = await fetch(getApiUrl('/api/v1/auth/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else if (userResponse.status === 401) {
        console.warn('Session expired while refreshing user. Staying on current screen until next action.');
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const updateUser = async (fullName?: string, email?: string, password?: string) => {
    if (!token) {
      throw new Error('Không có token xác thực');
    }

    try {
      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (email !== undefined) updateData.email = email;
      if (password !== undefined) updateData.password = password;

      const response = await fetch(getApiUrl('/api/v1/auth/me'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Cập nhật thông tin thất bại');
      }

      // Update user in state and storage
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setUser(data);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

