// API 기본 URL
const API_URL = 'http://localhost:3001/api';

// DOM 요소
// 인증 관련
const authSection = document.getElementById('auth-section');
const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.querySelector('.logout-button');
const showLoginLink = document.getElementById('show-login');
const showRegisterLink = document.getElementById('show-register');
const verifyIdentityBtn = document.getElementById('verify-identity');
const identityStatus = document.getElementById('identity-status');
const registerTermsLink = document.getElementById('register-terms-link');
const registerPrivacyLink = document.getElementById('register-privacy-link');

// 메인 검색 관련
const mainSection = document.getElementById('main-section');
const welcomeMessage = document.querySelector('.user-name');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-name');
const searchButton = document.querySelector('.search-button');
const filterOptions = document.querySelectorAll('.filter-option');
const toggleAdvancedBtn = document.querySelector('.toggle-advanced');
const advancedSearch = document.getElementById('advanced-search');

// 결과 관련
const resultsContainer = document.getElementById('results-container');
const resultsList = document.getElementById('results-list');
const resultsCount = document.getElementById('results-count');
const loadingContainer = document.getElementById('loading-container');
const noResults = document.getElementById('no-results');

// 상세 보기 관련
const detailSection = document.getElementById('detail-section');
const detailTitle = document.getElementById('detail-title');
const detailClose = document.getElementById('detail-close');
const detailContentBody = document.getElementById('detail-content-body');

// 검색 히스토리 관련
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const backToSearchBtn = document.getElementById('back-to-search');
const clearHistoryBtn = document.getElementById('clear-history');
const historyLogoutBtn = document.getElementById('history-logout');

// 페이지 푸터 관련 링크
const termsLink = document.getElementById('terms-link');
const privacyLink = document.getElementById('privacy-link');
const helpLink = document.getElementById('help-link');

// 배경 요소
const y2kElements = document.querySelectorAll('.y2k-element');

// 전역 상태
let searchHistory = [];

// 세션 체크 및 초기 라우팅
function checkSession() {
    console.log('세션 체크 중...');
    try {
        // 로컬 스토리지에서 사용자 정보 확인
        const userString = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token');
        
        if (userString && token) {
            // 유효한 사용자 정보가 있으면 메인 화면으로
            const userInfo = JSON.parse(userString);
            console.log('사용자 정보 찾음:', userInfo);
            
            // 사용자 정보 업데이트 및 메인 화면 표시
            updateUserInfo(userInfo);
            showMainSection();
        } else {
            // 로그인 정보가 없으면 인증 화면으로
            console.log('로그인 정보 없음, 인증 화면으로 이동');
            showAuthSection();
        }
    } catch (error) {
        console.error('세션 체크 오류:', error);
        showAuthSection();
    }
}

// 사용자 정보 업데이트
function updateUserInfo(user) {
    if (!user) return;
    
    // 메인 화면의 사용자 이름 표시
    if (welcomeMessage) {
        welcomeMessage.textContent = user.name || '사용자';
    }
    
    // 히스토리 화면의 사용자 이름 표시
    const historyWelcomeMessage = document.getElementById('history-welcome-message');
    if (historyWelcomeMessage) {
        historyWelcomeMessage.textContent = user.name || '사용자';
    }
}

// 인증 섹션 표시
function showAuthSection() {
    if (!authSection || !mainSection) return;
    
    mainSection.style.display = 'none';
    authSection.style.display = 'block';
    historySection.style.display = 'none';
    
    // 기본적으로 로그인 폼 표시
    showLogin();
}

// 메인 섹션 표시
function showMainSection() {
    if (!mainSection || !authSection) return;
    
    authSection.style.display = 'none';
    mainSection.style.display = 'block';
    historySection.style.display = 'none';
    detailSection.classList.remove('active');
}

// 로그인 폼 표시
function showLogin() {
    if (!loginContainer || !registerContainer) return;
    
    loginContainer.style.display = 'block';
    registerContainer.style.display = 'none';
}

// 회원가입 폼 표시
function showRegister() {
    if (!loginContainer || !registerContainer) return;
    
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'block';
}

// 로그인 처리
function loginUser(userData) {
    // 로그인 버튼 비활성화 및 로딩 표시
    const loginButton = document.querySelector('#login-form button[type="submit"]');
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = '로그인 중...';
    }
    
    console.log('로그인 시도:', userData.email);
    
    // 실제 환경에서는 서버에 로그인 요청을 보내야 함
    // 지금은 테스트용 계정으로 로그인 시뮬레이션
    setTimeout(() => {
        // 로그인 버튼 원래 상태로 복원
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = '로그인';
        }
        
        // 테스트 계정 확인 (실제로는 서버에서 확인)
        if (userData.email === 'jaesu@kakao.com' && userData.password === '1234') {
            console.log('로그인 성공');
            
            // 사용자 정보 저장
            const userInfo = {
                id: 'user123',
                name: '김재수',
                email: userData.email,
                role: 'user',
                lastLogin: new Date().toISOString()
            };
            
            // 로컬 스토리지에 사용자 정보와 토큰 저장
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            localStorage.setItem('token', 'test-token-' + Math.random().toString(36).substring(2));
            
            // 사용자 정보 업데이트 및 메인 화면으로 이동
            updateUserInfo(userInfo);
            showMainSection();
            
            // 로그인 알림 표시
            showAlert('환영합니다, ' + userInfo.name + '님!', 'success', mainSection);
        } else {
            console.log('로그인 실패');
            // 로그인 실패 알림
            showAlert('로그인 실패: 이메일 또는 비밀번호가 일치하지 않습니다.<br>테스트 계정: jaesu@kakao.com / 1234', 'error', loginContainer);
        }
    }, 1000); // 1초 지연 (API 요청 시뮬레이션)
}

// 회원가입 처리
function registerUser(userData) {
    // 회원가입 버튼 비활성화 및 로딩 표시
    const registerButton = document.querySelector('#register-form button[type="submit"]');
    if (registerButton) {
        registerButton.disabled = true;
        registerButton.textContent = '가입 중...';
    }
    
    console.log('회원가입 시도:', userData);
    
    // 실제 환경에서는 서버에 회원가입 요청을 보내야 함
    // 지금은 회원가입 성공 시뮬레이션
    setTimeout(() => {
        // 회원가입 버튼 원래 상태로 복원
        if (registerButton) {
            registerButton.disabled = false;
            registerButton.textContent = '회원가입';
        }
        
        // 회원가입 성공 처리 (실제로는 서버 응답에 따라 처리)
        console.log('회원가입 성공');
        
        // 회원가입 성공 알림 후 로그인 페이지로 이동
        showAlert('회원가입이 완료되었습니다. 로그인해 주세요.', 'success', loginContainer);
        showLogin();
    }, 1500); // 1.5초 지연 (API 요청 시뮬레이션)
}

// 로그아웃 처리
function logout() {
    console.log('로그아웃');
    
    // 로컬 스토리지에서 사용자 정보 삭제
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    
    // 검색 기록 초기화
    searchHistory = [];
    
    // 인증 화면으로 이동
    showAuthSection();
    
    // 로그아웃 알림
    showAlert('로그아웃되었습니다.', 'info', loginContainer);
}

// 알림 메시지 표시
function showAlert(message, type, container) {
    if (!container) return;
    
    // 알림 컨테이너 생성
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.innerHTML = message;
    
    // 컨테이너에 알림 추가
    const alertContainer = container.querySelector('.alert-container') || container;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertElement);
    
    // 5초 후 알림 자동 제거
    setTimeout(() => {
        alertElement.remove();
    }, 5000);
}

