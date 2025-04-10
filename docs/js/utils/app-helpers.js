/**
 * app-helpers.js - 애플리케이션 유틸리티 함수
 * app.js에서 공통으로 사용되는 유틸리티 함수들을 분리하여 모듈화합니다.
 */

// 유틸리티 객체
const AppHelpers = {};

/**
 * 디바운스 함수 - 연속 호출 방지
 * @param {Function} func 실행할 함수
 * @param {number} wait 지연시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
AppHelpers.debounce = function(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
};

/**
 * localStorage에서 사용자 정보 가져오기
 * @returns {Object} 사용자 정보 객체
 */
AppHelpers.getUserFromStorage = function() {
    return {
        isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName')
    };
};

/**
 * 날짜 포맷팅
 * @param {string|Date} date 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 날짜 문자열
 */
AppHelpers.formatDate = function(date) {
    if (!date) return '정보 없음';
    
    try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return date; // 유효한 날짜가 아니면 원본 반환
        
        return dateObj.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('날짜 포맷팅 오류:', error);
        return date;
    }
};

/**
 * 로딩 인디케이터 표시
 * @param {string} containerId 컨테이너 ID
 * @param {string} message 로딩 메시지
 * @returns {HTMLElement} 로딩 인디케이터 요소
 */
AppHelpers.showLoadingIndicator = function(containerId, message = '로딩 중...') {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-indicator';
    loadingElement.innerHTML = `
        <div class="spinner"></div>
        <p>${message}</p>
    `;
    
    container.appendChild(loadingElement);
    return loadingElement;
};

/**
 * 로딩 인디케이터 숨기기
 * @param {HTMLElement} indicator 로딩 인디케이터 요소
 */
AppHelpers.hideLoadingIndicator = function(indicator) {
    if (!indicator || !indicator.parentNode) return;
    
    // 페이드 아웃 효과
    indicator.style.opacity = '0';
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 300);
};

/**
 * 배열이나 문자열이 비어있는지 확인
 * @param {Array|string} value 확인할 값
 * @returns {boolean} 비어있으면 true, 아니면 false
 */
AppHelpers.isEmpty = function(value) {
    if (value === null || value === undefined) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'string') return value.trim() === '';
    return false;
};

/**
 * 객체에서 안전하게 값 가져오기 (null/undefined 방지)
 * @param {Object} obj 대상 객체
 * @param {string} path 값의 경로 (예: 'user.profile.name')
 * @param {*} defaultValue 기본값
 * @returns {*} 찾은 값 또는 기본값
 */
AppHelpers.getNestedValue = function(obj, path, defaultValue = '') {
    if (!obj) return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
        result = result?.[key];
        if (result === undefined || result === null) {
            return defaultValue;
        }
    }
    
    return result;
};

/**
 * 사용자 이메일 유효성 검사
 * @param {string} email 이메일 문자열
 * @returns {boolean} 유효하면 true, 아니면 false
 */
AppHelpers.isValidEmail = function(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * 비밀번호 강도 체크
 * @param {string} password 비밀번호
 * @returns {string} 강도 ('weak', 'medium', 'strong')
 */
AppHelpers.checkPasswordStrength = function(password) {
    if (!password) return 'weak';
    
    // 기본 길이 체크
    if (password.length < 4) return 'weak';
    if (password.length < 8) return 'medium';
    
    // 복잡성 체크 (문자, 숫자, 특수문자 조합)
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (hasLetter && hasNumber && hasSpecial) return 'strong';
    if ((hasLetter && hasNumber) || (hasLetter && hasSpecial) || (hasNumber && hasSpecial)) return 'medium';
    
    return 'weak';
};

/**
 * 문자열 자르기 (긴 텍스트를 표시용으로 줄임)
 * @param {string} text 원본 텍스트
 * @param {number} maxLength 최대 길이
 * @returns {string} 잘린 텍스트
 */
AppHelpers.truncateText = function(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
};

/**
 * 고유 ID 생성
 * @returns {string} 랜덤 ID
 */
AppHelpers.generateId = function() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
};

/**
 * 배열 중복 제거
 * @param {Array} array 대상 배열
 * @returns {Array} 중복이 제거된 배열
 */
AppHelpers.uniqueArray = function(array) {
    if (!Array.isArray(array)) return [];
    return [...new Set(array)];
};

// 브라우저 환경에서 전역 객체에 AppHelpers 노출
if (typeof window !== 'undefined') {
    window.AppHelpers = AppHelpers;
}

// 모듈 내보내기 (ESM/CommonJS)
if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = AppHelpers;
} 