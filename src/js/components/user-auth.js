/**
 * user-auth.js - 사용자 인증 컴포넌트
 * 로그인, 로그아웃, 회원가입 기능을 제공합니다.
 */

// AppHelpers 모듈 가져오기
import AppHelpers from '../utils/app-helpers.js';

// 전역 상태 변수
let users = [];
let currentUser = null;

// 사용자 인증 컴포넌트 객체
const UserAuthComponent = {
  // 초기화 여부
  initialized: false,
  
  // ... [여기에 기존 코드 유지] ...

  // 로그인 상태 검증
  validateSession: function() {
    try {
      // 로컬 스토리지 확인
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const token = localStorage.getItem('authToken');
      
      // 세션 스토리지 확인
      const userInfoStr = sessionStorage.getItem('currentUser');
      let userInfo = null;
      
      if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr);
      }
      
      if (isLoggedIn && (token || AppHelpers.isDevMode())) {
        return { 
          isValid: true, 
          userInfo 
        };
      }
      
      return { isValid: false };
    } catch (error) {
      console.error('세션 검증 오류:', error);
      return { isValid: false };
    }
  }
};

/**
 * 인증 컴포넌트 초기화
 */
function initUserAuth() {
  console.log('사용자 인증 컴포넌트 초기화 중...');

  // 로컬 스토리지에서 사용자 정보 로드
  loadUsers();

  // 로그인 상태 확인
  checkLoginStatus();

  // 이벤트 리스너 설정
  setupAuthEventListeners();

  // 전역 객체에 함수 등록
  exposeGlobalFunctions();

  console.log('사용자 인증 컴포넌트 초기화 완료');
}

/**
 * 사용자 데이터 로드
 * @private
 */
function loadUsers() {
  try {
    users = JSON.parse(localStorage.getItem('users')) || [];
    console.log(`${users.length}명의 사용자 데이터 로드됨`);
  } catch (e) {
    console.error('로컬 스토리지 데이터 파싱 오류:', e);
    users = [];
  }
}

/**
 * 로그인 상태 확인
 */
function checkLoginStatus() {
  // URL 파라미터 체크 (자동 로그인)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('autologin') === 'true') {
    console.log('자동 로그인 파라미터 감지됨');
    doAutoLogin();
    return;
  }

  // 로컬 스토리지 체크
  const userInfo = AppHelpers?.getUserFromStorage() || {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    email: localStorage.getItem('userEmail'),
    name: localStorage.getItem('userName')
  };

  if (userInfo.isLoggedIn && userInfo.email) {
    currentUser = {
      email: userInfo.email,
      name: userInfo.name
    };

    showMainSection(userInfo.email);
    console.log('로그인 상태: 사용자 인증됨');
  } else {
    showLoginSection();
    console.log('로그인 상태: 인증되지 않음');
  }
}

/**
 * 자동 로그인 처리
 * @private
 */
function doAutoLogin() {
  // 테스트 계정으로 자동 로그인
  currentUser = {
    email: 'jaesu@kakao.com',
    name: '김재수'
  };

  try {
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', currentUser.email);
    localStorage.setItem('userName', currentUser.name);
  } catch (storageError) {
    console.warn('자동 로그인 - 스토리지 저장 실패:', storageError);
  }

  // 메인 섹션 표시
  showMainSection(currentUser.email);
}

/**
 * 인증 관련 이벤트 리스너 설정
 * @private
 */
function setupAuthEventListeners() {
  // 로그인 폼 이벤트
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // 로그아웃 버튼 이벤트
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', logoutUser);
  }

  // 회원가입 폼 이벤트
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegistration);
  }

  // 회원가입 모달 열기 버튼
  const registerButton = document.getElementById('register-button');
  if (registerButton) {
    registerButton.addEventListener('click', showRegisterModal);
  }

  // 회원가입 모달 닫기 버튼
  const closeRegisterButton = document.querySelector('#register-modal .close');
  if (closeRegisterButton) {
    closeRegisterButton.addEventListener('click', hideRegisterModal);
  }
}

/**
 * 로그인 처리
 * @param {Event} e 이벤트 객체
 */
