import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getAuth
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from './config';

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * 이메일/비밀번호로 로그인
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<Object>} - 로그인 결과
 */
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('로그인 오류:', error.code, error.message);
    let errorMessage = '로그인에 실패했습니다.';
    
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일 형식입니다.';
        break;
      case 'auth/user-disabled':
        errorMessage = '이 계정은 비활성화되었습니다.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
        break;
      default:
        errorMessage = '로그인 중 오류가 발생했습니다. 나중에 다시 시도해주세요.';
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
    let errorMessage = '회원가입에 실패했습니다.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = '이미 사용 중인 이메일입니다.';
        break;
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일 형식입니다.';
        break;
      case 'auth/weak-password':
        errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
        break;
      default:
        errorMessage = '회원가입 중 오류가 발생했습니다. 나중에 다시 시도해주세요.';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * 로그아웃
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
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
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: '로그인된 사용자가 없습니다.' };
    }
    
    await deleteUser(currentUser);
    return { success: true };
  } catch (error) {
    console.error('계정 삭제 오류:', error);
    return { success: false, error: '계정 삭제 중 오류가 발생했습니다.' };
  }
};

// 비밀번호 재설정 이메일 보내기
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 현재 인증된 사용자 가져오기
export const getCurrentUser = () => {
  return auth.currentUser;
};

// 사용자 프로필 업데이트
export const updateUserProfile = async (displayName, photoURL = null) => {
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

export { auth }; 