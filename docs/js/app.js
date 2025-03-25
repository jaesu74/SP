/**
 * 세계 경제 제재 대상 검색 서비스 - 핵심 기능 구현
 * 2024 © 주식회사 팩션
 */

// 상수
const TEST_EMAIL = 'jaesu@kakao.com';
const TEST_PASSWORD = '1234';
const MAIN_SECTION_ID = 'main-section';
const LOGIN_SECTION_ID = 'login-section';

// 애플리케이션 초기화
window.addEventListener('DOMContentLoaded', function() {
    console.log('앱 초기화 시작');
    
    try {
        // 기존 스토리지 정리 및 초기화
        try {
            // 브라우저 스토리지 상태 확인
            let storageIsWorking = false;
            
            // localStorage 확인
            try {
                localStorage.setItem('test', '1');
                localStorage.removeItem('test');
                console.log('localStorage 정상 작동');
                storageIsWorking = true;
                
                // 너무 많은 항목이 있는 경우 정리
                if (localStorage.length > 5) {
                    console.log('localStorage 항목 정리 중...');
                    localStorage.clear();
                }
            } catch (e) {
                console.warn('localStorage 작동 안함:', e);
            }
            
            // localStorage가 작동하지 않으면 sessionStorage 시도
            if (!storageIsWorking) {
                try {
                    sessionStorage.setItem('test', '1');
                    sessionStorage.removeItem('test');
                    console.log('sessionStorage 정상 작동');
                    storageIsWorking = true;
                } catch (e) {
                    console.warn('sessionStorage 작동 안함:', e);
                }
            }
            
            // 모든 스토리지 작동 안하면 쿠키 사용 준비
            if (!storageIsWorking) {
                console.log('스토리지 작동 안함 - 쿠키 대안 사용 준비');
                // 쿠키 관련 초기화 코드는 여기에 추가...
            }
        } catch (storageError) {
            console.error('스토리지 접근 오류:', storageError);
        }
        
        // 페이지 섹션들의 초기 상태 설정
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // 초기에 모든 섹션 숨기기
        hideAllSections();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // 로딩 인디케이터 숨기기
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        
        // 로그인 상태 확인 - 약간의 지연을 두어 DOM이 완전히 로드된 후 실행
        setTimeout(function() {
            console.log('로그인 상태 확인 타이머 실행...');
            checkLoginStatus();
        }, 300);
        
        console.log('앱 초기화 완료');
    } catch (error) {
        console.error('앱 초기화 중 오류 발생:', error);
        
        // 초기화 오류 시 기본적으로 로그인 화면 표시
        const loginSection = document.querySelector('#login-section');
        if (loginSection) {
            loginSection.style.display = 'block';
        }
    }
});

/**
 * 모든 섹션 숨기기
 */