// 검색 매개변수 수집
function collectSearchParams() {
    const params = {};
    
    // 기본 검색
    const nameInput = document.getElementById('search-name');
    if (nameInput && nameInput.value.trim()) {
        params.name = nameInput.value.trim();
    }
    
    const idInput = document.getElementById('search-id');
    if (idInput && idInput.value.trim()) {
        params.id = idInput.value.trim();
    }
    
    // 유형 필터 (다중 선택 가능)
    const activeFilters = document.querySelectorAll('.filter-option.active');
    if (activeFilters.length > 0) {
        // '모든 유형'이 선택되지 않은 경우에만 특정 유형 필터 적용
        const isAllSelected = Array.from(activeFilters).some(el => el.getAttribute('data-filter') === 'all');
        
        if (!isAllSelected) {
            params.types = Array.from(activeFilters).map(el => el.getAttribute('data-filter'));
        }
    }
    
    // 고급 검색 필드
    const countrySelect = document.getElementById('search-country');
    if (countrySelect && countrySelect.value && countrySelect.value !== 'all') {
        params.country = countrySelect.value;
    }
    
    const programSelect = document.getElementById('search-program');
    if (programSelect && programSelect.value && programSelect.value !== 'all') {
        params.program = programSelect.value;
    }
    
    const listSelect = document.getElementById('search-list');
    if (listSelect && listSelect.value && listSelect.value !== 'all') {
        params.list = listSelect.value;
    }
    
    // 새로운 고급 검색 필드 추가
    const advancedIdInput = document.getElementById('advanced-id');
    if (advancedIdInput && advancedIdInput.value.trim()) {
        params.advancedId = advancedIdInput.value.trim();
    }
    
    const advancedCodeInput = document.getElementById('advanced-code');
    if (advancedCodeInput && advancedCodeInput.value.trim()) {
        params.advancedCode = advancedCodeInput.value.trim();
    }
    
    const matchScoreSlider = document.getElementById('match-score');
    if (matchScoreSlider) {
        params.matchScore = parseInt(matchScoreSlider.value);
    }
    
    return params;
}

// 검색 실행 함수
async function performSearch(e) {
    if (e) e.preventDefault();
    
    try {
        // 검색 상태 업데이트
        if (loadingContainer) loadingContainer.classList.remove('hidden');
        if (resultsContainer) resultsContainer.classList.add('hidden');
        if (noResults) noResults.classList.add('hidden');
        
        // 검색 매개변수 수집
        const params = collectSearchParams();
        
        // 빈 검색어 처리
        if (!params.name && !params.id && 
            !params.country && !params.program && !params.list && 
            (!params.types || params.types.length === 0) &&
            !params.advancedId && !params.advancedCode) {
            if (loadingContainer) loadingContainer.classList.add('hidden');
            if (noResults) noResults.classList.remove('hidden');
            
            // 검색창 다시 포커싱
            if (document.getElementById('search-name')) {
                document.getElementById('search-name').focus();
            }
            return;
        }
        
        // 검색어가 있을 때만 검색 실행
        const results = await fetchSearchResults(params);
        
        // 로딩 완료 처리
        if (loadingContainer) loadingContainer.classList.add('hidden');
        
        // 결과 표시
        displayResults(results, params);
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        
        // 로딩 상태 숨기기
        if (loadingContainer) loadingContainer.classList.add('hidden');
        
        // 오류 메시지 표시 (팝업 대신 인라인 메시지로 변경)
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            // 기존 오류 메시지가 있으면 제거
            const existingError = searchContainer.querySelector('.search-error');
            if (existingError) {
                existingError.remove();
            }
            
            // 인라인 오류 메시지 추가
            const errorElement = document.createElement('div');
            errorElement.className = 'search-error';
            errorElement.innerHTML = `
                <div class="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>검색 중 문제가 발생했습니다. 다시 시도해 주세요.</span>
                </div>
                <button class="error-close">×</button>
            `;
            
            searchContainer.appendChild(errorElement);
            
            // 오류 메시지 닫기 버튼 이벤트
            const closeButton = errorElement.querySelector('.error-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    errorElement.remove();
                });
            }
            
            // 5초 후 자동으로 오류 메시지 제거
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.remove();
                }
            }, 5000);
        }
    }
}

// 검색 결과 가져오기 (더미 데이터)
async function fetchSearchResults(params) {
    // 실제로는 서버에 API 요청을 보내야 함
    console.log("검색 매개변수:", params);
    
    // 더미 데이터 (예시)
    const dummyData = [
        {
            id: "UN12345",
            name: "김정은",
            type: "Individual",
            country: "North Korea",
            program: "DPRK",
            source: "UN",
            date_listed: "2023-05-15",
            reason: "북한 정권의 지도자로서 핵무기 및 미사일 프로그램 관련 제재 대상",
            aliases: ["Kim Jong Un", "Kim Jong-un", "김정운"]
        },
        {
            id: "OFAC9876",
            name: "North Korean Ministry of Rocket Industry",
            type: "Entity",
            country: "North Korea",
            program: "DPRK",
            source: "OFAC",
            date_listed: "2022-11-08",
            reason: "북한의 미사일 개발 프로그램을 지원하는 정부 기관",
            aliases: ["조선로케트공업성", "DPRK Ministry of Rocket Industry"]
        },
        {
            id: "EU54321",
            name: "Vladimir Smagin",
            type: "Individual",
            country: "Russia",
            program: "RUSSIA",
            source: "EU",
            date_listed: "2023-02-20",
            reason: "우크라이나 침공과 관련된 러시아 군사 활동 지원",
            aliases: ["블라디미르 스마긴", "Владимир Смагин"]
        },
        {
            id: "UK11223",
            name: "Iranian Revolutionary Guard Corps",
            type: "Entity",
            country: "Iran",
            program: "IRAN",
            source: "UK",
            date_listed: "2023-01-10",
            reason: "테러 활동 지원 및 인권 침해 혐의",
            aliases: ["IRGC", "이란 혁명수비대", "سپاه پاسداران انقلاب اسلامی"]
        },
        {
            id: "JP98765",
            name: "Dandong Hongxiang Industrial Development Co. Ltd",
            type: "Entity",
            country: "China",
            program: "DPRK",
            source: "JP",
            date_listed: "2023-03-05",
            reason: "북한과의 불법 무역 활동 및 제재 회피 지원",
            aliases: ["단둥훙샹실업발전유한공사", "丹东鸿祥实业发展有限公司"]
        },
        {
            id: "UN67890",
            name: "Hassan Nasrallah",
            type: "Individual",
            country: "Lebanon",
            program: "TERRORISM",
            source: "UN",
            date_listed: "2022-08-12",
            reason: "테러 조직 지도자로서의 활동",
            aliases: ["하산 나스랄라", "حسن نصر الله"]
        },
        {
            id: "OFAC2468",
            name: "Syria Trading Oil Company",
            type: "Entity",
            country: "Syria",
            program: "SYRIA",
            source: "OFAC",
            date_listed: "2023-06-02",
            reason: "시리아 정권 자금 조달 지원",
            aliases: ["STOC", "시리아 석유 무역 회사", "شركة سوريا لتجارة النفط"]
        },
        {
            id: "EU13579",
            name: "Belarus Electronic Warfare Systems",
            type: "Entity",
            country: "Belarus",
            program: "BELARUS",
            source: "EU",
            date_listed: "2023-04-18",
            reason: "벨라루스 정권의 억압 활동 지원 및 러시아 군사 활동 협력",
            aliases: ["BEWS", "벨라루스 전자전 시스템", "Беларуская сістэма электроннай барацьбы"]
        },
        {
            id: "UN55555",
            name: "Golden Luxury Yacht 1",
            type: "Vessel",
            country: "North Korea",
            program: "DPRK",
            source: "UN",
            date_listed: "2023-07-20",
            reason: "북한 제재를 우회하기 위한 불법 활동에 사용되는 선박",
            aliases: ["황금호 1", "Golden Star"]
        },
        {
            id: "JP44444",
            name: "Shadow Aircraft LLC",
            type: "Aircraft",
            country: "Russia",
            program: "RUSSIA",
            source: "JP",
            date_listed: "2022-12-15",
            reason: "제재 우회 목적의 항공기 운영",
            aliases: ["새도우 에어크래프트", "Shadow Air"]
        }
    ];
    
    // 필터링 및 정렬 로직
    let results = [...dummyData];
    
    // 이름 또는 ID로 검색
    if (params.name) {
        const searchLower = params.name.toLowerCase();
        
        // 이름, 별칭(aliases)으로 유사 검색
        results = results.filter(item => {
            // 이름에서 검색어 포함 확인
            const nameMatch = item.name.toLowerCase().includes(searchLower);
            
            // 별칭(aliases)에서 검색어 포함 확인
            const aliasMatch = item.aliases && item.aliases.some(alias => 
                alias.toLowerCase().includes(searchLower)
            );
            
            // ID에서 검색어 포함 확인
            const idMatch = item.id.toLowerCase().includes(searchLower);
            
            // 이름, 별칭, ID 중 하나라도 일치하면 결과에 포함
            return nameMatch || aliasMatch || idMatch;
        });
        
        // 검색어와 유사도가 높은 순으로 정렬
        results.sort((a, b) => {
            // 이름 일치도 계산
            const aNameMatch = a.name.toLowerCase().includes(searchLower) ? 
                a.name.toLowerCase().indexOf(searchLower) : Infinity;
            const bNameMatch = b.name.toLowerCase().includes(searchLower) ? 
                b.name.toLowerCase().indexOf(searchLower) : Infinity;
                
            // 별칭 일치도 계산
            const aAliasMatch = a.aliases ? a.aliases.findIndex(alias => 
                alias.toLowerCase().includes(searchLower)) : -1;
            const bAliasMatch = b.aliases ? b.aliases.findIndex(alias => 
                alias.toLowerCase().includes(searchLower)) : -1;
                
            // 이름 일치가 우선, 그 다음 별칭 일치
            if (aNameMatch !== Infinity && bNameMatch !== Infinity) {
                return aNameMatch - bNameMatch;
            } else if (aNameMatch !== Infinity) {
                return -1;
            } else if (bNameMatch !== Infinity) {
                return 1;
            } else if (aAliasMatch !== -1 && bAliasMatch !== -1) {
                return aAliasMatch - bAliasMatch;
            } else if (aAliasMatch !== -1) {
                return -1;
            } else if (bAliasMatch !== -1) {
                return 1;
            }
            
            // 그 외의 경우 최신 제재 순으로 정렬
            return new Date(b.date_listed) - new Date(a.date_listed);
        });
    }
    
    // ID로 검색
    if (params.id) {
        const idLower = params.id.toLowerCase();
        results = results.filter(item => 
            item.id.toLowerCase().includes(idLower)
        );
    }
    
    // 유형으로 필터링 (복수 선택 가능)
    if (params.types && params.types.length > 0) {
        results = results.filter(item => 
            params.types.includes(item.type)
        );
    }
    
    // 국가로 필터링
    if (params.country) {
        results = results.filter(item => 
            item.country === params.country
        );
    }
    
    // 프로그램으로 필터링
    if (params.program) {
        results = results.filter(item => 
            item.program === params.program
        );
    }
    
    // 출처(제재 목록)로 필터링
    if (params.list) {
        results = results.filter(item => 
            item.source === params.list
        );
    }
    
    // 검색어가 없고 필터만 적용된 경우, 최신 제재 순으로 정렬
    if (!params.name && (params.country || params.program || params.list || (params.types && params.types.length > 0))) {
        results.sort((a, b) => new Date(b.date_listed) - new Date(a.date_listed));
    }
    
    return results;
}

