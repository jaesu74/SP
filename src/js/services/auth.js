/**
 * auth.js - 인증 관련 서비스
 * 로그인, 로그아웃, 세션 관리 등의 기능을 제공합니다.
 */

// 인증 서비스 객체 생성
const AuthService = {};

// 로컬 변수
let currentUser = null;
const loginListeners = [];

/**
 * 초기화 함수
 */
AuthService.init = function() {
  console.log('인증 서비스 초기화...');

  // 세션 확인
  this.checkSession();

  console.log('인증 서비스 초기화 완료');
};

/**
 * 로그인 상태 확인
 * @returns {boolean} 로그인 여부
 */
AuthService.isLoggedIn = function() {
  const isLogged = localStorage.getItem('isLoggedIn') === 'true';
  return isLogged && !!currentUser;
};

/**
 * 현재 사용자 가져오기
 * @returns {Object|null} 현재 사용자 정보
 */
AuthService.getCurrentUser = function() {
  return currentUser;
};

/**
 * 세션 확인 - 로그인 상태 확인 및 사용자 정보 로드
 */
AuthService.checkSession = function() {
  console.log('세션 확인 중...');

  try {
    // URL 파라미터로 autologin=true가 있으면 강제 로그인
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('autologin') === 'true') {
      console.log('자동 로그인 파라미터 감지됨');
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

      // 로그인 이벤트 발생
      this._notifyLoginListeners(true, currentUser);

      return true;
    }

    // 로컬 스토리지에서 로그인 상태 확인
    if (localStorage.getItem('isLoggedIn') === 'true') {
      // 세션 스토리지에서 현재 사용자 정보 가져오기
      try {
        const userStr = sessionStorage.getItem('currentUser');
        if (userStr) {
          currentUser = JSON.parse(userStr);
        } else {
          // 세션 스토리지에 없으면 로컬 스토리지에서 복원
          currentUser = {
            email: localStorage.getItem('userEmail'),
            name: localStorage.getItem('userName')
          };

          if (currentUser.email) {
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
          }
        }
      } catch (e) {
        console.error('현재 사용자 정보 파싱 오류:', e);

        // 오류 발생 시 로컬 스토리지에서 직접 가져오기
        currentUser = {
          email: localStorage.getItem('userEmail'),
          name: localStorage.getItem('userName')
        };
      }

      if (currentUser && currentUser.email) {
        console.log('로그인 상태 감지됨:', currentUser.email);
        // 로그인 이벤트 발생
        this._notifyLoginListeners(true, currentUser);
        return true;
      } else {
        // 유효하지 않은 사용자 정보인 경우 로그아웃 처리
        this.logout();
        return false;
      }
    } else {
      // 로그인되지 않은 상태
      this._notifyLoginListeners(false, null);
      return false;
    }
  } catch (error) {
    console.error('세션 확인 오류:', error);
    return false;
  }
};

/**
 * 로그인 처리
 * @param {string} email 이메일
 * @param {string} password 비밀번호
 * @returns {Promise<Object>} 로그인 결과
 */
AuthService.login = function(email, password) {
  return new Promise((resolve, reject) => {
    // 테스트 계정 확인 (실제 서비스에서는 API 요청으로 대체)
    if (email === 'jaesu@kakao.com' && password === '1234') {
      // 로그인 성공
      currentUser = {
        email: email,
        name: '김재수'
      };

      // 로컬 스토리지에 정보 저장
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', '김재수');

      // 세션 스토리지에도 저장
      try {
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      } catch (e) {
        console.error('세션 스토리지 저장 오류:', e);
      }

      // 로그인 이벤트 발생
      this._notifyLoginListeners(true, currentUser);

      resolve({ success: true, user: currentUser });
    } else {
      // 로그인 실패
      reject({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
  });
};

/**
 * 로그아웃 처리
 */
AuthService.logout = function() {
  // 현재 사용자 정보 초기화
  currentUser = null;

  // 스토리지에서 로그인 정보 제거
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');

  try {
    sessionStorage.removeItem('currentUser');
  } catch (e) {
    console.error('세션 스토리지 제거 오류:', e);
  }

  // 로그아웃 이벤트 발생
  this._notifyLoginListeners(false, null);

  console.log('로그아웃 완료');
};

/**
 * 로그인 상태 변경 리스너 등록
 * @param {Function} callback 콜백 함수(isLoggedIn, user)
 */
AuthService.addLoginListener = function(callback) {
  if (typeof callback === 'function' && !loginListeners.includes(callback)) {
    loginListeners.push(callback);
  }
};

/**
 * 로그인 상태 변경 리스너 제거
 * @param {Function} callback 제거할 콜백 함수
 */
AuthService.removeLoginListener = function(callback) {
  const index = loginListeners.indexOf(callback);
  if (index !== -1) {
    loginListeners.splice(index, 1);
  }
};

/**
 * 로그인 리스너에게 알림
 * @param {boolean} isLoggedIn 로그인 여부
 * @param {Object} user 사용자 정보
 * @private
 */
AuthService._notifyLoginListeners = function(isLoggedIn, user) {
  for (const listener of loginListeners) {
    try {
      listener(isLoggedIn, user);
    } catch (error) {
      console.error('로그인 리스너 호출 오류:', error);
    }
  }
};

/**
 * 회원가입 처리
 * @param {Object} userData 사용자 데이터
 * @returns {Promise<Object>} 회원가입 결과
 */
AuthService.register = function(userData) {
  return new Promise((resolve, reject) => {
    // 필수 필드 확인
    if (!userData.name || !userData.email || !userData.password) {
      reject({ success: false, message: '모든 필수 정보를 입력해주세요.' });
      return;
    }

    // 이메일 형식 확인
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      reject({ success: false, message: '유효한 이메일 주소를 입력해주세요.' });
      return;
    }

    // 비밀번호 길이 확인
    if (userData.password.length < 4) {
      reject({ success: false, message: '비밀번호는 최소 4자 이상이어야 합니다.' });
      return;
    }

    // 비밀번호 확인
    if (userData.password !== userData.passwordConfirm) {
      reject({ success: false, message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' });
      return;
    }

    // 사용자 목록 가져오기
    let users = [];
    try {
      const usersStr = localStorage.getItem('users');
      if (usersStr) {
        users = JSON.parse(usersStr);
      }
    } catch (e) {
      console.error('사용자 목록 로드 오류:', e);
      users = [];
    }

    // 이메일 중복 확인
    if (users.some(user => user.email === userData.email)) {
      reject({ success: false, message: '이미 등록된 이메일 주소입니다.' });
      return;
    }

    // 새 사용자 추가
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: userData.name,
      email: userData.email,
      password: userData.password, // 실제 서비스에서는 암호화해야 함
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // 저장
    try {
      localStorage.setItem('users', JSON.stringify(users));
      resolve({ success: true, message: '회원가입이 완료되었습니다. 로그인해주세요.' });
    } catch (e) {
      console.error('사용자 저장 오류:', e);
      reject({ success: false, message: '회원가입 처리 중 오류가 발생했습니다.' });
    }
  });
};

// 전역 객체로 내보내기
window.AuthService = AuthService;