// API 기본 URL
const API_URL = 'http://localhost:3001/api';

// DOM 요소
// 인증 관련
const authSection = document.getElementById('auth-section');
const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-button');
const showLoginLink = document.getElementById('show-login');
const showRegisterLink = document.getElementById('show-register');
const verifyIdentityBtn = document.getElementById('verify-identity-btn');
const identityStatus = document.getElementById('identity-status');
const registerTermsLink = document.getElementById('register-terms-link');
const registerPrivacyLink = document.getElementById('register-privacy-link');

// 메인 검색 관련
const mainSection = document.getElementById('main-section');
const welcomeMessage = document.getElementById('welcome-message');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const filterOptions = document.querySelectorAll('.filter-option');
const toggleAdvancedBtn = document.getElementById('toggle-advanced');
const advancedSearch = document.getElementById('advanced-search');

// 결과 관련
const resultsContainer = document.getElementById('results-container');
const resultsList = document.getElementById('results-list');
const resultsCount = document.getElementById('results-count');
const loadingContainer = document.getElementById('loading-container');
const noResults = document.getElementById('no-results');

// 상세 보기 관련
const detailSection = document.getElementById('detail-section');
const detailContent = document.getElementById('detail-content');
const detailTitle = document.getElementById('detail-title');
const detailClose = document.getElementById('detail-close');
const detailMetadata = document.getElementById('detail-metadata');
const detailType = document.getElementById('detail-type');
const detailCountry = document.getElementById('detail-country');
const detailDate = document.getElementById('detail-date');
const detailSource = document.getElementById('detail-source');
const detailId = document.getElementById('detail-id');
const detailContentBody = document.getElementById('detail-content-body');
const detailActions = document.getElementById('detail-actions');

// 검색 히스토리 관련
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const backToSearchBtn = document.getElementById('back-to-search');
const clearHistoryBtn = document.getElementById('clear-history');
const historyLogoutBtn = document.getElementById('history-logout-button');
const historyWelcomeMessage = document.getElementById('history-welcome-message');

// 페이지 푸터 관련 링크
const termsLink = document.getElementById('terms-link');
const privacyLink = document.getElementById('privacy-link');
const helpLink = document.getElementById('help-link');

// 배경 요소
const y2kElements = document.querySelectorAll('.y2k-element');

// 전역 상태
let currentUser = null;
let searchHistory = [];

// 세션 체크 및 초기 라우팅
function checkSession() {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    
    if (token && userJson) {
        try {
            currentUser = JSON.parse(userJson);
            showMainSection();
            updateUserInfo();
        } catch (e) {
            // 유효하지 않은 사용자 정보
            logout();
        }
    } else {
        showAuthSection();
    }
}

// 사용자 정보 업데이트
function updateUserInfo() {
    if (currentUser && currentUser.name) {
        welcomeMessage.textContent = `${currentUser.name}님 환영합니다`;
        if (historyWelcomeMessage) {
            historyWelcomeMessage.textContent = `${currentUser.name}님 환영합니다`;
        }
    }
}

// 섹션 표시 함수
function showAuthSection() {
    authSection.classList.remove('hidden');
    mainSection.classList.add('hidden');
    detailSection.classList.add('hidden');
    
    // 기본적으로 로그인 컨테이너 표시
    loginContainer.classList.remove('hidden');
    registerContainer.classList.add('hidden');
}

function showMainSection() {
    authSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
    detailSection.classList.add('hidden');
    
    // 기본적으로 결과 컨테이너 숨김
    resultsContainer.classList.add('hidden');
}

function showDetailSection(sanctionId) {
    authSection.classList.add('hidden');
    mainSection.classList.add('hidden');
    detailSection.classList.remove('hidden');
    
    // 상세 페이지에서도 사용자 정보 표시
    updateUserInfo();
    
    // 선택한 제재 대상 정보 표시
    displaySanctionDetail(sanctionId);
}

// 로그인/회원가입 전환
function showLogin() {
    loginContainer.classList.remove('hidden');
    registerContainer.classList.add('hidden');
}

