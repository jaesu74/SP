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
        
        if (!storedEmail) {
            // 아직 회원가입하지 않은 경우
            if (credentials.email === 'test@example.com' && credentials.password === 'password') {
                // 테스트 계정으로 로그인 허용
                const user = {
                    email: credentials.email,
                    name: 'Test User'
                };
                
                // 임시 토큰 생성
                const mockToken = 'mock_token_' + Date.now();
                
                // 로컬 스토리지에 토큰과 사용자 정보 저장
                localStorage.setItem('token', mockToken);
                localStorage.setItem('user', JSON.stringify(user));
                
                // 현재 사용자 업데이트
                currentUser = user;
                
                // 성공 알림 표시
                showAlert('테스트 계정으로 로그인되었습니다.', 'success', loginContainer);
                
                // 메인 페이지로 이동
                setTimeout(() => {
                    showMainSection();
                    updateUserInfo();
                }, 1000);
                
                return;
            }
            throw new Error('가입된 사용자가 없습니다. 회원가입해주세요.');
        }
        
        if (credentials.email !== storedEmail || credentials.password !== storedPassword) {
            throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
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
    // Y2K 배경 요소 초기화
    initY2KElements();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 세션 확인 및 초기 페이지 설정
    checkSession();
});

// 로그인 후 세션 관리
function handlePostLogin(user) {
    currentUser = user;
    
    // 사용자 정보 업데이트
    updateUserInfo();
    
    // 검색 히스토리 로드
    loadSearchHistory();
    
    // 메인 페이지로 이동
    showMainSection();
    
    // 첫 로그인 시 검색 히스토리가 있으면 표시
    if (searchHistory.length > 0) {
        // 최근 검색 결과 다시 수행
        const recentSearch = searchHistory[0];
        
        if (searchInput) searchInput.value = recentSearch.params.name || '';
        
        if (document.getElementById('search-id')) {
            document.getElementById('search-id').value = recentSearch.params.id || '';
        }
        
        if (document.getElementById('search-country')) {
            document.getElementById('search-country').value = recentSearch.params.country || '';
        }
        
        if (document.getElementById('search-program')) {
            document.getElementById('search-program').value = recentSearch.params.program || '';
        }
        
        if (document.getElementById('search-list')) {
            document.getElementById('search-list').value = recentSearch.params.list || '';
        }
        
        performSearch();
    }
}

