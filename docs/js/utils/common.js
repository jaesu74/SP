/**
 * common.js - 공통 유틸리티 함수 모음
 * 자주 사용되는 기능을 모듈화하여 재사용성을 높입니다.
 */

// 유틸리티 객체 생성
const Utils = {};

/**
 * 디바운스 함수 - 연속 호출 방지
 * @param {Function} func 실행할 함수
 * @param {number} wait 지연시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
Utils.debounce = function(func, wait) {
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
Utils.getUserFromStorage = function() {
    return {
        isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName')
    };
};

/**
 * 고유 ID 생성
 * @returns {string} 랜덤 ID
 */
Utils.generateId = function() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
};

/**
 * 토스트 알림 표시
 * @param {string} message 메시지
 * @param {string} type 알림 유형 (success, error, info, warning)
 * @param {Object} options 추가 옵션
 * @param {number} options.duration 표시 시간 (ms)
 * @returns {HTMLElement} 생성된 토스트 요소
 */
Utils.showToast = function(message, type = 'info', options = {}) {
    const defaults = {
        duration: 3000,
    };
    
    const settings = { ...defaults, ...options };
    
    // 토스트 컨테이너 찾기 또는 생성
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // 토스트 요소 생성
    const toastId = Utils.generateId();
    const toastElement = document.createElement('div');
    toastElement.id = toastId;
    toastElement.className = `toast toast-${type}`;
    toastElement.innerHTML = `
        <div class="toast-content">${message}</div>
        <button class="toast-close">&times;</button>
    `;
    
    // 닫기 버튼 이벤트
    const closeButton = toastElement.querySelector('.toast-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            toastElement.classList.add('toast-hiding');
            setTimeout(() => {
                if (toastElement.parentNode) {
                    toastElement.parentNode.removeChild(toastElement);
                }
            }, 300);
        });
    }
    
    // 자동 닫힘
    if (settings.duration > 0) {
        setTimeout(() => {
            if (document.getElementById(toastId)) {
                toastElement.classList.add('toast-hiding');
                setTimeout(() => {
                    if (document.getElementById(toastId)) {
                        toastElement.parentNode.removeChild(toastElement);
                    }
                }, 300);
            }
        }, settings.duration);
    }
    
    // 토스트 표시
    toastContainer.appendChild(toastElement);
    
    // 애니메이션 효과
    setTimeout(() => {
        toastElement.classList.add('toast-visible');
    }, 10);
    
    return toastElement;
};

/**
 * 알림 표시
 * @param {string} message 메시지
 * @param {string} type 알림 유형 (success, error, info, warning)
 * @param {Object} options 추가 옵션
 * @param {number} options.duration 표시 시간 (ms)
 * @param {boolean} options.isStatic 자동 닫힘 여부
 * @returns {HTMLElement} 생성된 알림 요소
 */
Utils.showAlert = function(message, type = 'info', options = {}) {
    const defaults = {
        duration: 5000,
        isStatic: false
    };
    
    const settings = { ...defaults, ...options };
    
    // 알림 컨테이너 찾기 또는 생성
    let alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        document.body.appendChild(alertContainer);
    }
    
    // 알림 요소 생성
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.innerHTML = `
        <div class="alert-content">${message}</div>
        ${!settings.isStatic ? '<button class="alert-close">&times;</button>' : ''}
    `;
    
    // 닫기 버튼 이벤트
    if (!settings.isStatic) {
        const closeButton = alertElement.querySelector('.alert-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                alertElement.classList.add('alert-hiding');
                setTimeout(() => {
                    if (alertElement.parentNode) {
                        alertElement.parentNode.removeChild(alertElement);
                    }
                }, 300);
            });
        }
        
        // 자동 닫힘
        if (settings.duration > 0) {
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.classList.add('alert-hiding');
                    setTimeout(() => {
                        if (alertElement.parentNode) {
                            alertElement.parentNode.removeChild(alertElement);
                        }
                    }, 300);
                }
            }, settings.duration);
        }
    }
    
    // 알림 표시
    alertContainer.appendChild(alertElement);
    
    return alertElement;
};

/**
 * 로딩 인디케이터 표시
 * @param {string} containerId 컨테이너 ID
 * @param {string} message 로딩 메시지
 * @returns {HTMLElement} 로딩 인디케이터 요소
 */
Utils.showLoadingIndicator = function(containerId, message = '로딩 중...') {
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
Utils.hideLoadingIndicator = function(indicator) {
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
 * 최종 업데이트 시간 표시
 * @param {Date|string} updateTime 업데이트 시간
 */
Utils.updateLastUpdateTime = function(updateTime) {
    const updateElement = document.getElementById('last-update');
    if (!updateElement) return;
    
    let formattedDate;
    
    if (updateTime instanceof Date) {
        formattedDate = updateTime.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } else if (typeof updateTime === 'string') {
        formattedDate = updateTime;
    } else {
        formattedDate = new Date().toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    updateElement.textContent = formattedDate;
};

/**
 * 요소의 클래스 토글
 * @param {HTMLElement} element 대상 요소
 * @param {string} className 클래스명
 * @param {boolean} force 강제 추가/제거 여부
 */
Utils.toggleClass = function(element, className, force) {
    if (!element) return;
    
    if (typeof force === 'boolean') {
        if (force) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    } else {
        element.classList.toggle(className);
    }
};

// 전역 객체로 내보내기
window.Utils = Utils; 