function hideAllSections() {
    const mainSection = document.getElementById(MAIN_SECTION_ID);
    const loginSection = document.getElementById(LOGIN_SECTION_ID);
    
    if (mainSection) mainSection.style.display = 'none';
    if (loginSection) loginSection.style.display = 'none';
    
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });
    
    console.log('모든 섹션 숨김 처리 완료');
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    try {
        console.log('이벤트 리스너 설정 시작');
        
        // 로그인 폼 이벤트 리스너
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                handleLogin(email, password);
            });
            console.log('로그인 폼 이벤트 리스너 설정 완료');
        } else {
            console.warn('로그인 폼 요소를 찾을 수 없음');
        }

        // 로그아웃 버튼 이벤트 리스너
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
            console.log('로그아웃 버튼 이벤트 리스너 설정 완료');
        }

        // 비밀번호 토글 버튼
        const togglePasswordBtn = document.querySelector('.toggle-password');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                if (passwordInput) {
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        this.classList.replace('fa-eye', 'fa-eye-slash');
                    } else {
                        passwordInput.type = 'password';
                        this.classList.replace('fa-eye-slash', 'fa-eye');
                    }
                }
            });
        }

        // 검색 폼 이벤트 리스너
        const searchForm = document.getElementById('search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput && searchInput.value.trim()) {
                    performSearch(searchInput.value);
                }
            });
        }

        // 고급 검색 토글 버튼
        const advancedToggle = document.getElementById('advanced-toggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('click', function() {
                const advancedSearch = document.getElementById('advanced-search');
                if (advancedSearch) {
                    advancedSearch.classList.toggle('active');
                    
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-sliders-h');
                        icon.classList.toggle('fa-times');
                    }
                }
            });
        }

        // 필터 버튼 이벤트 리스너 - 다중 선택 지원
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // 'all' 필터가 클릭된 경우 다른 모든 필터 비활성화
                if (this.getAttribute('data-filter') === 'all') {
                    filterBtns.forEach(otherBtn => {
                        if (otherBtn !== this) {
                            otherBtn.classList.remove('active');
                        }
                    });
                    this.classList.add('active');
                } else {
                    // 'all' 필터 비활성화
                    const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
                    if (allFilterBtn) {
                        allFilterBtn.classList.remove('active');
                    }
                    
                    // 현재 버튼 토글
                    this.classList.toggle('active');
                    
                    // 활성화된 필터가 하나도 없으면 'all' 필터 활성화
                    const hasActiveFilters = document.querySelector('.filter-btn.active') !== null;
                    if (!hasActiveFilters && allFilterBtn) {
                        allFilterBtn.classList.add('active');
                    }
                }
                
                // 검색 결과에 필터 적용 또는 최신 데이터 표시
                const resultsArea = document.getElementById('results-area');
                if (resultsArea && resultsArea.style.display !== 'none') {
                    applyFilters();
                } else {
                    // 검색 결과가 없는 경우 필터에 해당하는 최근 데이터 표시
                    showRecentSanctions();
                }
            });
        });

        // 상세 정보 모달 닫기 버튼
        const detailClose = document.getElementById('detail-close');
        if (detailClose) {
            detailClose.addEventListener('click', function() {
                const detailModal = document.getElementById('detail-modal');
                if (detailModal) {
                    detailModal.classList.remove('active');
                }
            });
        }

        // 인쇄/다운로드 버튼
        const detailPrint = document.getElementById('detail-print');
        if (detailPrint) {
            detailPrint.addEventListener('click', printDetail);
        }
        
        const detailDownload = document.getElementById('detail-download');
        if (detailDownload) {
            detailDownload.addEventListener('click', downloadPDF);
        }

        // 이용약관 및 개인정보처리방침 링크
        setupPageSectionLinks();

        // 첫 번째 필터 버튼 활성화하고 최신 데이터 표시
        if (filterBtns.length > 0) {
            filterBtns[0].classList.add('active');
            showRecentSanctions();
        }
        
        console.log('이벤트 리스너 설정 완료');
    } catch (error) {
        console.error('이벤트 리스너 설정 중 오류 발생:', error);
    }
}

/**
 * 페이지 섹션 링크 설정
 */
function setupPageSectionLinks() {
    try {
        // 이용약관 및 개인정보처리방침 링크
        const termsLink = document.getElementById('terms-link');
        if (termsLink) {
            termsLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPageSection('terms-section');
            });
        }

        const privacyLink = document.getElementById('privacy-link');
        if (privacyLink) {
            privacyLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPageSection('privacy-section');
            });
        }

        const helpLink = document.getElementById('help-link');
        if (helpLink) {
            helpLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPageSection('help-section');
            });
        }

        // 뒤로가기 버튼
        const termsBackBtn = document.getElementById('terms-back-btn');
        if (termsBackBtn) {
            termsBackBtn.addEventListener('click', function() {
                hidePageSection('terms-section');
            });
        }

        const privacyBackBtn = document.getElementById('privacy-back-btn');
        if (privacyBackBtn) {
            privacyBackBtn.addEventListener('click', function() {
                hidePageSection('privacy-section');
            });
        }

        const helpBackBtn = document.getElementById('help-back-btn');
        if (helpBackBtn) {
            helpBackBtn.addEventListener('click', function() {
                hidePageSection('help-section');
            });
        }
    } catch (error) {
        console.error('페이지 섹션 링크 설정 중 오류 발생:', error);
    }
}

/**
 * 로그인 상태 확인
 */