// 제재 대상 상세 정보 표시 함수
async function displaySanctionDetail(sanctionId) {
    try {
        console.log("상세 정보 조회:", sanctionId);
        
        // 토큰 가져오기
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        }
        
        // 상세 정보 API 호출
        const response = await fetch(`${API_URL}/sanctions/${sanctionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log("상세 정보 응답 상태:", response.status);
        if (response.status === 401) {
            // 토큰이 만료되었거나 유효하지 않은 경우
            localStorage.removeItem('token');
            showAlert('인증이 만료되었습니다. 다시 로그인해주세요.', 'error', detailSection);
            setTimeout(() => {
                showAuthSection();
            }, 2000);
            return;
        }
        
        let data;
        if (!response.ok) {
            // API 호출 실패 시 currentResults에서 해당 ID의 항목 찾기
            console.log("API 호출 실패, 로컬 데이터 사용");
            data = currentResults.find(item => item.id === sanctionId);
            if (!data) {
                throw new Error('요청한 제재 대상 정보를 찾을 수 없습니다');
            }
        } else {
            // API 호출 성공 시 응답 데이터 사용
            data = await response.json();
            console.log("상세 정보 응답:", data);
        }
        
        // 상세 정보 표시
        displaySanctionDetailData(data);
    } catch (error) {
        console.error("상세 정보 오류:", error);
        
        // API 호출 실패 시 currentResults에서 해당 ID의 항목 찾기
        const item = currentResults.find(item => item.id === sanctionId);
        if (item) {
            console.log("오류 발생으로 로컬 데이터 사용");
            displaySanctionDetailData(item);
        } else {
            // 오류 메시지 표시
            detailTitle.textContent = '정보를 불러올 수 없습니다';
            detailContentBody.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }
}

// 제재 대상 상세 정보 표시 보조 함수
function displaySanctionDetailData(data) {
    // 상세 정보 표시
    detailTitle.textContent = data.name;
    detailMetadata.innerHTML = `
        <p>해당 제재 대상은 ${data.date_listed ? new Date(data.date_listed).getFullYear() + '년' : ''} ${data.source || '국제기구'}에 의해 제재 목록에 등재되었습니다.</p>
        <p class="mt-2">제재 사유: ${data.reason || '구체적인 제재 사유 정보가 없습니다.'}</p>
    `;
}

// 임시 테스트 데이터 - 로그인 없이 검색 결과 보기 위함
function useTestData() {
    // 임시 결과 데이터 생성
    const data = {
        count: 5,
        results: [
            {
                id: "UN-DPRK-1",
                name: "Kim Jong Un",
                type: "Individual",
                country: "North Korea",
                reason: "UN 안전보장이사회 결의안 위반",
                source: "UN",
                program: "DPRK",
                date_listed: "2023-01-15",
                details: {
                    sanctions: [
                        {
                            program: "DPRK",
                            startDate: "2023-01-15",
                            reason: "UN 안전보장이사회 결의안 위반"
                        }
                    ]
                }
            },
            {
                id: "OFAC-RUS-1",
                name: "Acme Corporation",
                type: "Entity",
                country: "Russia",
                reason: "국제 무역 규제 위반",
                source: "OFAC",
                program: "RUSSIA",
                date_listed: "2022-03-08",
                details: {
                    sanctions: [
                        {
                            program: "RUSSIA",
                            startDate: "2022-03-08",
                            reason: "국제 무역 규제 위반"
                        }
                    ]
                }
            },
            {
                id: "EU-SYR-1",
                name: "Mohammad Al-Assad",
                type: "Individual",
                country: "Syria",
                reason: "인권 침해",
                source: "EU",
                program: "SYRIA",
                date_listed: "2022-07-22",
                details: {
                    sanctions: [
                        {
                            program: "SYRIA",
                            startDate: "2022-07-22",
                            reason: "인권 침해"
                        }
                    ]
                }
            },
            {
                id: "UN-IRAN-1",
                name: "Tehran Trading Ltd",
                type: "Entity",
                country: "Iran",
                reason: "핵 개발 프로그램 자금 지원",
                source: "UN",
                program: "IRAN",
                date_listed: "2021-11-30",
                details: {
                    sanctions: [
                        {
                            program: "IRAN",
                            startDate: "2021-11-30",
                            reason: "핵 개발 프로그램 자금 지원"
                        }
                    ]
                }
            },
            {
                id: "UK-BLR-1",
                name: "Alexander Lukashenko",
                type: "Individual",
                country: "Belarus",
                reason: "인권 침해 및 선거 조작",
                source: "UK",
                program: "BELARUS",
                date_listed: "2022-12-05",
                details: {
                    sanctions: [
                        {
                            program: "BELARUS",
                            startDate: "2022-12-05",
                            reason: "인권 침해 및 선거 조작"
                        }
                    ]
                }
            }
        ]
    };
    
    currentResults = data.results;
    return data;
}

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
    
    // 이용약관 페이지 생성 및 표시
    let termsSection = document.getElementById('terms-section');
    if (!termsSection) {
        termsSection = document.createElement('section');
        termsSection.id = 'terms-section';
        termsSection.className = 'terms-section';
        
        termsSection.innerHTML = `
            <header class="header">
                <div class="header-logo">
                    <img src="public/images/logo-white.png" alt="로고">
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
            else if (currentState.detailVisible) showDetailSection();
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
    
    // 개인정보처리방침 페이지 생성 및 표시
    let privacySection = document.getElementById('privacy-section');
    if (!privacySection) {
        privacySection = document.createElement('section');
        privacySection.id = 'privacy-section';
        privacySection.className = 'privacy-section';
        
        privacySection.innerHTML = `
            <header class="header">
                <div class="header-logo">
                    <img src="public/images/logo-white.png" alt="로고">
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
            else if (currentState.detailVisible) showDetailSection();
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
    
    // 도움말 페이지 생성 및 표시
    let helpSection = document.getElementById('help-section');
    if (!helpSection) {
        helpSection = document.createElement('section');
        helpSection.id = 'help-section';
        helpSection.className = 'help-section';
        
        helpSection.innerHTML = `
            <header class="header">
                <div class="header-logo">
                    <img src="public/images/logo-white.png" alt="로고">
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
                        <li>유형: 개인, 단체, 선박, 항공기 등 대상의 유형을 선택합니다.</li>
                        <li>국가: 제재 대상의 국적이나 활동 국가를 선택합니다.</li>
                        <li>제재 프로그램: 특정 제재 프로그램(예: 북한 제재, 이란 제재 등)을 선택합니다.</li>
                        <li>제재 목록: 특정 기관의 제재 목록(예: UN, OFAC, EU 등)을 선택합니다.</li>
                    </ul>
                    
                    <h3>3. 검색 결과 해석</h3>
                    <p>검색 결과는 일치도 순으로 정렬되며, 각 결과에는 다음 정보가 포함됩니다:</p>
                    <ul>
                        <li>이름: 제재 대상의 이름</li>
                        <li>유형: 개인, 단체, 선박 등 대상의 유형</li>
                        <li>국가: 제재 대상의 국적 또는 관련 국가</li>
                        <li>제재 프로그램: 해당 대상에 적용된 제재 프로그램</li>
                        <li>목록 출처: 제재를 지정한 기관 또는 정부</li>
                        <li>제재 시작일: 제재가 시작된 날짜</li>
                        <li>일치도: 검색어와 결과의 일치 정도를 백분율로 표시</li>
                    </ul>
                    
                    <h3>4. 상세 정보 확인</h3>
                    <p>검색 결과 목록에서 항목을 클릭하면 더 자세한 정보를 확인할 수 있습니다. 상세 정보에는 제재 사유, 별명(aliases), 관련 기관, 주소 등이 포함될 수 있습니다.</p>
                    
                    <h3>5. 고객 지원</h3>
                    <p>서비스 이용에 관한 문의나 기술적인 문제는 다음 연락처로 문의해 주세요:</p>
                    <p>- 이메일: support@faction.co.kr</p>
                    <p>- 전화: 02-XXX-XXXX (평일 09:00-18:00)</p>
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
            else if (currentState.detailVisible) showDetailSection();
        });
    }
    
    helpSection.classList.remove('hidden');
}

