/**
 * utils.js - 공통 유틸리티 함수
 */

// API 기본 URL 정의 (전역 변수가 없는 경우에만 설정)
if (!window.API_BASE_URL) {
    window.API_BASE_URL = 'http://localhost:8000/api';
}

/**
 * 알림 표시 함수
 * @param {string} message 메시지
 * @param {string} type 알림 유형 (success, error, warning, info)
 * @param {Object} options 추가 옵션
 */
function showAlert(message, type = 'info', options = {}) {
    console.log(`알림 표시: ${message} (${type})`);
    
    // 기존 알림 제거 (static 알림 제외)
    if (!options.isStatic) {
        const existingAlerts = document.querySelectorAll('.alert:not(.static)');
        existingAlerts.forEach(alert => {
            alert.remove();
        });
    }
    
    // 알림 컨테이너 찾기 (제일 가까운 것)
    let container = document.querySelector('.alert-container');
    if (!container) {
        console.warn('알림 컨테이너를 찾을 수 없어 body에 추가합니다.');
        container = document.createElement('div');
        container.className = 'alert-container';
        document.body.appendChild(container);
    }
    
    // 알림 생성
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    if (options.isStatic) {
        alert.classList.add('static');
    }
    
    // 알림 내용 설정
    alert.textContent = message;
    
    // 컨테이너에 추가
    container.appendChild(alert);
    
    // 자동 제거 타이머 설정 (static이 아닌 경우)
    if (!options.isStatic) {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.classList.add('fade-out');
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.remove();
                    }
                }, 300);
            }
        }, options.duration || 3000);
    }
    
    return alert;
}

/**
 * 로딩 표시기 표시
 * @param {string} containerId 표시할 컨테이너 ID
 * @param {string} message 로딩 메시지
 */
function showLoadingIndicator(containerId, message = '로딩 중...') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`로딩 표시기를 표시할 컨테이너를 찾을 수 없습니다: ${containerId}`);
        return null;
    }
    
    // 기존 로딩 표시기 제거
    const existingIndicator = container.querySelector('.loading-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // 로딩 표시기 생성
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>${message}</p>
    `;
    
    // 컨테이너에 추가
    container.appendChild(loadingIndicator);
    
    return loadingIndicator;
}

/**
 * 로딩 표시기 숨기기
 * @param {HTMLElement} indicator 로딩 표시기 요소
 */
function hideLoadingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.remove();
    }
}

/**
 * 날짜 형식화
 * @param {string} dateString ISO 형식 날짜 문자열
 * @returns {string} 형식화된 날짜
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // 파싱 실패 시 원본 반환
        }
        
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        console.warn('날짜 포맷 오류:', error);
        return dateString;
    }
}

/**
 * JWT 토큰 파싱 함수
 * @param {string} token JWT 토큰
 * @returns {Object} 토큰 페이로드
 */
function parseJwt(token) {
    if (!token) return null;
    
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('JWT 파싱 오류:', error);
        return null;
    }
}

/**
 * API 요청 래퍼 함수
 * @param {string} endpoint API 엔드포인트
 * @param {Object} options fetch 옵션
 * @returns {Promise<Object>} API 응답
 */
async function fetchAPI(endpoint, options = {}) {
    try {
        // 기본 URL 설정
        const url = endpoint.startsWith('http') 
            ? endpoint 
            : `${window.API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        
        // 기본 헤더 설정
        const headers = options.headers || {};
        
        // 인증 토큰 추가 (필요시)
        if (options.requireAuth !== false) {
            const token = localStorage.getItem('wvl_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        // Content-Type 설정 (기본값: application/json)
        if (!headers['Content-Type'] && !options.formData) {
            headers['Content-Type'] = 'application/json';
        }
        
        // 요청 옵션 구성
        const fetchOptions = {
            method: options.method || 'GET',
            headers: headers,
            ...options
        };
        
        // FormData 처리
        if (options.formData) {
            fetchOptions.body = options.formData;
            // FormData를 사용할 경우 Content-Type을 제거 (브라우저가 자동으로 설정)
            delete fetchOptions.headers['Content-Type'];
        } 
        // JSON 바디 처리
        else if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            fetchOptions.body = JSON.stringify(options.body);
        }
        
        console.log(`API 요청: ${fetchOptions.method} ${url}`);
        
        // 요청 실행
        const response = await fetch(url, fetchOptions);
        
        console.log(`API 응답 상태: ${response.status}`);
        
        // JSON 응답 파싱
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else if (options.blob) {
            data = await response.blob();
        } else {
            data = await response.text();
        }
        
        // 오류 응답 처리
        if (!response.ok) {
            const error = new Error(data.detail || data.message || '알 수 없는 오류가 발생했습니다');
            error.status = response.status;
            error.data = data;
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('API 요청 오류:', error);
        throw error;
    }
}

// 전역으로 노출
window.showAlert = showAlert;
window.showLoadingIndicator = showLoadingIndicator;
window.hideLoadingIndicator = hideLoadingIndicator;
window.formatDate = formatDate;
window.parseJwt = parseJwt;
window.fetchAPI = fetchAPI; 