// 검색 결과 표시
function displayResults(results, params) {
    if (!resultsContainer || !resultsList || !resultsCount) return;
    
    // 검색 결과 숨김
    resultsContainer.classList.add('hidden');
    loadingContainer.classList.add('hidden');
    
    // 결과 수 표시
    resultsCount.textContent = `(${results.length})`;
    
    // 결과 목록 초기화
    resultsList.innerHTML = '';
    
    if (results.length === 0) {
        // 결과가 없는 경우
        if (noResults) noResults.classList.remove('hidden');
        return;
    }
    
    // 결과가 있는 경우
    if (noResults) noResults.classList.add('hidden');
    
    // 검색 점수 계산 (가중치 적용)
    const calculateSearchScore = (item, searchTerm) => {
        if (!searchTerm) return 100; // 검색어가 없으면 최대 점수
        
        searchTerm = searchTerm.toLowerCase();
        const name = item.name.toLowerCase();
        let score = 0;
        
        // 직접 이름 일치 (가장 높은 가중치)
        if (name === searchTerm) {
            score = 100;
        } 
        // 이름 시작 부분 일치
        else if (name.startsWith(searchTerm)) {
            score = 90;
        } 
        // 이름에 검색어 포함
        else if (name.includes(searchTerm)) {
            score = 75;
        }
        // 별칭(aliases) 검색
        else if (item.aliases && item.aliases.some(alias => 
            alias.toLowerCase() === searchTerm
        )) {
            score = 85;
        }
        else if (item.aliases && item.aliases.some(alias => 
            alias.toLowerCase().includes(searchTerm)
        )) {
            score = 70;
        }
        // ID 일치
        else if (item.id.toLowerCase().includes(searchTerm)) {
            score = 60;
        }
        // 국가 일치
        else if (item.country.toLowerCase().includes(searchTerm)) {
            score = 50;
        }
        // 프로그램 또는 출처 일치
        else if (
            (item.program && item.program.toLowerCase().includes(searchTerm)) ||
            (item.source && item.source.toLowerCase().includes(searchTerm))
        ) {
            score = 40;
        }
        // 이유에 검색어 포함
        else if (item.reason && item.reason.toLowerCase().includes(searchTerm)) {
            score = 30;
        }
        // 기본 최소 점수
        else {
            score = 20;
        }
        
        return score;
    };
    
    // 결과를 카드로 표시
    results.forEach(item => {
        // 검색 점수 계산
        const searchScore = calculateSearchScore(item, params.name);
        
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.dataset.id = item.id;
        
        // 최대 2개까지 별칭 표시
        let aliasesDisplay = '';
        if (item.aliases && item.aliases.length > 0) {
            const displayAliases = item.aliases.slice(0, 2);
            aliasesDisplay = `
                <div class="aliases">
                    <span class="alias-label">별칭:</span>
                    <span class="alias-value">${displayAliases.join(', ')}</span>
                    ${item.aliases.length > 2 ? `<span class="alias-more">+${item.aliases.length - 2}개 더 보기</span>` : ''}
                </div>
            `;
        }
        
        // 날짜 포맷팅
        const dateStr = item.date_listed 
            ? new Date(item.date_listed).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
            : '정보 없음';
        
        // 유사도 그래프 HTML
        const similarityGraph = `
            <div class="similarity-graph">
                <div class="similarity-label">유사도: ${searchScore}%</div>
                <div class="similarity-bar">
                    <div class="similarity-fill" style="width: ${searchScore}%"></div>
                </div>
            </div>
        `;
        
        resultCard.innerHTML = `
            <h3 class="result-title">${item.name}</h3>
            <div class="result-info">
                <div class="metadata">
                    <span class="metadata-item"><strong>유형:</strong> ${item.type}</span>
                    <span class="metadata-item"><strong>국가:</strong> ${item.country}</span>
                    <span class="metadata-item"><strong>제재 목록:</strong> ${item.source}</span>
                    <span class="metadata-item"><strong>제재 날짜:</strong> ${dateStr}</span>
                </div>
                ${aliasesDisplay}
                ${params.name ? similarityGraph : ''}
            </div>
            <p class="result-description">${item.reason || '구체적인 제재 사유 정보가 없습니다.'}</p>
            <div class="result-actions">
                <button class="view-detail-btn" data-id="${item.id}">상세보기</button>
                <button class="share-btn" data-id="${item.id}">
                    <i class="fas fa-share-alt"></i> 공유
                </button>
                <button class="download-btn" data-id="${item.id}">
                    <i class="fas fa-file-download"></i> 보고서
                </button>
            </div>
        `;
        
        // 카드 클릭 이벤트 - 상세보기
        resultCard.addEventListener('click', (e) => {
            // 공유 버튼 또는 다운로드 버튼 클릭 시 이벤트 전파 중단
            if (e.target.classList.contains('share-btn') || 
                e.target.classList.contains('download-btn') ||
                e.target.closest('.share-btn') || 
                e.target.closest('.download-btn')) {
                e.stopPropagation();
                return;
            }
            
            const clickedItem = results.find(r => r.id === item.id);
            if (clickedItem) {
                showDetailView(clickedItem);
                
                // 검색 기록에 추가
                addToSearchHistory(params, results.length);
            }
        });
        
        // 공유 버튼 클릭 이벤트
        const shareBtn = resultCard.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                shareResult(item);
            });
        }
        
        // 보고서 다운로드 버튼 클릭 이벤트
        const downloadBtn = resultCard.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadReport(item);
            });
        }
        
        resultsList.appendChild(resultCard);
    });
    
    // 결과 컨테이너 표시
    resultsContainer.classList.remove('hidden');
    
    // 검색 히스토리에 추가
    if (results.length > 0) {
        addToSearchHistory(params, results.length);
    }
}

