/**
 * WVL Sanctions Authentication
 * 사용자 인증 관련 기능 담당
 */

// 테스트 계정 정보
const TEST_CREDENTIALS = {
  email: 'jaesu@kakao.com',
  password: '1234',
  name: '김재수'
};

// 로컬 스토리지 키
const STORAGE_KEY = 'wvl_user_info';

/**
 * 로그인 처리
 * @param {string} email 이메일
 * @param {string} password 비밀번호
 * @returns {Object|null} 로그인 결과 (성공 시 사용자 정보, 실패 시 null)
 */
function login(email, password) {
  // 입력값 유효성 검사
  if (!email || !password) {
    return {
      success: false,
      message: '이메일과 비밀번호를 입력해주세요.'
    };
  }

  // 테스트 계정 확인
  if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
    // 사용자 정보 생성
    const userInfo = {
      name: TEST_CREDENTIALS.name,
      email: email,
      loginTime: new Date().toISOString()
    };

    // 로컬 스토리지에 저장
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
    } catch (e) {
      console.error('로컬 스토리지 저장 실패:', e);
      
      // 세션 스토리지 사용 시도
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
      } catch (e) {
        console.error('세션 스토리지 저장 실패:', e);
      }
    }

    return {
      success: true,
      message: '로그인 성공',
      user: userInfo
    };
  }

  // 로그인 실패
  return {
    success: false,
    message: '이메일 또는 비밀번호가 일치하지 않습니다.'
  };
}

/**
 * 로그아웃 처리
 */
function logout() {
  // 로컬 스토리지에서 사용자 정보 삭제
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // 오류 무시
  }

  // 세션 스토리지에서도 삭제
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // 오류 무시
  }

  return {
    success: true,
    message: '로그아웃되었습니다.'
  };
}

/**
 * 현재 로그인 상태 확인
 * @returns {Object|null} 로그인 상태 (로그인 시 사용자 정보, 미로그인 시 null)
 */
function checkLoginStatus() {
  let userInfo = null;

  // 로컬 스토리지 확인
  try {
    const storedInfo = localStorage.getItem(STORAGE_KEY);
    if (storedInfo) {
      userInfo = JSON.parse(storedInfo);
    }
  } catch (e) {
    // 오류 무시
  }

  // 없으면 세션 스토리지 확인
  if (!userInfo) {
    try {
      const storedInfo = sessionStorage.getItem(STORAGE_KEY);
      if (storedInfo) {
        userInfo = JSON.parse(storedInfo);
      }
    } catch (e) {
      // 오류 무시
    }
  }

  return userInfo;
}

// 모듈 내보내기
export {
  login,
  logout,
  checkLoginStatus
}; 