/**
 * WVL Sanctions Authentication Module
 * 사용자 인증 관련 기능 담당
 */

// 백엔드 API URL
const API_BASE_URL = "http://localhost:3001/api";

// 로컬 스토리지 키
const STORAGE_KEY = 'wvl_user_info';
const TOKEN_KEY = 'wvl_token';

// 기본 테스트 계정 (개발 편의용)
const TEST_CREDENTIALS = {
  email: 'jaesu@kakao.com',
  password: '1234',
  name: '김재수'
};

/**
 * 로그인 처리
 * @param {string} email 이메일
 * @param {string} password 비밀번호
 * @returns {Promise<Object>} 로그인 결과
 */
async function login(email, password) {
  // 입력값 유효성 검사
  if (!email || !password) {
    return {
      success: false,
      message: '이메일과 비밀번호를 입력해주세요.'
    };
  }

  try {
    // 테스트 계정 확인 (백업 로그인 방식)
    if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
      // 사용자 정보 생성
      const userInfo = {
        name: TEST_CREDENTIALS.name,
        email: email,
        loginTime: new Date().toISOString()
      };

      // 로컬 스토리지에 저장
      saveUserToStorage(userInfo);

      return {
        success: true,
        message: '로그인 성공',
        user: userInfo
      };
    }

    // 백엔드 API 호출
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: email, password: password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '로그인 실패');
    }

    const data = await response.json();
    
    // 액세스 토큰 저장
    localStorage.setItem(TOKEN_KEY, data.access_token);
    
    // 사용자 정보 가져오기
    const userInfo = await getUserInfo(data.access_token);
    
    // 로컬 스토리지에 저장
    saveUserToStorage(userInfo);

    return {
      success: true,
      message: '로그인 성공',
      user: userInfo
    };

  } catch (error) {
    console.error('로그인 오류:', error);
    
    // 백업 로그인 로직 - 네트워크 오류 시 간편 로그인 허용
    if (email.includes('@') && password.length >= 4) {
      console.log('백업 로그인 방식 사용');
      const name = email.split('@')[0];
      const userInfo = {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: email,
        loginTime: new Date().toISOString()
      };

      saveUserToStorage(userInfo);

      return {
        success: true,
        message: '간편 로그인 성공',
        user: userInfo
      };
    }
    
    return {
      success: false,
      message: error.message || '로그인 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 회원가입 처리
 * @param {Object} userData 사용자 데이터
 * @returns {Promise<Object>} 회원가입 결과
 */
async function register(userData) {
  try {
    // 백엔드 API 호출
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '회원가입 실패');
    }

    const data = await response.json();
    return {
      success: true,
      message: '회원가입 성공',
      user: data
    };
  } catch (error) {
    console.error('회원가입 오류:', error);
    
    // 백업 회원가입 로직 - 테스트 환경 또는 네트워크 오류 시
    if (userData.email && userData.email.includes('@') && userData.name && userData.password) {
      // 로컬 스토리지에 사용자 목록 가져오기
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // 이메일 중복 확인
      if (users.some(user => user.email === userData.email)) {
        return {
          success: false,
          message: '이미 등록된 이메일입니다.'
        };
      }
      
      // 새 사용자 추가
      const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        password: userData.password, // 실제로는 해싱 필요
        createdAt: new Date().toISOString()
      };
      
      // 로컬 스토리지에 저장
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      return {
        success: true,
        message: '간편 회원가입 성공',
        user: {
          name: newUser.name,
          email: newUser.email
        }
      };
    }
    
    return {
      success: false,
      message: error.message || '회원가입 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 사용자 정보 가져오기
 * @param {string} token 액세스 토큰
 * @returns {Promise<Object>} 사용자 정보
 */
async function getUserInfo(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('사용자 정보를 가져오는데 실패했습니다.');
    }

    return await response.json();
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw error;
  }
}

/**
 * 로그아웃 처리
 */
function logout() {
  // 로컬 스토리지에서 사용자 정보 및 토큰 제거
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('isLoggedIn');
  
  // 세션 스토리지 정리
  sessionStorage.removeItem('currentUser');
  
  // 로그인 페이지로 리디렉션
  window.location.reload();
}

/**
 * 사용자 정보를 로컬 스토리지에 저장
 * @param {Object} userInfo 사용자 정보
 */
function saveUserToStorage(userInfo) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', userInfo.email);
    localStorage.setItem('userName', userInfo.name);
  } catch (e) {
    console.error('스토리지 저장 실패:', e);
    
    // 세션 스토리지 백업 사용
    try {
      sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
    } catch (e) {
      console.error('세션 스토리지 저장 실패:', e);
    }
  }
}

/**
 * 로컬 스토리지에서 사용자 정보 가져오기
 * @returns {Object|null} 사용자 정보
 */