function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // 유효성 검사
  if (!email) {
    window.showToast('이메일을 입력해주세요.', 'warning');
    return;
  }

  if (!password) {
    window.showToast('비밀번호를 입력해주세요.', 'warning');
    return;
  }

  // 테스트 계정 확인 (임시 로직)
  if (email === 'jaesu@kakao.com' && password === '1234') {
    loginSuccess(email, '김재수');
  } else if (users.length > 0) {
    // 등록된 사용자 확인
    const user = users.find(user =>
      user.email === email && user.password === password
    );

    if (user) {
      loginSuccess(user.email, user.name);
    } else {
      loginFailed('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
  } else {
    loginFailed('등록된 사용자가 없습니다.');
  }
}

/**
 * 로그인 성공 처리
 * @param {string} email 사용자 이메일
 * @param {string} name 사용자 이름
 */
function loginSuccess(email, name) {
  // 현재 사용자 설정
  currentUser = { email, name };

  // 로컬 스토리지에 저장
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userEmail', email);
  localStorage.setItem('userName', name);

  // 세션 스토리지에도 저장
  try {
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
  } catch (e) {
    console.error('세션 스토리지 저장 오류:', e);
  }

  // 성공 메시지
  window.showToast('로그인 성공!', 'success');

  // 화면 전환
  showMainSection(email);
}

/**
 * 로그인 실패 처리
 * @param {string} message 실패 메시지
 */
function loginFailed(message) {
  window.showToast(message || '로그인 실패', 'error');

  // 비밀번호 필드 초기화
  const passwordField = document.getElementById('password');
  if (passwordField) {
    passwordField.value = '';
    passwordField.focus();
  }
}

/**
 * 사용자 로그아웃
 */
function logoutUser() {
  // 로컬 스토리지에서 로그인 정보 제거
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');

  // 세션 스토리지도 정리
  sessionStorage.removeItem('currentUser');

  // 현재 사용자 초기화
  currentUser = null;

  // 알림 표시
  window.showToast('로그아웃 되었습니다.', 'success', { duration: 2000 });

  // 페이지 새로고침 (로그인 화면으로 전환)
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

/**
 * 회원가입 처리
 * @param {Event} e 이벤트 객체
 */
function handleRegistration(e) {
  e.preventDefault();

  // 폼 요소
  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const passwordConfirmInput = document.getElementById('register-password-confirm');
  const termsAgree = document.getElementById('terms-agree');

  // 입력값 검증
  if (!nameInput.value.trim()) {
    window.showToast('이름을 입력해주세요.', 'error');
    return;
  }

  if (!emailInput.value.trim()) {
    window.showToast('이메일을 입력해주세요.', 'error');
    return;
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value)) {
    window.showToast('유효한 이메일 주소를 입력해주세요.', 'error');
    return;
  }

  if (!passwordInput.value) {
    window.showToast('비밀번호를 입력해주세요.', 'error');
    return;
  }

  if (passwordInput.value.length < 4) {
    window.showToast('비밀번호는 4자 이상이어야 합니다.', 'error');
    return;
  }

  if (passwordInput.value !== passwordConfirmInput.value) {
    window.showToast('비밀번호가 일치하지 않습니다.', 'error');
    return;
  }

  if (!termsAgree.checked) {
    window.showToast('이용약관 및 개인정보처리방침에 동의해주세요.', 'error');
    return;
  }

  // 기존 사용자 중복 확인
  const existingUser = users.find(user => user.email === emailInput.value);
  if (existingUser) {
    window.showToast('이미 등록된 이메일입니다.', 'error');
    return;
  }

  // 새 사용자 추가
  const newUser = {
    id: Date.now().toString(),
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value,
    registeredAt: new Date().toISOString()
  };

  users.push(newUser);

  // 로컬 스토리지에 저장
  try {
    localStorage.setItem('users', JSON.stringify(users));
  } catch (e) {
    console.error('로컬 스토리지 저장 오류:', e);
    window.showToast('사용자 정보 저장 중 오류가 발생했습니다.', 'error');
    return;
  }

  // 회원가입 성공 메시지
  window.showToast('회원가입이 완료되었습니다. 로그인해주세요.', 'success');

  // 폼 초기화 및 모달 닫기
  document.getElementById('register-form').reset();
  hideRegisterModal();
}

/**
 * 로그인 섹션 표시
 */
function showLoginSection() {
  const loginSection = document.getElementById('login-section');
  const mainSection = document.getElementById('main-section');

  if (loginSection) loginSection.style.display = 'flex';
  if (mainSection) mainSection.style.display = 'none';
}

/**
 * 메인 섹션 표시
 * @param {string} email 사용자 이메일
 */
function showMainSection(email) {
  const loginSection = document.getElementById('login-section');
  const mainSection = document.getElementById('main-section');
  const userInfo = document.getElementById('user-info');

  if (loginSection) loginSection.style.display = 'none';
  if (mainSection) mainSection.style.display = 'block';

  // 사용자 정보 표시
  if (userInfo) {
    const user = currentUser || {
      email: email,
      name: localStorage.getItem('userName') || '사용자'
    };

    userInfo.innerHTML = `
            <span class="user-name">${user.name}</span>
            <span class="user-email">${user.email}</span>
        `;
  }
}

/**
 * 회원가입 모달 표시
 */
function showRegisterModal() {
  const modal = document.getElementById('register-modal');
  if (modal) {
    modal.style.display = 'block';

    // 첫 번째 입력 필드에 포커스
    const firstInput = document.getElementById('register-name');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

/**
 * 회원가입 모달 숨기기
 */
function hideRegisterModal() {
  const modal = document.getElementById('register-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * 전역 객체에 인증 관련 함수 노출
 * @private
 */
function exposeGlobalFunctions() {
  window.UserAuthComponent = UserAuthComponent;

  // 로그인 상태 검증
  UserAuthComponent.validateSession = function() {
    try {
      // 로컬 스토리지 확인
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const token = localStorage.getItem('authToken');

      // 세션 스토리지 확인
      const userInfoStr = sessionStorage.getItem('currentUser');
      let userInfo = null;

      if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr);
      }

      if (isLoggedIn && (token || AppHelpers.isDevMode())) {
        return {
          isValid: true,
          userInfo
        };
      }

      return { isValid: false };
    } catch (error) {
      console.error('세션 검증 오류:', error);
      return { isValid: false };
    }
  };
}

// 브라우저 환경에서 초기화
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initUserAuth);
}

// ESM/CommonJS 모듈로 내보내기 (선택적)
if (typeof exports === 'object' && typeof module !== 'undefined') {
  module.exports = {
    initUserAuth,
    checkLoginStatus,
    logoutUser
  };
}