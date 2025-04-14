import { useEffect, useState } from 'react';
import '../styles/globals.css';
import dynamic from 'next/dynamic';

// Firebase 인증 컨텍스트를 클라이언트 사이드에서만 로드
const AuthProviderClient = dynamic(
  () => import('../lib/firebase/context').then(mod => ({ default: mod.AuthProvider })),
  { ssr: false }
);

function MyApp({ Component, pageProps }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {isMounted ? (
        <AuthProviderClient>
          <Component {...pageProps} />
        </AuthProviderClient>
      ) : (
        <Component {...pageProps} />
      )}
    </>
  );
}

export default MyApp; 