function checkLoginStatus() {
    try {
        console.log('로그인 상태 확인 시작');
        
        // 화면 기본 상태 설정
        hideAllSections();
        
        // 사용자 정보 확인 - localStorage와 sessionStorage 모두 시도
        let userInfo = null;
        let isLoggedIn = false;
        
        // 먼저 localStorage 확인
        try {
            userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                console.log('localStorage에서 사용자 정보 발견');
                isLoggedIn = true;
            }
        } catch (localStorageError) {
            console.warn('localStorage 접근 오류:', localStorageError);
        }
        
        // localStorage에 없으면 sessionStorage 확인
        if (!isLoggedIn) {
            try {
                userInfo = sessionStorage.getItem('userInfo');
                if (userInfo) {
                    console.log('sessionStorage에서 사용자 정보 발견');
                    isLoggedIn = true;
                }
            } catch (sessionStorageError) {
                console.warn('sessionStorage 접근 오류:', sessionStorageError);
            }
        }
        
        // 쿠키에서도 확인 (최후의 대안)
        if (!isLoggedIn && document.cookie.includes('loggedInUser=')) {
            console.log('쿠키에서 로그인 정보 발견');
            isLoggedIn = true;
            userInfo = '{"name":"김재수"}';
        }
        
        const mainSection = document.getElementById(MAIN_SECTION_ID);
        const loginSection = document.getElementById(LOGIN_SECTION_ID);
        
        if (!mainSection || !loginSection) {
            console.error('필수 섹션 요소를 찾을 수 없음');
            // 요소가 없을 경우 로그인 화면 표시 시도
            const fallbackLoginSection = document.querySelector('#login-section');
            if (fallbackLoginSection) {
                fallbackLoginSection.style.display = 'block';
            }
            return;
        }
        
        if (isLoggedIn && userInfo) {
            // 로그인 상태
            try {
                const user = JSON.parse(userInfo);
                const userNameElement = document.getElementById('user-name');
                if (userNameElement) {
                    userNameElement.textContent = user.name || '사용자';
                }
                
                // 메인 섹션 표시
                mainSection.style.display = 'block';
                loginSection.style.display = 'none';
                
                console.log('로그인 상태 - 메인 섹션 표시됨');
            } catch (parseError) {
                console.error('사용자 정보 파싱 오류:', parseError);
                // 잘못된 데이터 제거
                try {
                    localStorage.removeItem('userInfo');
                    sessionStorage.removeItem('userInfo');
                } catch (e) {
                    console.warn('스토리지 항목 제거 실패:', e);
                }
                
                // 비로그인 상태로 전환
                mainSection.style.display = 'none';
                loginSection.style.display = 'block';
            }
        } else {
            // 비로그인 상태
            mainSection.style.display = 'none';
            loginSection.style.display = 'block';
            
            console.log('비로그인 상태 - 로그인 섹션 표시됨');
        }
    } catch (error) {
        console.error('로그인 상태 확인 중 오류 발생:', error);
        
        // 오류 발생 시 로그인 화면 표시
        const loginSection = document.getElementById(LOGIN_SECTION_ID);
        if (loginSection) {
            loginSection.style.display = 'block';
        }
    }
}

/**
 * 로그인 처리
 */