function showRegister() {
    loginContainer.classList.add('hidden');
    registerContainer.classList.remove('hidden');
}

// 알림 표시 함수
function showAlert(message, type, container) {
    // 기존 알림 제거
    const existingAlerts = container.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // 새 알림 생성
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mb-4`;
    alertDiv.textContent = message;
    
    // 컨테이너의 첫 번째 요소로 삽입
    container.insertBefore(alertDiv, container.firstChild);
    
    // 3초 후 알림 제거
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// 회원가입 함수
async function registerUser(userData) {
    try {
        console.log("회원가입 시도:", userData);
        
        // 실제 API 연결 코드 (현재 서버 연결 문제로 주석 처리)
        /*
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        console.log("회원가입 응답 상태:", response.status);
        const data = await response.json();
        console.log("회원가입 응답 데이터:", data);
        
        if (!response.ok) {
            throw new Error(data.detail || '회원가입 중 오류가 발생했습니다');
        }
        */
        
        // 이메일 중복 확인 (테스트 계정과 중복 체크)
        const testAccounts = [
            { email: 'test@example.com', password: 'password', name: '테스트 사용자' },
            { email: 'admin@example.com', password: 'admin1234', name: '관리자' },
            { email: 'demo@wvl.co.kr', password: 'demo1234', name: '데모 사용자' },
            { email: 'jaesu@kakao.com', password: '1234', name: '개발자' }
        ];
        
        // 이미 등록된 테스트 계정과 이메일 중복 확인
        const isEmailTaken = testAccounts.some(account => account.email === userData.email);
        
        // 이미 로컬 스토리지에 저장된 계정과 이메일 중복 확인
        const storedEmail = localStorage.getItem('temp_registered_email');
        if (isEmailTaken || (storedEmail && storedEmail === userData.email)) {
            throw new Error('이미 등록된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.');
        }
        
        // 임시 회원가입 처리 (서버 연결 없이 로컬에서 처리)
        // 실제로는 서버 API가 작동하면 이 부분을 제거하고 위의 주석 처리된 코드를 사용해야 함
        localStorage.setItem('temp_registered_email', userData.email);
        localStorage.setItem('temp_registered_password', userData.password);
        localStorage.setItem('temp_registered_name', userData.name);
        localStorage.setItem('temp_registered_phone', userData.phone);
        
        // 성공 알림 표시
        showAlert('회원가입이 완료되었습니다. 로그인해주세요.', 'success', registerContainer);
        
        // 로그인 페이지로 전환
        setTimeout(() => {
            showLogin();
        }, 1500);
        
    } catch (error) {
        console.error("회원가입 오류:", error);
        showAlert(error.message, 'error', registerContainer);
    }
}

// 로그인 함수
async function loginUser(credentials) {
    try {
        console.log("로그인 시도:", credentials.email);
        
        // 실제 API 연결 코드 (현재 서버 연결 문제로 주석 처리)
        /*
        // FormData 형식으로 변환 (OAuth2 형식)
        const formData = new URLSearchParams();
        formData.append('username', credentials.email);
        formData.append('password', credentials.password);
        
        console.log("API URL:", `${API_URL}/users/login`);
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        
        console.log("로그인 응답 상태:", response.status);
        const data = await response.json();
        console.log("로그인 응답 데이터:", data);
        
        if (!response.ok) {
            throw new Error(data.detail || '로그인 중 오류가 발생했습니다');
        }
        */
        
        // 임시 로그인 처리 (서버 연결 없이 로컬에서 처리)
        // 저장된 임시 회원가입 정보와 비교
        const storedEmail = localStorage.getItem('temp_registered_email');
        const storedPassword = localStorage.getItem('temp_registered_password');
        const storedName = localStorage.getItem('temp_registered_name');
        
        // 테스트 계정 정보
        const testAccounts = [
            { email: 'test@example.com', password: 'password', name: '테스트 사용자' },
            { email: 'admin@example.com', password: 'admin1234', name: '관리자' },
            { email: 'demo@wvl.co.kr', password: 'demo1234', name: '데모 사용자' },
            { email: 'jaesu@kakao.com', password: '1234', name: '개발자' }
        ];
        
        // 테스트 계정으로 로그인 시도
        const testAccount = testAccounts.find(
            account => account.email === credentials.email && account.password === credentials.password
        );
        
        if (testAccount) {
            // 테스트 계정으로 로그인 성공
            const user = {
                email: testAccount.email,
                name: testAccount.name
            };
            
            // 임시 토큰 생성
            const mockToken = 'mock_token_' + Date.now();
            
            // 로컬 스토리지에 토큰과 사용자 정보 저장
            localStorage.setItem('token', mockToken);
            localStorage.setItem('user', JSON.stringify(user));
            
            // 현재 사용자 업데이트
            currentUser = user;
            
            // 성공 알림 표시
            showAlert(`${testAccount.name}님 환영합니다.`, 'success', loginContainer);
            
            // 메인 페이지로 이동
            setTimeout(() => {
                showMainSection();
                updateUserInfo();
            }, 1000);
            
            return;
        }
        
        if (!storedEmail) {
            throw new Error('계정이 존재하지 않습니다. 회원가입 후 이용해주세요. (테스트 계정: jaesu@kakao.com / 1234)');
        }
        
        if (credentials.email !== storedEmail || credentials.password !== storedPassword) {
            throw new Error('이메일 또는 비밀번호가 올바르지 않습니다. (테스트 계정: jaesu@kakao.com / 1234)');
        }
        
        // 사용자 정보 생성
        const user = {
            email: credentials.email,
            name: storedName || credentials.email.split('@')[0] // 이름이 없는 경우 이메일에서 추출
        };
        
        // 임시 토큰 생성
        const mockToken = 'mock_token_' + Date.now();
        
        // 로컬 스토리지에 토큰과 사용자 정보 저장
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // 현재 사용자 업데이트
        currentUser = user;
        
        // 성공 알림 표시
        showAlert('로그인 되었습니다.', 'success', loginContainer);
        
        // 메인 페이지로 이동
        setTimeout(() => {
            showMainSection();
            updateUserInfo();
        }, 1000);
        
    } catch (error) {
        console.error("로그인 오류:", error);
        showAlert(error.message, 'error', loginContainer);
    }
}

// 로그아웃 함수
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    
    // 로그인 페이지로 이동
    showAuthSection();
}

// 검색 매개변수 수집
function collectSearchParams() {
    const name = searchInput.value.trim();
    const id = document.getElementById('search-id') ? document.getElementById('search-id').value.trim() : '';
    
    // 현재 선택된 유형 필터 가져오기 (다중 선택 가능하도록 수정)
    let types = [];
    const activeFilters = document.querySelectorAll('.filter-option.active');
    if (activeFilters) {
        activeFilters.forEach(filter => {
            const filterType = filter.getAttribute('data-filter');
            if (filterType && filterType !== 'all') {
                types.push(filterType.charAt(0).toUpperCase() + filterType.slice(1));
            }
        });
    }
    
    const country = document.getElementById('search-country') ? document.getElementById('search-country').value : '';
    const program = document.getElementById('search-program') ? document.getElementById('search-program').value : '';
    const list = document.getElementById('search-list') ? document.getElementById('search-list').value : '';
    const score = document.getElementById('match-score') ? document.getElementById('match-score').value : 75;
    
    // 검색 매개변수를 객체로 반환
    return { name, id, types, country, program, list, score };
}

// 검색 수행
async function performSearch(e) {
    if (e) e.preventDefault();
    
    // 로딩 상태 표시
    if (resultsContainer) resultsContainer.classList.add('hidden');
    if (noResults) noResults.classList.add('hidden');
    if (loadingContainer) loadingContainer.classList.remove('hidden');
    
    // 검색 매개변수 수집
    const params = collectSearchParams();
    
    try {
        // API 호출 (예시)
        // 실제로는 서버에 요청을 보내야 함
        await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시간 시뮬레이션
        
        // 검색 결과 가져오기 (더미 데이터)
        const results = await fetchSearchResults(params);
        
        // 결과 표시
        displayResults(results, params);
        
        // 검색 히스토리에 추가
        addToSearchHistory(params, results.length);
        
    } catch (error) {
        console.error('검색 중 오류가 발생했습니다.', error);
        alert('검색 중 오류가 발생했습니다.');
    } finally {
        if (loadingContainer) loadingContainer.classList.add('hidden');
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
    
    // 결과를 카드로 표시
    results.forEach(item => {
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
    if (!detailSection) return;
    
    // 상세 정보 채우기
    if (detailTitle) detailTitle.textContent = data.name;
    if (detailType) detailType.textContent = data.type || '정보 없음';
    if (detailCountry) detailCountry.textContent = data.country || '정보 없음';
    
    // 날짜 포맷팅
    const dateStr = data.date_listed 
        ? new Date(data.date_listed).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '정보 없음';
        
    if (detailDate) detailDate.textContent = dateStr;
    if (detailSource) detailSource.textContent = data.source || '정보 없음';
    if (detailId) detailId.textContent = data.id || '정보 없음';
    
    // 상세 설명 내용
    if (detailContentBody) {
        // 별칭 정보
        const aliasesHtml = data.aliases && data.aliases.length > 0
            ? `<div class="detail-section">
                <h4>별칭</h4>
                <ul class="alias-list">
                    ${data.aliases.map(alias => `<li>${alias}</li>`).join('')}
                </ul>
               </div>`
            : '';
            
        // 가상의 주소 정보 추가
        const addressesHtml = `
            <div class="detail-section">
                <h4>관련 주소</h4>
                <ul class="address-list">
                    <li>${data.country}의 ${data.type === 'Individual' ? '거주지' : '본사'} 주소</li>
                    ${data.type === 'Entity' ? '<li>해외 지사 주소</li>' : ''}
                </ul>
            </div>
        `;
        
        // 가상의 관련 제재 정보 추가
        const relatedSanctionsHtml = `
            <div class="detail-section">
                <h4>관련 제재 정보</h4>
                <table class="sanctions-table">
                    <thead>
                        <tr>
                            <th>시작일</th>
                            <th>제재 프로그램</th>
                            <th>출처</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${dateStr}</td>
                            <td>${data.program}</td>
                            <td>${data.source}</td>
                        </tr>
                        ${data.date_listed && new Date(data.date_listed).getFullYear() > 2020 ? 
                          `<tr>
                              <td>${new Date(data.date_listed).getFullYear() - 1}년 5월 2일</td>
                              <td>${data.program}</td>
                              <td>국제 감시 기구</td>
                           </tr>` : ''}
                    </tbody>
                </table>
            </div>
        `;
        
        detailContentBody.innerHTML = `
            <div class="detail-main-info">
                <p>이 제재 대상은 ${dateStr}에 ${data.source}에 의해 등재되었습니다.</p>
                <div class="reason-box">
                    <h4>제재 사유</h4>
                    <p>${data.reason || '구체적인 제재 사유 정보가 없습니다.'}</p>
                </div>
            </div>
            
            ${aliasesHtml}
            ${addressesHtml}
            ${relatedSanctionsHtml}
            
            <div class="detail-section">
                <h4>기타 정보</h4>
                <p>이 정보는 정기적으로 업데이트되며, 최근 업데이트는 ${new Date().toLocaleDateString('ko-KR')}입니다.</p>
                <p>제공된 정보는 참고용이며, 법적 조치를 취하기 전에 관련 기관의 공식 문서를 확인하세요.</p>
            </div>
        `;
    }
    
    // 상세 정보 섹션 표시
    detailSection.classList.add('active');
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

// 고급 검색 옵션 토글
function toggleAdvancedSearch() {
    if (!advancedSearch || !toggleAdvancedBtn) return;
    
    advancedSearch.classList.toggle('hidden');
    toggleAdvancedBtn.classList.toggle('active');
    
    // 아이콘 변경
    const icon = toggleAdvancedBtn.querySelector('.toggle-icon');
    if (icon) {
        icon.textContent = advancedSearch.classList.contains('hidden') ? '+' : '×';
    }
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 기본 라우팅 (세션 체크)
    checkSession();
    
    // 로그인 폼 제출 이벤트
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            loginUser({ email, password });
        });
    }
    
    // 회원가입 폼 제출 이벤트
    if (registerForm) {
        registerForm.addEventListener('submit', e => {
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
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });
    
    // 본인 인증 버튼
    if (verifyIdentityBtn) {
        verifyIdentityBtn.addEventListener('click', () => {
            // 실제로는 본인인증 서비스 연동이 필요함
            // 예시로 인증 완료 처리
            if (identityStatus) {
                identityStatus.textContent = '본인 인증이 완료되었습니다';
                identityStatus.classList.add('verified');
                verifyIdentityBtn.disabled = true;
            }
        });
    }
    
    // 로그아웃 버튼
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }
    
    // 역사 페이지의 로그아웃 버튼
    if (historyLogoutBtn) {
        historyLogoutBtn.addEventListener('click', () => {
            logout();
        });
    }
    
    // 검색 폼 제출 이벤트
    if (searchForm) {
        searchForm.addEventListener('submit', performSearch);
    }
    
    // 필터 옵션 클릭 이벤트 - 다중 선택 가능하도록 수정
    if (filterOptions) {
        filterOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 'all' 옵션과 특정 유형 옵션을 함께 선택할 수 없도록 처리
                const isAll = option.getAttribute('data-filter') === 'all';
                const isActive = option.classList.contains('active');
                
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
        detailClose.addEventListener('click', () => {
            if (detailSection) detailSection.classList.remove('active');
        });
    }
    
    // 검색 기록 페이지로 이동
    document.querySelector('.header').addEventListener('click', event => {
        if (event.target.closest('.header-logo')) {
            showMainSection();
        }
    });
    
    // 검색 기록 페이지 관련 버튼
    if (backToSearchBtn) {
        backToSearchBtn.addEventListener('click', () => {
            showMainSection();
        });
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }
    
    // 슬라이더 진행 상태 업데이트
    const matchScoreSlider = document.getElementById('match-score');
    if (matchScoreSlider) {
        const matchScoreValue = document.getElementById('match-score-value');
        const sliderProgress = document.querySelector('.slider-progress');
        
        // 초기값 설정
        if (matchScoreValue) matchScoreValue.textContent = `${matchScoreSlider.value}%`;
        if (sliderProgress) sliderProgress.style.width = `${matchScoreSlider.value}%`;
        
        // 슬라이더 값 변경 이벤트
        matchScoreSlider.addEventListener('input', () => {
            if (matchScoreValue) matchScoreValue.textContent = `${matchScoreSlider.value}%`;
            if (sliderProgress) sliderProgress.style.width = `${matchScoreSlider.value}%`;
        });
        
        // 슬라이더 값 변경 완료 후 검색 수행
        matchScoreSlider.addEventListener('change', () => {
            performSearch();
        });
    }
    
    // 푸터 링크에 이벤트 리스너 추가
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
    
    // 회원가입 양식의 약관 링크에도 이벤트 리스너 추가
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
    
    // 국가, 프로그램, 제재 목록 선택 이벤트 (즉시 검색 수행)
    const advancedSelects = [
        document.getElementById('search-country'),
        document.getElementById('search-program'),
        document.getElementById('search-list')
    ];
    
    advancedSelects.forEach(select => {
        if (select) {
            select.addEventListener('change', () => {
                performSearch();
            });
        }
    });
    
    // 초기화: 검색 기록 로드
    loadSearchHistory();
    
    // Y2K 효과 초기화
    initY2KElements();
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