// 결과 공유 기능
function shareResult(item) {
    // 공유할 텍스트 생성
    const shareText = `제재 대상 정보: ${item.name} (${item.type}, ${item.country})`;
    const shareUrl = window.location.href;
    
    // 실제 서비스에서는 API 연동이 필요, 현재는 브라우저 공유 API 사용
    if (navigator.share) {
        navigator.share({
            title: '제재 대상 검색 결과',
            text: shareText,
            url: shareUrl + '?id=' + item.id
        })
        .then(() => console.log('공유 성공'))
        .catch((error) => console.log('공유 실패:', error));
    } else {
        // 대체 공유 방법 (모달창 표시)
        alert(`복사하여 공유하세요:\n\n${shareText}\n${shareUrl}?id=${item.id}`);
        
        try {
            // 클립보드에 복사
            navigator.clipboard.writeText(`${shareText}\n${shareUrl}?id=${item.id}`)
                .then(() => showAlert('클립보드에 복사되었습니다.', 'success', mainSection))
                .catch(err => console.log('클립보드 복사 실패:', err));
        } catch (err) {
            console.log('클립보드 복사 오류:', err);
        }
    }
}

// 보고서 다운로드 기능
function downloadReport(item) {
    // 실제 서비스에서는 서버에서 PDF 생성 필요
    // 현재는 간단한 텍스트 파일로 대체
    const reportContent = `
제재 대상 보고서
--------------------------
이름: ${item.name}
ID: ${item.id}
유형: ${item.type}
국가: ${item.country}
제재 프로그램: ${item.program}
제재 출처: ${item.source}
제재 날짜: ${item.date_listed ? new Date(item.date_listed).toLocaleDateString('ko-KR') : '정보 없음'}

제재 사유:
${item.reason || '구체적인 제재 사유 정보가 없습니다.'}

별칭:
${item.aliases ? item.aliases.join('\n') : '정보 없음'}

보고서 생성일: ${new Date().toLocaleDateString('ko-KR')}
보고서 생성 시스템: 세계 경제 제재 대상 검색 서비스
`;

    // 텍스트 파일 다운로드
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `제재대상_${item.id}_보고서.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showAlert('보고서가 다운로드 되었습니다.', 'success', mainSection);
}

// 상세 정보 보기
function showDetailView(data) {
    if (!detailSection || !detailTitle || !detailContentBody) return;
    
    // 상세 정보 제목 설정
    detailTitle.textContent = data.name;
    
    // 상세 정보 내용 구성
    const aliases = data.aliases && data.aliases.length > 0 
        ? data.aliases.join(', ') 
        : '정보 없음';
        
    const dateStr = data.date_listed 
        ? new Date(data.date_listed).toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : '정보 없음';
        
    // 메타데이터 섹션 구성
    const metadataHTML = `
        <div class="detail-metadata">
            <div class="metadata-group">
                <div class="metadata-item">
                    <span class="metadata-label">ID</span>
                    <span class="metadata-value">${data.id}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">유형</span>
                    <span class="metadata-value">${data.type}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">국가</span>
                    <span class="metadata-value">${data.country}</span>
                </div>
            </div>
            <div class="metadata-group">
                <div class="metadata-item">
                    <span class="metadata-label">프로그램</span>
                    <span class="metadata-value">${data.program}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">제재 출처</span>
                    <span class="metadata-value">${data.source}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">제재 날짜</span>
                    <span class="metadata-value">${dateStr}</span>
                </div>
            </div>
        </div>
    `;
    
    // 별칭 및 상세 정보 섹션
    const detailHTML = `
        <div class="detail-section">
            <h3 class="detail-section-title">별칭</h3>
            <div class="detail-aliases">
                ${aliases}
            </div>
        </div>
        <div class="detail-section">
            <h3 class="detail-section-title">제재 사유</h3>
            <div class="detail-reason">
                ${data.reason || '제재 사유 정보가 없습니다.'}
            </div>
        </div>
    `;
    
    // 액션 버튼 섹션
    const actionsHTML = `
        <div class="detail-actions">
            <button class="action-button pdf-report" data-id="${data.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                PDF 보고서 다운로드
            </button>
            <button class="action-button text-report" data-id="${data.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                텍스트 보고서 다운로드
            </button>
            <button class="action-button share-report" data-id="${data.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                보고서 공유
            </button>
        </div>
    `;
    
    // 전체 내용 조합
    detailContentBody.innerHTML = `
        ${metadataHTML}
        ${detailHTML}
        ${actionsHTML}
    `;
    
    // PDF 보고서 다운로드 버튼 이벤트
    const pdfReportBtn = detailContentBody.querySelector('.pdf-report');
    if (pdfReportBtn) {
        pdfReportBtn.addEventListener('click', () => {
            downloadPdfReport(data);
        });
    }
    
    // 텍스트 보고서 다운로드 버튼 이벤트
    const textReportBtn = detailContentBody.querySelector('.text-report');
    if (textReportBtn) {
        textReportBtn.addEventListener('click', () => {
            downloadReport(data);
        });
    }
    
    // 공유 버튼 이벤트
    const shareReportBtn = detailContentBody.querySelector('.share-report');
    if (shareReportBtn) {
        shareReportBtn.addEventListener('click', () => {
            shareDetailReport(data);
        });
    }
    
    // 상세 정보 섹션 표시
    detailSection.classList.add('active');
}

// PDF 보고서 다운로드 기능
function downloadPdfReport(item) {
    try {
        // PDF 생성을 위한 HTML 템플릿
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>제재 대상 보고서 - ${item.name}</title>
                <style>
                    body {
                        font-family: 'Noto Sans KR', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        padding: 20px;
                    }
                    .report-header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #ddd;
                    }
                    .report-title {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #1a365d;
                    }
                    .report-date {
                        font-size: 14px;
                        color: #666;
                    }
                    .section {
                        margin-bottom: 20px;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 20px;
                    }
                    .section-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #1a365d;
                    }
                    .metadata {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                    }
                    .metadata-item {
                        margin-bottom: 8px;
                    }
                    .metadata-label {
                        font-weight: bold;
                        margin-right: 5px;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <div class="report-title">제재 대상 상세 보고서</div>
                    <div class="report-date">생성일: ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                
                <div class="section">
                    <div class="section-title">기본 정보</div>
                    <div class="metadata">
                        <div class="metadata-item">
                            <span class="metadata-label">이름:</span>
                            <span>${item.name}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">ID:</span>
                            <span>${item.id}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">유형:</span>
                            <span>${item.type}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">국가:</span>
                            <span>${item.country}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">프로그램:</span>
                            <span>${item.program}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">제재 출처:</span>
                            <span>${item.source}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">제재 날짜:</span>
                            <span>${item.date_listed ? new Date(item.date_listed).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '정보 없음'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">별칭</div>
                    <div>${item.aliases ? item.aliases.join(', ') : '정보 없음'}</div>
                </div>
                
                <div class="section">
                    <div class="section-title">제재 사유</div>
                    <div>${item.reason || '구체적인 제재 사유 정보가 없습니다.'}</div>
                </div>
                
                <div class="footer">
                    세계 경제 제재 대상 검색 서비스에서 생성된 보고서입니다.<br>
                    이 보고서는 참고용으로만 활용하시기 바랍니다.
                </div>
            </body>
            </html>
        `;
        
        // HTML을 PDF로 변환하는 부분 (실제로는 서버에서 처리해야 함)
        // 여기서는 html2pdf.js 라이브러리를 사용한다고 가정
        if (typeof html2pdf !== 'undefined') {
            const options = {
                margin: 10,
                filename: `제재대상_${item.id}_보고서.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            // HTML 요소 생성 후 PDF 변환
            const tempElement = document.createElement('div');
            tempElement.innerHTML = reportHTML;
            tempElement.style.position = 'absolute';
            tempElement.style.left = '-9999px';
            document.body.appendChild(tempElement);
            
            html2pdf().from(tempElement).set(options).save().then(() => {
                document.body.removeChild(tempElement);
                showAlert('PDF 보고서가 다운로드 되었습니다.', 'success', mainSection);
            });
        } else {
            // 라이브러리가 없는 경우 대체 다운로드 방법 (텍스트로 대체)
            console.warn('html2pdf 라이브러리가 로드되지 않았습니다. 텍스트 보고서로 대체합니다.');
            downloadReport(item);
            
            // 라이브러리 로드 시도
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            document.head.appendChild(script);
            
            showAlert('PDF 변환 라이브러리가 로드되지 않아 텍스트 보고서로 대체됩니다.', 'warning', mainSection);
        }
    } catch (error) {
        console.error('PDF 생성 중 오류:', error);
        showAlert('PDF 생성 중 오류가 발생했습니다. 텍스트 보고서로 대체됩니다.', 'error', mainSection);
        downloadReport(item);
    }
}

// 보고서 공유 기능
function shareDetailReport(item) {
    // 공유할 텍스트 및 URL 생성
    const shareTitle = `제재 대상 보고서: ${item.name} (${item.id})`;
    const shareText = `
제재 대상: ${item.name}
유형: ${item.type}
국가: ${item.country}
프로그램: ${item.program}
제재 출처: ${item.source}
제재 날짜: ${item.date_listed ? new Date(item.date_listed).toLocaleDateString('ko-KR') : '정보 없음'}
    `;
    const shareUrl = window.location.href.split('?')[0] + `?id=${item.id}`;
    
    // 실제 서비스에서는 API 연동이 필요, 현재는 브라우저 공유 API 사용
    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
        })
        .then(() => console.log('공유 성공'))
        .catch((error) => {
            console.log('공유 실패:', error);
            fallbackShare(shareTitle, shareText, shareUrl);
        });
    } else {
        fallbackShare(shareTitle, shareText, shareUrl);
    }
}

// 대체 공유 방법
function fallbackShare(title, text, url) {
    // 공유 모달 생성
    const modalHTML = `
        <div class="share-modal">
            <div class="share-modal-content">
                <div class="share-modal-header">
                    <h3>보고서 공유</h3>
                    <button class="share-modal-close">&times;</button>
                </div>
                <div class="share-modal-body">
                    <p>아래 텍스트를 복사하여 공유하세요:</p>
                    <textarea class="share-textarea" readonly>${title}\n\n${text}\n자세히 보기: ${url}</textarea>
                    <div class="share-buttons">
                        <button class="copy-btn">클립보드에 복사</button>
                        <a href="mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n자세히 보기: ' + url)}" class="email-btn">이메일로 공유</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 모달 DOM에 추가
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement);
    
    // 모달 닫기 이벤트
    const closeButton = modalElement.querySelector('.share-modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modalElement);
        });
    }
    
    // 클립보드 복사 버튼 이벤트
    const copyButton = modalElement.querySelector('.copy-btn');
    const textarea = modalElement.querySelector('.share-textarea');
    
    if (copyButton && textarea) {
        copyButton.addEventListener('click', () => {
            textarea.select();
            try {
                document.execCommand('copy');
                showAlert('클립보드에 복사되었습니다.', 'success', modalElement.querySelector('.share-modal-body'));
            } catch (err) {
                console.error('클립보드 복사 실패:', err);
                showAlert('클립보드 복사에 실패했습니다.', 'error', modalElement.querySelector('.share-modal-body'));
            }
        });
    }
    
    // 모달 외부 클릭 시 닫기
    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement.querySelector('.share-modal')) {
            document.body.removeChild(modalElement);
        }
    });
}