function handleLogin(email, password) {
    try {
        console.log('로그인 시도:', email);
        
        // 입력값 검증
        if (!email || !password) {
            showAlert('이메일과 비밀번호를 입력해주세요.', 'error');
            return;
        }
        
        // 테스트 계정 체크
        if (email === TEST_EMAIL && password === TEST_PASSWORD) {
            console.log('로그인 성공: 테스트 계정 인증 완료');
            
            try {
                // 먼저 localStorage 비우기
                try {
                    localStorage.clear();
                } catch (clearError) {
                    console.warn('localStorage 정리 실패:', clearError);
                }
                
                // 최소한의 데이터만 저장 (할당량 초과 방지)
                const userInfo = { 
                    name: '김재수',
                    loginTime: new Date().toISOString().split('T')[0]
                };
                
                // localStorage에 저장 시도
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                console.log('사용자 정보 저장 성공');
            } catch (storageError) {
                // 로컬 스토리지 오류가 발생해도 로그인은 계속 진행
                console.error('localStorage 오류:', storageError);
                
                // 세션 스토리지 대체 사용 시도
                try {
                    sessionStorage.setItem('userInfo', JSON.stringify({ name: '김재수' }));
                    console.log('sessionStorage로 대체 저장');
                } catch (sessionError) {
                    console.error('sessionStorage도 실패:', sessionError);
                }
            }
            
            // 성공 알림 표시
            showAlert('로그인 성공! 환영합니다.', 'success');
            
            // 메인 화면으로 즉시 전환
            const mainSection = document.getElementById(MAIN_SECTION_ID);
            const loginSection = document.getElementById(LOGIN_SECTION_ID);
            
            // 사용자 이름 표시
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = '김재수';
            }
            
            if (mainSection) mainSection.style.display = 'block';
            if (loginSection) loginSection.style.display = 'none';
            
            console.log('로그인 성공 - 메인 섹션으로 전환 완료');
            
            return true;
        } else {
            // 로그인 실패
            console.log('로그인 실패: 인증 정보 불일치');
            showAlert('로그인 실패. 이메일 또는 비밀번호가 일치하지 않습니다.', 'error');
            return false;
        }
    } catch (error) {
        console.error('로그인 처리 중 오류 발생:', error);
        showAlert('로그인 과정에서 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        
        // 오류에도 불구하고 테스트 계정일 경우 로그인 진행
        if (email === TEST_EMAIL && password === TEST_PASSWORD) {
            const mainSection = document.getElementById(MAIN_SECTION_ID);
            const loginSection = document.getElementById(LOGIN_SECTION_ID);
            
            if (mainSection) mainSection.style.display = 'block';
            if (loginSection) loginSection.style.display = 'none';
            
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = '김재수';
            }
            
            console.log('오류 발생했지만 강제 로그인 처리됨');
            return true;
        }
        
        return false;
    }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
    try {
        console.log('로그아웃 시도');
        
        // 로컬 스토리지에서 사용자 정보 삭제
        localStorage.removeItem('userInfo');
        
        // 알림 표시
        showAlert('로그아웃되었습니다.', 'info');
        
        // 로그인 화면으로 즉시 전환
        const loginSection = document.getElementById(LOGIN_SECTION_ID);
        const mainSection = document.getElementById(MAIN_SECTION_ID);
        
        if (loginSection) loginSection.style.display = 'block';
        if (mainSection) mainSection.style.display = 'none';
        
        console.log('로그아웃 완료 - 로그인 섹션으로 전환 완료');
        
        return true;
    } catch (error) {
        console.error('로그아웃 처리 중 오류 발생:', error);
        return false;
    }
}

/**
 * 특정 섹션 표시
 */
function showSection(sectionId) {
    // 모든 섹션 숨기기
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 지정된 섹션 표시
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        
        // 섹션이 메인 섹션인 경우 추가 초기화 작업
        if (sectionId === 'main-section') {
            initMainSection();
        }
        
        console.log(`섹션 전환: ${sectionId}`);
    } else {
        console.error(`섹션을 찾을 수 없음: ${sectionId}`);
    }
}

/**
 * 메인 섹션 초기화
 */
