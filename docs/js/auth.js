/**
 * WVL Sanctions Authentication Module
 * Firebase 기반 사용자 인증 관련 기능 담당
 */

// 백엔드 API URL - 중복 선언 방지
window.AUTH_API_URL = window.AUTH_API_URL || "http://localhost:8000/api";

// 로컬 스토리지 키
const STORAGE_KEY = 'wvl_user_info';
const TOKEN_KEY = 'wvl_token';

// Firebase 설정 (백엔드에서 가져옴)
// firebaseConfig가 이미 선언되어 있는지 확인하고 초기화 
window.firebaseConfig = window.firebaseConfig || null;
let auth = null;

// Firebase 초기화
async function initFirebase() {
  try {
    if (!window.firebaseConfig) {
      // 백엔드에서 Firebase 설정 가져오기
      const response = await fetch(`${window.AUTH_API_URL}/firebase-config`);
      window.firebaseConfig = await response.json();
      
      // Firebase 초기화
      if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
      }
      auth = firebase.auth();
      
      // 언어 설정
      auth.languageCode = 'ko';
      
      console.log('Firebase 초기화 완료');
    } else if (!auth) {
      if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
      }
      auth = firebase.auth();
      auth.languageCode = 'ko';
    }
    return true;
  } catch (error) {
    console.error('Firebase 초기화 실패:', error);
    return false;
  }
}

/**
 * 알림 메시지 표시
 * @param {string} message 표시할 메시지
 * @param {string} type 알림 유형 (success, error, info, warning)
 * @param {Object} options 추가 옵션
 */
function showAlert(message, type = 'info', options = {}) {
  const target = options.target ? document.querySelector(options.target) : document.querySelector('.alert-container');
  if (!target) return;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  target.innerHTML = '';
  target.appendChild(alertDiv);
  
  if (!options.isStatic) {
    setTimeout(() => {
      alertDiv.classList.add('fade-out');
      setTimeout(() => {
        if (target.contains(alertDiv)) {
          target.removeChild(alertDiv);
        }
      }, 500);
    }, 3000);
  }
}

// 인증 모듈
const API = window.AUTH_API_URL;

/**
 * Firebase로 로그인
 * @param {string} email 이메일
 * @param {string} password 비밀번호
 * @returns {Promise<Object>} 로그인 결과
 */
async function firebaseLogin(email, password) {
  try {
    console.log('Firebase 로그인 시도:', email);
    const initialized = await initFirebase();
    if (!initialized) {
      console.error('Firebase 초기화 실패');
      return { success: false, msg: 'Firebase 초기화 실패' };
    }
    
    console.log('Firebase 인증 시작');
    try {
      // Firebase 이메일/비밀번호 로그인
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('Firebase 사용자 로그인 성공:', user.email);
      
      // Firebase ID 토큰 가져오기
      const idToken = await user.getIdToken(true);
      console.log('Firebase ID 토큰 획득 성공');
      
      // 백엔드에 Firebase 토큰 인증 요청
      console.log('백엔드 인증 요청 시작:', `${API}/firebase/login`);
      const response = await fetch(`${API}/firebase/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken })
      });
      
      let data;
      try {
        data = await response.json();
        console.log('백엔드 응답:', response.status, data);
      } catch (error) {
        console.error('백엔드 응답 파싱 오류:', error);
        data = { detail: '서버 응답을 처리할 수 없습니다.' };
      }
      
      if (!response.ok) {
        console.error('Firebase 백엔드 인증 실패:', data);
        // Firebase에서 로그아웃
        await auth.signOut();
        return { success: false, msg: data.detail || '인증 실패' };
      }
      
      // 사용자 정보 및 토큰 저장
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || data.user?.name || email.split('@')[0],
        isFirebase: true
      };
      
      console.log('인증 성공, 사용자 정보 저장:', userData);
      localStorage.setItem('wvl_token', data.access_token);
      localStorage.setItem('wvl_user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (firebaseError) {
      console.error('Firebase 인증 오류:', firebaseError.code, firebaseError.message);
      const errorMessage = getFirebaseErrorMessage(firebaseError);
      return { success: false, msg: errorMessage };
    }
  } catch (error) {
    console.error('Firebase 로그인 처리 중 예외 발생:', error);
    return { success: false, msg: '로그인 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * Firebase 오류 메시지 변환
 * @param {Error} error Firebase 오류 객체
 * @returns {string} 사용자 친화적인 오류 메시지
 */
function getFirebaseErrorMessage(error) {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'auth/user-not-found':
      return '해당 이메일로 등록된 사용자가 없습니다.';
    case 'auth/wrong-password':
      return '비밀번호가 올바르지 않습니다.';
    case 'auth/invalid-email':
      return '유효하지 않은 이메일 형식입니다.';
    case 'auth/user-disabled':
      return '해당 계정은 비활성화되었습니다.';
    case 'auth/too-many-requests':
      return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    case 'auth/network-request-failed':
      return '네트워크 연결에 문제가 있습니다.';
    default:
      return `로그인 중 오류가 발생했습니다: ${error.message}`;
  }
}

/**
 * 일반 백엔드 로그인
 * @param {string} email 이메일
 * @param {string} password 비밀번호
 * @returns {Promise<Object>} 로그인 결과
 */
async function backendLogin(email, password) {
  if(!email || !password) return { success: false, msg: '이메일과 비밀번호 필요' };
  
  try {
    const res = await fetch(`${API}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email,  // FastAPI OAuth2는 username 필드를 사용
        password: password
      })
    });
    
    const data = await res.json();
    
    if(!res.ok) return {
      success: false, 
      msg: data.detail || '로그인 실패'
    };
    
    // 토큰 저장
    localStorage.setItem('wvl_token', data.access_token);
    localStorage.setItem('wvl_user', JSON.stringify({
      ...data.user,
      isFirebase: false
    }));
    
    return { success: true, user: data.user };
  } catch(e) {
    console.error('백엔드 로그인 오류:', e);
    return { success: false, msg: '서버 오류' };
  }
}

