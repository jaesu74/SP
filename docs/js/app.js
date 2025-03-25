// API 기본 URL
const API_URL = 'http://localhost:3001/api';

// 전역 상태
let searchHistory = [];
let currentUser = null;

// DOM 요소
let authSection, loginContainer, registerContainer, loginForm, registerForm;
let logoutBtn, showLoginLink, showRegisterLink, verifyIdentityBtn, identityStatus;
let registerTermsLink, registerPrivacyLink;
let mainSection, welcomeMessage, searchForm, searchInput, searchButton;
let filterOptions, toggleAdvancedBtn, advancedSearch;
let resultsContainer, resultsList, resultsCount, loadingContainer, noResults;
let detailSection, detailTitle, detailClose, detailContentBody;
let historySection, historyList, backToSearchBtn, clearHistoryBtn, historyLogoutBtn;
let termsLink, privacyLink, helpLink;
let y2kElements;

// 세션 체크 및 초기 라우팅
function checkSession() {
    console.log('세션 체크 시작');
    
    try {
        // 로컬 스토리지에서 사용자 정보 확인
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = localStorage.getItem('token');
        
        console.log('저장된 사용자 정보:', userInfo);
        console.log('저장된 토큰:', token);
        
        if (userInfo && token) {
            // 유효한 사용자 정보가 있으면 메인 화면으로
            currentUser = userInfo;
            console.log('사용자 정보 찾음:', currentUser);
            
            // 메인 화면으로 이동
            updateUserInfo(currentUser);
            showMainSection();
        } else {
            // 사용자 정보가 없으면 로그인 화면으로
            console.log('저장된 사용자 정보 없음, 로그인 화면 표시');
            showAuthSection();
        }
    } catch (error) {
        console.error('세션 체크 오류:', error);
        showAuthSection();
    }
}

