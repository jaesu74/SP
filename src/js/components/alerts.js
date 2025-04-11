/**
 * alerts.js - 표준화된 알림 및 토스트 컴포넌트
 * 응용 프로그램 전체에서 사용할 수 있는 알림 및 토스트 메시지 시스템
 * 
 * @version 1.0.0
 * @author Your Name
 * @created 2023-10-01
 */

// 글로벌 네임스페이스에 컴포넌트 등록
window.AlertsComponent = (function() {
    'use strict';

    // 기본 설정
    const DEFAULT_DURATION = 5000;
    const DEFAULT_TYPE = 'info';
    const MAX_ALERTS = 3;
    const MAX_TOASTS = 3;

    // 컨테이너 요소
    let alertsContainer = null;
    let toastsContainer = null;

    // 활성화된 알림과 토스트를 추적하는 배열
    let activeAlerts = new Map();
    let activeToasts = [];
    let alertCounter = 0;

    // SVG 아이콘 템플릿
    const SVG_ICONS = {
        success: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>',
        error: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>',
        warning: '<svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.9L19.1 19H4.9L12 5.9zM11 10h2v5h-2v-5zm0 6h2v2h-2v-2z"/></svg>',
        info: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
        close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>'
    };

    // 닫기 아이콘
    const CLOSE_ICON = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>';

    // 타입별 제목
    const TITLES = {
        success: '성공',
        error: '오류',
        warning: '경고',
        info: '정보'
    };

    /**
     * 컴포넌트 초기화
     */
    function init() {
        // 알림 컨테이너 생성
        if (!alertsContainer) {
            alertsContainer = document.createElement('div');
            alertsContainer.className = 'alerts-container';
            alertsContainer.style.top = '20px';
            alertsContainer.style.right = '20px';
            document.body.appendChild(alertsContainer);
        }

        // 토스트 컨테이너 생성
        if (!toastsContainer) {
            toastsContainer = document.createElement('div');
            toastsContainer.className = 'alerts-container';
            toastsContainer.style.bottom = '20px';
            toastsContainer.style.left = '20px';
            document.body.appendChild(toastsContainer);
        }

        // 글로벌 함수 설정
        window.showAlert = showAlert;
        window.showToast = showToast;
        window.closeAlert = closeAlert;
        window.closeToast = closeToast;
        window.closeAllAlerts = closeAllAlerts;
        window.closeAllToasts = closeAllToasts;

        // 컨테이너 초기화
        containers = {};
    }

    /**
     * 알림 표시
     * @param {string} message - 표시할 메시지
     * @param {string} type - 알림 타입 (success, error, warning, info)
     * @param {Object} options - 추가 옵션
     * @param {number} options.duration - 자동으로 닫히기 전 지속 시간 (밀리초)
     * @param {boolean} options.isStatic - true이면 자동으로 닫히지 않음
     * @param {string} options.title - 커스텀 제목 (기본값은 타입에 따라 다름)
     * @returns {HTMLElement} - 생성된 알림 요소
     */
    function showAlert(message, type = 'info', options = {}) {
        // 옵션 기본값 설정
        const duration = options.duration || DEFAULT_DURATION;
        const isStatic = options.isStatic || false;
        const title = options.title || TITLES[type] || TITLES.info;

        // 최대 알림 수 제한
        if (activeAlerts.size >= MAX_ALERTS) {
            closeAlert(activeAlerts.keys().next().value);
        }

        // 알림 요소 생성
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.id = `alert-${++alertCounter}`;
        alert.setAttribute('role', 'alert');
        alert.setAttribute('tabindex', '0');

        // 알림 헤더 생성
        const alertHeader = document.createElement('div');
        alertHeader.className = 'alert-header';

        // 아이콘 추가
        const alertIcon = document.createElement('div');
        alertIcon.className = 'alert-icon';
        alertIcon.innerHTML = SVG_ICONS[type] || SVG_ICONS.info;
        alertHeader.appendChild(alertIcon);

        // 제목 추가
        const alertTitle = document.createElement('div');
        alertTitle.className = 'alert-title';
        alertTitle.textContent = title;
        alertHeader.appendChild(alertTitle);

        // 닫기 버튼 추가
        const closeButton = document.createElement('button');
        closeButton.className = 'alert-close';
        closeButton.innerHTML = SVG_ICONS.close;
        closeButton.setAttribute('aria-label', '닫기');
        closeButton.onclick = function() {
            closeAlert(alert.id);
        };
        alertHeader.appendChild(closeButton);

        alert.appendChild(alertHeader);

        // 알림 본문 생성
        const alertBody = document.createElement('div');
        alertBody.className = 'alert-body';

        // 메시지 추가
        const messageEl = document.createElement('div');
        messageEl.className = 'alert-message';
        messageEl.textContent = message;
        alertBody.appendChild(messageEl);

        alert.appendChild(alertBody);

        // 진행 표시줄 추가 (정적이 아닌 경우에만)
        if (!isStatic) {
            const progressBar = document.createElement('div');
            progressBar.className = 'alert-progress';
            alert.appendChild(progressBar);
            
            // 애니메이션 설정
            setTimeout(() => {
                progressBar.classList.add('active');
                progressBar.style.animationDuration = `${duration}ms`;
            }, 10);
        }

        // 알림 컨테이너에 추가
        alertsContainer.appendChild(alert);

        // 타이머 설정 (정적이 아닌 경우에만)
        let timer = null;
        if (!isStatic) {
            timer = setTimeout(() => {
                closeAlert(alert.id);
            }, duration);
        }

        // 활성 알림 배열에 추가
        activeAlerts.set(alert.id, {
            element: alert,
            timerId: timer,
            onClose: options.onClose
        });

        // 표시 애니메이션 (다음 프레임에서 실행)
        setTimeout(() => {
            alert.classList.add('alert-visible');
        }, 10);

        return alert;
    }

    /**
     * 토스트 표시
     * @param {string} message - 표시할 메시지
     * @param {string} type - 토스트 타입 (success, error, warning, info)
     * @param {Object} options - 추가 옵션
     * @param {number} options.duration - 자동으로 닫히기 전 지속 시간 (밀리초)
     * @param {boolean} options.isStatic - true이면 자동으로 닫히지 않음
     * @returns {HTMLElement} - 생성된 토스트 요소
     */
    function showToast(message, type = 'info', options = {}) {
        // 옵션 기본값 설정
        const duration = options.duration || DEFAULT_DURATION;
        const isStatic = options.isStatic || false;

        // 최대 토스트 수 제한
        if (activeToasts.length >= MAX_TOASTS) {
            closeToast(activeToasts[0]);
        }

        // 토스트 요소 생성
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.id = `toast-${Date.now()}`;

        // 토스트 콘텐츠 생성
        const content = document.createElement('div');
        content.className = 'toast-content';

        // 아이콘 추가
        const toastIcon = document.createElement('div');
        toastIcon.className = 'toast-icon';
        toastIcon.innerHTML = SVG_ICONS[type] || SVG_ICONS.info;
        content.appendChild(toastIcon);

        // 메시지 추가
        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        content.appendChild(messageEl);

        // 닫기 버튼 추가
        const closeButton = document.createElement('button');
        closeButton.className = 'toast-close';
        closeButton.innerHTML = SVG_ICONS.close;
        closeButton.setAttribute('aria-label', '닫기');
        closeButton.onclick = function() {
            closeToast(toast);
        };
        content.appendChild(closeButton);

        toast.appendChild(content);

        // 진행 표시줄 추가 (정적이 아닌 경우에만)
        if (!isStatic) {
            const progressBar = document.createElement('div');
            progressBar.className = 'toast-progress';
            toast.appendChild(progressBar);
            
            // 애니메이션 설정
            setTimeout(() => {
                progressBar.classList.add('active');
                progressBar.style.animationDuration = `${duration}ms`;
            }, 10);
        }

        // 토스트 컨테이너에 추가
        toastsContainer.appendChild(toast);

        // 타이머 설정 (정적이 아닌 경우에만)
        let timer = null;
        if (!isStatic) {
            timer = setTimeout(() => {
                closeToast(toast);
            }, duration);
        }

        // 활성 토스트 배열에 추가
        activeToasts.push(toast);

        // 표시 애니메이션 (다음 프레임에서 실행)
        setTimeout(() => {
            toast.classList.add('toast-visible');
        }, 10);

        // 토스트 객체에 필요한 데이터 추가
        toast._timer = timer;

        return toast;
    }

    /**
     * 알림 닫기
     * @param {HTMLElement} alert - 닫을 알림 요소
     */
    function closeAlert(alert) {
        if (!alert || !alert.classList) return;

        // 타이머 해제
        if (alert._timer) {
            clearTimeout(alert._timer);
        }

        // 닫기 애니메이션
        alert.classList.remove('alert-visible');
        alert.classList.add('alert-hiding');

        // 활성 알림 배열에서 제거
        const index = activeAlerts.indexOf(alert);
        if (index > -1) {
            activeAlerts.splice(index, 1);
        }

        // 애니메이션 완료 후 DOM에서 제거
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }

    /**
     * 토스트 닫기
     * @param {HTMLElement} toast - 닫을 토스트 요소
     */
    function closeToast(toast) {
        if (!toast || !toast.classList) return;

        // 타이머 해제
        if (toast._timer) {
            clearTimeout(toast._timer);
        }

        // 닫기 애니메이션
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-hiding');

        // 활성 토스트 배열에서 제거
        const index = activeToasts.indexOf(toast);
        if (index > -1) {
            activeToasts.splice(index, 1);
        }

        // 애니메이션 완료 후 DOM에서 제거
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * 모든 알림 닫기
     */
    function closeAllAlerts() {
        // 복사본을 만들어 반복하는 동안 배열이 변경되는 것을 방지
        const alerts = [...activeAlerts];
        alerts.forEach(alert => {
            closeAlert(alert);
        });
    }

    /**
     * 모든 토스트 닫기
     */
    function closeAllToasts() {
        // 복사본을 만들어 반복하는 동안 배열이 변경되는 것을 방지
        const toasts = [...activeToasts];
        toasts.forEach(toast => {
            closeToast(toast);
        });
    }

    // 키보드 단축키 이벤트 리스너 추가 (ESC 키로 모든 알림 닫기)
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllAlerts();
            closeAllToasts();
        }
    });

    // 다크 모드 감지 및 적용
    function detectColorScheme() {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // 최초 확인
        applyColorScheme(darkModeMediaQuery.matches);
        
        // 변화 감지
        darkModeMediaQuery.addEventListener('change', (e) => {
            applyColorScheme(e.matches);
        });
    }

    // 색상 테마 적용
    function applyColorScheme(isDarkMode) {
        // 여기서 필요한 경우 추가적인 다크 모드 관련 로직을 처리할 수 있습니다.
        // CSS에서 미디어 쿼리로 처리하기 때문에 여기서는 특별한 작업이 필요하지 않습니다.
        console.debug('다크 모드 상태:', isDarkMode ? '활성화' : '비활성화');
    }

    // 공개 API
    return {
        init: init,
        showAlert: showAlert,
        showToast: showToast,
        closeAlert: closeAlert,
        closeToast: closeToast,
        closeAllAlerts: closeAllAlerts,
        closeAllToasts: closeAllToasts
    };
})();

// 문서 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', AlertsComponent.init); 