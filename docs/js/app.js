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
    
    // 현재 선택된 유형 필터 가져오기
    let type = '';
    const activeFilter = document.querySelector('.filter-option.active');
    if (activeFilter) {
        const filterType = activeFilter.getAttribute('data-filter');
        if (filterType && filterType !== 'all') {
            type = filterType.charAt(0).toUpperCase() + filterType.slice(1);
        }
    }
    
    const country = document.getElementById('search-country') ? document.getElementById('search-country').value : '';
    const program = document.getElementById('search-program') ? document.getElementById('search-program').value : '';
    const list = document.getElementById('search-list') ? document.getElementById('search-list').value : '';
    const score = document.getElementById('match-score') ? document.getElementById('match-score').value : 75;
    
    // 검색 매개변수를 객체로 반환
    return { name, id, type, country, program, list, score };
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

// 더미 검색 결과 가져오기 (실제로는 서버에서 가져올 것)
async function fetchSearchResults(params) {
    console.log('검색 매개변수:', params);
    
    // 로컬 샘플 데이터 (실제 구현 시 서버 API 호출로 대체)
    const sampleData = [
        {
            id: 'SDN-12345',
            name: '김정은',
            type: 'Individual',
            country: 'North Korea',
            reason: '북한 핵 및 미사일 프로그램과 관련된 제재',
            date_listed: '2016-05-15',
            program: 'DPRK',
            source: 'UN'
        },
        {
            id: 'SDN-23456',
            name: '조선무역은행',
            type: 'Entity',
            country: 'North Korea',
            reason: '북한 제재 대상 기관 및 핵 프로그램 자금 조달 연루',
            date_listed: '2017-08-22',
            program: 'DPRK',
            source: 'OFAC'
        },
        {
            id: 'SDN-34567',
            name: '블라디미르 페트로프',
            type: 'Individual',
            country: 'Russia',
            reason: '우크라이나 침공 관련 제재 대상',
            date_listed: '2022-03-10',
            program: 'RUSSIA',
            source: 'EU'
        },
        {
            id: 'SDN-45678',
            name: '이란 혁명수비대',
            type: 'Entity',
            country: 'Iran',
            reason: '테러리즘 지원 및 대량살상무기 확산 활동',
            date_listed: '2019-04-15',
            program: 'IRAN',
            source: 'OFAC'
        },
        {
            id: 'SDN-56789',
            name: '시리아 과학연구센터',
            type: 'Entity',
            country: 'Syria',
            reason: '화학무기 개발 및 제조 연루',
            date_listed: '2018-06-25',
            program: 'SYRIA',
            source: 'UK'
        }
    ];
    
    // 실제 검색 로직 구현 (필터링)
    let results = [...sampleData];
    
    // 이름 검색
    if (params.name) {
        results = results.filter(item => 
            item.name.toLowerCase().includes(params.name.toLowerCase())
        );
    }
    
    // ID 검색
    if (params.id) {
        results = results.filter(item => 
            item.id.toLowerCase().includes(params.id.toLowerCase())
        );
    }
    
    // 유형 필터링
    if (params.type) {
        results = results.filter(item => item.type === params.type);
    }
    
    // 국가 필터링
    if (params.country) {
        results = results.filter(item => item.country === params.country);
    }
    
    // 프로그램 필터링
    if (params.program) {
        results = results.filter(item => item.program === params.program);
    }
    
    // 제재 목록 출처 필터링
    if (params.list) {
        results = results.filter(item => item.source === params.list);
    }
    
    // 검색어가 비어있고 필터가 있는 경우 최신 제재 기준으로 정렬
    if (!params.name && !params.id && (params.country || params.program || params.list)) {
        results.sort((a, b) => new Date(b.date_listed) - new Date(a.date_listed));
    }
    
    // 결과 반환 (예제 데이터 사용)
    return results;
}

