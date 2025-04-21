// Firebase 클라이언트 설정
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase 구성 - 클라이언트 측
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase 앱이 이미 초기화되었는지 확인
let firebaseApp;
let auth;

// Firebase가 클라이언트 사이드에서만 초기화되도록 함
if (typeof window !== 'undefined') {
  try {
    // 기존 앱이 있는지 확인
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    console.log("Firebase가 성공적으로 초기화되었습니다.");
  } catch (error) {
    console.error("Firebase 초기화 중 오류:", error);
  }
}

export { firebaseApp, auth }; 