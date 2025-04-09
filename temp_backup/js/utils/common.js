/**
 * common.js - 공통 유틸리티 함수
 */

/**
 * 디바운스 함수 - 연속 호출 방지
 * @param {Function} func 실행할 함수
 * @param {number} wait 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * localStorage에서 사용자 정보 가져오기
 * @returns {Object} 사용자 정보 객체
 */
export function getUserFromStorage() {
    return {
        isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName')
    };
}

/**
 * 고유 ID 생성
 * @returns {string} 생성된 고유 ID
 */
export function generateId() {
    return 'sanction_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 알림 표시
 * @param {string} message 알림 메시지
 * @param {string} type 알림 타입 (info, success, warning, error)
 * @param {Object} options 옵션 객체
 */
export function showAlert(message, type = 'info', options = {}) {
    const defaults = {
        duration: 3000,            // 알림 표시 시간 (ms)
        isStatic: false,           // true면 자동으로 사라지지 않음
        target: '.alert-container' // 알림을 표시할 컨테이너 선택자
    };
    
    const settings = { ...defaults, ...options };
    
    const alertContainer = document.querySelector(settings.target);
    if (!alertContainer) {
        console.error(`알림 컨테이너를 찾을 수 없음: ${settings.target}`);
        return;
    }
    
    // 동일한 알림이 이미 표시중인지 확인
    const existingAlerts = alertContainer.querySelectorAll('.alert');
    for (let i = 0; i < existingAlerts.length; i++) {
        const existingAlert = existingAlerts[i];
        const alertContent = existingAlert.querySelector('.alert-content');
        if (alertContent && alertContent.textContent === message) {
            return;
        }
    }
    
    // 새 알림 생성
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    
    // 알림 내용 추가
    alertElement.innerHTML = `
        <div class="alert-content">${message}</div>
        <button class="alert-close">&times;</button>
    `;
    
    // 닫기 버튼 설정
    const closeButton = alertElement.querySelector('.alert-close');
    closeButton.addEventListener('click', () => {
        alertElement.classList.add('fade-out');
        setTimeout(() => {
            if (alertContainer.contains(alertElement)) {
                alertContainer.removeChild(alertElement);
            }
        }, 300);
    });
    
    // 컨테이너에 알림 추가
    alertContainer.appendChild(alertElement);
    
    // 일정 시간 후 자동으로 사라지기
    if (!settings.isStatic) {
        setTimeout(() => {
            alertElement.classList.add('fade-out');
            setTimeout(() => {
                if (alertContainer.contains(alertElement)) {
                    alertContainer.removeChild(alertElement);
                }
            }, 300);
        }, settings.duration);
    }
}

/**
 * 로딩 인디케이터 표시
 * @param {string} containerId 로딩 인디케이터를 표시할 컨테이너 ID
 * @param {string} message 로딩 메시지
 */
export function showLoadingIndicator(containerId, message = '로딩 중...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // 기존 로딩 인디케이터 제거
    const existingIndicator = container.querySelector('.loading-indicator');
    if (existingIndicator) {
        container.removeChild(existingIndicator);
    }
    
    // 새 로딩 인디케이터 생성
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>${message}</p>
    `;
    
    container.appendChild(loadingIndicator);
}

/**
 * 로딩 인디케이터 숨기기
 * @param {HTMLElement} indicator 로딩 인디케이터 요소
 */
export function hideLoadingIndicator(indicator) {
    if (!indicator) return;
    
    // 페이드 아웃 효과 추가
    indicator.classList.add('fade-out');
    
    // 요소 제거
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 300);
}

/**
 * 최신 업데이트 시간을 표시
 * @param {string} updateTime ISO 형식의 업데이트 시간
 */
export function updateLastUpdateTime(updateTime) {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        const date = new Date(updateTime);
        const formattedDate = date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        lastUpdateElement.textContent = formattedDate;
    }
}

/**
 * CSS 클래스를 토글합니다.
 * @param {HTMLElement} element 대상 요소
 * @param {string} className 토글할 클래스명
 * @param {boolean} force true면 추가, false면 제거, undefined면 토글
 */
export function toggleClass(element, className, force) {
    if (element) {
        if (force === undefined) {
            element.classList.toggle(className);
        } else if (force) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }
} 