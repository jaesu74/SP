import { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from './config';

// Firebase 초기화 (클라이언트 사이드에서만)
let firebaseApp;
let auth;

// 인증 컨텍스트 생성
const AuthContext = createContext({
  user: null,
  loading: true,
  logout: async () => {},
});

// 인증 제공자 컴포넌트
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firebase 초기화
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      if (!firebaseApp) {
        if (getApps().length === 0) {
          firebaseApp = initializeApp(firebaseConfig);
        } else {
          firebaseApp = getApps()[0];
        }
        auth = getAuth(firebaseApp);
      }
    } catch (error) {
      console.error('Firebase 초기화 오류:', error);
      setLoading(false);
    }
  }, []);

  // 로그아웃 함수
  const logout = async () => {
    if (typeof window === 'undefined' || !auth) return;
    
    try {
      await signOut(auth);
      setUser(null);
      
      // 로컬 스토리지에서 사용자 정보 삭제
      localStorage.removeItem('sanctions_search_auth_token');
      localStorage.removeItem('sanctions_search_user_info');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 인증 상태 변경 감지
  useEffect(() => {
    if (typeof window === 'undefined' || !auth) {
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // 사용자 정보 로컬 스토리지에 저장
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem('sanctions_search_user_info', JSON.stringify(userData));
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 인증 컨텍스트 훅
export const useAuth = () => useContext(AuthContext); 