// 검색 결과 표시
function displayResults(results, params) {
    if (!resultsList) return;
    
    resultsList.innerHTML = '';
    
    if (results.length === 0) {
        if (resultsContainer) resultsContainer.classList.add('hidden');
        if (noResults) noResults.classList.remove('hidden');
        return;
    }
    
    // 결과 갯수 업데이트
    if (resultsCount) resultsCount.textContent = `(${results.length})`;
    
    // 결과 목록 생성
    results.forEach(item => {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        // 날짜 포맷팅
        const dateStr = item.date_listed 
            ? new Date(item.date_listed).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
            : '정보 없음';
        
        resultCard.innerHTML = `
            <h3 class="result-title">${item.name}</h3>
            <div class="result-info">
                <div><strong>유형:</strong> ${item.type}</div>
                <div><strong>국적:</strong> ${item.country}</div>
                <div><strong>제재 시작일:</strong> ${dateStr}</div>
            </div>
            <p class="result-description">${item.reason || '제재 사유 정보가 없습니다'}</p>
            <a href="#" class="result-link" data-id="${item.id}">
                자세히 보기 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
        `;
        
        // 결과 항목 클릭 이벤트
        resultCard.querySelector('.result-link').addEventListener('click', e => {
            e.preventDefault();
            showDetailView(item);
        });
        
        resultsList.appendChild(resultCard);
    });
    
    if (resultsContainer) resultsContainer.classList.remove('hidden');
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
        detailContentBody.innerHTML = `
            <p>해당 제재 대상은 ${data.date_listed ? new Date(data.date_listed).getFullYear() + '년' : ''} ${data.source || '국제기구'}에 의해 제재 목록에 등재되었습니다.</p>
            <p class="mt-2">제재 사유: ${data.reason || '구체적인 제재 사유 정보가 없습니다.'}</p>
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
function setupEventListeners() {
    // 기존 이벤트 리스너
    if (loginForm) loginForm.addEventListener('submit', login);
    if (registerForm) registerForm.addEventListener('submit', register);
    if (showLoginLink) showLoginLink.addEventListener('click', () => showLoginContainer());
    if (showRegisterLink) showRegisterLink.addEventListener('click', () => showRegisterContainer());
    if (verifyIdentityBtn) verifyIdentityBtn.addEventListener('click', verifyIdentity);
    if (registerTermsLink) registerTermsLink.addEventListener('click', (e) => { e.preventDefault(); showTermsPage(); });
    if (registerPrivacyLink) registerPrivacyLink.addEventListener('click', (e) => { e.preventDefault(); showPrivacyPage(); });
    
    // 검색 관련 이벤트
    if (searchForm) searchForm.addEventListener('submit', performSearch);
    
    // 필터 옵션 클릭 이벤트
    filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 기존 active 클래스 제거
            filterOptions.forEach(opt => opt.classList.remove('active'));
            // 클릭한 옵션에 active 클래스 추가
            option.classList.add('active');
        });
    });
    
    // 고급 검색 토글 버튼
    if (toggleAdvancedBtn) toggleAdvancedBtn.addEventListener('click', toggleAdvancedSearch);
    
    // 일치도 슬라이더 이벤트
    const slider = document.getElementById('match-score');
    if (slider) {
        slider.addEventListener('input', updateSliderProgress);
        // 초기 슬라이더 상태 설정
        updateSliderProgress();
    }
    
    // 상세 정보 관련 이벤트
    if (detailClose) detailClose.addEventListener('click', () => {
        detailSection.classList.remove('active');
    });
    
    // 검색 히스토리 관련 이벤트
    if (backToSearchBtn) backToSearchBtn.addEventListener('click', showMainSection);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearSearchHistory);
    if (historyLogoutBtn) historyLogoutBtn.addEventListener('click', logout);
    
    // 푸터 링크 이벤트
    if (termsLink) termsLink.addEventListener('click', (e) => { e.preventDefault(); showTermsPage(); });
    if (privacyLink) privacyLink.addEventListener('click', (e) => { e.preventDefault(); showPrivacyPage(); });
    if (helpLink) helpLink.addEventListener('click', (e) => { e.preventDefault(); showHelpPage(); });
}

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', () => {
    console.log("문서 로드 완료");
    
    // 로그인/회원가입 전환
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegister();
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLogin();
        });
    }
    
    // 본인 확인 버튼
    if (verifyIdentityBtn) {
        verifyIdentityBtn.addEventListener('click', () => {
            verifyIdentity();
        });
    }
    
    // 약관 링크
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
    
    // 회원가입 폼 제출
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 폼 유효성 검사
            if (!validateRegisterForm()) {
                return;
            }
            
            const userData = {
                name: document.getElementById('register-name').value,
                phone: document.getElementById('register-phone').value,
                email: document.getElementById('register-email').value,
                password: document.getElementById('register-password').value,
                marketing_consent: document.getElementById('marketing-consent').checked
            };
            
            registerUser(userData);
        });
    }
    
    // 로그인 폼 제출
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const credentials = {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            };
            
            loginUser(credentials);
        });
    }
    
    // 로그아웃 버튼
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // 검색 폼 제출
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // API 연결이 안 될 경우 테스트 데이터 사용 (개발용)
            // displayResults(useTestData());
            
            // 실제 검색 실행
            performSearch();
        });
    }
    
    // 일치도 슬라이더
    const matchScoreSlider = document.getElementById('match-score');
    if (matchScoreSlider) {
        matchScoreSlider.addEventListener('input', () => {
            const value = (matchScoreSlider.value - matchScoreSlider.min) / (matchScoreSlider.max - matchScoreSlider.min) * 100;
            const scoreValue = document.getElementById('match-score-value');
            if (scoreValue) {
                scoreValue.textContent = `${value.toFixed(0)}%`;
            }
            
            // 슬라이더 막대 색상 업데이트
            matchScoreSlider.style.background = `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${value}%, #ddd ${value}%, #ddd 100%)`;
        });
    
        // 초기 슬라이더 막대 색상 설정
        const initialValue = (matchScoreSlider.value - matchScoreSlider.min) / (matchScoreSlider.max - matchScoreSlider.min) * 100;
        matchScoreSlider.style.background = `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${initialValue}%, #ddd ${initialValue}%, #ddd 100%)`;
    }
    
    // 상세 페이지에서 결과 목록으로 돌아가기
    const backToResultsBtn = document.getElementById('back-to-results');
    if (backToResultsBtn) {
        backToResultsBtn.addEventListener('click', () => {
            showMainSection();
        });
    }
    
    // 푸터 링크 이벤트 리스너
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
    
    // 세션 확인 및 초기 페이지 설정
    checkSession();
    
    // Y2K 배경 요소 초기화
    initY2KElements();
}); 