/**
 * ui.js
 * UI 관련 기능 및 렌더링 담당 모듈
 */

const UIManager = {
  // UI 상태
  state: {
    isMaximalistStyle: true,
    currentSection: 'login',
    isModalOpen: false,
    currentModal: null
  },

  /**
     * UI 모듈 초기화
     */
  init() {
    console.log('UI 모듈 초기화...');
    this.applyMaximalistStyle();
    this.setupUIComponents();
  },

  /**
     * 맥시멀리즘 스타일 적용
     */
  applyMaximalistStyle() {
    // 맥시멀리즘 UI 스타일에 필요한 클래스 추가
    document.querySelectorAll('.maximalist').forEach(el => {
      el.classList.add('textured');
    });

    // 애니메이션 요소 확인 및 적용
    document.querySelectorAll('.animated').forEach(el => {
      // 뷰포트에 이미 보이는 요소는 바로 보여주기
      if (this.isElementInViewport(el)) {
        el.classList.add('visible');
      }
    });

    // 스크롤 감지하여 요소 애니메이션 처리
    this.setupScrollAnimations();
  },

  /**
     * 스크롤 애니메이션 설정
     */
  setupScrollAnimations() {
    const handleScroll = this.debounce(() => {
      document.querySelectorAll('.animated:not(.visible)').forEach(el => {
        if (this.isElementInViewport(el)) {
          el.classList.add('visible');
        }
      });
    }, 100);

    window.addEventListener('scroll', handleScroll);
    // 초기 실행
    handleScroll();
  },

  /**
     * 요소가 뷰포트에 있는지 확인
     */
  isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0 &&
            rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
            rect.right >= 0
    );
  },

  /**
     * 디바운스 함수
     */
  debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  },

  /**
     * UI 컴포넌트 설정
     */
  setupUIComponents() {
    this.setupModalClose();
    this.setupPasswordToggle();
    this.setupFooterLinks();
  },

  /**
     * 모달 닫기 버튼 설정
     */
  setupModalClose() {
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // 모달 바깥 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });
  },

  /**
     * 비밀번호 표시/숨김 토글 설정
     */
  setupPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const passwordInput = e.target.previousElementSibling;
        if (passwordInput && passwordInput.type) {
          const type = passwordInput.type === 'password' ? 'text' : 'password';
          passwordInput.type = type;
          e.target.classList.toggle('fa-eye');
          e.target.classList.toggle('fa-eye-slash');
        }
      });
    });
  },

  /**
     * 푸터 링크 설정
     */
  setupFooterLinks() {
    const helpLink = document.getElementById('help-link');
    const aboutLink = document.getElementById('about-link');

    if (helpLink) {
      helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showInfoModal('help');
      });
    }

    if (aboutLink) {
      aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showInfoModal('about');
      });
    }
  },

  /**
     * 정보 모달 표시
     */
  showInfoModal(type) {
    const modal = document.getElementById('info-modal');
    const title = document.getElementById('info-title');
    const content = document.getElementById('info-content');

    if (!modal || !title || !content) return;

    if (type === 'help') {
      title.textContent = '도움말';
      content.innerHTML = `
                <div class="info-section">
                    <h3>제재 검색 서비스 사용법</h3>
                    <p>이 서비스는 UN, EU, US의 경제 제재 대상을 검색할 수 있는 서비스입니다.</p>
                    
                    <h4>기본 검색</h4>
                    <p>검색창에 이름, 국가, 식별번호 등을 입력하여 검색할 수 있습니다.</p>
                    
                    <h4>상세 정보 조회</h4>
                    <p>검색 결과에서 항목을 클릭하면 상세 정보를 확인할 수 있습니다.</p>
                    
                    <h4>필터 사용</h4>
                    <p>국가, 프로그램, 날짜별로 결과를 필터링할 수 있습니다.</p>
                    
                    <h4>데이터 다운로드</h4>
                    <p>상세 정보 화면에서 PDF로 정보를 다운로드할 수 있습니다.</p>
                </div>
            `;
    } else if (type === 'about') {
      title.textContent = '회사 소개';
      content.innerHTML = `
                <div class="info-section">
                    <h3>WVL 소개</h3>
                    <p>WVL은 글로벌 컴플라이언스와 규제 정보 솔루션을 제공하는 기업입니다.</p>
                    
                    <h4>연락처</h4>
                    <p>웹사이트: <a href="https://wvl.co.kr" target="_blank">wvl.co.kr</a></p>
                    <p>이메일: support@wvl.co.kr</p>
                    
                    <h4>데이터 소스</h4>
                    <p>본 서비스는 UN, EU, US 제재 데이터를 수집하여 통합 제공합니다.</p>
                    <p>마지막 데이터 업데이트: 2025-04-10</p>
                </div>
            `;
    }

    this.openModal('info-modal');
  },

  /**
     * 모달 열기
     */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);

    this.state.isModalOpen = true;
    this.state.currentModal = modalId;

    // 접근성 개선: 모달 오픈 시 포커스 이동
    const focusableEl = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableEl) {
      focusableEl.focus();
    }

    // ARIA 속성 설정
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // 배경 스크롤 방지
    this.disableBodyScroll();
  },

  /**
     * 모달 닫기
     */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('show');

    // 트랜지션 후 숨김 처리
    setTimeout(() => {
      modal.style.display = 'none';

      this.state.isModalOpen = false;
      this.state.currentModal = null;

      // ARIA 속성 업데이트
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');

      // 배경 스크롤 복원
      this.enableBodyScroll();
    }, 300);
  },

  /**
     * 바디 스크롤 비활성화
     */
  disableBodyScroll() {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  },

  /**
     * 바디 스크롤 활성화
     */
  enableBodyScroll() {
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  },

  /**
     * 로그인 섹션 표시
     */
  showLoginSection() {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');

    if (loginSection && mainSection) {
      loginSection.style.display = 'block';
      mainSection.style.display = 'none';

      this.state.currentSection = 'login';
      this.adjustFooterForLoginSection();
    }
  },

  /**
     * 메인 섹션 표시
     * @param {string} email 사용자 이메일
     */
  showMainSection(email) {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    const userNameElement = document.getElementById('user-name');

    if (loginSection && mainSection) {
      loginSection.style.display = 'none';
      mainSection.style.display = 'block';

      if (userNameElement && email) {
        const user = email.split('@')[0];
        userNameElement.textContent = `${user} 님`;
      }

      this.state.currentSection = 'main';
      this.adjustFooterForMainSection();

      // 접근성 개선: 메인 섹션으로 포커스 이동
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }
  },

  /**
     * 로그인 섹션용 푸터 조정
     */
  adjustFooterForLoginSection() {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.classList.add('login-footer');
      footer.classList.remove('main-footer');
    }
  },

  /**
     * 메인 섹션용 푸터 조정
     */
  adjustFooterForMainSection() {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.classList.remove('login-footer');
      footer.classList.add('main-footer');
    }
  },

  /**
     * 알림 메시지 표시
     * @param {string} message 메시지
     * @param {string} type 알림 타입 (success, error, info, warning)
     * @param {string} containerId 알림 컨테이너 ID (옵션)
     */
  showAlert(message, type = 'info', containerId = null) {
    // AlertsComponent 활용(있는 경우)
    if (window.AlertsComponent && typeof window.AlertsComponent.showAlert === 'function') {
      window.AlertsComponent.showAlert(message, type, containerId);
      return;
    }

    // 대체 구현
    const container = containerId
      ? document.getElementById(containerId)
      : document.querySelector('.alert-container');

    if (!container) return;

    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.innerHTML = `
            <span class="alert-message">${message}</span>
            <button class="alert-close">&times;</button>
        `;

    container.appendChild(alertElement);

    // 애니메이션 적용
    setTimeout(() => {
      alertElement.classList.add('show');
    }, 10);

    // 닫기 버튼 이벤트
    const closeBtn = alertElement.querySelector('.alert-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        alertElement.classList.remove('show');
        setTimeout(() => {
          container.removeChild(alertElement);
        }, 300);
      });
    }

    // 3초 후 자동 제거
    setTimeout(() => {
      if (alertElement.parentNode === container) {
        alertElement.classList.remove('show');
        setTimeout(() => {
          if (alertElement.parentNode === container) {
            container.removeChild(alertElement);
          }
        }, 300);
      }
    }, 3000);
  },

  /**
     * 로딩 인디케이터 표시
     * @param {string} containerId 표시할 컨테이너 ID
     * @param {string} message 로딩 메시지
     * @returns {HTMLElement} 생성된 로딩 요소
     */
  showLoading(containerId, message = '로딩 중...') {
    const container = document.getElementById(containerId);
    if (!container) return null;

    // 기존 로딩 요소가 있으면 제거
    const existingLoading = container.querySelector('.loading-indicator');
    if (existingLoading) {
      container.removeChild(existingLoading);
    }

    // 새 로딩 요소 생성
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-indicator';
    loadingElement.setAttribute('role', 'status');
    loadingElement.setAttribute('aria-live', 'polite');
    loadingElement.innerHTML = `
            <div class="spinner" aria-hidden="true"></div>
            <p class="loading-message">${message}</p>
        `;

    container.appendChild(loadingElement);
    return loadingElement;
  },

  /**
     * 로딩 인디케이터 제거
     * @param {string|HTMLElement} containerOrElement 컨테이너 ID 또는 로딩 요소
     */
  hideLoading(containerOrElement) {
    if (typeof containerOrElement === 'string') {
      const container = document.getElementById(containerOrElement);
      if (!container) return;

      const loadingElement = container.querySelector('.loading-indicator');
      if (loadingElement) {
        container.removeChild(loadingElement);
      }
    } else if (containerOrElement instanceof HTMLElement) {
      if (containerOrElement.parentNode) {
        containerOrElement.parentNode.removeChild(containerOrElement);
      }
    }
  }
};

// 전역 객체에 등록
window.UIManager = UIManager;

// 외부 모듈에서 사용할 수 있도록 export
export default UIManager;