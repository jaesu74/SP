/**
 * API 클라이언트 모듈
 * 제재 검색 관련 API 요청 처리
 */

// API 기본 설정 - 전역 변수 확인 후 할당
if (!window.API_BASE_URL) {
  window.API_BASE_URL = 'http://localhost:8000/api';
}

/**
 * SanctionsAPI 클래스 - 제재 관련 API 호출 처리
 */
class SanctionsAPI {
  constructor() {
    this.baseUrl = window.API_BASE_URL;
    this.token = this.getAuthToken();
    this.lastUpdateTime = null;
    this.data = [];
    this.isLoading = false;
    console.log('SanctionsAPI 초기화됨, 기본 URL:', this.baseUrl);
  }

  // 인증 토큰 가져오기
  getAuthToken() {
    const token = localStorage.getItem('wvl_token') || localStorage.getItem('token');
    if (!token) {
      console.warn('인증 토큰이 없습니다.');
    }
    return token;
  }

  /**
   * 제재 데이터 검색
   * @param {string} query 검색어
   * @param {Object} filters 검색 필터 (선택적)
   * @returns {Promise<Array>} 검색 결과
   */
  async searchSanctions(query, filters = {}) {
    try {
      console.log(`[API] '${query}' 검색 시작`, filters);
      
      // 쿼리 파라미터 구성
      let url = `${this.baseUrl}/sanctions/search?query=${encodeURIComponent(query)}&limit=100`;
      
      // 필터 추가
      if (filters) {
        if (filters.source) url += `&source=${encodeURIComponent(filters.source)}`;
        if (filters.type) url += `&type=${encodeURIComponent(filters.type)}`;
        if (filters.country) url += `&country=${encodeURIComponent(filters.country)}`;
        if (filters.year) url += `&year=${encodeURIComponent(filters.year)}`;
      }
      
      // 검색 요청
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('검색 API 오류:', response.status, errorData);
        throw new Error(errorData.detail || '검색 중 오류가 발생했습니다.');
      }
      
      const data = await response.json();
      console.log(`[API] '${query}' 검색 결과:`, data);
      
      // 결과 검증 및 데이터 정리
      const results = data.results || [];
      
      // 결과가 있는 경우 필드 구조 확인
      if (results.length > 0) {
        console.log(`[API] 첫 번째 결과 필드:`, Object.keys(results[0]));
        console.log(`[API] 총 ${results.length}개의 결과 반환됨`);
      }
      
      return results;
    } catch (error) {
      console.error('제재 데이터 검색 오류:', error);
      throw error;
    }
  }

  /**
   * 제재 상세 정보 조회
   * @param {string} id 제재 ID
   * @returns {Promise<Object>} 제재 상세 정보
   */
  async getSanctionDetail(id) {
    try {
      console.log(`[API] ID: '${id}' 상세 정보 조회 시작`);
      
      // 상세 정보 요청
      const response = await fetch(`${this.baseUrl}/sanctions/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('상세 정보 API 오류:', response.status, errorData);
        throw new Error(errorData.detail || '상세 정보 조회 중 오류가 발생했습니다.');
      }
      
      const data = await response.json();
      console.log(`[API] ID: '${id}' 상세 정보:`, data);
      
      return data;
    } catch (error) {
      console.error('제재 상세 정보 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 제재 PDF 다운로드
   * @param {string} id 제재 ID
   */
  async downloadPdf(id) {
    try {
      console.log(`[API] ID: '${id}' PDF 다운로드 시작`);
      
      // PDF 다운로드 요청
      const response = await fetch(`${this.baseUrl}/sanctions/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('PDF 다운로드 API 오류:', response.status);
        
        // 404 오류인 경우 백엔드에 PDF 생성 기능이 없다는 메시지 표시
        if (response.status === 404) {
          throw new Error('PDF 생성 기능이 구현되지 않았습니다. 텍스트로 저장해주세요.');
        }
        
        throw new Error('PDF 다운로드 중 오류가 발생했습니다.');
      }
      
      // PDF Blob 생성 및 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `sanction_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // 정리
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`[API] ID: '${id}' PDF 다운로드 완료`);
                return true;
    } catch (error) {
      console.error('PDF 다운로드 오류:', error);
      throw error;
    }
  }
}

// 전역 객체에 API 클래스 노출
window.SanctionsAPI = SanctionsAPI;

/**
 * 사용자 인증 관련 API
 */
const UserAPI = {
  /**
   * 로그인
   * @param {string} email - 사용자 이메일
   * @param {string} password - 사용자 비밀번호
   * @returns {Promise<Object>} 로그인 결과 (토큰 및 사용자 정보)
   */
  async login(email, password) {
    try {
      const response = await fetch(`${window.API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '로그인 실패');
      }
      
      const data = await response.json();
      
      // 토큰 및 사용자 정보 저장
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('로그인 오류:', error);
      throw new Error('로그인 중 오류가 발생했습니다. 이메일과 비밀번호를 확인해주세요.');
    }
  },
  
  /**
   * 회원가입
   * @param {string} email - 사용자 이메일
   * @param {string} password - 사용자 비밀번호
   * @param {string} name - 사용자 이름
   * @returns {Promise<Object>} 회원가입 결과
   */
  async register(email, password, name) {
    try {
      const response = await fetch(`${window.API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ email, password, name })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '회원가입 실패');
      }
      
      return await response.json();
    } catch (error) {
      console.error('회원가입 오류:', error);
      throw new Error('회원가입 중 오류가 발생했습니다.');
    }
  },
  
  /**
   * 로그아웃
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },
  
  /**
   * 현재 로그인한 사용자 정보 반환
   * @returns {Object|null} 사용자 정보 또는 null
   */
  getCurrentUser() {
    try {
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        return null;
      }
      
      return JSON.parse(userJson);
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      return null;
    }
  },
  
  /**
   * 로그인 상태 확인
   * @returns {boolean} 로그인 여부
   */
  isLoggedIn() {
    return !!localStorage.getItem('token');
  }
};

// 토큰 가져오기
function getToken() {
  return localStorage.getItem('token');
}

// 헤더 생성 함수
function createHeaders(token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// 전역 객체에 UserAPI 및 getToken 함수 노출
window.UserAPI = UserAPI;
window.getToken = getToken; 