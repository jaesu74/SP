/**
 * alerts.js - 표준화된 알림 및 토스트 컴포넌트
 * 응용 프로그램 전체에서 사용할 수 있는 알림 및 토스트 메시지 시스템
 *
 * @version 1.0.0
 * @author Your Name
 * @created 2023-10-01
 */

// 알림 컴포넌트 객체
const AlertsComponent = {
  // 초기화 여부
  initialized: false,

  // 알림 컨테이너 맵 (타겟별 컨테이너)
  containers: new Map(),

  // 알림 타입
  TYPE: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  },

  // 기본 알림 타입
  DEFAULT_TYPE: 'info',

  // 알림 지속 시간 (ms)
  DURATION: {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 8000
  },

  // 기본 지속 시간
  DEFAULT_DURATION: 5000,

  // 아이콘 매핑
  ICONS: {
    success: '<i class="fas fa-check-circle"></i>',
    error: '<i class="fas fa-times-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>',
    info: '<i class="fas fa-info-circle"></i>'
  },

  // 닫기 아이콘
  CLOSE_ICON: '<i class="fas fa-times"></i>',

  /**
   * 컴포넌트 초기화
   */
  init() {
    if (this.initialized) return;

    // 기본 알림 컨테이너 생성
    this.createContainer('default');

    // 색상 스키마 감지 (다크 모드 지원)
    this.detectColorScheme();

    // 이벤트 리스너 추가
    window.addEventListener('theme-change', this.detectColorScheme.bind(this));

    this.initialized = true;

    // 전역 함수 등록
    window.showAlert = this.showAlert.bind(this);
  },

  /**
   * 알림 컨테이너 생성
   * @param {string} target 컨테이너 타겟 ID
   * @returns {HTMLElement} 생성된 컨테이너
   */
  createContainer(target = 'default') {
    // 이미 존재하는 컨테이너 반환
    if (this.containers.has(target)) {
      return this.containers.get(target);
    }

    // 새 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'alerts-container';
    container.id = `alerts-container-${target}`;

    // 타겟에 따라 위치 설정
    switch (target) {
      case 'top':
        container.classList.add('alerts-top');
        break;
      case 'bottom':
        container.classList.add('alerts-bottom');
        break;
      case 'center':
        container.classList.add('alerts-center');
        break;
      default:
        container.classList.add('alerts-default');
    }

    // DOM에 추가
    document.body.appendChild(container);

    // 맵에 저장
    this.containers.set(target, container);

    return container;
  },

  // 나머지 함수 유지...
};

// 전역 객체에 등록
window.AlertsComponent = AlertsComponent;

// 모듈로 내보내기
export default AlertsComponent;