/**
 * 로그인 처리 함수
 * @param {string} email 이메일
 * @param {string} password 비밀번호
 * @returns {Promise<Object>} 로그인 결과
 */
async function login(email, password) {
  try {
    console.log('로그인 시도:', email);
    
    // Firebase 로그인 시도
    const firebaseResult = await firebaseLogin(email, password);
    if (firebaseResult.success) {
      console.log('Firebase 로그인 성공');
      return firebaseResult;
    }
    
    console.log('Firebase 로그인 실패, 백엔드 로그인 시도');
    
    // Firebase 로그인 실패 시 백엔드 로그인 시도
    const backendResult = await backendLogin(email, password);
    if (backendResult.success) {
      console.log('백엔드 로그인 성공');
      return backendResult;
    }
    
    console.log('백엔드 로그인 실패');
    return { success: false, msg: backendResult.msg || firebaseResult.msg || '로그인에 실패했습니다.' };
  } catch (error) {
    console.error('로그인 오류:', error);
    return { success: false, msg: '로그인 중 오류가 발생했습니다.' };
  }
}

/**
 * Firebase 회원가입
 * @param {string} email 이메일
 * @param {string} password 비밀번호
 * @param {string} name 이름
 * @returns {Promise<Object>} 회원가입 결과
 */
async function firebaseRegister(email, password, name) {
  try {
    const initialized = await initFirebase();
    if (!initialized) {
      return { success: false, msg: 'Firebase 초기화 실패' };
    }
    
    // Firebase 회원가입
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // 사용자 프로필 업데이트
    await user.updateProfile({
      displayName: name || email.split('@')[0]
    });
    
    // Firebase ID 토큰 가져오기
    const idToken = await user.getIdToken(true);
    
    // 백엔드에 사용자 정보 동기화
    const response = await fetch(`${API}/firebase/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken })
    });
    
    if (!response.ok) {
      console.warn('백엔드 동기화는 실패했지만 회원가입은 성공했습니다.');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Firebase 회원가입 오류:', error);
    
    // Firebase 오류 메시지 변환
    let errorMessage = '회원가입 중 오류가 발생했습니다.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '이미 사용 중인 이메일입니다.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '유효하지 않은 이메일 형식입니다.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '비밀번호가 너무 약합니다.';
    }
    
    return { success: false, msg: errorMessage };
  }
}

/**
 * 회원가입 (Firebase 우선)
 * @param {string} email 이메일
 * @param {string} password 비밀번호
 * @param {string} name 이름
 * @returns {Promise<Object>} 회원가입 결과
 */
async function register(email, password, name) {
  if(!email || !password) return { success: false, msg: '이메일과 비밀번호 필요' };
  
  // Firebase 회원가입 시도
  try {
    return await firebaseRegister(email, password, name);
  } catch (error) {
    console.error('Firebase 회원가입 실패, 백엔드 회원가입 시도:', error);
    
    // 백엔드 회원가입 시도
    try {
      const res = await fetch(`${API}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, 
          password: password,
          name: name || email.split('@')[0]
        })
      });
      
      const data = await res.json();
      
      if(!res.ok) return {
        success: false, 
        msg: data.detail || '등록 실패'
      };
      
      return { success: true };
    } catch(e) {
      console.error('백엔드 회원가입 오류:', e);
      return { success: false, msg: '서버 오류' };
    }
  }
}