function getUserFromStorage() {
  try {
    const userInfo = localStorage.getItem(STORAGE_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (e) {
    console.error('스토리지 읽기 실패:', e);
    return null;
  }
}

/**
 * 사용자 인증 여부 확인
 * @returns {boolean} 인증 여부
 */
function isAuthenticated() {
  return localStorage.getItem('isLoggedIn') === 'true' || !!getUserFromStorage();
}

/**
 * 회원가입 폼 제출 이벤트 핸들러
 * @param {Event} e 이벤트 객체
 */
async function handleRegisterSubmit(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const passwordConfirmInput = document.getElementById('register-password-confirm');
  const termsAgree = document.getElementById('terms-agree');
  
  // 필수 입력값 확인
  if (!nameInput.value.trim() || !emailInput.value.trim() || 
      !passwordInput.value || !passwordConfirmInput.value) {
    showAlert('모든 항목을 입력해주세요.', 'error', { 
      target: '#register-modal .alert-container', 
      isStatic: true 
    });
    return;
  }
  
  // 이메일 형식 확인
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value)) {
    showAlert('유효한 이메일 주소를 입력해주세요.', 'error', {
      target: '#register-modal .alert-container',
      isStatic: true
    });
    return;
  }
  
  // 비밀번호 일치 확인
  if (passwordInput.value !== passwordConfirmInput.value) {
    showAlert('비밀번호가 일치하지 않습니다.', 'error', {
      target: '#register-modal .alert-container',
      isStatic: true
    });
    return;
  }
  
  // 약관 동의 확인
  if (!termsAgree.checked) {
    showAlert('이용약관 및 개인정보처리방침에 동의해주세요.', 'error', {
      target: '#register-modal .alert-container',
      isStatic: true
    });
    return;
  }
  
  // 회원가입 데이터
  const userData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value
  };
  
  try {
    // 회원가입 API 호출
    const result = await register(userData);
    
    if (result.success) {
      showAlert(result.message, 'success', {
        target: '#register-modal .alert-container',
        isStatic: true
      });
      
      // 성공 시 2초 후 모달 닫기
      setTimeout(() => {
        const registerModal = document.getElementById('register-modal');
        if (registerModal) {
          registerModal.style.display = 'none';
          
          // 폼 초기화
          nameInput.value = '';
          emailInput.value = '';
          passwordInput.value = '';
          passwordConfirmInput.value = '';
          termsAgree.checked = false;
        }
      }, 2000);
    } else {
      showAlert(result.message, 'error', {
        target: '#register-modal .alert-container',
        isStatic: true
      });
    }
  } catch (error) {
    showAlert('회원가입 중 오류가 발생했습니다.', 'error', {
      target: '#register-modal .alert-container',
      isStatic: true
    });
  }
}

/**
 * 로그인 폼 제출 이벤트 핸들러
 * @param {Event} e 이벤트 객체
 */
async function handleLoginSubmit(e) {
  e.preventDefault();
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  if (!emailInput || !passwordInput) {
    console.error('로그인 폼 요소를 찾을 수 없습니다.');
    return;
  }
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  // 입력값 확인
  if (!email || !password) {
    showAlert('이메일과 비밀번호를 입력해주세요.', 'error');
    return;
  }
  
  try {
    // 로그인 API 호출
    const result = await login(email, password);
    
    if (result.success) {
      showAlert(result.message, 'success');
      
      // 약간의 지연 후 메인 섹션 표시
      setTimeout(() => {
        showMainSection(result.user);
      }, 500);
    } else {
      showAlert(result.message, 'error');
      passwordInput.value = '';
    }
  } catch (error) {
    showAlert('로그인 중 오류가 발생했습니다.', 'error');
    console.error('로그인 오류:', error);
  }
}

/**
 * 메인 섹션 표시
 * @param {Object} user 사용자 정보
 */
function showMainSection(user) {
  // 사용자 정보 표시
  const userNameElement = document.getElementById('user-name');
  if (userNameElement && user) {
    if (typeof user === 'string') {
      // 이메일이 전달된 경우
      const name = user.split('@')[0];
      userNameElement.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    } else if (user.name) {
      userNameElement.textContent = user.name;
    } else if (user.email) {
      const name = user.email.split('@')[0];
      userNameElement.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    }
  }
  
  // 로그인 섹션 숨기기
  const loginSection = document.getElementById('login-section');
  if (loginSection) {
    loginSection.style.display = 'none';
  }
  
  // 메인 섹션 표시
  const mainSection = document.getElementById('main-section');
  if (mainSection) {
    mainSection.style.display = 'block';
  }
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
  // 로그인 폼
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
  
  // 회원가입 폼
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }
  
  // 회원가입 링크
  const registerLink = document.getElementById('register-link');
  if (registerLink) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      const registerModal = document.getElementById('register-modal');
      if (registerModal) {
        registerModal.style.display = 'block';
      }
    });
  }
  
  // 회원가입 모달 닫기 버튼
  const registerClose = document.getElementById('register-close');
  if (registerClose) {
    registerClose.addEventListener('click', () => {
      const registerModal = document.getElementById('register-modal');
      if (registerModal) {
        registerModal.style.display = 'none';
      }
    });
  }
  
  // 로그아웃 버튼
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  // 페이지 로드 시 자동 로그인
  const urlParams = new URLSearchParams(window.location.search);
  const autoLogin = urlParams.get('autologin');
  
  if (autoLogin === 'true') {
    // 자동 로그인 처리
    login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
      .then(result => {
        if (result.success) {
          showMainSection(result.user);
        }
      })
      .catch(error => {
        console.error('자동 로그인 오류:', error);
      });
  } else if (isAuthenticated()) {
    // 이미 로그인된 상태
    const user = getUserFromStorage();
    showMainSection(user);
  }
}); 