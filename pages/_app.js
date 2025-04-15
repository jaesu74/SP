import '../styles/globals.css';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// 서버 사이드 렌더링 없이 클라이언트에서만 AuthProvider 사용
const AuthProviderClient = dynamic(() => import('@/lib/firebase/context').then((mod) => mod.AuthProvider), {
  ssr: false,
});

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 디렉토리 설정 API 호출
    fetch('/api/setup-directories', {
      method: 'POST',
    })
      .then(res => res.json())
      .then(data => console.log('디렉토리 설정:', data))
      .catch(err => console.error('디렉토리 설정 오류:', err));
  }, []);

  if (!mounted) return null;

  return (
    <AuthProviderClient>
      <Component {...pageProps} />
    </AuthProviderClient>
  );
}

export default MyApp; 