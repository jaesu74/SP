/**
 * eventHandlers.js
 * 앱 전체 이벤트 핸들러 관리 모듈
 */

const EventManager = {
  /**
     * 이벤트 관리자 초기화
     */
  init() {
    console.log('이벤트 관리자 초기화...');
    this.setupEventListeners();
  },

  /**
     * 앱 전체 이벤트 리스너 설정
     */
  setupEventListeners() {
    this.setupLoginEvents();
    this.setupSearchEvents();
    this.setupDetailEvents();
    this.setupFilterEvents();
    this.setupNavigationEvents();
  },

  /**
     * 로그인 관련 이벤트 설정
     */
  setupLoginEvents() {
    const loginForm = document.getElementById('login-form');
    const registerLink = document.getElementById('register-link');
    const registerForm = document.getElementById('register-form');
    const autoLoginBtn = document.getElementById('auto-login-btn');

    // 로그인 폼 제출
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    // 회원가입 링크
    if (registerLink) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.UIManager) {
          window.UIManager.openModal('register-modal');
        }
      });
    }

    // 회원가입 폼 제출
    if (registerForm) {
      registerForm.addEventListener('submit', this.handleRegister.bind(this));
    }

    // 자동 로그인 버튼
    if (autoLoginBtn) {
      autoLoginBtn.addEventListener('click', this.handleAutoLogin.bind(this));
    }

    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }
  },

  /**
     * 검색 관련 이벤트 설정
     */
  setupSearchEvents() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // 검색 입력
    if (searchInput) {
      // 입력 시 자동 완성 표시
      searchInput.addEventListener('input', this.debounce((e) => {
        this.handleSearchInput(e.target.value);
      }, 300));

      // 엔터 키 입력
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearch(e.target.value);
        }
      });
    }

    // 검색 버튼
    if (searchButton) {
      searchButton.addEventListener('click', () => {
        const query = searchInput ? searchInput.value : '';
        this.handleSearch(query);
      });
    }

    // 검색 제안 이벤트
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
      suggestionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-tag')) {
          const query = e.target.textContent;
          if (searchInput) {
            searchInput.value = query;
          }
          this.handleSearch(query);
        }
      });
    }
  },

  /**
     * 상세 정보 관련 이벤트 설정
     */
  setupDetailEvents() {
    const resultsContainer = document.getElementById('results-container');
    const detailCloseBtn = document.getElementById('detail-close');
    const detailDownloadBtn = document.getElementById('detail-download');

    // 결과 클릭하여 상세 정보 표시
    if (resultsContainer) {
      resultsContainer.addEventListener('click', (e) => {
        const resultItem = e.target.closest('.result-item');
        if (resultItem) {
          const id = resultItem.dataset.id;
          if (id) {
            this.handleShowDetails(id);
          }
        }
      });
    }

    // 상세 정보 닫기
    if (detailCloseBtn) {
      detailCloseBtn.addEventListener('click', () => {
        if (window.UIManager) {
          window.UIManager.closeModal('detail-modal');
        }
      });
    }

    // PDF 다운로드
    if (detailDownloadBtn) {
      detailDownloadBtn.addEventListener('click', this.handleDetailDownload.bind(this));
    }
  },

  /**
     * 필터 관련 이벤트 설정
     */
  setupFilterEvents() {
    // 필터 변경 이벤트 수신
    document.addEventListener('filter:change', (e) => {
      this.handleFilterChange(e.detail.filters);
    });

    // 필터 초기화 버튼
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        if (window.FilterManager) {
          window.FilterManager.resetFilters();
        }
      });
    }
  },

  /**
     * 네비게이션 이벤트 설정
     */
  setupNavigationEvents() {
    // 앱 로고 클릭 시 홈으로
    const logo = document.querySelector('.header-logo');
    if (logo) {
      logo.addEventListener('click', () => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.value = '';
        }
        this.handleSearch('');
      });
    }
  },

  // 이벤트 핸들러 메서드들

  /**
     * 로그인 처리
     */
  async handleLogin(e) {
    e.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      if (window.UIManager) {
        window.UIManager.showAlert('이메일과 비밀번호를 입력하세요.', 'error');
      }
      return;
    }

    try {
      if (window.UIManager) {
        window.UIManager.showAlert('로그인 중...', 'info');
      }

      if (window.AuthManager) {
        const result = await window.AuthManager.login(email, password);

        if (result.success) {
          if (window.UIManager) {
            window.UIManager.showMainSection(email);
            window.UIManager.showAlert('로그인 성공!', 'success');
          }

          // 초기 데이터 로드
          this.loadInitialData();
        } else {
          if (window.UIManager) {
            window.UIManager.showAlert(result.error || '로그인 실패', 'error');
          }
        }
      }
    } catch (error) {
      console.error('로그인 처리 오류:', error);
      if (window.UIManager) {
        window.UIManager.showAlert('로그인 처리 중 오류가 발생했습니다.', 'error');
      }
    }
  },

  /**
     * 자동 로그인 처리
     */
  handleAutoLogin() {
    const email = 'jaesu@kakao.com';
    const password = '1234';

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.dispatchEvent(new Event('submit'));
    } else {
      this.handleLogin(new Event('click'));
    }
  },

  /**
     * 회원가입 처리
     */
  async handleRegister(e) {
    e.preventDefault();

    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');

    if (!nameInput || !emailInput || !passwordInput) return;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!name || !email || !password) {
      if (window.UIManager) {
        window.UIManager.showAlert('모든 필드를 입력하세요.', 'error', 'register-modal');
      }
      return;
    }

    try {
      if (window.UIManager) {
        window.UIManager.showAlert('가입 처리 중...', 'info', 'register-modal');
      }

      if (window.AuthManager) {
        const result = await window.AuthManager.register({
          name,
          email,
          password
        });

        if (result.success) {
          if (window.UIManager) {
            window.UIManager.showAlert('회원가입 성공! 로그인하세요.', 'success', 'register-modal');

            setTimeout(() => {
              window.UIManager.closeModal('register-modal');

              // 로그인 폼에 이메일 자동 입력
              const loginEmailInput = document.getElementById('email');
              if (loginEmailInput) {
                loginEmailInput.value = email;

                // 비밀번호 입력 필드에 포커스
                const loginPasswordInput = document.getElementById('password');
                if (loginPasswordInput) {
                  loginPasswordInput.focus();
                }
              }
            }, 1500);
          }
        } else {
          if (window.UIManager) {
            window.UIManager.showAlert(result.error || '회원가입 실패', 'error', 'register-modal');
          }
        }
      }
    } catch (error) {
      console.error('회원가입 처리 오류:', error);
      if (window.UIManager) {
        window.UIManager.showAlert('회원가입 처리 중 오류가 발생했습니다.', 'error', 'register-modal');
      }
    }
  },

  /**
     * 로그아웃 처리
     */
  handleLogout() {
    if (window.AuthManager) {
      const success = window.AuthManager.logout();

      if (success) {
        if (window.UIManager) {
          window.UIManager.showLoginSection();
        }
      } else {
        if (window.UIManager) {
          window.UIManager.showAlert('로그아웃 처리 중 오류가 발생했습니다.', 'error');
        }
      }
    }
  },

  /**
     * 검색 처리
     */
  async handleSearch(query) {
    try {
      // 옵션 처리
      const searchType = document.querySelector('input[name="search-type"]:checked')?.value || 'text';
      const numberType = document.querySelector('select[name="number-type"]')?.value || 'all';

      const options = {
        searchType,
        numberType
      };

      // 결과 컨테이너
      const resultsContainer = document.getElementById('results-container');
      if (!resultsContainer) return;

      if (window.DataManager) {
        const results = await window.DataManager.searchSanctions(query, options);

        // 필터 적용
        let filteredResults = results.results;
        if (window.FilterManager) {
          filteredResults = window.FilterManager.applyFilters(filteredResults);
        }

        // 결과 표시
        this.displayResults(filteredResults);

        // 검색 제안 표시
        if (query && query.length >= 2) {
          this.showSearchSuggestions(query);
        }
      }
    } catch (error) {
      console.error('검색 처리 오류:', error);
      if (window.UIManager) {
        window.UIManager.showAlert('검색 처리 중 오류가 발생했습니다.', 'error');
      }
    }
  },

  /**
     * 검색 입력 처리
     */
  handleSearchInput(query) {
    if (query && query.length >= 2) {
      this.showSearchSuggestions(query);
    } else {
      // 제안 숨기기
      const suggestionsContainer = document.getElementById('search-suggestions');
      if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
      }
    }
  },

  /**
     * 검색 제안 표시
     */
  showSearchSuggestions(query) {
    const suggestions = this.getSuggestedSearchTerms(query);

    if (suggestions.length === 0) return;

    const suggestionsContainer = document.getElementById('search-suggestions');
    const tagsContainer = suggestionsContainer?.querySelector('.suggestion-tags');

    if (!suggestionsContainer || !tagsContainer) return;

    // 태그 생성
    tagsContainer.innerHTML = '';
    suggestions.forEach(suggestion => {
      const tag = document.createElement('span');
      tag.className = 'suggestion-tag';
      tag.textContent = suggestion;
      tagsContainer.appendChild(tag);
    });

    // 컨테이너 표시
    suggestionsContainer.style.display = 'block';
  },

  /**
     * 초기 데이터 로드
     */
  async loadInitialData() {
    try {
      if (window.DataManager) {
        // 데이터 로드 및 결과 표시
        const data = await window.DataManager.fetchSanctionsData();
        this.displayResults(data);
      }
    } catch (error) {
      console.error('초기 데이터 로드 오류:', error);
      if (window.UIManager) {
        window.UIManager.showAlert('데이터 로드 중 오류가 발생했습니다.', 'error');
      }
    }
  },

  /**
     * 필터 변경 처리
     */
  handleFilterChange(filters) {
    // DataManager의 현재 결과에 필터 적용
    if (window.DataManager) {
      const results = window.DataManager.getCurrentResults();

      if (window.FilterManager) {
        const filtered = window.FilterManager.applyFilters(results);
        this.displayResults(filtered);
      }
    }
  },

  /**
     * 상세 정보 표시 처리
     */
  async handleShowDetails(id) {
    try {
      if (window.DataManager) {
        const details = await window.DataManager.getSanctionDetails(id);

        if (!details) {
          if (window.UIManager) {
            window.UIManager.showAlert('상세 정보를 찾을 수 없습니다.', 'error');
          }
          return;
        }

        // DetailComponent 사용
        if (window.DetailComponent && typeof window.DetailComponent.showDetails === 'function') {
          window.DetailComponent.showDetails(details);
        } else {
          // 기본 상세 정보 표시
          this.displayBasicDetails(details);
        }

        // 모달 표시
        if (window.UIManager) {
          window.UIManager.openModal('detail-modal');
        }
      }
    } catch (error) {
      console.error('상세 정보 표시 오류:', error);
      if (window.UIManager) {
        window.UIManager.showAlert('상세 정보를 불러오는 중 오류가 발생했습니다.', 'error');
      }
    }
  },

  /**
     * 기본 상세 정보 표시
     */
  displayBasicDetails(details) {
    const container = document.getElementById('detail-content');
    if (!container) return;

    const title = document.getElementById('detail-title');
    if (title) {
      title.textContent = details.name || '제재 대상 상세 정보';
    }

    // 기본 상세 정보 HTML 생성
    let html = `
            <div class="detail-header">
                <h3>${details.name || '이름 없음'}</h3>
                <span class="detail-badge ${details.type?.toLowerCase()}">${details.type || 'UNKNOWN'}</span>
            </div>
            <div class="detail-body">
                <div class="detail-section">
                    <h4>기본 정보</h4>
                    <table class="detail-table">
                        <tr><th>ID</th><td>${details.id || 'N/A'}</td></tr>
                        <tr><th>국가</th><td>${details.country || 'N/A'}</td></tr>
                        <tr><th>출처</th><td>${details.source || 'N/A'}</td></tr>
                        <tr><th>등재일</th><td>${details.date_listed || 'N/A'}</td></tr>
                        <tr><th>프로그램</th><td>${details.programs?.join(', ') || 'N/A'}</td></tr>
                    </table>
                </div>
        `;

    // 별칭 정보
    const aliases = details.details?.aliases || [];
    if (aliases.length > 0) {
      html += `
                <div class="detail-section">
                    <h4>별칭</h4>
                    <ul class="detail-list">
                        ${aliases.map(alias => `<li>${alias}</li>`).join('')}
                    </ul>
                </div>
            `;
    }

    // 국적 정보
    const nationalities = details.details?.nationalities || [];
    if (nationalities.length > 0) {
      html += `
                <div class="detail-section">
                    <h4>국적</h4>
                    <ul class="detail-list">
                        ${nationalities.map(nat => `<li>${nat}</li>`).join('')}
                    </ul>
                </div>
            `;
    }

    // 주소 정보
    const addresses = details.details?.addresses || [];
    if (addresses.length > 0) {
      html += `
                <div class="detail-section">
                    <h4>주소</h4>
                    <ul class="detail-list">
                        ${addresses.map(addr => `<li>${addr}</li>`).join('')}
                    </ul>
                </div>
            `;
    }

    // 식별 정보
    const identifications = details.details?.identifications || [];
    if (identifications.length > 0) {
      html += `
                <div class="detail-section">
                    <h4>식별 정보</h4>
                    <table class="detail-table">
                        ${identifications.map(id => `
                            <tr>
                                <td>${id.type || 'N/A'}</td>
                                <td>${id.number || 'N/A'}</td>
                                <td>${id.country || ''}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;
    }

    // 제재 사유
    if (details.reason) {
      html += `
                <div class="detail-section">
                    <h4>제재 사유</h4>
                    <p>${details.reason}</p>
                </div>
            `;
    }

    html += '</div>';

    container.innerHTML = html;
  },

  /**
     * 상세 정보 다운로드 처리
     */
  handleDetailDownload() {
    // DetailComponent 사용
    if (window.DetailComponent && typeof window.DetailComponent.downloadPdf === 'function') {
      window.DetailComponent.downloadPdf();
    } else {
      if (window.UIManager) {
        window.UIManager.showAlert('PDF 다운로드 기능을 사용할 수 없습니다.', 'error');
      }
    }
  },

  /**
     * 검색 결과 표시
     */
  displayResults(results) {
    const container = document.getElementById('results-container');
    if (!container) return;

    if (!results || results.length === 0) {
      container.innerHTML = `
                <div class="no-results">
                    <p>검색 결과가 없습니다.</p>
                </div>
            `;

      // 결과 카운트 업데이트
      const countElement = document.getElementById('results-count');
      if (countElement) {
        countElement.textContent = '0';
      }

      return;
    }

    // 결과 HTML 생성
    let html = '';

    results.forEach(item => {
      html += `
                <div class="result-item" data-id="${item.id}">
                    <div class="result-header">
                        <h3 class="result-name">${item.name}</h3>
                        <span class="result-badge ${item.type?.toLowerCase()}">${item.type || 'UNKNOWN'}</span>
                    </div>
                    <div class="result-body">
                        <p class="result-country"><strong>국가:</strong> ${item.country || 'N/A'}</p>
                        <p class="result-source"><strong>출처:</strong> ${item.source || 'N/A'}</p>
                        <p class="result-date"><strong>등재일:</strong> ${item.date_listed || 'N/A'}</p>
                    </div>
                    <div class="result-footer">
                        <button class="btn-text view-details" aria-label="상세 정보 보기">
                            상세 정보 <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
    });

    container.innerHTML = html;

    // 결과 카운트 업데이트
    const countElement = document.getElementById('results-count');
    if (countElement) {
      countElement.textContent = results.length;
    }

    // 데이터 업데이트
    if (window.DataManager) {
      window.DataManager.state.currentResults = results;
    }
  },

  /**
     * 추천 검색어 생성
     */
  getSuggestedSearchTerms(query) {
    if (!query || query.length < 2) return [];

    const suggestions = [];
    const normalizedQuery = query.toLowerCase();

    // 국가 추천
    const countries = ['북한', '한국', '러시아', '중국', '이란', '시리아', '미국', '일본'];
    countries.forEach(country => {
      if (country.toLowerCase().includes(normalizedQuery)) {
        suggestions.push(country);
      }
    });

    // 이름 패턴 추천
    const namePatterns = ['김', '이', '박', '정', '최', 'Kim', 'Lee', 'Park'];
    namePatterns.forEach(pattern => {
      if (pattern.toLowerCase().includes(normalizedQuery)) {
        suggestions.push(pattern);
      }
    });

    // 유형 추천
    const types = ['개인', '단체', '회사', '기관', 'INDIVIDUAL', 'ENTITY'];
    types.forEach(type => {
      if (type.toLowerCase().includes(normalizedQuery)) {
        suggestions.push(type);
      }
    });

    // 반복 제거 및 최대 5개로 제한
    return [...new Set(suggestions)].slice(0, 5);
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
  }
};

// 전역 객체에 등록
window.EventManager = EventManager;

// 외부 모듈에서 사용할 수 있도록 export
export default EventManager;