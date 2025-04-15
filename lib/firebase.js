// Firebase 클라이언트 설정
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase 구성 - 클라이언트 측
const firebaseConfig = {
  apiKey: "AIzaSyCu82sysG5VTNHpKEvEnT-A33B8EwBKT7A",
  authDomain: "sp-2504.firebaseapp.com",
  projectId: "sp-2504",
  storageBucket: "sp-2504.appspot.com",
  messagingSenderId: "107459326789618110284",
  appId: "1:107459326789618110284:web:e428f3b2f2a8c5d04fef1a"
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