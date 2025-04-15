import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getAuth,
  updatePassword
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from './config';

// Firebase 초기화 (클라이언트 사이드에서만)
let app;
let auth;

if (typeof window !== 'undefined') {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
  } catch (error) {
    console.error('Firebase 초기화 오류:', error);
  }
}

// 로컬 스토리지 키
export const AUTH_TOKEN_KEY = 'sanctions_search_auth_token';
export const USER_INFO_KEY = 'sanctions_search_user_info';

/**
 * 이메일/비밀번호로 로그인
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<Object>} - 로그인 결과
 */
export const loginWithEmailAndPassword = async (email, password) => {
  if (typeof window === 'undefined' || !auth) {
    console.warn('서버 사이드 렌더링 또는 Firebase가 초기화되지 않았습니다.');
    return { success: false, error: '인증 서비스를 사용할 수 없습니다.' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 로컬 스토리지에 사용자 정보 저장
    if (userCredential.user) {
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        lastLogin: new Date().toISOString()
      };
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData));
    }
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('로그인 오류:', error.code, error.message);
    
    let errorMessage = '로그인에 실패했습니다.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '너무 많은 시도로 인해 계정이 일시적으로 잠겼습니다. 나중에 다시 시도해주세요.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = '계정이 비활성화되었습니다. 관리자에게 문의하세요.';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * 이메일/비밀번호로 회원가입
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @param {string} displayName - 표시 이름
 * @returns {Promise<Object>} - 회원가입 결과
 */
export const registerWithEmailAndPassword = async (email, password, displayName = '') => {
  if (typeof window === 'undefined' || !auth) {
    console.warn('서버 사이드 렌더링 또는 Firebase가 초기화되지 않았습니다.');
    return { success: false, error: '인증 서비스를 사용할 수 없습니다.' };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 표시 이름 설정
    if (displayName) {
      await updateProfile(user, {
        displayName
      });
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('회원가입 오류:', error.code, error.message);
    
    let errorMessage = '회원가입 중 오류가 발생했습니다.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '이미 사용 중인 이메일 주소입니다.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '유효하지 않은 이메일 형식입니다.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * 로그아웃
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  if (typeof window === 'undefined' || !auth) {
    console.warn('서버 사이드 렌더링 또는 Firebase가 초기화되지 않았습니다.');
    return { success: false };
  }

  try {
    await signOut(auth);
    
    // 로컬 스토리지에서 사용자 정보 삭제
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    
    return { success: true };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
  }
};

/**
 * 현재 로그인한 사용자 계정 삭제
 * @returns {Promise<Object>} - 삭제 결과
 */
export const deleteUserAccount = async () => {
  if (typeof window === 'undefined' || !auth) {
    console.warn('서버 사이드 렌더링 또는 Firebase가 초기화되지 않았습니다.');
    return { success: false, error: '인증 서비스를 사용할 수 없습니다.' };
  }

  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, error: '로그인된 사용자가 없습니다.' };
    }
    
    await deleteUser(user);
    
    // 로컬 스토리지에서 사용자 정보 삭제
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    
    return { success: true };
  } catch (error) {
    console.error('계정 삭제 오류:', error);
    
    let errorMessage = '계정 삭제 중 오류가 발생했습니다.';
    if (error.code === 'auth/requires-recent-login') {
      errorMessage = '보안을 위해 다시 로그인한 후 계정 삭제를 진행해주세요.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// 비밀번호 재설정 이메일 보내기
export const resetPassword = async (email) => {
  if (typeof window === 'undefined' || !auth) {
    return { success: false, error: '인증 서비스를 사용할 수 없습니다.' };
  }

  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 현재 인증된 사용자 가져오기
export const getCurrentUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    // 먼저 로컬 스토리지에서 확인
    const userInfo = localStorage.getItem(USER_INFO_KEY);
    if (userInfo) {
      return JSON.parse(userInfo);
    }
    
    // 로컬 스토리지에 없으면 Firebase 확인
    return auth?.currentUser || null;
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    return null;
  }
};

// 사용자 프로필 업데이트
export const updateUserProfile = async (displayName, photoURL = null) => {
  if (typeof window === 'undefined' || !auth) {
    return { success: false, error: '인증 서비스를 사용할 수 없습니다.' };
  }

  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: '인증된 사용자가 없습니다.' };
    
    const updateData = { displayName };
    if (photoURL) updateData.photoURL = photoURL;
    
    await updateProfile(user, updateData);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 인증 토큰 가져오기
export const getAuthToken = async () => {
  if (typeof window === 'undefined' || !auth) {
    return null;
  }
  
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return null;
    }
    
    return await user.getIdToken();
  } catch (error) {
    console.error('인증 토큰 가져오기 오류:', error);
    return null;
  }
};

// 인증 여부 확인
export const isAuthenticated = () => {
  if (typeof window === 'undefined' || !auth) {
    return false;
  }
  
  return !!auth.currentUser;
};

// 사용자 재인증 
export const reauthenticateUser = async (password) => {
  if (typeof window === 'undefined' || !auth) {
    console.warn('서버 사이드 렌더링 또는 Firebase가 초기화되지 않았습니다.');
    return { success: false, error: '인증 서비스를 사용할 수 없습니다.' };
  }

  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '인증된 사용자가 없습니다.' };
    }
    
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    return { success: true };
  } catch (error) {
    console.error('재인증 오류:', error.code, error.message);
    
    let errorMessage = '재인증에 실패했습니다.';
    if (error.code === 'auth/wrong-password') {
      errorMessage = '현재 비밀번호가 올바르지 않습니다.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '너무 많은 시도로 인해 일시적으로 차단되었습니다. 나중에 다시 시도해주세요.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// 비밀번호 변경
export const changePassword = async (currentPassword, newPassword) => {
  if (typeof window === 'undefined' || !auth) {
    console.warn('서버 사이드 렌더링 또는 Firebase가 초기화되지 않았습니다.');
    return { success: false, error: '인증 서비스를 사용할 수 없습니다.' };
  }

  try {
    // 먼저 재인증 진행
    const reauth = await reauthenticateUser(currentPassword);
    if (!reauth.success) {
      return reauth; // 재인증 실패 시 해당 오류 반환
    }
    
    const user = auth.currentUser;
    await updatePassword(user, newPassword);
    
    return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
  } catch (error) {
    console.error('비밀번호 변경 오류:', error.code, error.message);
    
    let errorMessage = '비밀번호 변경에 실패했습니다.';
    if (error.code === 'auth/weak-password') {
      errorMessage = '새 비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
    }
    
    return { success: false, error: errorMessage };
  }
};

export { auth }; 