// 검색 히스토리에 추가
function addToSearchHistory(params, resultCount) {
    // 중복 검색 방지를 위한 검사
    const existingSearchIndex = searchHistory.findIndex(item => 
        item.params.name === params.name &&
        item.params.id === params.id &&
        item.params.type === params.type &&
        item.params.country === params.country &&
        item.params.program === params.program &&
        item.params.list === params.list
    );
    
    if (existingSearchIndex !== -1) {
        // 중복 검색은 최신 항목으로 업데이트
        searchHistory.splice(existingSearchIndex, 1);
    }
    
    // 새 검색 히스토리 항목 추가
    const newSearch = {
        id: Date.now(),
        timestamp: new Date(),
        params: params,
        resultCount: resultCount
    };
    
    searchHistory.unshift(newSearch);
    
    // 최대 20개 항목만 유지
    if (searchHistory.length > 20) {
        searchHistory.pop();
    }
    
    // 로컬 스토리지에 저장
    saveSearchHistory();
}

// 검색 히스토리 저장
function saveSearchHistory() {
    if (currentUser) {
        localStorage.setItem(`searchHistory_${currentUser.email}`, JSON.stringify(searchHistory));
    }
}

// 검색 히스토리 로드
function loadSearchHistory() {
    if (currentUser) {
        const savedHistory = localStorage.getItem(`searchHistory_${currentUser.email}`);
        if (savedHistory) {
            searchHistory = JSON.parse(savedHistory);
        } else {
            searchHistory = [];
        }
    } else {
        searchHistory = [];
    }
}