function initMainSection() {
    // 검색 입력창 초기화
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    // 결과 영역 초기화
    const resultsArea = document.getElementById('results-area');
    if (resultsArea) resultsArea.style.display = 'none';
    
    // 로딩 인디케이터 숨기기
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

/**
 * 검색 수행
 */
function performSearch(searchTerm) {
    try {
        // 로딩 표시
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'flex';
        
        // 결과 영역 표시 준비
        const resultsArea = document.getElementById('results-area');
        if (resultsArea) resultsArea.style.display = 'none';
        
        // 실제 검색 기능 구현 (현재는 샘플)
        getSampleSanctions().then(sanctions => {
            // 검색어를 소문자로 변환
            const lowerQuery = searchTerm.toLowerCase();
            
            // 검색어에 맞는 결과 필터링
            const filteredResults = sanctions.filter(item => 
                item.name.toLowerCase().includes(lowerQuery) ||
                item.id.toLowerCase().includes(lowerQuery) ||
                item.description?.toLowerCase().includes(lowerQuery) ||
                item.country.toLowerCase().includes(lowerQuery) ||
                item.program.toLowerCase().includes(lowerQuery) ||
                item.aliases?.some(alias => alias.toLowerCase().includes(lowerQuery)) ||
                item.addresses?.some(address => address.toLowerCase().includes(lowerQuery))
            );
            
            // 결과 표시 (딜레이 추가)
            setTimeout(() => {
                displaySearchResults(filteredResults);
                
                // 로딩 숨기기 및 결과 영역 표시
                if (loading) loading.style.display = 'none';
                if (resultsArea) resultsArea.style.display = 'block';
                
                // 필터 적용
                applyFilters();
            }, 800);
        });
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        
        // 에러 발생 시 로딩 숨기기
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }
}

/**
 * 검색 결과 표시
 * @param {Array} results - 검색 결과 데이터 배열
 */
function displaySearchResults(results) {
    const resultsList = document.getElementById('results-list');
    const resultsCount = document.getElementById('results-count');
    const noResults = document.getElementById('no-results');
    
    // 결과 개수 업데이트
    if (resultsCount) {
        resultsCount.textContent = results.length;
    }
    
    // 결과 목록 초기화
    if (resultsList) {
        resultsList.innerHTML = '';
    }
    
    if (results.length === 0) {
        // 결과 없음 표시
        if (resultsList) resultsList.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
    } else {
        // 결과 표시
        if (resultsList) resultsList.style.display = 'grid';
        if (noResults) noResults.style.display = 'none';
        
        // 각 결과 항목 생성
        results.forEach(item => {
            const resultCard = document.createElement('div');
            resultCard.className = `result-card ${item.type}`;
            resultCard.setAttribute('data-id', item.id);
            resultCard.setAttribute('data-type', item.type);
            
            // 카드 내용 생성
            resultCard.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${item.name}</h3>
                    <span class="card-type">${getKoreanType(item.type)}</span>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <p><strong>국가:</strong> ${item.country}</p>
                        <p><strong>프로그램:</strong> ${item.program}</p>
                        <p><strong>등록일:</strong> ${formatDate(item.date)}</p>
                        <p><strong>출처:</strong> ${item.source}</p>
                    </div>
                    <div class="card-description">
                        ${item.description || ''}
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn-view-detail" data-id="${item.id}">상세 보기</button>
                </div>
            `;
            
            // 결과 목록에 추가
            if (resultsList) {
                resultsList.appendChild(resultCard);
            }
        });
        
        // 결과 카드 클릭 이벤트 설정
        setupResultCardClicks(results);
    }
}

/**
 * 결과 카드 클릭 이벤트를 설정하는 함수
 * @param {Array} data - 검색 결과 데이터
 */
function setupResultCardClicks(data) {
    // 결과 카드에 클릭 이벤트 추가
    document.querySelectorAll('.result-card').forEach(card => {
        card.addEventListener('click', function() {
            // 카드에서 ID 가져오기
            const id = this.getAttribute('data-id');

            // ID로 데이터 찾기
            const item = data.find(i => i.id === id);
            if (!item) return;

            // 상세 정보 모달 채우기
            fillDetailModal(item);
            
            // 모달 표시
            document.getElementById('detail-modal').classList.add('active');
            document.body.classList.add('modal-open'); // 스크롤 방지
        });
    });
}

/**
 * 상세 정보 모달을 데이터로 채우는 함수
 * @param {Object} item - 선택된 제재 대상 데이터
 */
function fillDetailModal(item) {
    // 기본 정보 채우기
    document.getElementById('detail-title').textContent = item.name;
    document.getElementById('detail-type').textContent = getKoreanType(item.type);
    document.getElementById('detail-country').textContent = item.country;
    document.getElementById('detail-date').textContent = formatDate(item.date);
    document.getElementById('detail-source').textContent = item.source;
    
    // 상세 내용 컨테이너 가져오기
    const detailContent = document.getElementById('detail-content');
    
    // 새로운 상세 내용 HTML 생성
    let contentHTML = `
        <div class="detail-section">
            <h3>기본 정보</h3>
            <p>${item.description || '정보가 없습니다.'}</p>
        </div>
    `;
    
    // 별칭 정보 추가
    contentHTML += `
        <div class="detail-section">
            <h3>별칭</h3>
            ${item.aliases && item.aliases.length > 0 
                ? `<ul class="detail-list">${item.aliases.map(alias => `<li>${alias}</li>`).join('')}</ul>`
                : '<p>등록된 별칭이 없습니다.</p>'
            }
        </div>
    `;
    
    // 주소 정보 추가
    contentHTML += `
        <div class="detail-section">
            <h3>주소</h3>
            ${item.addresses && item.addresses.length > 0 
                ? `<ul class="detail-list">${item.addresses.map(address => `<li>${address}</li>`).join('')}</ul>`
                : '<p>등록된 주소가 없습니다.</p>'
            }
        </div>
    `;
    
    // 관련 제재 추가 (샘플 데이터 사용)
    contentHTML += `
        <div class="detail-section">
            <h3>관련 제재</h3>
            <div class="related-sanctions">
                ${getRelatedSanctions(item).map(related => `
                    <div class="related-item">
                        <div class="related-name">${related.name}</div>
                        <div class="related-info">
                            <span class="related-type">${getKoreanType(related.type)}</span>
                            <span class="related-country">${related.country}</span>
                            <span class="related-date">${formatDate(related.date)}</span>
                        </div>
                    </div>
                `).join('') || '<p>관련 제재 대상이 없습니다.</p>'}
            </div>
        </div>
    `;
    
    // 추가 정보 섹션 (제재 프로그램)
    contentHTML += `
        <div class="detail-section">
            <h3>제재 프로그램</h3>
            <p>${getProgramDescription(item.program)}</p>
        </div>
    `;
    
    // 컨텐츠 업데이트
    detailContent.innerHTML = contentHTML;
}

/**
 * 관련 제재 대상을 가져오는 함수 (샘플)
 * @param {Object} item - 현재 제재 대상
 * @returns {Array} - 관련 제재 대상 목록
 */
function getRelatedSanctions(item) {
    // 샘플 데이터에서 같은 국가/프로그램에 해당하는 다른 제재들 가져오기
    return getSampleSanctions()
        .then(sanctions => {
            return sanctions.filter(s => 
                s.id !== item.id && 
                (s.country === item.country || s.program === item.program)
            ).slice(0, 3); // 최대 3개만 표시
        })
        .catch(() => []);
}

/**
 * 제재 프로그램에 대한 설명을 반환하는 함수
 * @param {string} program - 제재 프로그램 코드
 * @returns {string} - 프로그램에 대한 설명
 */
function getProgramDescription(program) {
    const descriptions = {
        'DPRK': '북한 관련 제재 프로그램으로, UN 안전보장이사회 결의안 및 각국의 대북제재에 따라 지정된 개인, 단체, 선박 등을 포함합니다.',
        'RUSSIA': '러시아 관련 제재 프로그램으로, 우크라이나 침공 및 크림반도 합병 관련 제재 대상을 포함합니다.',
        'IRAN': '이란 관련 제재 프로그램으로, 핵 프로그램 및 테러 지원 관련 제재 대상을 포함합니다.',
        'SYRIA': '시리아 관련 제재 프로그램으로, 정부 관계자 및 화학무기 개발 관련 제재 대상을 포함합니다.'
    };
    
    return descriptions[program] || `${program} 프로그램 관련 제재`;
}

/**
 * 제재 유형을 한글로 변환하는 함수
 * @param {string} type - 영어 유형
 * @returns {string} - 한글 유형
 */
function getKoreanType(type) {
    const types = {
        'individual': '개인',
        'entity': '단체',
        'vessel': '선박',
        'aircraft': '항공기'
    };
    
    return types[type] || type;
}

/**
 * 날짜 형식을 변환하는 함수
 * @param {string} dateStr - YYYY-MM-DD 형식의 날짜 문자열
 * @returns {string} - 형식이 변환된 날짜 문자열
 */
function formatDate(dateStr) {
    if (!dateStr) return '날짜 정보 없음';
    
    try {
        const date = new Date(dateStr);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch (error) {
        return dateStr;
    }
}

/**
 * 상세 정보 인쇄
 */
function printDetail() {
    try {
        const detailTitle = document.getElementById('detail-title').textContent;
        const detailContent = document.getElementById('detail-content').innerHTML;
        
        // 인쇄용 팝업 창 열기
        const printWindow = window.open('', '', 'width=800,height=600');
        
        // 인쇄용 HTML 생성
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${detailTitle} - 제재 정보</title>
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; margin: 20px; }
                    h1 { color: #5D5FEF; }
                    h3 { margin-top: 20px; color: #444; }
                    .detail-section { margin-bottom: 20px; }
                    .detail-list { margin: 10px 0; padding-left: 20px; }
                    .meta-info { display: flex; flex-wrap: wrap; background: #f5f7ff; padding: 10px; margin-bottom: 20px; border-radius: 8px; }
                    .meta-item { margin-right: 20px; margin-bottom: 10px; }
                    .meta-label { font-weight: bold; color: #5D5FEF; }
                    .footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
                    @media print {
                        body { font-size: 12pt; }
                        h1 { font-size: 18pt; }
                        h3 { font-size: 14pt; }
                        .meta-info { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <h1>${detailTitle}</h1>
                <div class="meta-info">
                    <div class="meta-item"><span class="meta-label">유형:</span> ${document.getElementById('detail-type').textContent}</div>
                    <div class="meta-item"><span class="meta-label">국가:</span> ${document.getElementById('detail-country').textContent}</div>
                    <div class="meta-item"><span class="meta-label">제재 일자:</span> ${document.getElementById('detail-date').textContent}</div>
                    <div class="meta-item"><span class="meta-label">출처:</span> ${document.getElementById('detail-source').textContent}</div>
                </div>
                ${detailContent}
                <div class="footer">
                    <p>출력일: ${new Date().toLocaleDateString()} / 주식회사 팩션 제재 대상 조회 시스템</p>
                </div>
            </body>
            </html>
        `);
        
        // 페이지 로드 후 인쇄
        printWindow.document.close();
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    } catch (error) {
        console.error('인쇄 중 오류 발생:', error);
        alert('인쇄 중 오류가 발생했습니다.');
    }
}

/**
 * PDF 다운로드
 */
function downloadPDF() {
    try {
        // jsPDF가 로드되었는지 확인
        if (typeof jspdf === 'undefined') {
            // jsPDF 동적 로드
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = function() {
                // html2canvas 로드
                const canvas = document.createElement('script');
                canvas.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                canvas.onload = function() {
                    // 모든 라이브러리가 로드된 후 PDF 생성 실행
                    generatePDF();
                };
                document.head.appendChild(canvas);
            };
            document.head.appendChild(script);
        } else {
            // 이미 로드되어 있으면 바로 PDF 생성
            generatePDF();
        }
    } catch (error) {
        console.error('PDF 다운로드 중 오류 발생:', error);
        alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

/**
 * PDF 생성 및 다운로드
 */
function generatePDF() {
    // 모달 내용 가져오기
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return;
    
    // 스크롤 위치 저장
    const scrollPosition = window.scrollY;
    
    // PDF 페이지 내용 준비
    const title = document.getElementById('detail-title').textContent;
    const type = document.getElementById('detail-type').textContent;
    const country = document.getElementById('detail-country').textContent;
    const date = document.getElementById('detail-date').textContent;
    const source = document.getElementById('detail-source').textContent;
    const content = document.getElementById('detail-content').innerHTML;
    
    // 임시 HTML 요소 생성
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.left = '-9999px';
    tempElement.style.top = '0';
    tempElement.style.width = '800px';
    tempElement.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="color: #5D5FEF; font-size: 24px;">${title}</h1>
            <div style="display: flex; flex-wrap: wrap; background: #f5f7ff; padding: 10px; margin-bottom: 20px; border-radius: 8px;">
                <div style="margin-right: 20px; margin-bottom: 10px;"><span style="font-weight: bold; color: #5D5FEF;">유형:</span> ${type}</div>
                <div style="margin-right: 20px; margin-bottom: 10px;"><span style="font-weight: bold; color: #5D5FEF;">국가:</span> ${country}</div>
                <div style="margin-right: 20px; margin-bottom: 10px;"><span style="font-weight: bold; color: #5D5FEF;">제재 일자:</span> ${date}</div>
                <div style="margin-right: 20px; margin-bottom: 10px;"><span style="font-weight: bold; color: #5D5FEF;">출처:</span> ${source}</div>
            </div>
            <div>${content}</div>
            <div style="margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px;">
                <p>출력일: ${new Date().toLocaleDateString()} / 주식회사 팩션 제재 대상 조회 시스템</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(tempElement);
    
    // html2canvas를 사용하여 HTML 요소를 캔버스로 변환
    html2canvas(tempElement, {
        scale: 1.5
    }).then(function(canvas) {
        // 캔버스를 이미지로 변환
        const imgData = canvas.toDataURL('image/png');
        
        // jsPDF를 사용하여 PDF 생성
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // 이미지 크기 계산
        const imgWidth = 210; // A4 너비 (mm)
        const pageHeight = 295; // A4 높이 (mm)
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        // 첫 페이지 추가
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // 필요한 경우 추가 페이지 생성
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // PDF 다운로드
        pdf.save(`${title}_제재정보.pdf`);
        
        // 임시 요소 제거
        document.body.removeChild(tempElement);
        
        // 스크롤 위치 복원
        window.scrollTo(0, scrollPosition);
    });
}

/**
 * 알림 표시
 */
function showAlert(message, type) {
    try {
        // 현재 활성화된 섹션의 알림 컨테이너 찾기
        let container = null;
        
        // 먼저 로그인 섹션의 알림 컨테이너 찾기 시도
        const loginSection = document.getElementById(LOGIN_SECTION_ID);
        if (loginSection && loginSection.style.display !== 'none') {
            container = loginSection.querySelector('.alert-container');
        } 
        
        // 없으면 메인 섹션에서 찾기
        if (!container) {
            const mainSection = document.getElementById(MAIN_SECTION_ID);
            if (mainSection && mainSection.style.display !== 'none') {
                container = mainSection.querySelector('.alert-container');
            }
        }
        
        // 여전히 없으면 fallback으로 문서에서 첫 번째 알림 컨테이너 찾기
        if (!container) {
            container = document.querySelector('.alert-container');
        }
        
        if (!container) {
            console.error('알림 컨테이너를 찾을 수 없습니다.');
            console.log('알림 메시지:', message, '타입:', type);
            return;
        }
        
        // 알림 요소 생성
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = message;
        
        // 컨테이너에 알림 추가
        container.innerHTML = '';
        container.appendChild(alertDiv);
        
        // 5초 후 알림 자동 제거
        setTimeout(() => {
            try {
                if (alertDiv && alertDiv.parentNode) {
                    alertDiv.style.opacity = '0';
                    setTimeout(() => {
                        try {
                            if (alertDiv.parentNode) {
                                alertDiv.parentNode.removeChild(alertDiv);
                            }
                        } catch (innerError) {
                            console.error('알림 제거 중 오류 발생:', innerError);
                        }
                    }, 300);
                }
            } catch (fadeError) {
                console.error('알림 페이드아웃 중 오류 발생:', fadeError);
            }
        }, 5000);
    } catch (error) {
        console.error('알림 표시 중 오류 발생:', error);
        console.log('알림 메시지:', message, '타입:', type);
    }
}

/**
 * 페이지 섹션 표시
 */
function showPageSection(sectionId) {
    // 현재 화면 저장
    const currentMainDisplay = document.getElementById(MAIN_SECTION_ID).style.display;
    const currentLoginDisplay = document.getElementById(LOGIN_SECTION_ID).style.display;
    
    // 섹션 표시
    const section = document.getElementById(sectionId);
    if (section) {
        // 페이지 섹션 데이터 설정
        section.dataset.previousMain = currentMainDisplay;
        section.dataset.previousLogin = currentLoginDisplay;
        
        // 현재 페이지 숨기기
        document.getElementById(MAIN_SECTION_ID).style.display = 'none';
        document.getElementById(LOGIN_SECTION_ID).style.display = 'none';
        
        // 페이지 섹션 표시
        section.style.display = 'block';
        
        // 스크롤 맨 위로
        window.scrollTo(0, 0);
    }
}

/**
 * 페이지 섹션 숨기기
 */
function hidePageSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // 페이지 섹션 숨기기
        section.style.display = 'none';
        
        // 이전 화면으로 복귀
        const previousMain = section.dataset.previousMain;
        const previousLogin = section.dataset.previousLogin;
        
        if (previousMain === 'block') {
            document.getElementById(MAIN_SECTION_ID).style.display = 'block';
        } else if (previousLogin === 'block') {
            document.getElementById(LOGIN_SECTION_ID).style.display = 'block';
        } else {
            // 기본값: 로그인 상태에 따라 결정
            checkLoginStatus();
        }
    }
}

/**
 * 필터 적용
 */
function applyFilters() {
    // 선택된 필터 가져오기
    const activeFilters = Array.from(document.querySelectorAll('.filter-btn.active'))
        .map(btn => btn.getAttribute('data-filter'));
    
    // 'all'이 포함되어 있거나 필터가 없으면 모든 결과 표시
    const showAllTypes = activeFilters.includes('all') || activeFilters.length === 0;
    
    // 모든 결과 카드 선택
    const resultCards = document.querySelectorAll('.result-card');
    let visibleCount = 0;
    
    // 필터링
    resultCards.forEach(card => {
        const cardType = card.getAttribute('data-type');
        
        if (showAllTypes || activeFilters.includes(cardType)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // 결과 개수 업데이트
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) resultsCount.textContent = visibleCount;
    
    // 결과 없음 표시
    const noResults = document.getElementById('no-results');
    if (noResults) {
        if (visibleCount === 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    }
} 