// 사용자 정보 업데이트
function updateUserInfo(userInfo) {
    if (!userInfo) return;
    
    // 메인 화면의 사용자 이름 표시
    if (welcomeMessage) {
        welcomeMessage.textContent = userInfo.name || '사용자';
    }
    
    // 히스토리 화면의 사용자 이름 표시
    const historyWelcomeMessage = document.getElementById('history-welcome-message');
    if (historyWelcomeMessage) {
        historyWelcomeMessage.textContent = userInfo.name || '사용자';
    }
    
    // 로그아웃 버튼 활성화
    if (logoutBtn) {
        logoutBtn.classList.remove('hidden');
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    // 히스토리 섹션의 로그아웃 버튼 처리
    if (historyLogoutBtn) {
        historyLogoutBtn.addEventListener('click', logoutUser);
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
    console.log('로그인 시도:', userData);
    
    // 로그인 버튼 비활성화 및 로딩 표시
    const loginButton = document.querySelector('#login-form button[type="submit"]');
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = '로그인 중...';
    }
    
    // 테스트 계정 확인
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
        currentUser = userInfo;
        updateUserInfo(userInfo);
        showMainSection();
        
        // 로그인 알림 표시
        showAlert('환영합니다, ' + userInfo.name + '님!', 'success', mainSection);
    } else {
        console.log('로그인 실패');
        
        // 로그인 버튼 원래 상태로 복원
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = '로그인';
        }
        
        // 로그인 실패 알림
        const loginContainer = document.querySelector('#login-container');
        showAlert('로그인 실패: 이메일 또는 비밀번호가 일치하지 않습니다.<br>테스트 계정: jaesu@kakao.com / 1234', 'error', loginContainer);
        return;
    }
    
    // 로그인 버튼 원래 상태로 복원
    if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = '로그인';
    }
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
function logoutUser() {
    // 로컬 스토리지에서 사용자 정보와 토큰 삭제
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    
    // 사용자 정보 초기화
    currentUser = null;
    
    // 인증 화면으로 이동
    showAuthSection();
    
    // 로그인 폼 초기화
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    
    if (loginEmail && loginPassword) {
        loginEmail.value = '';
        loginPassword.value = '';
    }
    
    // 로그아웃 알림
    showAlert('로그아웃되었습니다.', 'info', document.querySelector('#login-container'));
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

// 상세 보기 표시
function showDetailView(data) {
    if (!detailSection || !data) return;
    
    // 상세 정보 표시
    if (detailTitle) {
        detailTitle.textContent = data.name || '제재 대상 정보';
    }
    
    // 메타데이터 업데이트
    const metadata = {
        type: data.type || '-',
        country: data.country || '-',
        date: data.date_listed || '-',
        source: data.source || '-',
        id: data.id || '-'
    };
    
    // 메타데이터 요소 업데이트
    Object.entries(metadata).forEach(([key, value]) => {
        const element = document.getElementById(`detail-${key}`);
        if (element) {
            element.textContent = value;
        }
    });
    
    // 상세 내용 구성
    let content = `
        <div class="detail-actions">
            <button class="print-btn" onclick="printDetail()">
                <i class="fas fa-print"></i> 인쇄
            </button>
            <button class="report-btn" onclick="generateReport()">
                <i class="fas fa-file-pdf"></i> PDF 리포트
            </button>
            <button class="share-btn" onclick="shareDetail()">
                <i class="fas fa-share-alt"></i> 공유
            </button>
        </div>
    `;
    
    // 별칭 정보
    if (data.aliases && data.aliases.length > 0) {
        content += `
            <div class="detail-section">
                <h3 class="detail-section-title">별칭 정보</h3>
                <div class="detail-aliases">
                    ${data.aliases.map(alias => `
                        <div class="alias-item">
                            <span class="alias-value">${alias}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // 주소 정보
    if (data.addresses && data.addresses.length > 0) {
        content += `
            <div class="detail-section">
                <h3 class="detail-section-title">주소 정보</h3>
                <div class="detail-addresses">
                    ${data.addresses.map(addr => `
                        <div class="address-item">
                            <span class="address-country">${addr.country || '미지정'}</span>
                            <span class="address-value">${addr.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // 제재 사유
    if (data.reason) {
        content += `
            <div class="detail-section">
                <h3 class="detail-section-title">제재 사유</h3>
                <div class="detail-reason">
                    ${data.reason}
                </div>
            </div>
        `;
    }
    
    // 관련 제재 정보
    if (data.relatedSanctions && data.relatedSanctions.length > 0) {
        content += `
            <div class="detail-section">
                <h3 class="detail-section-title">관련 제재 정보</h3>
                <div class="related-sanctions">
                    ${data.relatedSanctions.map(sanction => `
                        <div class="related-item">
                            <div class="related-title">${sanction.title}</div>
                            <div class="related-date">${sanction.date}</div>
                            <div class="related-description">${sanction.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // 상세 내용 업데이트
    if (detailContentBody) {
        detailContentBody.innerHTML = content;
    }
    
    // 상세 보기 섹션 표시
    detailSection.classList.add('active');
    
    // 스크롤 초기화
    detailSection.scrollTop = 0;
}

// 상세 정보 인쇄
function printDetail() {
    const printWindow = window.open('', '_blank');
    const detailContent = document.querySelector('.detail-content').cloneNode(true);
    
    // 인쇄용 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        body { font-family: Arial, sans-serif; }
        .detail-section { margin-bottom: 20px; }
        .detail-section-title { font-weight: bold; margin-bottom: 10px; }
    `;
    
    printWindow.document.head.appendChild(style);
    printWindow.document.body.appendChild(detailContent);
    
    // 인쇄 버튼 제거
    const printBtn = printWindow.document.querySelector('.print-btn');
    if (printBtn) printBtn.remove();
    
    // 인쇄 다이얼로그 표시
    printWindow.print();
}

// PDF 리포트 생성
function generateReport() {
    const detailContent = document.querySelector('.detail-content').cloneNode(true);
    
    // PDF 생성에 필요한 데이터 준비
    const reportData = {
        title: detailTitle.textContent,
        metadata: {
            type: document.getElementById('detail-type').textContent,
            country: document.getElementById('detail-country').textContent,
            date: document.getElementById('detail-date').textContent,
            source: document.getElementById('detail-source').textContent,
            id: document.getElementById('detail-id').textContent
        },
        content: detailContent.innerHTML
    };
    
    // PDF 생성 요청
    fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
    })
    .then(response => response.blob())
    .then(blob => {
        // PDF 다운로드
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `제재대상_${reportData.metadata.id}_리포트.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        showAlert('리포트가 생성되었습니다.', 'success', mainSection);
    })
    .catch(error => {
        console.error('PDF 생성 오류:', error);
        showAlert('리포트 생성 중 오류가 발생했습니다.', 'error', mainSection);
    });
}

// 상세 정보 공유
function shareDetail() {
    const shareData = {
        title: detailTitle.textContent,
        text: `제재 대상 정보: ${detailTitle.textContent}`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('공유 성공'))
            .catch(error => console.log('공유 실패:', error));
    } else {
        // 대체 공유 방법
        const shareText = `${shareData.title}\n${shareData.url}`;
        navigator.clipboard.writeText(shareText)
            .then(() => showAlert('클립보드에 복사되었습니다.', 'success', mainSection))
            .catch(err => console.log('클립보드 복사 실패:', err));
    }
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
            <div class="advanced-group">
                <label for="search-country">국가</label>
                <select id="search-country" class="advanced-select">
                    <option value="all">모든 국가</option>
                    <option value="North Korea">북한</option>
                    <option value="Russia">러시아</option>
                    <option value="Iran">이란</option>
                    <option value="Syria">시리아</option>
                    <option value="Belarus">벨라루스</option>
                    <option value="China">중국</option>
                </select>
            </div>
            <div class="advanced-group">
                <label for="search-program">제재 프로그램</label>
                <select id="search-program" class="advanced-select">
                    <option value="all">모든 프로그램</option>
                    <option value="DPRK">북한 제재</option>
                    <option value="RUSSIA">러시아 제재</option>
                    <option value="IRAN">이란 제재</option>
                    <option value="SYRIA">시리아 제재</option>
                    <option value="BELARUS">벨라루스 제재</option>
                    <option value="TERRORISM">테러리즘 제재</option>
                </select>
            </div>
        </div>
        
        <div class="advanced-row">
            <div class="advanced-group">
                <label for="search-list">제재 목록</label>
                <select id="search-list" class="advanced-select">
                    <option value="all">모든 목록</option>
                    <option value="UN">UN</option>
                    <option value="OFAC">OFAC</option>
                    <option value="EU">EU</option>
                    <option value="UK">UK</option>
                    <option value="JP">일본</option>
                </select>
            </div>
            <div class="advanced-group">
                <label for="match-score">유사도 설정</label>
                <div class="slider-container">
                    <input type="range" id="match-score" class="advanced-slider" min="0" max="100" value="75">
                    <div class="slider-progress"></div>
                    <span id="match-score-value">75%</span>
                </div>
            </div>
        </div>
        
        <div class="advanced-row">
            <div class="advanced-group full-width">
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
    `;
    
    // 슬라이더 이벤트 리스너 추가
    const matchScoreSlider = document.getElementById('match-score');
    if (matchScoreSlider) {
        matchScoreSlider.addEventListener('input', updateSliderProgress);
    }
    
    // 체크박스 이벤트 리스너 추가
    const checkboxes = document.querySelectorAll('.advanced-options input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (searchForm) performSearch();
        });
    });
    
    // 셀렉트 박스 이벤트 리스너 추가
    const selects = document.querySelectorAll('.advanced-select');
    selects.forEach(select => {
        select.addEventListener('change', () => {
            if (searchForm) performSearch();
        });
    });
}

// Y2K 배경 요소 초기화
function initY2KElements() {
    const elements = document.querySelectorAll('.y2k-element');
    elements.forEach((element, index) => {
        // 각 요소에 랜덤한 위치와 크기 설정
        element.style.left = `${Math.random() * 100}%`;
        element.style.top = `${Math.random() * 100}%`;
        element.style.width = `${Math.random() * 200 + 100}px`;
        element.style.height = `${Math.random() * 200 + 100}px`;
        element.style.animationDelay = `${index * 0.5}s`;
    });
}

// DOM이 로드되면 초기화
document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 초기화
    initializeDOMElements();
    
    // Y2K 배경 요소 초기화
    initY2KElements();
    
    // 세션 체크
    checkSession();
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    console.log('앱 초기화 완료');
});

// DOM 요소 초기화
function initializeDOMElements() {
    // 인증 관련
    authSection = document.getElementById('auth-section');
    loginContainer = document.getElementById('login-container');
    registerContainer = document.getElementById('register-container');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    logoutBtn = document.querySelector('.logout-button');
    showLoginLink = document.getElementById('show-login');
    showRegisterLink = document.getElementById('show-register');
    verifyIdentityBtn = document.getElementById('verify-identity');
    identityStatus = document.getElementById('identity-status');
    registerTermsLink = document.getElementById('register-terms-link');
    registerPrivacyLink = document.getElementById('register-privacy-link');

    // 메인 검색 관련
    mainSection = document.getElementById('main-section');
    welcomeMessage = document.querySelector('.user-name');
    searchForm = document.getElementById('search-form');
    searchInput = document.getElementById('search-name');
    searchButton = document.querySelector('.search-button');
    filterOptions = document.querySelectorAll('.filter-option');
    toggleAdvancedBtn = document.querySelector('.toggle-advanced');
    advancedSearch = document.getElementById('advanced-search');

    // 결과 관련
    resultsContainer = document.getElementById('results-container');
    resultsList = document.getElementById('results-list');
    resultsCount = document.getElementById('results-count');
    loadingContainer = document.getElementById('loading-container');
    noResults = document.getElementById('no-results');

    // 상세 보기 관련
    detailSection = document.getElementById('detail-section');
    detailTitle = document.getElementById('detail-title');
    detailClose = document.getElementById('detail-close');
    detailContentBody = document.getElementById('detail-content-body');

    // 검색 히스토리 관련
    historySection = document.getElementById('history-section');
    historyList = document.getElementById('history-list');
    backToSearchBtn = document.getElementById('back-to-search');
    clearHistoryBtn = document.getElementById('clear-history');
    historyLogoutBtn = document.getElementById('history-logout');

    // 페이지 푸터 관련 링크
    termsLink = document.getElementById('terms-link');
    privacyLink = document.getElementById('privacy-link');
    helpLink = document.getElementById('help-link');

    // 배경 요소
    y2kElements = document.querySelectorAll('.y2k-element');
    
    // Y2K 배경 요소 초기화
    initY2KElements();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    console.log('이벤트 리스너 설정');
    
    // 로그인/회원가입 전환 링크
    if (showLoginLink) {
        showLoginLink.addEventListener('click', () => {
            document.querySelector('.auth-container').classList.remove('show-register');
        });
    }
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', () => {
            document.querySelector('.auth-container').classList.add('show-register');
        });
    }
    
    // 비밀번호 토글 버튼
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordField = this.previousElementSibling;
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                this.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordField.type = 'password';
                this.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
    
    // 로그인 폼 제출 이벤트
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('로그인 폼 제출');
            
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            
            if (!emailInput || !passwordInput) {
                console.error('로그인 폼 요소를 찾을 수 없습니다.');
                return;
            }
            
            const userData = {
                email: emailInput.value.trim(),
                password: passwordInput.value
            };
            
            loginUser(userData);
        });
    }
    
    // 로그아웃 버튼
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    // 검색 폼 제출 이벤트
    if (searchForm) {
        searchForm.addEventListener('submit', performSearch);
    }
    
    // 고급 검색 토글 버튼 이벤트
    if (toggleAdvancedBtn) {
        toggleAdvancedBtn.addEventListener('click', toggleAdvancedSearch);
    }
    
    // 상세 보기 닫기 버튼 이벤트
    if (detailClose) {
        detailClose.addEventListener('click', () => {
            detailSection.classList.remove('active');
        });
    }
    
    // 검색 히스토리 관련 이벤트
    if (backToSearchBtn) {
        backToSearchBtn.addEventListener('click', showMainSection);
    }
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }
    
    // 이용약관, 개인정보처리방침, 도움말 링크 이벤트
    if (termsLink) {
        termsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showTermsPage();
        });
    }
    
    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            showPrivacyPage();
        });
    }
    
    if (helpLink) {
        helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            showHelpPage();
        });
    }
    
    // 회원가입 폼의 이용약관, 개인정보처리방침 링크 이벤트
    if (registerTermsLink) {
        registerTermsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showTermsPage();
        });
    }
    
    if (registerPrivacyLink) {
        registerPrivacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            showPrivacyPage();
        });
    }
    
    // 뒤로 가기 버튼 이벤트
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentSection = button.closest('section');
            if (currentSection) {
                currentSection.classList.add('hidden');
                showMainSection();
            }
        });
    });
}

// 이용약관 페이지 표시
function showTermsPage() {
    const termsSection = document.getElementById('terms-section');
    if (!termsSection) return;
    
    // 다른 섹션 숨기기
    document.querySelectorAll('section').forEach(section => {
        if (section !== termsSection) {
            section.classList.add('hidden');
        }
    });
    
    // 이용약관 섹션 표시
    termsSection.classList.remove('hidden');
    
    // 스크롤 초기화
    termsSection.scrollTop = 0;
}

// 개인정보처리방침 페이지 표시
function showPrivacyPage() {
    const privacySection = document.getElementById('privacy-section');
    if (!privacySection) return;
    
    // 다른 섹션 숨기기
    document.querySelectorAll('section').forEach(section => {
        if (section !== privacySection) {
            section.classList.add('hidden');
        }
    });
    
    // 개인정보처리방침 섹션 표시
    privacySection.classList.remove('hidden');
    
    // 스크롤 초기화
    privacySection.scrollTop = 0;
}

// 도움말 페이지 표시
function showHelpPage() {
    const helpSection = document.getElementById('help-section');
    if (!helpSection) return;
    
    // 다른 섹션 숨기기
    document.querySelectorAll('section').forEach(section => {
        if (section !== helpSection) {
            section.classList.add('hidden');
        }
    });
    
    // 도움말 섹션 표시
    helpSection.classList.remove('hidden');
    
    // 스크롤 초기화
    helpSection.scrollTop = 0;
} 