// 검색 히스토리 표시
function displaySearchHistory() {
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (searchHistory.length === 0) {
        historyList.innerHTML = `
            <div class="no-history">
                <h3>검색 기록이 없습니다</h3>
                <p>검색을 수행하면 여기에 기록이 표시됩니다.</p>
            </div>
        `;
        return;
    }
    
    searchHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // 검색어와 필터 정보 가져오기
        const { name, type, country, program, list } = item.params;
        const searchDate = new Date(item.timestamp).toLocaleString('ko-KR');
        
        // 히스토리 항목 컨텐츠 생성
        historyItem.innerHTML = `
            <span class="history-date">${searchDate}</span>
            <h3 class="history-query">${name || '모든 제재 대상'}</h3>
            <div class="history-details">
                <p>검색 결과: ${item.resultCount}개</p>
                <div class="history-tags">
                    ${type ? `<span class="history-tag">${type}</span>` : ''}
                    ${country ? `<span class="history-tag">${country}</span>` : ''}
                    ${program ? `<span class="history-tag">${program}</span>` : ''}
                    ${list ? `<span class="history-tag">${list}</span>` : ''}
                </div>
            </div>
        `;
        
        // 히스토리 항목 클릭 이벤트 (해당 검색 재실행)
        historyItem.addEventListener('click', () => {
            // 검색 폼에 이전 검색 파라미터 적용
            if (searchInput) searchInput.value = item.params.name || '';
            
            if (document.getElementById('search-id')) {
                document.getElementById('search-id').value = item.params.id || '';
            }
            
            // 필터 옵션 적용
            if (item.params.type) {
                const filterType = item.params.type.toLowerCase();
                filterOptions.forEach(option => {
                    if (option.getAttribute('data-filter') === filterType) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                });
            } else {
                // 필터 없는 경우 '모든 유형' 선택
                filterOptions.forEach(option => {
                    option.classList.toggle('active', option.getAttribute('data-filter') === 'all');
                });
            }
            
            // 고급 검색 옵션 적용
            if (document.getElementById('search-country')) {
                document.getElementById('search-country').value = item.params.country || '';
            }
            
            if (document.getElementById('search-program')) {
                document.getElementById('search-program').value = item.params.program || '';
            }
            
            if (document.getElementById('search-list')) {
                document.getElementById('search-list').value = item.params.list || '';
            }
            
            if (document.getElementById('match-score')) {
                document.getElementById('match-score').value = item.params.score || 75;
                updateSliderProgress();
            }
            
            // 검색 실행 및 히스토리 페이지 닫기
            showMainSection();
            performSearch();
        });
        
        historyList.appendChild(historyItem);
    });
}

// 검색 히스토리 표시
function showHistorySection() {
    if (!historySection) return;
    
    if (mainSection) mainSection.classList.add('hidden');
    if (authSection) authSection.classList.add('hidden');
    if (detailSection) detailSection.classList.remove('active');
    historySection.classList.remove('hidden');
    
    // 검색 히스토리 내용 업데이트
    displaySearchHistory();
}

// 메인 섹션으로 돌아가기
function showMainSection() {
    if (!mainSection) return;
    
    if (historySection) historySection.classList.add('hidden');
    if (authSection) authSection.classList.add('hidden');
    if (detailSection) detailSection.classList.remove('active');
    mainSection.classList.remove('hidden');
}

// 검색 히스토리 삭제
function clearSearchHistory() {
    if (confirm('모든 검색 기록을 삭제하시겠습니까?')) {
        searchHistory = [];
        saveSearchHistory();
        displaySearchHistory();
    }
}

// 슬라이더 프로그레스 바 업데이트
function updateSliderProgress() {
    const slider = document.getElementById('match-score');
    if (!slider) return;
    
    const value = slider.value;
    const min = slider.min || 0;
    const max = slider.max || 100;
    const percentage = ((value - min) / (max - min)) * 100;
    
    // 슬라이더 진행 표시줄 업데이트
    const progressBar = document.querySelector('.slider-progress');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    // 값 표시 업데이트
    const valueDisplay = document.getElementById('match-score-value');
    if (valueDisplay) {
        valueDisplay.textContent = `${value}%`;
    }
}

// 고급 검색 토글 기능
function toggleAdvancedSearch() {
    const advancedSearchContainer = document.getElementById('advanced-search');
    if (!advancedSearchContainer) return;
    
    const toggleButton = document.querySelector('.toggle-advanced');
    const isHidden = advancedSearchContainer.classList.contains('hidden');
    
    if (isHidden) {
        // 고급 검색 표시
        advancedSearchContainer.classList.remove('hidden');
        
        // 버튼 상태 변경
        if (toggleButton) {
            toggleButton.classList.add('active');
            toggleButton.innerHTML = `
                <span>고급 검색 닫기</span>
                <i class="toggle-icon">+</i>
            `;
        }
        
        // 고급 검색 필드가 아직 렌더링되지 않았으면 생성
        if (advancedSearchContainer.children.length === 0) {
            renderAdvancedSearchFields();
        }
    } else {
        // 고급 검색 숨기기
        advancedSearchContainer.classList.add('hidden');
        
        // 버튼 상태 변경
        if (toggleButton) {
            toggleButton.classList.remove('active');
            toggleButton.innerHTML = `
                <span>고급 검색 열기</span>
                <i class="toggle-icon">+</i>
            `;
        }
    }
}

// 고급 검색 필드 렌더링
function renderAdvancedSearchFields() {
    const advancedSearchContainer = document.getElementById('advanced-search');
    if (!advancedSearchContainer) return;
    
    // 고급 검색 필드 생성
    advancedSearchContainer.innerHTML = `
        <div class="advanced-row">
            <div class="advanced-group">
                <label for="advanced-id">고유 식별자 (ID/코드)</label>
                <input type="text" id="advanced-id" class="advanced-input" placeholder="고유 번호나 식별 코드 입력">
                <small class="field-hint">OFAC, UN, EU 등의 식별 코드 검색</small>
            </div>
            <div class="advanced-group">
                <label for="advanced-code">등록 코드/참조 번호</label>
                <input type="text" id="advanced-code" class="advanced-input" placeholder="등록 번호나 참조 코드 입력">
                <small class="field-hint">등록 번호, 참조 코드, 여권 번호 등</small>
            </div>
        </div>
        
        <div class="advanced-row">
            <div class="advanced-group full-width">
                <label>추가 검색 옵션</label>
                <div class="advanced-options">
                    <div class="advanced-option">
                        <input type="checkbox" id="search-aliases" checked>
                        <label for="search-aliases">별명 및 별칭 포함</label>
                    </div>
                    <div class="advanced-option">
                        <input type="checkbox" id="search-fuzzy" checked>
                        <label for="search-fuzzy">유사 검색 활성화</label>
                    </div>
                    <div class="advanced-option">
                        <input type="checkbox" id="search-history">
                        <label for="search-history">이력 정보 포함</label>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="advanced-row">
            <div class="advanced-group full-width">
                <div class="media-search-options">
                    <div class="media-search-title">
                        <h4>멀티미디어 검색</h4>
                        <span class="beta-tag">Beta</span>
                    </div>
                    <div class="media-search-buttons">
                        <button class="media-search-btn image-search-btn" disabled>
                            <i class="fas fa-image"></i> 이미지 검색
                        </button>
                        <button class="media-search-btn video-search-btn" disabled>
                            <i class="fas fa-video"></i> 영상 검색
                        </button>
                        <button class="media-search-btn voice-search-btn" disabled>
                            <i class="fas fa-microphone"></i> 음성 인식
                        </button>
                    </div>
                    <p class="media-search-note">* 곧 제공될 예정입니다</p>
                </div>
            </div>
        </div>
    `;
    
    // 고급 검색 토글 버튼에 이벤트 리스너 추가
    const searchAliasesCheckbox = document.getElementById('search-aliases');
    const searchFuzzyCheckbox = document.getElementById('search-fuzzy');
    const searchHistoryCheckbox = document.getElementById('search-history');
    
    // 체크박스 변경 시 즉시 검색 수행
    [searchAliasesCheckbox, searchFuzzyCheckbox, searchHistoryCheckbox].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                // 검색 폼이 있을 경우에만 검색 실행
                if (searchForm) performSearch();
            });
        }
    });
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    console.log('문서 로드 완료');
    
    // 로그인 폼 제출 이벤트
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            loginUser({ email, password });
        });
    }
    
    // 회원가입 폼 제출 이벤트
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-password-confirm').value;
            const phone = document.getElementById('register-phone').value;
            
            // 비밀번호 일치 여부 확인
            if (password !== confirmPassword) {
                showAlert('비밀번호가 일치하지 않습니다.', 'error', registerContainer);
                return;
            }
            
            registerUser({ name, email, password, phone });
        });
    }
    
    // 로그인/회원가입 전환 링크
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLogin();
        });
    }
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            showRegister();
        });
    }
    
    // 로그아웃 버튼
    const logoutBtns = document.querySelectorAll('.logout-button');
    logoutBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', logout);
        }
    });
    
    // 본인 인증 버튼
    if (verifyIdentityBtn) {
        verifyIdentityBtn.addEventListener('click', function() {
            // 실제로는 본인인증 서비스 연동이 필요함
            // 예시로 인증 완료 처리
            if (identityStatus) {
                identityStatus.textContent = '본인 인증이 완료되었습니다';
                identityStatus.classList.add('verified');
                verifyIdentityBtn.disabled = true;
            }
        });
    }
    
    // 검색 폼 제출 이벤트
    if (searchForm) {
        searchForm.addEventListener('submit', performSearch);
    }
    
    // 필터 옵션 클릭 이벤트
    if (filterOptions) {
        filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                // 'all' 옵션과 특정 유형 옵션을 함께 선택할 수 없도록 처리
                const isAll = option.getAttribute('data-filter') === 'all';
                
                if (isAll) {
                    // '모든 유형' 선택 시 다른 필터 해제
                    filterOptions.forEach(opt => {
                        opt.classList.toggle('active', opt.getAttribute('data-filter') === 'all');
                    });
                } else {
                    // 특정 유형 선택 시 '모든 유형' 해제
                    const allOption = Array.from(filterOptions).find(opt => opt.getAttribute('data-filter') === 'all');
                    if (allOption) {
                        allOption.classList.remove('active');
                    }
                    
                    // 현재 옵션 토글
                    option.classList.toggle('active');
                    
                    // 활성화된 필터가 없으면 '모든 유형' 자동 선택
                    const hasActiveSpecificFilter = Array.from(filterOptions)
                        .some(opt => opt.getAttribute('data-filter') !== 'all' && opt.classList.contains('active'));
                    
                    if (!hasActiveSpecificFilter && allOption) {
                        allOption.classList.add('active');
                    }
                }
                
                // 필터 변경 즉시 검색 수행
                if (searchForm) performSearch();
            });
        });
    }
    
    // 고급 검색 토글
    if (toggleAdvancedBtn) {
        toggleAdvancedBtn.addEventListener('click', toggleAdvancedSearch);
    }
    
    // 상세 보기 닫기 버튼
    if (detailClose) {
        detailClose.addEventListener('click', function() {
            if (detailSection) detailSection.classList.remove('active');
        });
    }
    
    // 푸터 링크에 이벤트 리스너 추가
    if (termsLink) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showTermsPage();
        });
    }
    
    if (privacyLink) {
        privacyLink.addEventListener('click', function(e) {
            e.preventDefault();
            showPrivacyPage();
        });
    }
    
    if (helpLink) {
        helpLink.addEventListener('click', function(e) {
            e.preventDefault();
            showHelpPage();
        });
    }
    
    // Y2K 효과 초기화
    initY2KElements();
    
    // 기본 라우팅 (세션 체크)
    checkSession();
});

