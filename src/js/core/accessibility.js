/**
 * accessibility.js
 * 접근성 기능 관리 모듈
 */

const AccessibilityManager = {
  // 접근성 설정 상태
  settings: {
    highContrast: false,
    largerText: false,
    largestText: false,
    reduceMotion: false,
    keyboardUser: false,
    lastAnnouncement: null
  },

  /**
     * 접근성 모듈 초기화
     */
  init() {
    console.log('접근성 모듈 초기화...');

    // 저장된 설정 복원
    this.restoreSettings();

    // 접근성 메뉴 생성
    this.createAccessibilityMenu();

    // 키보드 사용자 감지
    this.detectKeyboardUser();

    // ARIA 요소 초기화
    this.setupAriaAttributes();

    // 스킵 링크 추가
    this.addSkipLinks();
  },

  /**
     * 저장된 접근성 설정 복원
     */
  restoreSettings() {
    try {
      const savedSettings = localStorage.getItem('accessibilitySettings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };

        // 설정 적용
        if (this.settings.highContrast) this.toggleHighContrast(true);
        if (this.settings.largerText) this.toggleLargerText(true);
        if (this.settings.largestText) this.toggleLargestText(true);
        if (this.settings.reduceMotion) this.toggleReduceMotion(true);
        if (this.settings.keyboardUser) document.body.classList.add('keyboard-user');
      }
    } catch (e) {
      console.warn('접근성 설정 복원 오류:', e);
    }
  },

  /**
     * 접근성 설정 저장
     */
  saveSettings() {
    try {
      localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('접근성 설정 저장 오류:', e);
    }
  },

  /**
     * 접근성 메뉴 생성
     */
  createAccessibilityMenu() {
    // 접근성 토글 버튼
    const toggleButton = document.createElement('button');
    toggleButton.className = 'accessibility-toggle';
    toggleButton.setAttribute('aria-label', '접근성 메뉴 열기');
    toggleButton.innerHTML = '<i class="fas fa-universal-access" aria-hidden="true"></i>';

    // 접근성 메뉴
    const menu = document.createElement('div');
    menu.className = 'accessibility-menu';
    menu.setAttribute('aria-labelledby', 'accessibility-title');

    menu.innerHTML = `
            <h3 id="accessibility-title">접근성 설정</h3>
            <ul>
                <li>
                    <button id="high-contrast-toggle" aria-pressed="${this.settings.highContrast}">
                        고대비 모드 ${this.settings.highContrast ? '끄기' : '켜기'}
                    </button>
                </li>
                <li>
                    <button id="larger-text-toggle" aria-pressed="${this.settings.largerText}">
                        큰 텍스트 ${this.settings.largerText ? '끄기' : '켜기'}
                    </button>
                </li>
                <li>
                    <button id="largest-text-toggle" aria-pressed="${this.settings.largestText}">
                        가장 큰 텍스트 ${this.settings.largestText ? '끄기' : '켜기'}
                    </button>
                </li>
                <li>
                    <button id="reduce-motion-toggle" aria-pressed="${this.settings.reduceMotion}">
                        애니메이션 줄이기 ${this.settings.reduceMotion ? '끄기' : '켜기'}
                    </button>
                </li>
                <li>
                    <button id="reset-settings">
                        모든 설정 초기화
                    </button>
                </li>
            </ul>
        `;

    // 문서에 추가
    document.body.appendChild(toggleButton);
    document.body.appendChild(menu);

    // 이벤트 리스너 등록
    toggleButton.addEventListener('click', () => {
      const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
      toggleButton.setAttribute('aria-expanded', !isExpanded);
      menu.classList.toggle('show');
      toggleButton.setAttribute('aria-label', isExpanded ? '접근성 메뉴 열기' : '접근성 메뉴 닫기');
    });

    // 메뉴 옵션 이벤트 리스너
    document.getElementById('high-contrast-toggle').addEventListener('click', () => {
      this.toggleHighContrast();
    });

    document.getElementById('larger-text-toggle').addEventListener('click', () => {
      this.toggleLargerText();
    });

    document.getElementById('largest-text-toggle').addEventListener('click', () => {
      this.toggleLargestText();
    });

    document.getElementById('reduce-motion-toggle').addEventListener('click', () => {
      this.toggleReduceMotion();
    });

    document.getElementById('reset-settings').addEventListener('click', () => {
      this.resetSettings();
    });

    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !toggleButton.contains(e.target) && menu.classList.contains('show')) {
        menu.classList.remove('show');
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.setAttribute('aria-label', '접근성 메뉴 열기');
      }
    });
  },

  /**
     * 고대비 모드 토글
     * @param {boolean} value 강제 설정 값 (옵션)
     */
  toggleHighContrast(value) {
    const newValue = value !== undefined ? value : !this.settings.highContrast;
    this.settings.highContrast = newValue;

    document.body.classList.toggle('high-contrast', newValue);

    const button = document.getElementById('high-contrast-toggle');
    if (button) {
      button.setAttribute('aria-pressed', newValue);
      button.textContent = `고대비 모드 ${newValue ? '끄기' : '켜기'}`;
    }

    this.announce(`고대비 모드 ${newValue ? '켜짐' : '꺼짐'}`);
    this.saveSettings();
  },

  /**
     * 큰 텍스트 모드 토글
     * @param {boolean} value 강제 설정 값 (옵션)
     */
  toggleLargerText(value) {
    const newValue = value !== undefined ? value : !this.settings.largerText;

    // 가장 큰 텍스트가 활성화된 경우 비활성화
    if (newValue && this.settings.largestText) {
      this.toggleLargestText(false);
    }

    this.settings.largerText = newValue;

    document.body.classList.toggle('larger-text', newValue);

    const button = document.getElementById('larger-text-toggle');
    if (button) {
      button.setAttribute('aria-pressed', newValue);
      button.textContent = `큰 텍스트 ${newValue ? '끄기' : '켜기'}`;
    }

    this.announce(`큰 텍스트 모드 ${newValue ? '켜짐' : '꺼짐'}`);
    this.saveSettings();
  },

  /**
     * 가장 큰 텍스트 모드 토글
     * @param {boolean} value 강제 설정 값 (옵션)
     */
  toggleLargestText(value) {
    const newValue = value !== undefined ? value : !this.settings.largestText;

    // 큰 텍스트가 활성화된 경우 비활성화
    if (newValue && this.settings.largerText) {
      this.toggleLargerText(false);
    }

    this.settings.largestText = newValue;

    document.body.classList.toggle('largest-text', newValue);

    const button = document.getElementById('largest-text-toggle');
    if (button) {
      button.setAttribute('aria-pressed', newValue);
      button.textContent = `가장 큰 텍스트 ${newValue ? '끄기' : '켜기'}`;
    }

    this.announce(`가장 큰 텍스트 모드 ${newValue ? '켜짐' : '꺼짐'}`);
    this.saveSettings();
  },

  /**
     * 애니메이션 감소 모드 토글
     * @param {boolean} value 강제 설정 값 (옵션)
     */
  toggleReduceMotion(value) {
    const newValue = value !== undefined ? value : !this.settings.reduceMotion;
    this.settings.reduceMotion = newValue;

    document.body.classList.toggle('reduce-motion', newValue);

    const button = document.getElementById('reduce-motion-toggle');
    if (button) {
      button.setAttribute('aria-pressed', newValue);
      button.textContent = `애니메이션 줄이기 ${newValue ? '끄기' : '켜기'}`;
    }

    this.announce(`애니메이션 감소 모드 ${newValue ? '켜짐' : '꺼짐'}`);
    this.saveSettings();
  },

  /**
     * 모든 설정 초기화
     */
  resetSettings() {
    // 설정 초기화
    this.settings = {
      highContrast: false,
      largerText: false,
      largestText: false,
      reduceMotion: false,
      keyboardUser: this.settings.keyboardUser,
      lastAnnouncement: null
    };

    // 클래스 제거
    document.body.classList.remove('high-contrast', 'larger-text', 'largest-text', 'reduce-motion');

    // 버튼 상태 업데이트
    const buttons = {
      'high-contrast-toggle': '고대비 모드 켜기',
      'larger-text-toggle': '큰 텍스트 켜기',
      'largest-text-toggle': '가장 큰 텍스트 켜기',
      'reduce-motion-toggle': '애니메이션 줄이기 켜기'
    };

    Object.entries(buttons).forEach(([id, text]) => {
      const button = document.getElementById(id);
      if (button) {
        button.setAttribute('aria-pressed', 'false');
        button.textContent = text;
      }
    });

    this.announce('모든 접근성 설정이 초기화되었습니다');
    this.saveSettings();
  },

  /**
     * 키보드 사용자 감지
     */
  detectKeyboardUser() {
    const handleFirstTab = (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
        this.settings.keyboardUser = true;
        this.saveSettings();

        // 이벤트 리스너 제거 (한 번만 실행)
        window.removeEventListener('keydown', handleFirstTab);
      }
    };

    window.addEventListener('keydown', handleFirstTab);

    // 마우스 사용 시 키보드 모드 비활성화
    window.addEventListener('mousedown', () => {
      if (this.settings.keyboardUser) {
        document.body.classList.remove('keyboard-user');
        this.settings.keyboardUser = false;
        this.saveSettings();

        // 키보드 사용 감지 다시 활성화
        window.addEventListener('keydown', handleFirstTab);
      }
    });
  },

  /**
     * ARIA 속성 초기화
     */
  setupAriaAttributes() {
    // 모달 초기 설정
    document.querySelectorAll('.modal').forEach(modal => {
      modal.setAttribute('aria-hidden', 'true');
    });

    // 알림 영역 설정
    document.querySelectorAll('.alert-container').forEach(container => {
      container.setAttribute('aria-live', 'polite');
    });

    // 검색 결과 영역 설정
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.setAttribute('aria-live', 'polite');
    }
  },

  /**
     * 스킵 링크 추가
     */
  addSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';

    // 메인 콘텐츠로 건너뛰기
    const skipToMain = document.createElement('a');
    skipToMain.href = '#main-section';
    skipToMain.className = 'skip-link';
    skipToMain.textContent = '메인 콘텐츠로 건너뛰기';

    // 검색으로 건너뛰기
    const skipToSearch = document.createElement('a');
    skipToSearch.href = '#search-input';
    skipToSearch.className = 'skip-link';
    skipToSearch.textContent = '검색으로 건너뛰기';

    skipLinks.appendChild(skipToMain);
    skipLinks.appendChild(skipToSearch);

    document.body.insertBefore(skipLinks, document.body.firstChild);
  },

  /**
     * 스크린 리더 안내 메시지
     * @param {string} message 안내 메시지
     */
  announce(message) {
    if (message === this.settings.lastAnnouncement) return;

    const announcer = document.getElementById('screen-reader-announcements');
    if (announcer) {
      announcer.textContent = message;
      this.settings.lastAnnouncement = message;
    }
  },

  /**
     * 페이지 제목 업데이트
     * @param {string} title 새 제목
     */
  updatePageTitle(title) {
    document.title = title ? `${title} - 세계 경제 제재 검색 서비스` : '세계 경제 제재 검색 서비스';
  },

  /**
     * 접근성 검증
     * 주요 WCAG 요구사항 검사
     * @returns {Object} 검증 결과
     */
  validateAccessibility() {
    const issues = [];

    // 이미지 대체 텍스트 확인
    document.querySelectorAll('img').forEach(img => {
      if (!img.getAttribute('alt')) {
        issues.push({
          element: img,
          issue: '이미지에 대체 텍스트(alt) 없음',
          severity: 'error',
          wcag: '1.1.1'
        });
      }
    });

    // 색상 대비 검사는 자동화 불가능하므로 경고만 표시
    issues.push({
      element: document.body,
      issue: '색상 대비 확인 필요',
      severity: 'warning',
      wcag: '1.4.3'
    });

    // 폼 레이블 확인
    document.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.type !== 'hidden' && !input.getAttribute('aria-label') && !document.querySelector(`label[for="${input.id}"]`)) {
        issues.push({
          element: input,
          issue: '폼 요소에 레이블 없음',
          severity: 'error',
          wcag: '1.3.1'
        });
      }
    });

    // 헤딩 계층 구조 확인
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    for (let i = 1; i < headings.length; i++) {
      const current = parseInt(headings[i].tagName.substring(1));
      const previous = parseInt(headings[i-1].tagName.substring(1));

      if (current > previous + 1) {
        issues.push({
          element: headings[i],
          issue: '헤딩 레벨 건너뜀',
          severity: 'warning',
          wcag: '1.3.1'
        });
      }
    }

    return {
      issues,
      severity: issues.some(i => i.severity === 'error') ? 'error' : 'warning',
      timestamp: new Date().toISOString()
    };
  }
};

// 전역 객체에 등록
window.AccessibilityManager = AccessibilityManager;

// 외부 모듈에서 사용할 수 있도록 export
export default AccessibilityManager;