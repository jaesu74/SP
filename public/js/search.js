// API 기본 URL 설정
const apiBaseUrl = "http://localhost:8000/api";

/**
 * 제재 검색 함수
 * @param {string} query - 검색어
 * @param {object} options - 검색 옵션 (country, program, startDate, endDate, limit, skip)
 * @returns {Promise<object>} 검색 결과
 */
async function searchSanctions(query, options = {}) {
  showLoading();
  
  try {
    // 현재 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      throw new Error('로그인이 필요합니다');
    }
    
    // URL 파라미터 구성
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (options.country) params.append('country', options.country);
    if (options.program) params.append('program', options.program);
    if (options.startDate) params.append('start_date', options.startDate);
    if (options.endDate) params.append('end_date', options.endDate);
    if (options.limit) params.append('limit', options.limit);
    if (options.skip) params.append('skip', options.skip);
    
    // API 호출
    const response = await fetch(`${apiBaseUrl}/sanctions/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '검색 실패');
    }
    
    const data = await response.json();
    hideLoading();
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('검색 중 오류 발생:', error);
    hideLoading();
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 제재 상세 정보 조회 함수
 * @param {string} id - 제재 ID
 * @returns {Promise<object>} 상세 정보
 */
async function getSanctionDetails(id) {
  showLoading();
  
  try {
    // 현재 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      throw new Error('로그인이 필요합니다');
    }
    
    // API 호출
    const response = await fetch(`${apiBaseUrl}/sanctions/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '상세 정보 조회 실패');
    }
    
    const data = await response.json();
    hideLoading();
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('상세 정보 조회 중 오류 발생:', error);
    hideLoading();
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 제재 통계 조회 함수
 * @returns {Promise<object>} 통계 정보
 */
async function getSanctionsStats() {
  showLoading();
  
  try {
    // 현재 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      throw new Error('로그인이 필요합니다');
    }
    
    // API 호출
    const response = await fetch(`${apiBaseUrl}/sanctions/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '통계 조회 실패');
    }
    
    const data = await response.json();
    hideLoading();
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('통계 조회 중 오류 발생:', error);
    hideLoading();
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 제재 PDF 다운로드 함수
 * @param {string} id - 제재 ID
 * @returns {Promise<object>} 다운로드 결과
 */
async function downloadSanctionPdf(id) {
  showLoading();
  
  try {
    // 현재 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      throw new Error('로그인이 필요합니다');
    }
    
    // API 호출
    const response = await fetch(`${apiBaseUrl}/sanctions/${id}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'PDF 다운로드 실패');
    }
    
    const blob = await response.blob();
    hideLoading();
    
    // PDF 파일 다운로드
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `sanction-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('PDF 다운로드 중 오류 발생:', error);
    hideLoading();
    
    return {
      success: false,
      error: error.message
    };
  }
}

// 로딩 표시 함수
function showLoading() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'flex';
  }
}

// 로딩 숨김 함수
function hideLoading() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
} 