// 이용약관, 개인정보처리방침, 도움말 페이지 보기
function showTermsPage() {
    // 현재 페이지 상태 저장
    const currentState = {
        authVisible: !authSection.classList.contains('hidden'),
        mainVisible: !mainSection.classList.contains('hidden'),
        detailVisible: !detailSection.classList.contains('hidden')
    };
    
    // 모든 섹션 숨기기
    authSection.classList.add('hidden');
    mainSection.classList.add('hidden');
    detailSection.classList.add('hidden');
    
    // 이미 존재하는 약관 페이지 숨기기
    const existingSections = document.querySelectorAll('.terms-section, .privacy-section, .help-section');
    existingSections.forEach(section => section.classList.add('hidden'));
    
    // 이용약관 페이지 생성 및 표시
    let termsSection = document.getElementById('terms-section');
    if (!termsSection) {
        termsSection = document.createElement('section');
        termsSection.id = 'terms-section';
        termsSection.className = 'terms-section';
        
        termsSection.innerHTML = `
            <header class="header">
                <div class="header-logo">
                    <img src="images/logo-white.png" alt="로고">
                    <h1>세계 경제 제재 대상 검색</h1>
                </div>
                <button id="terms-back-btn" class="back-button">
                    <i class="fas fa-arrow-left"></i> 돌아가기
                </button>
            </header>
            <div class="container py-4">
                <h2 class="terms-title">이용약관</h2>
                <div class="terms-content">
                    <h3>1. 서비스 이용약관</h3>
                    <p>본 이용약관은 주식회사 팩션(이하 "회사")이 제공하는 제재 대상 검색 서비스(이하 "서비스")의 이용 조건을 정합니다.</p>
                    
                    <h3>2. 서비스 설명</h3>
                    <p>본 서비스는 국제 제재 목록에서 개인과 단체를 검색할 수 있는 도구를 제공합니다. 회사는 제공된 정보의 정확성과 최신성을 유지하기 위해 노력하지만, 모든 정보가 완전하거나 정확하다는 것을 보장하지는 않습니다.</p>
                    
                    <h3>3. 회원 가입 및 계정</h3>
                    <p>서비스 이용을 위해 사용자는 실명, 전화번호, 이메일 주소 등의 정보를 제공하여 회원 가입을 완료해야 합니다. 사용자는 자신의 계정 정보를 안전하게 보관할 책임이 있습니다.</p>
                    
                    <h3>4. 서비스 이용 제한</h3>
                    <p>회사는 다음과 같은 경우 사용자의 서비스 이용을 제한할 수 있습니다:</p>
                    <ul>
                        <li>타인의 개인정보를 도용하거나 부정한 방법으로 가입한 경우</li>
                        <li>서비스를 이용하여 법령 또는 이용약관을 위반하는 행위를 하는 경우</li>
                        <li>다른 사용자나 회사의 권리를 침해하는 경우</li>
                    </ul>
                    
                    <h3>5. 책임 제한</h3>
                    <p>회사는 서비스에서 제공하는 정보의 사용으로 인한 어떠한 결과에 대해서도 책임을 지지 않습니다. 사용자는 자신의 판단과 책임 하에 서비스를 이용해야 합니다.</p>
                    
                    <h3>6. 이용약관 변경</h3>
                    <p>회사는 필요한 경우 이용약관을 변경할 수 있으며, 변경된 이용약관은 웹사이트에 게시함으로써 효력이 발생합니다.</p>
                    
                    <h3>7. 준거법 및 관할</h3>
                    <p>본 이용약관은 대한민국 법률에 따라 해석되며, 서비스 이용으로 인한 분쟁은 대한민국 법원의 관할에 따릅니다.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(termsSection);
        
        // 뒤로가기 버튼 이벤트 등록
        document.getElementById('terms-back-btn').addEventListener('click', () => {
            termsSection.classList.add('hidden');
            
            // 이전 상태로 복원
            if (currentState.authVisible) showAuthSection();
            else if (currentState.mainVisible) showMainSection();
            else if (currentState.detailVisible) {
                authSection.classList.add('hidden');
                mainSection.classList.add('hidden');
                detailSection.classList.remove('hidden');
                detailSection.classList.add('active');
            }
        });
    }
    
    termsSection.classList.remove('hidden');
}

function showPrivacyPage() {
    // 현재 페이지 상태 저장
    const currentState = {
        authVisible: !authSection.classList.contains('hidden'),
        mainVisible: !mainSection.classList.contains('hidden'),
        detailVisible: !detailSection.classList.contains('hidden')
    };
    
    // 모든 섹션 숨기기
    authSection.classList.add('hidden');
    mainSection.classList.add('hidden');
    detailSection.classList.add('hidden');
    
    // 이미 존재하는 약관 페이지 숨기기
    const existingSections = document.querySelectorAll('.terms-section, .privacy-section, .help-section');
    existingSections.forEach(section => section.classList.add('hidden'));
    
    // 개인정보처리방침 페이지 생성 및 표시
    let privacySection = document.getElementById('privacy-section');
    if (!privacySection) {
        privacySection = document.createElement('section');
        privacySection.id = 'privacy-section';
        privacySection.className = 'privacy-section';
        
        privacySection.innerHTML = `
            <header class="header">
                <div class="header-logo">
                    <img src="images/logo-white.png" alt="로고">
                    <h1>세계 경제 제재 대상 검색</h1>
                </div>
                <button id="privacy-back-btn" class="back-button">
                    <i class="fas fa-arrow-left"></i> 돌아가기
                </button>
            </header>
            <div class="container py-4">
                <h2 class="privacy-title">개인정보처리방침</h2>
                <div class="privacy-content">
                    <h3>1. 개인정보 수집 항목 및 목적</h3>
                    <p>주식회사 팩션(이하 "회사")은 다음과 같은 개인정보를 수집하고 있습니다:</p>
                    <ul>
                        <li>필수 항목: 이름, 전화번호, 이메일 주소, 비밀번호</li>
                        <li>수집 목적: 회원 식별, 서비스 제공, 고객 서비스, 공지사항 전달</li>
                    </ul>
                    
                    <h3>2. 개인정보의 보유 및 이용 기간</h3>
                    <p>회사는 회원 탈퇴 시 또는 개인정보 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관련 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</p>
                    
                    <h3>3. 개인정보의 제3자 제공</h3>
                    <p>회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:</p>
                    <ul>
                        <li>이용자가 사전에 동의한 경우</li>
                        <li>법령에 의해 요구되는 경우</li>
                    </ul>
                    
                    <h3>4. 개인정보의 안전성 확보 조치</h3>
                    <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                    <ul>
                        <li>개인정보 암호화 전송 및 저장</li>
                        <li>접근 권한 제한 및 관리</li>
                        <li>보안 프로그램 설치 및 갱신</li>
                    </ul>
                    
                    <h3>5. 이용자의 권리와 행사 방법</h3>
                    <p>이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다. 개인정보 관련 문의는 고객센터 이메일(info@faction.co.kr)로 문의하시기 바랍니다.</p>
                    
                    <h3>6. 개인정보 보호책임자</h3>
                    <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제를 위하여 다음과 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                    <p>- 개인정보 보호책임자: 홍길동 (개인정보보호팀)</p>
                    <p>- 연락처: 02-XXX-XXXX, privacy@faction.co.kr</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(privacySection);
        
        // 뒤로가기 버튼 이벤트 등록
        document.getElementById('privacy-back-btn').addEventListener('click', () => {
            privacySection.classList.add('hidden');
            
            // 이전 상태로 복원
            if (currentState.authVisible) showAuthSection();
            else if (currentState.mainVisible) showMainSection();
            else if (currentState.detailVisible) {
                authSection.classList.add('hidden');
                mainSection.classList.add('hidden');
                detailSection.classList.remove('hidden');
                detailSection.classList.add('active');
            }
        });
    }
    
    privacySection.classList.remove('hidden');
}

