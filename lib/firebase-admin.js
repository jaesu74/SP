// Firebase Admin SDK 설정
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// 서비스 계정 정보 (환경 변수에서 로드)
let serviceAccount;

// 환경 변수에서 서비스 계정 정보 가져오기
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (error) {
    console.error("Firebase 서비스 계정 정보 파싱 오류:", error);
  }
} else {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT 환경 변수가 설정되지 않았습니다.");
  console.warn("Firebase Admin SDK가 비활성화되었습니다.");
  
  // 개발용 더미 서비스 계정 (실제 키 없음)
  serviceAccount = {
    "type": "service_account",
    "project_id": "example-project",
    "private_key_id": "PRIVATE_KEY_ID_REQUIRED",
    "private_key": "PRIVATE_KEY_REQUIRED",
    "client_email": "example@example-project.iam.gserviceaccount.com",
    "client_id": "CLIENT_ID_REQUIRED"
  };
}

// Firebase Admin 앱이 이미 초기화되었는지 확인
let adminApp;

// 서버 사이드에서만 실행되도록 함
if (typeof window === 'undefined') {
  try {
    const apps = getApps();
    
    if (!apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
      adminApp = initializeApp({
        credential: cert(serviceAccount)
      }, 'admin');
      console.log("Firebase Admin SDK가 성공적으로 초기화되었습니다.");
    } else if (apps.length) {
      adminApp = apps[0];
    } else {
      console.warn("Firebase Admin SDK가 초기화되지 않았습니다: 유효한 서비스 계정 정보가 없습니다.");
    }
  } catch (error) {
    console.error("Firebase Admin SDK 초기화 중 오류:", error);
  }
}

// 관리자 인증 기능 내보내기
export const adminAuth = adminApp ? getAuth(adminApp) : null; 