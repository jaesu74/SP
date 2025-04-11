/**
 * interaction.js
 * 마우스 및 사용자 인터랙션 관련 애니메이션 처리
 */

// 인터랙션 애니메이션 모듈
const InteractionAnimations = {
  // 설정
  config: {
    enableTilt: true,
    enableHover: true,
    enableParallax: true,
    tiltSettings: {
      maxTilt: 10,
      perspective: 500,
      scale: 1.02,
      speed: 200
    },
    hoverSettings: {
      scale: 1.05,
      speed: 300
    }
  },

  // 초기화
  init(options = {}) {
    // 옵션으로 설정 업데이트
    this.config = { ...this.config, ...options };

    // 틸트 효과 초기화
    if (this.config.enableTilt) {
      this.initTiltEffects();
    }

    // 호버 효과 초기화
    if (this.config.enableHover) {
      this.setupHoverEffects();
    }

    // 패럴랙스 효과 초기화
    if (this.config.enableParallax) {
      this.setupParallaxEffect();
    }

    // 이벤트 핸들러 정리를 위한 비활성화 메서드 등록
    window.addEventListener('beforeunload', this.cleanupEventListeners);

    console.log('인터랙션 애니메이션 모듈 초기화 완료');

    return this;
  },

  // 틸트 효과 초기화
  initTiltEffects() {
    const tiltElements = document.querySelectorAll('.tilt-effect');

    tiltElements.forEach(element => {
      element.addEventListener('mousemove', this.handleTilt.bind(this));
      element.addEventListener('mouseout', this.resetTilt.bind(this));
    });
  },

  // 틸트 처리 핸들러
  handleTilt(e) {
    const el = e.currentTarget;
    const height = el.clientHeight;
    const width = el.clientWidth;

    // 마우스 위치 계산
    const xVal = e.offsetX;
    const yVal = e.offsetY;

    // 틸트 계산
    const settings = this.config.tiltSettings;
    const yRotation = settings.maxTilt * ((xVal - width / 2) / width);
    const xRotation = -settings.maxTilt * ((yVal - height / 2) / height);

    // 변환 적용
    const transform = `perspective(${settings.perspective}px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(${settings.scale})`;

    el.style.transform = transform;
    el.style.transition = `transform ${settings.speed}ms`;
  },

  // 틸트 초기화
  resetTilt(e) {
    const el = e.currentTarget;
    el.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';
    el.style.transition = 'transform 500ms';
  },

  // 호버 효과 설정
  setupHoverEffects() {
    const hoverElements = document.querySelectorAll('.hover-effect');

    hoverElements.forEach(element => {
      element.addEventListener('mouseenter', this.addHoverEffect.bind(this));
      element.addEventListener('mouseleave', this.removeHoverEffect.bind(this));
    });

    // 버튼 호버 효과
    const buttons = document.querySelectorAll('button:not(.no-hover), .btn');

    buttons.forEach(button => {
      button.addEventListener('mouseenter', this.addButtonHoverEffect.bind(this));
      button.addEventListener('mouseleave', this.removeButtonHoverEffect.bind(this));
    });
  },

  // 호버 효과 추가
  addHoverEffect(e) {
    const el = e.currentTarget;
    const settings = this.config.hoverSettings;

    el.style.transform = `scale(${settings.scale})`;
    el.style.transition = `transform ${settings.speed}ms`;
    el.style.zIndex = '1';

    // 그림자 효과 (이미 있는 경우가 아니라면)
    if (!el.dataset.originalShadow) {
      el.dataset.originalShadow = el.style.boxShadow;
      el.style.boxShadow = '0 10px 20px rgba(0,0,0,0.15)';
    }
  },

  // 호버 효과 제거
  removeHoverEffect(e) {
    const el = e.currentTarget;
    const settings = this.config.hoverSettings;

    el.style.transform = 'scale(1)';
    el.style.transition = `transform ${settings.speed}ms`;
    el.style.zIndex = '';

    // 원래 그림자로 복원
    if (el.dataset.originalShadow !== undefined) {
      el.style.boxShadow = el.dataset.originalShadow;
    }
  },

  // 버튼 호버 효과
  addButtonHoverEffect(e) {
    const button = e.currentTarget;

    // 이펙트 설정
    if (!button.querySelector('.hover-bg')) {
      const effect = document.createElement('span');
      effect.className = 'hover-bg';
      effect.style.position = 'absolute';
      effect.style.top = '0';
      effect.style.left = '0';
      effect.style.width = '100%';
      effect.style.height = '100%';
      effect.style.backgroundColor = 'currentColor';
      effect.style.opacity = '0';
      effect.style.transition = 'opacity 300ms';
      effect.style.pointerEvents = 'none';
      effect.style.zIndex = '-1';
      effect.style.borderRadius = 'inherit';

      // 버튼에 상대적 포지션 확인
      if (window.getComputedStyle(button).position === 'static') {
        button.style.position = 'relative';
      }

      button.insertBefore(effect, button.firstChild);
    }

    // 이펙트 적용
    const effect = button.querySelector('.hover-bg');
    effect.style.opacity = '0.1';

    // 버튼 스케일 효과
    button.style.transform = 'scale(1.05)';
    button.style.transition = 'transform 300ms';
  },

  // 버튼 호버 효과 제거
  removeButtonHoverEffect(e) {
    const button = e.currentTarget;
    const effect = button.querySelector('.hover-bg');

    if (effect) {
      effect.style.opacity = '0';
    }

    // 스케일 효과 제거
    button.style.transform = 'scale(1)';
  },

  // 패럴랙스 효과 설정
  setupParallaxEffect() {
    const parallaxElements = document.querySelectorAll('.parallax');

    if (parallaxElements.length === 0) return;

    // 마우스 움직임에 따른 패럴랙스 효과
    const updateMousePosition = (e) => {
      this.updateParallaxPositions(e, parallaxElements);
    };

    // 이벤트 리스너 등록
    document.addEventListener('mousemove', updateMousePosition);

    // 초기 위치 설정
    parallaxElements.forEach(el => {
      el.style.transition = 'transform 100ms ease-out';
      el.style.transform = 'translate(0, 0)';
    });
  },

  // 패럴랙스 위치 업데이트
  updateParallaxPositions(e, elements) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    elements.forEach(el => {
      const speed = parseFloat(el.dataset.speed || 0.1);
      const x = (mouseX - windowWidth / 2) * speed;
      const y = (mouseY - windowHeight / 2) * speed;

      el.style.transform = `translate(${x}px, ${y}px)`;
    });
  },

  // 이벤트 리스너 정리
  cleanupEventListeners() {
    const tiltElements = document.querySelectorAll('.tilt-effect');
    const hoverElements = document.querySelectorAll('.hover-effect');
    const buttons = document.querySelectorAll('button:not(.no-hover), .btn');

    tiltElements.forEach(element => {
      element.removeEventListener('mousemove', this.handleTilt);
      element.removeEventListener('mouseout', this.resetTilt);
    });

    hoverElements.forEach(element => {
      element.removeEventListener('mouseenter', this.addHoverEffect);
      element.removeEventListener('mouseleave', this.removeHoverEffect);
    });

    buttons.forEach(button => {
      button.removeEventListener('mouseenter', this.addButtonHoverEffect);
      button.removeEventListener('mouseleave', this.removeButtonHoverEffect);
    });

    document.removeEventListener('mousemove', this.updateParallaxPositions);
  }
};

// 브라우저 환경에서 전역 객체에 노출
if (typeof window !== 'undefined') {
  window.InteractionAnimations = InteractionAnimations;
}