function showHelpPage() {
    // 현재 페이지 상태 저장
    const currentState = {
        authVisible: !authSection.classList.contains('hidden'),
        mainVisible: !mainSection.classList.contains('hidden'),
        detailVisible: !detailSection.classList.contains('hidden')
    };
    
    // 모든 섹션 숨기기
    authSection.classList.add('hidden');
    mainSection.classList.add('hidden');
    detailSection.classList.add('hidden');
    
    // 이미 존재하는 약관 페이지 숨기기
    const existingSections = document.querySelectorAll('.terms-section, .privacy-section, .help-section');
    existingSections.forEach(section => section.classList.add('hidden'));
    
    // 도움말 페이지 생성 및 표시
    let helpSection = document.getElementById('help-section');
    if (!helpSection) {
        helpSection = document.createElement('section');
        helpSection.id = 'help-section';
        helpSection.className = 'help-section';
        
        helpSection.innerHTML = `
            <header class="header">
                <div class="header-logo">
                    <img src="images/logo-white.png" alt="로고">
                    <h1>세계 경제 제재 대상 검색</h1>
                </div>
                <button id="help-back-btn" class="back-button">
                    <i class="fas fa-arrow-left"></i> 돌아가기
                </button>
            </header>
            <div class="container py-4">
                <h2 class="help-title">도움말</h2>
                <div class="help-content">
                    <h3>1. 세계 경제 제재 대상 검색 서비스란?</h3>
                    <p>본 서비스는 UN, EU, 미국 OFAC 등 국제기구 및 각국 정부의 제재 목록에서 개인과 단체를 검색할 수 있는 서비스입니다. 국제 거래나 비즈니스 파트너 실사 과정에서 제재 대상 여부를 확인하는 데 도움을 줍니다.</p>
                    
                    <h3>2. 검색 방법</h3>
                    <p>다음 기준으로 제재 대상을 검색할 수 있습니다:</p>
                    <ul>
                        <li>이름 또는 키워드: 개인명, 회사명, 단체명 등 검색어를 입력합니다.</li>
                        <li>ID 또는 참조번호: 특정 제재 대상의 고유 식별자를 입력합니다.</li>
                        <li>유형: 개인, 단체, 선박, 항공기 등 대상의 유형을 선택합니다. 복수 선택이 가능합니다.</li>
                        <li>국가: 제재 대상의 국적이나 활동 국가를 선택합니다.</li>
                        <li>제재 프로그램: 특정 제재 프로그램(예: 북한 제재, 이란 제재 등)을 선택합니다.</li>
                        <li>제재 목록: 특정 기관의 제재 목록(예: UN, OFAC, EU 등)을 선택합니다.</li>
                    </ul>
                    
                    <h3>3. 검색 결과 해석</h3>
                    <p>검색 결과는 다음 순서로 정렬됩니다:</p>
                    <ul>
                        <li>이름을 검색했을 경우: 이름 일치도 순으로 정렬</li>
                        <li>필터만 사용한 경우: 최신 제재 시작일 순으로 정렬</li>
                    </ul>
                    <p>각 결과에는 다음 정보가 포함됩니다:</p>
                    <ul>
                        <li>이름: 제재 대상의 이름</li>
                        <li>유형: 개인, 단체, 선박 등 대상의 유형</li>
                        <li>국가: 제재 대상의 국적 또는 관련 국가</li>
                        <li>제재 프로그램: 해당 대상에 적용된 제재 프로그램</li>
                        <li>목록 출처: 제재를 지정한 기관 또는 정부</li>
                        <li>제재 시작일: 제재가 시작된 날짜</li>
                        <li>별칭: 제재 대상의 다른 이름이나 별칭</li>
                    </ul>
                    
                    <h3>4. 상세 정보 확인</h3>
                    <p>검색 결과 목록에서 항목을 클릭하면 더 자세한 정보를 확인할 수 있습니다. 상세 정보에는 제재 사유, 별명(aliases), 관련 기관, 주소 등이 포함될 수 있습니다.</p>
                    
                    <h3>5. 고객 지원</h3>
                    <p>서비스 이용에 관한 문의나 기술적인 문제는 다음 연락처로 문의해 주세요:</p>
                    <p>- 이메일: support@faction.co.kr</p>
                    <p>- 전화: 02-XXX-XXXX (평일 09:00-18:00)</p>
                    <p>- 주소: 경기도 고양시 덕양구 향기로 182, 현대테라타워향동 T1008호</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpSection);
        
        // 뒤로가기 버튼 이벤트 등록
        document.getElementById('help-back-btn').addEventListener('click', () => {
            helpSection.classList.add('hidden');
            
            // 이전 상태로 복원
            if (currentState.authVisible) showAuthSection();
            else if (currentState.mainVisible) showMainSection();
            else if (currentState.detailVisible) {
                authSection.classList.add('hidden');
                mainSection.classList.add('hidden');
                detailSection.classList.remove('hidden');
                detailSection.classList.add('active');
            }
        });
    }
    
    helpSection.classList.remove('hidden');
} 