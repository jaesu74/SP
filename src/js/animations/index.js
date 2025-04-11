/**
 * animations/index.js
 * 애니메이션 모듈의 중앙 진입점
 * 여러 애니메이션 하위 모듈을 통합하고 초기화
 */

// 애니메이션 모듈
const Animations = {
  // 설정
  config: {
    performance: 'medium', // low, medium, high
    reducedMotion: false,
    enableParallax: true,
    enableTilt: true,
    enableFloating: true,
    enableScrollAnimations: true,
    enableInteractions: true,
    enableLoading: true
  },

  // 하위 모듈 참조
  modules: {
    scroll: null,
    interaction: null,
    loading: null
  },

  // 초기화
  init(options = {}) {
    console.log('애니메이션 시스템 초기화 중...');

    // 성능 설정 확인
    this.setupPerformanceConfig(options);

    // 모듈 초기화
    this.initModules();

    // DOMContentLoaded 이벤트 핸들러
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.onDocumentReady.bind(this));
    } else {
      this.onDocumentReady();
    }

    console.log('애니메이션 시스템 초기화 완료');

    return this;
  },

  // 성능 설정 초기화
  setupPerformanceConfig(options) {
    // 옵션으로 설정 업데이트
    this.config = { ...this.config, ...options };

    // URL 파라미터로 성능 모드 확인
    const urlParams = new URLSearchParams(window.location.search);
    const performanceMode = urlParams.get('performance');

    if (performanceMode === 'high') {
      // 고성능 모드 - 애니메이션 최소화
      this.config.enableParallax = false;
      this.config.enableTilt = false;
      this.config.enableFloating = false;
      this.config.performance = 'high';
      console.log('고성능 모드가 활성화되었습니다. 애니메이션이 최소화됩니다.');
    } else if (performanceMode === 'medium') {
      // 중간 성능 모드 - 일부 애니메이션만 활성화
      this.config.enableParallax = false;
      this.config.enableTilt = true;
      this.config.enableFloating = false;
      this.config.performance = 'medium';
      console.log('중간 성능 모드가 활성화되었습니다.');
    } else if (performanceMode === 'low') {
      // 저성능 모드 - 모든 애니메이션 활성화
      this.config.enableParallax = true;
      this.config.enableTilt = true;
      this.config.enableFloating = true;
      this.config.performance = 'low';
      console.log('모든 애니메이션이 활성화되었습니다.');
    }

    // 감소된 모션 선호도 확인
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.config.reducedMotion = true;
      this.config.enableParallax = false;
      this.config.enableTilt = false;
      this.config.enableFloating = false;
      console.log('감소된 모션 선호도가 감지되었습니다. 애니메이션이 최소화됩니다.');
    }
  },

  // 모듈 초기화
  initModules() {
    // 스크롤 애니메이션 모듈 초기화
    if (this.config.enableScrollAnimations && window.ScrollAnimations) {
      this.modules.scroll = window.ScrollAnimations.init({
        enableParallax: this.config.enableParallax
      });
    }

    // 인터랙션 애니메이션 모듈 초기화
    if (this.config.enableInteractions && window.InteractionAnimations) {
      this.modules.interaction = window.InteractionAnimations.init({
        enableTilt: this.config.enableTilt,
        enableParallax: this.config.enableParallax,
        enableHover: !this.config.reducedMotion
      });
    }

    // 로딩 애니메이션 모듈 초기화
    if (this.config.enableLoading && window.LoadingAnimations) {
      this.modules.loading = window.LoadingAnimations.init();
    }
  },

  // DOM 준비 완료 핸들러
  onDocumentReady() {
    // 결과 아이템 애니메이션 초기화
    this.initResultsAnimations();

    // 자동 애니메이션 요소 초기화
    this.setupAutoAnimations();
  },

  // 결과 아이템 애니메이션 초기화
  initResultsAnimations() {
    const resultsContainer = document.getElementById('results-container');

    if (!resultsContainer) return;

    // 결과 추가 시 애니메이션 적용 (MutationObserver 사용)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // 요소 노드인 경우
              this.animateResultItem(node);
            }
          });
        }
      });
    });

    // 옵저버 설정
    observer.observe(resultsContainer, { childList: true });
  },

  // 결과 아이템 애니메이션 적용
  animateResultItem(item) {
    if (this.config.reducedMotion) {
      item.style.opacity = '1';
      return;
    }

    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';

    setTimeout(() => {
      item.style.transition = 'all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1.4)';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    }, 10);
  },

  // 자동 애니메이션 요소 설정
  setupAutoAnimations() {
    if (this.config.reducedMotion) return;

    // 자동 애니메이션 클래스를 가진 요소들
    const animatedElements = document.querySelectorAll('.auto-animate');

    animatedElements.forEach((el, index) => {
      const delay = el.dataset.delay || index * 0.1;

      setTimeout(() => {
        el.classList.add('animate-in');
      }, delay * 1000);
    });
  },

  // 로딩 인디케이터 표시
  showLoadingIndicator(containerId, message = '로딩 중...') {
    if (this.modules.loading && this.modules.loading.showIndicator) {
      return this.modules.loading.showIndicator(containerId, message);
    }

    // 폴백 구현
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
  },

  // 로딩 인디케이터 숨기기
  hideLoadingIndicator(indicator) {
    if (this.modules.loading && this.modules.loading.hideIndicator) {
      this.modules.loading.hideIndicator(indicator);
      return;
    }

    // 폴백 구현
    if (!indicator || !indicator.parentNode) return;

    indicator.style.opacity = '0';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 300);
  }
};

// 브라우저 환경에서 전역 객체에 노출
if (typeof window !== 'undefined') {
  window.Animations = Animations;

  // 자동 초기화 (window.skipAutoInit이 true가 아닌 경우)
  if (!window.skipAnimationsAutoInit) {
    // 문서가 로드되면 초기화
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.Animations.init();
      });
    } else {
      window.Animations.init();
    }
  }
}