/**
 * 로그아웃 처리
 */
async function logout() {
  try {
    console.log('로그아웃 시작');
    
    // Firebase 로그아웃 시도
    try {
      if (firebase.apps.length && auth) {
        await auth.signOut();
        console.log('Firebase 로그아웃 성공');
      }
    } catch (firebaseError) {
      console.error('Firebase 로그아웃 오류:', firebaseError);
    }
    
    // 모든 인증 정보 삭제
    localStorage.removeItem('wvl_token');
    localStorage.removeItem('token');
    localStorage.removeItem('wvl_user');
    localStorage.removeItem('user');
    
    // SanctionsAPI 초기화
    if (window.sanctionsAPI) {
      window.sanctionsAPI = null;
    }
    
    console.log('로그아웃 완료, 로그인 페이지로 이동');
    
    // 페이지 리디렉션 (새로고침으로 모든 상태 초기화)
    window.location.href = window.location.origin + window.location.pathname;
    
    return { success: true };
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error);
    return { success: false, msg: '로그아웃 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자 정보 로컬 스토리지에서 가져오기
 * @returns {Object|null} 사용자 정보
 */
function getUserFromStorage() {
  try {
    const userStr = localStorage.getItem('wvl_user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('사용자 정보 파싱 오류:', error);
    return null;
  }
}

/**
 * 인증 상태 확인
 * @returns {boolean} 인증 여부
 */
function isAuth() {
  const token = localStorage.getItem('wvl_token');
  const userStr = localStorage.getItem('wvl_user');
  return !!token && !!userStr;
}

/**
 * 등록 양식 처리
 */
async function handleRegister(e) {
  e.preventDefault();
  
  const email = document.getElementById('register-email').value;
  const pw = document.getElementById('register-password').value;
  const pwConf = document.getElementById('register-password-confirm').value;
  const name = document.getElementById('register-name')?.value;
  
  if(!email || !pw) {
    showAlert('모든 필드를 입력하세요', 'warning');
    return;
  }
  
  if(pw !== pwConf) {
    showAlert('비밀번호가 일치하지 않습니다', 'warning');
    return;
  }
  
  const btn = document.getElementById('register-btn');
  const orgText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '처리 중...';
  
  const result = await register(email, pw, name);
  
  btn.disabled = false;
  btn.textContent = orgText;
  
  if(result.success) {
    showAlert('등록 성공! 로그인하세요', 'success');
    document.getElementById('register-form').reset();
    
    // 등록 모달 닫기
    const modal = document.getElementById('register-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  } else {
    showAlert(result.msg, 'error');
  }
}

/**
 * 로그인 양식 처리
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const pw = document.getElementById('password').value;
  
  if(!email || !pw) {
    showAlert('이메일과 비밀번호를 입력하세요', 'warning');
    return;
  }
  
  const btn = document.querySelector('#login-form button[type="submit"]');
  const orgText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '로그인 중...';
  
  const result = await login(email, pw);
  
  btn.disabled = false;
  btn.textContent = orgText;
  
  if(result.success) {
    // 메인 섹션 표시
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    
    if (loginSection && mainSection) {
      loginSection.style.display = 'none';
      mainSection.style.display = 'block';
    }
    
    // 사용자 정보 표시
    const user = getUserFromStorage();
    if (user) {
      const userInfo = document.getElementById('user-info');
      if (userInfo) {
        userInfo.textContent = `${user.name || user.email.split('@')[0]}님 환영합니다.`;
      }
    }
  } else {
    showAlert(result.msg, 'error');
  }
}

/**
 * 사용자 정보 가져오기
 * @returns {Promise<Object>} 사용자 정보
 */
async function getUserInfo() {
  try {
    // 로컬 스토리지에서 사용자 정보 확인
    const user = getUserFromStorage();
    if (!user) {
      throw new Error('로그인된 사용자가 없습니다.');
    }
    
    // Firebase 사용자인 경우
    if (user.isFirebase) {
      await initFirebase();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Firebase 사용자 세션이 만료되었습니다.');
      }
      
      // 최신 정보로 갱신
      await currentUser.reload();
      
      // ID 토큰 갱신
      const idToken = await currentUser.getIdToken(true);
      
      return {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || currentUser.email.split('@')[0],
        token: idToken,
        isFirebase: true
      };
    } else {
      // 백엔드 사용자인 경우 현재 저장된 정보 반환
      return user;
    }
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw error;
  }
}

/**
 * 메인 섹션 표시 (로그인 성공 시)
 * @param {Object} user 사용자 정보
 */
function showMainSection(user) {
    console.log('showMainSection 함수 호출됨', user);
    
    // 사용자 정보가 없으면 로컬 스토리지에서 가져오기 시도
    if (!user) {
        console.log('사용자 정보가 없습니다. 로컬 스토리지에서 가져옵니다.');
        user = getUserFromStorage();
        
        if (!user) {
            console.error('저장된 사용자 정보가 없습니다.');
            return;
        }
    }
    
    // 토큰 존재 여부 확인
    const token = localStorage.getItem('wvl_token');
    if (!token) {
        console.warn('인증 토큰이 없습니다. 로그인으로 리디렉션합니다.');
        // 로그인 섹션 표시
        const loginSection = document.getElementById('login-section');
        const mainSection = document.getElementById('main-section');
        
        if (loginSection && mainSection) {
            loginSection.style.display = 'flex';
            mainSection.style.display = 'none';
        }
        return;
    }
    
    console.log('사용자 정보:', user);
    
    // 로그인 섹션 숨기고 메인 섹션 표시
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    
    if (loginSection && mainSection) {
        loginSection.style.display = 'none';
        mainSection.style.display = 'block';
    }
    
    // 사용자 이름 표시
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        const displayName = user.name || user.email?.split('@')[0] || '사용자';
        console.log('표시할 이름:', displayName);
        userNameElement.textContent = displayName;
    }
    
    // 사용자 정보 표시
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
        const displayName = user.name || user.email?.split('@')[0] || '사용자';
        userInfoElement.textContent = `${displayName}님 환영합니다.`;
    }
    
    console.log('메인 섹션 표시 완료');
    
    // 초기 데이터 로드
    console.log('초기 데이터 로드 시작');
    try {
        if (typeof window.SanctionsAPI?.fetchSanctionsData === 'function') {
            window.SanctionsAPI.fetchSanctionsData(true)
                .then(data => {
                    console.log(`초기 데이터 로드 완료: ${data.length}개 항목`);
                })
                .catch(error => {
                    console.error('초기 데이터 로드 실패:', error);
                });
        } else {
            console.warn('SanctionsAPI가 정의되어 있지 않습니다.');
        }
    } catch (error) {
        console.error('초기 데이터 로드 오류:', error);
    }
}

/**
 * 초기화 함수
 */
function initAuth() {
    console.log('auth.js 초기화');
    
    // Firebase 초기화
    initFirebase()
      .then(initialized => {
        console.log('Firebase 초기화 상태:', initialized);
      })
      .catch(error => {
        console.error('Firebase 초기화 오류:', error);
      });
    
    // 인증 확인 및 자동 로그인 처리
    const isLoggedIn = isAuth();
    console.log('인증 상태:', isLoggedIn);
    
    if (isLoggedIn) {
        const user = getUserFromStorage();
        showMainSection(user);
    } else {
        // 로그인 폼 이벤트 리스너 설정
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // 로그아웃 버튼 이벤트 리스너 설정
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        
        // 등록 링크 이벤트 리스너 설정
        const registerLink = document.getElementById('register-link');
        if (registerLink) {
            registerLink.addEventListener('click', function(e) {
                e.preventDefault();
                const registerModal = document.getElementById('register-modal');
                if (registerModal) {
                    registerModal.style.display = 'block';
                }
            });
        }
        
        // 등록 폼 이벤트 리스너 설정
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }
        
        // 모달 닫기 버튼 이벤트 리스너 설정
        const closeButtons = document.querySelectorAll('.close-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
}

// 전역 함수 등록
window.login = login;
window.logout = logout;
window.getUserFromStorage = getUserFromStorage;
window.isAuthenticated = isAuth;
window.showMainSection = showMainSection;
window.initAuth = initAuth;

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', initAuth); 