// 본인 확인 함수
function verifyIdentity() {
    // 본인 확인 팝업 창 열기
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    // 실제로는 본인 확인 서비스(아이핀, 휴대폰 인증 등)로 연결해야 함
    // 테스트용으로 임시 팝업 창을 표시하고 확인 버튼 클릭 시 인증 성공 처리
    const popupWindow = window.open('', '본인확인', `width=${width},height=${height},left=${left},top=${top}`);
    
    if (popupWindow) {
        popupWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>본인 확인</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        padding: 20px;
                        text-align: center;
                    }
                    h2 {
                        color: #006d7d;
                    }
                    .form-group {
                        margin-bottom: 15px;
                        text-align: left;
                    }
                    label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: 500;
                    }
                    input, select {
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                    }
                    .btn {
                        padding: 10px 20px;
                        background-color: #0095a8;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 500;
                        margin-top: 20px;
                    }
                    .btn:hover {
                        background-color: #007a8a;
                    }
                </style>
            </head>
            <body>
                <h2>본인 확인</h2>
                <p>입력하신 정보로 본인 확인을 진행합니다.</p>
                
                <form id="verify-form">
                    <div class="form-group">
                        <label for="name">이름</label>
                        <input type="text" id="name" value="${document.getElementById('register-name').value}" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label for="phone">전화번호</label>
                        <input type="text" id="phone" value="${document.getElementById('register-phone').value}" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label for="birth">생년월일</label>
                        <input type="text" id="birth" placeholder="YYYYMMDD" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="gender">성별</label>
                        <select id="gender" required>
                            <option value="">선택하세요</option>
                            <option value="M">남성</option>
                            <option value="F">여성</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="verify-code">인증번호</label>
                        <input type="text" id="verify-code" placeholder="인증번호 입력" required>
                        <button type="button" id="send-code" class="btn" style="margin-top: 5px; width: auto; font-size: 0.8rem;">인증번호 받기</button>
                    </div>
                    
                    <button type="submit" class="btn">확인</button>
                </form>
                
                <script>
                    document.getElementById('send-code').addEventListener('click', function() {
                        alert('인증번호가 발송되었습니다. (테스트용: 123456)');
                    });
                    
                    document.getElementById('verify-form').addEventListener('submit', function(e) {
                        e.preventDefault();
                        
                        const name = document.getElementById('name').value;
                        const phone = document.getElementById('phone').value;
                        const birth = document.getElementById('birth').value;
                        const gender = document.getElementById('gender').value;
                        const code = document.getElementById('verify-code').value;
                        
                        if (!name || !phone || !birth || !gender || !code) {
                            alert('모든 필드를 입력해주세요.');
                            return;
                        }
                        
                        if (code === '123456') {
                            window.opener.identityVerified();
                            window.close();
                        } else {
                            alert('인증번호가 일치하지 않습니다.');
                        }
                    });
                </script>
            </body>
            </html>
        `);
    } else {
        alert('팝업 창을 열 수 없습니다. 브라우저의 팝업 차단 설정을 확인해주세요.');
    }
}

// 본인 확인 완료 콜백 함수
function identityVerified() {
    identityStatus.textContent = '본인 확인 완료';
    identityStatus.classList.add('verified');
    
    // 버튼 비활성화
    verifyIdentityBtn.disabled = true;
    verifyIdentityBtn.classList.add('disabled');
    
    // 로컬 스토리지에 본인 확인 상태 저장 (실제로는 서버에서 관리)
    localStorage.setItem('identity_verified', 'true');
}

// 회원가입 폼 유효성 검사
function validateRegisterForm() {
    const name = document.getElementById('register-name').value;
    const phone = document.getElementById('register-phone').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const termsConsent = document.getElementById('terms-consent').checked;
    const privacyConsent = document.getElementById('privacy-consent').checked;
    
    // 이름 검사
    if (!name) {
        showAlert('이름을 입력해주세요.', 'error', registerContainer);
        return false;
    }
    
    // 전화번호 검사
    const phoneRegex = /^[0-9]{3}-[0-9]{4}-[0-9]{4}$/;
    if (!phone || !phoneRegex.test(phone)) {
        showAlert('유효한 전화번호를 입력해주세요. (예: 010-0000-0000)', 'error', registerContainer);
        return false;
    }
    
    // 이메일 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showAlert('유효한 이메일 주소를 입력해주세요.', 'error', registerContainer);
        return false;
    }
    
    // 비밀번호 검사
    if (!password || password.length < 8) {
        showAlert('비밀번호는 8자 이상이어야 합니다.', 'error', registerContainer);
        return false;
    }
    
    // 비밀번호 강도 검사 (영문/숫자/특수문자 조합)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        showAlert('비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.', 'error', registerContainer);
        return false;
    }
    
    // 비밀번호 확인 검사
    if (password !== passwordConfirm) {
        showAlert('비밀번호가 일치하지 않습니다.', 'error', registerContainer);
        return false;
    }
    
    // 본인 확인 검사
    if (!identityStatus.classList.contains('verified')) {
        showAlert('본인 확인이 필요합니다.', 'error', registerContainer);
        return false;
    }
    
    // 약관 동의 검사
    if (!termsConsent || !privacyConsent) {
        showAlert('필수 약관에 동의해주세요.', 'error', registerContainer);
        return false;
    }
    
    return true;
}

// Y2K 배경 요소 애니메이션
function initY2KElements() {
  if (y2kElements && y2kElements.length > 0) {
    y2kElements.forEach((element, index) => {
      // 랜덤 위치 및 크기 설정
      const size = Math.random() * 200 + 200; // 200-400px 사이의 크기
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      
      // 초기 위치 랜덤화
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const left = Math.random() * (viewportWidth - size);
      const top = Math.random() * (viewportHeight - size);
      
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
      
      // 색상 랜덤화
      const hue1 = Math.floor(Math.random() * 360);
      const hue2 = (hue1 + Math.floor(Math.random() * 60 + 30)) % 360;
      element.style.background = `linear-gradient(45deg, 
        hsla(${hue1}, 100%, 60%, 0.15), 
        hsla(${hue2}, 100%, 70%, 0.15))`;
      
      // 애니메이션 지연 설정
      element.style.animationDelay = `${index * 3}s`;
    });
  }
}

// 이벤트 리스너 설정
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
    
    // 로그인 폼 제출
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const credentials = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        };
        
        loginUser(credentials);
    });
    
    // 로그아웃 버튼
    logoutBtn.addEventListener('click', logout);
    
    // 검색 폼 제출
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // API 연결이 안 될 경우 테스트 데이터 사용 (개발용)
        // displayResults(useTestData());
        
        // 실제 검색 실행
        performSearch();
    });
    
    // 일치도 슬라이더
    document.getElementById('match-score').addEventListener('input', () => {
        const value = (document.getElementById('match-score').value - document.getElementById('match-score').min) / (document.getElementById('match-score').max - document.getElementById('match-score').min) * 100;
        document.getElementById('match-score-value').textContent = `${value.toFixed(0)}%`;
        
        // 슬라이더 막대 색상 업데이트
        document.getElementById('match-score').style.background = `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${value}%, #ddd ${value}%, #ddd 100%)`;
    });
    
    // 초기 슬라이더 막대 색상 설정
    const initialValue = (document.getElementById('match-score').value - document.getElementById('match-score').min) / (document.getElementById('match-score').max - document.getElementById('match-score').min) * 100;
    document.getElementById('match-score').style.background = `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${initialValue}%, #ddd ${initialValue}%, #ddd 100%)`;
    
    // 상세 페이지에서 결과 목록으로 돌아가기
    document.getElementById('back-to-results').addEventListener('click', () => {
        showMainSection();
    });
    
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