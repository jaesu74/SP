import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './auth';

// 인증 컨텍스트 생성
const AuthContext = createContext({
  user: null,
  loading: true
});

/**
 * 인증 컨텍스트 제공자 컴포넌트
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 변경 감지 설정
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // 정리 함수로 구독 해제
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 인증 컨텍스트 사용을 위한 훅
 */
export const useAuth = () => {
  return useContext(AuthContext);
}; 