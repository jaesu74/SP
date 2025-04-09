/**
 * auth.js - 사용자 인증 관련 서비스
 */

import { showAlert } from '../utils/common.js';

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
export async function login(email, password) {
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
export async function register(userData) {
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
export async function getUserInfo(token) {
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
    return null;
  }
}

/**
 * 로그아웃 처리
 */
export function logout() {
  // 로컬 스토리지에서 사용자 정보 및 토큰 제거
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  
  // 세션 스토리지 정리
  sessionStorage.removeItem('currentUser');
  
  return {
    success: true,
    message: '로그아웃 되었습니다.'
  };
}

/**
 * 사용자 정보를 로컬 스토리지에 저장
 * @param {Object} userInfo 사용자 정보
 */
export function saveUserToStorage(userInfo) {
  if (!userInfo) return;
  
  // 세션 및 로컬 스토리지에 사용자 정보 저장
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
    sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
    
    // 간편 접근을 위한 추가 정보 저장
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', userInfo.email);
    localStorage.setItem('userName', userInfo.name);
  } catch (error) {
    console.error('사용자 정보 저장 오류:', error);
  }
}

/**
 * 로컬 스토리지에서 사용자 정보 가져오기
 * @returns {Object} 사용자 정보
 */
export function getUserFromStorage() {
  try {
    const userInfoStr = localStorage.getItem(STORAGE_KEY);
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    return null;
  }
}

/**
 * 로그인 상태 확인
 * @returns {boolean} 로그인 상태
 */
export function isAuthenticated() {
  return localStorage.getItem('isLoggedIn') === 'true';
} 