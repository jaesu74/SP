/**
 * alerts.js - 표준화된 알림 컴포넌트
 * 사용자에게 성공, 오류, 경고 및 정보 메시지를 표시하는 모듈입니다.
 * 
 * @version 1.0.0
 * @author Your Name
 * @created 2023-10-01
 */

// 알림 컴포넌트 초기화
function initAlertsComponent() {
    // 알림 컨테이너 생성 및 추가
    createAlertContainer();
    
    // 전역 객체에 함수 노출
    window.showAlert = showAlert;
    window.showToast = showToast;
    window.clearAlerts = clearAlerts;
    
    console.log('알림 컴포넌트가 초기화되었습니다.');
}

/**
 * 알림 컨테이너 생성
 * @private
 */
function createAlertContainer() {
    // 기존 컨테이너가 있으면 제거
    removeExistingContainers();
    
    // 알림 컨테이너 추가
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert-container';
    document.body.appendChild(alertContainer);
    
    // 토스트 컨테이너 추가
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
}

/**
 * 기존 컨테이너 제거
 * @private
 */
function removeExistingContainers() {
    const existingAlertContainer = document.querySelector('.alert-container');
    if (existingAlertContainer) {
        existingAlertContainer.remove();
    }
    
    const existingToastContainer = document.querySelector('.toast-container');
    if (existingToastContainer) {
        existingToastContainer.remove();
    }
}

/**
 * 알림 표시
 * @param {string} message 메시지
 * @param {string} type 알림 유형 (success, error, info, warning)
 * @param {Object} options 추가 옵션
 * @param {number} options.duration 표시 시간 (ms)
 * @param {boolean} options.isStatic 자동 닫힘 여부
 * @returns {HTMLElement} 생성된 알림 요소
 */
function showAlert(message, type = 'info', options = {}) {
    const defaults = {
        duration: 5000,
        isStatic: false
    };
    
    const settings = { ...defaults, ...options };
    
    // 알림 컨테이너 찾기
    let alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        document.body.appendChild(alertContainer);
    }
    
    // 알림 ID 생성
    const alertId = 'alert_' + Math.random().toString(36).substr(2, 9);
    
    // 알림 요소 생성
    const alertElement = document.createElement('div');
    alertElement.id = alertId;
    alertElement.className = `alert alert-${type}`;
    alertElement.setAttribute('role', 'alert');
    alertElement.innerHTML = `
        <div class="alert-content">${message}</div>
        ${!settings.isStatic ? '<button class="alert-close" aria-label="닫기">&times;</button>' : ''}
    `;
    
    // 닫기 버튼 이벤트
    if (!settings.isStatic) {
        const closeButton = alertElement.querySelector('.alert-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeAlert(alertElement);
            });
        }
        
        // 자동 닫힘
        if (settings.duration > 0) {
            setTimeout(() => {
                closeAlert(alertElement);
            }, settings.duration);
        }
    }
    
    // 알림 표시
    alertContainer.appendChild(alertElement);
    
    // 애니메이션 효과
    setTimeout(() => {
        alertElement.classList.add('alert-visible');
    }, 10);
    
    return alertElement;
}

/**
 * 토스트 알림 표시
 * @param {string} message 메시지
 * @param {string} type 알림 유형 (success, error, info, warning)
 * @param {Object} options 추가 옵션
 * @param {number} options.duration 표시 시간 (ms)
 * @returns {HTMLElement} 생성된 토스트 요소
 */
function showToast(message, type = 'info', options = {}) {
    const defaults = {
        duration: 3000,
    };
    
    const settings = { ...defaults, ...options };
    
    // 토스트 컨테이너 찾기
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // 토스트 ID 생성
    const toastId = 'toast_' + Math.random().toString(36).substr(2, 9);
    
    // 토스트 요소 생성
    const toastElement = document.createElement('div');
    toastElement.id = toastId;
    toastElement.className = `toast toast-${type}`;
    toastElement.setAttribute('role', 'status');
    toastElement.innerHTML = `
        <div class="toast-content">${message}</div>
        <button class="toast-close" aria-label="닫기">&times;</button>
    `;
    
    // 닫기 버튼 이벤트
    const closeButton = toastElement.querySelector('.toast-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            closeToast(toastElement);
        });
    }
    
    // 자동 닫힘
    if (settings.duration > 0) {
        setTimeout(() => {
            closeToast(toastElement);
        }, settings.duration);
    }
    
    // 토스트 표시
    toastContainer.appendChild(toastElement);
    
    // 애니메이션 효과
    setTimeout(() => {
        toastElement.classList.add('toast-visible');
    }, 10);
    
    return toastElement;
}

/**
 * 알림 닫기
 * @private
 * @param {HTMLElement} alertElement 알림 요소
 */
function closeAlert(alertElement) {
    if (!alertElement || !alertElement.parentNode) return;
    
    alertElement.classList.add('alert-hiding');
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
        }
    }, 300);
}

/**
 * 토스트 닫기
 * @private
 * @param {HTMLElement} toastElement 토스트 요소
 */
function closeToast(toastElement) {
    if (!toastElement || !toastElement.parentNode) return;
    
    toastElement.classList.add('toast-hiding');
    setTimeout(() => {
        if (toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
        }
    }, 300);
}

/**
 * 모든 알림 제거
 */
function clearAlerts() {
    const alertContainer = document.querySelector('.alert-container');
    const toastContainer = document.querySelector('.toast-container');
    
    if (alertContainer) {
        alertContainer.innerHTML = '';
    }
    
    if (toastContainer) {
        toastContainer.innerHTML = '';
    }
}

// 문서 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', initAlertsComponent);

// 전역 스코프에 노출
window.AlertsComponent = {
    init: initAlertsComponent,
    showAlert: showAlert,
    showToast: showToast,
    clearAlerts: clearAlerts
}; 