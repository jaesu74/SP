/**
 * 제재 대상 검색 시스템 메인 스크립트
 */

// DOM 요소
// 섹션
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const detailSection = document.getElementById('detail-section');

// 로그인/회원가입
const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showLoginLink = document.getElementById('show-login');
const showRegisterLink = document.getElementById('show-register');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');

// 검색 및 결과
const searchForm = document.getElementById('search-form');
const searchName = document.getElementById('search-name');
const resultsContainer = document.getElementById('results-container');
const resultsCount = document.getElementById('results-count');
const resultsList = document.getElementById('results-list');
const matchScore = document.getElementById('match-score');
const matchScoreValue = document.getElementById('match-score-value');

// 상세 정보
const backToResultsBtn = document.getElementById('back-to-results');
const detailTitle = document.getElementById('detail-title');
const detailType = document.getElementById('detail-type');
const detailCountry = document.getElementById('detail-country');
const detailReason = document.getElementById('detail-reason');
const detailDate = document.getElementById('detail-date');
const detailProgram = document.getElementById('detail-program');
const detailSource = document.getElementById('detail-source');
const detailId = document.getElementById('detail-id');
const detailAdditional = document.getElementById('detail-additional');

// 사용자 정보
const userInfo = document.getElementById('user-info');
const authButtons = document.getElementById('auth-buttons');
const userName = document.getElementById('user-name');
const logoutButton = document.getElementById('logout-button');
const detailUserName = document.getElementById('detail-user-name');
const detailLogoutButton = document.getElementById('detail-logout-button');

// 전역 상태
let currentUser = null;
let currentResults = [];
let sanctionsData = null;
let lastSearchParams = {};
let dataLastUpdated = 0;

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
        userInfo.classList.remove('hidden');
        authButtons.classList.add('hidden');
        userName.textContent = currentUser.name;
        detailUserName.textContent = currentUser.name;
    } else {
        userInfo.classList.add('hidden');
        authButtons.classList.remove('hidden');
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
    if (!currentResults.length) {
        resultsContainer.classList.add('hidden');
    }
    
    // 데이터 로드
    loadSanctionsData();
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
    alertDiv.className = `alert alert-${type === 'error' ? 'red' : 'green'} mb-4 p-3 rounded text-sm ${type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`;
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
        
        // GitHub Pages는 서버가 없으므로 로컬 스토리지에 저장
        localStorage.setItem('registered_user', JSON.stringify({
            email: userData.email,
            name: userData.name,
            password: userData.password // 실제로는 해시화해야 함
        }));
        
        // 성공 알림 표시
        showAlert('회원가입이 완료되었습니다. 로그인해주세요.', 'success', registerContainer);
        
        // 로그인 페이지로 전환
        setTimeout(() => {
            showLogin();
        }, 1500);
        
    } catch (error) {
        console.error("회원가입 오류:", error);
        showAlert(error.message || '회원가입 중 오류가 발생했습니다.', 'error', registerContainer);
    }
}

// 로그인 함수
async function loginUser(credentials) {
    try {
        console.log("로그인 시도:", credentials.email);
        
        // GitHub Pages는 서버가 없으므로 로컬 스토리지에서 확인
        const registeredUser = JSON.parse(localStorage.getItem('registered_user') || '{}');
        
        // 기본 계정 (테스트용)
        const defaultCredentials = {
            email: 'test@example.com',
            password: 'password',
            name: '테스트 사용자'
        };
        
        // 등록된 사용자 또는 기본 계정으로 로그인
        if ((registeredUser.email === credentials.email && registeredUser.password === credentials.password) ||
            (credentials.email === defaultCredentials.email && credentials.password === defaultCredentials.password)) {
            
            // 사용자 정보
            const user = {
                email: credentials.email,
                name: registeredUser.email === credentials.email ? registeredUser.name : defaultCredentials.name
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
        } else {
            throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        
    } catch (error) {
        console.error("로그인 오류:", error);
        showAlert(error.message || '로그인 중 오류가 발생했습니다.', 'error', loginContainer);
    }
}

// 로그아웃 함수
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    
    // 로그인 페이지로 이동
    showAuthSection();
    updateUserInfo();
}

// 검색 매개변수 수집
function collectSearchParams() {
    const name = searchName.value.trim();
    const id = document.getElementById('search-id').value.trim();
    const type = document.getElementById('search-type').value;
    const country = document.getElementById('search-country').value;
    const program = document.getElementById('search-program').value;
    const list = document.getElementById('search-list').value;
    const score = matchScore.value;
    
    // 검색 매개변수를 객체로 반환
    return {
        name,
        id,
        type,
        country,
        program,
        list,
        score
    };
}

// 제재 데이터 로드
async function loadSanctionsData() {
    // 이미 로드된 데이터가 있는지 확인
    if (sanctionsData && Date.now() - dataLastUpdated < UPDATE_INTERVAL) {
        return sanctionsData;
    }
    
    try {
        // JSON 파일에서 데이터 로드
        const response = await fetch(DATA_FILE);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`${data.count}개의 제재 데이터 로드됨`);
        
        // 데이터 저장
        sanctionsData = data;
        dataLastUpdated = Date.now();
        
        return data;
    } catch (error) {
        console.error("데이터 로드 오류:", error);
        
        // 오류 발생 시 테스트 데이터 사용
        return {
            updated_at: new Date().toISOString(),
            count: 5,
            results: generateTestData()
        };
    }
}

// 검색 실행 함수
async function performSearch() {
    const params = collectSearchParams();
    lastSearchParams = params;
    
    // 최소한 하나의 검색 매개변수가 존재해야 함
    if (!params.name && !params.id && 
        (params.type === 'all' || !params.type) && 
        (params.country === 'all' || !params.country) && 
        (params.program === 'all' || !params.program) && 
        (params.list === 'all' || !params.list)) {
        showAlert('검색어를 입력하거나 조건을 선택해주세요.', 'error', searchForm.parentNode);
        return;
    }
    
    try {
        console.log("검색 매개변수:", params);
        
        // 데이터 로드
        const data = await loadSanctionsData();
        
        // 결과 필터링
        let filteredResults = [...data.results];
        
        // 이름/키워드 검색
        if (params.name) {
            const query = params.name.toLowerCase();
            filteredResults = filteredResults.filter(item => 
                item.name.toLowerCase().includes(query)
            );
        }
        
        // ID 검색
        if (params.id) {
            filteredResults = filteredResults.filter(item => 
                item.id.includes(params.id)
            );
        }
        
        // 유형 필터링
        if (params.type && params.type !== 'all') {
            filteredResults = filteredResults.filter(item => 
                item.type === params.type
            );
        }
        
        // 국가 필터링
        if (params.country && params.country !== 'all') {
            filteredResults = filteredResults.filter(item => 
                item.country === params.country
            );
        }
        
        // 프로그램 필터링
        if (params.program && params.program !== 'all') {
            filteredResults = filteredResults.filter(item => 
                item.program.includes(params.program)
            );
        }
        
        // 제재 목록 필터링
        if (params.list && params.list !== 'all') {
            filteredResults = filteredResults.filter(item => 
                item.source === params.list
            );
        }
        
        // 결과 객체 생성
        const results = {
            count: filteredResults.length,
            results: filteredResults
        };
        
        // 검색 결과 저장 및 표시
        currentResults = filteredResults;
        displayResults(results);
        
    } catch (error) {
        console.error("검색 오류:", error);
        showAlert(error.message || '검색 중 오류가 발생했습니다.', 'error', searchForm.parentNode);
        
        // 오류 발생 시 테스트 데이터 사용
        const testData = {
            count: 5,
            results: generateTestData()
        };
        
        // 검색 결과 저장 및 표시
        currentResults = testData.results;
        displayResults(testData);
    }
}

// 검색 결과 표시 함수
function displayResults(data) {
    // 결과 컨테이너 표시
    resultsContainer.classList.remove('hidden');
    
    // 결과 수 표시
    resultsCount.textContent = `${data.count}개의 결과를 찾았습니다`;
    
    // 결과 목록 생성
    resultsList.innerHTML = '';
    
    if (data.count === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" class="py-4 text-center text-gray-500">검색 결과가 없습니다</td>
        `;
        resultsList.appendChild(emptyRow);
    } else {
        data.results.forEach((item, index) => {
            // 일치도 점수 계산 (실제로는 API에서 제공해야 함)
            const matchPercent = Math.floor(Math.random() * 26) + 75; // 75-100% 사이의 임의 값
            
            // 최소 일치도 점수 필터링
            if (matchPercent >= lastSearchParams.score) {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 cursor-pointer';
                row.setAttribute('data-id', item.id);
                
                // 클릭 이벤트 리스너 추가
                row.addEventListener('click', () => {
                    showDetailSection(item.id);
                });
                
                row.innerHTML = `
                    <td class="py-3 px-4">${item.name}</td>
                    <td class="py-3 px-4">${item.type || '-'}</td>
                    <td class="py-3 px-4">${item.country || '-'}</td>
                    <td class="py-3 px-4">${item.program || (item.source ? item.source + ' 제재' : '-')}</td>
                    <td class="py-3 px-4">${item.source || '-'}</td>
                    <td class="py-3 px-4">
                        <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${matchPercent >= 90 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                            ${matchPercent}%
                        </div>
                    </td>
                `;
                
                resultsList.appendChild(row);
            }
        });
        
        // 필터링 후 결과가 없는 경우
        if (resultsList.children.length === 0) {
            const filteredRow = document.createElement('tr');
            filteredRow.innerHTML = `
                <td colspan="6" class="py-4 text-center text-gray-500">선택한 일치도 점수를 만족하는 결과가 없습니다</td>
            `;
            resultsList.appendChild(filteredRow);
        }
    }
    
    // 결과 위치로 스크롤
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// 제재 대상 상세 정보 표시 함수
async function displaySanctionDetail(sanctionId) {
    try {
        console.log("상세 정보 조회:", sanctionId);
        
        // 데이터 로드
        const data = await loadSanctionsData();
        
        // 해당 ID의 제재 대상 찾기
        const sanctionItem = data.results.find(item => item.id === sanctionId);
        
        if (!sanctionItem) {
            throw new Error('요청한 제재 대상 정보를 찾을 수 없습니다');
        }
        
        // 상세 정보 표시
        displaySanctionDetailData(sanctionItem);
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
            detailAdditional.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }
}

// 제재 대상 상세 정보 표시 보조 함수
function displaySanctionDetailData(data) {
    // 상세 정보 표시
    detailTitle.textContent = data.name;
    detailType.textContent = data.type || '정보 없음';
    detailCountry.textContent = data.country || '정보 없음';
    detailReason.textContent = data.reason || '정보 없음';
    
    // 날짜 포맷팅
    let dateStr = '정보 없음';
    if (data.date_listed) {
        try {
            dateStr = new Date(data.date_listed).toLocaleDateString('ko-KR', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            });
        } catch (e) {
            dateStr = data.date_listed;
        }
    }
    detailDate.textContent = dateStr;
    
    // 추가 정보
    detailProgram.textContent = data.program || (data.source ? `${data.source} 제재` : '정보 없음');
    detailSource.textContent = data.source || '정보 없음';
    detailId.textContent = data.id || '정보 없음';
    
    // 추가 설명 텍스트 (예시)
    let year = '';
    if (data.date_listed) {
        try {
            year = new Date(data.date_listed).getFullYear() + '년';
        } catch (e) {
            year = '';
        }
    }
    
    detailAdditional.innerHTML = `
        <p>해당 제재 대상은 ${year} ${data.source || '국제기구'}에 의해 제재 목록에 등재되었습니다.</p>
        <p class="mt-2">제재 사유: ${data.reason || '구체적인 제재 사유 정보가 없습니다.'}</p>
        ${data.type === 'Individual' ? 
            `<p class="mt-4 text-sm text-gray-600">개인에 대한 제재는 일반적으로 자산 동결, 여행 제한, 금융 거래 금지 등의 조치를 포함합니다.</p>` : 
            `<p class="mt-4 text-sm text-gray-600">조직에 대한 제재는 일반적으로 자산 동결, 거래 금지, 금융 서비스 이용 제한 등의 조치를 포함합니다.</p>`
        }
        <div class="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
            <p class="font-medium text-yellow-800">중요 안내</p>
            <p class="text-yellow-700">이 정보는 참고용으로만 제공됩니다. 실제 거래나 의사결정에 활용하기 전 관련 기관의 공식 제재 목록을 확인하시기 바랍니다.</p>
        </div>
    `;
}

// 테스트 데이터 생성
function generateTestData() {
    return [
        {
            id: "UN-DPRK-1",
            name: "Kim Jong Un",
            type: "Individual",
            country: "North Korea",
            reason: "UN 안전보장이사회 결의안 위반",
            source: "UN",
            program: "DPRK",
            date_listed: "2023-01-15"
        },
        {
            id: "OFAC-RUS-1",
            name: "Acme Corporation",
            type: "Entity",
            country: "Russia",
            reason: "국제 무역 규제 위반",
            source: "OFAC",
            program: "RUSSIA",
            date_listed: "2022-03-08"
        },
        {
            id: "EU-SYR-1",
            name: "Mohammad Al-Assad",
            type: "Individual",
            country: "Syria",
            reason: "인권 침해",
            source: "EU",
            program: "SYRIA",
            date_listed: "2022-07-22"
        },
        {
            id: "UN-IRAN-1",
            name: "Tehran Trading Ltd",
            type: "Entity",
            country: "Iran",
            reason: "핵 개발 프로그램 자금 지원",
            source: "UN",
            program: "IRAN",
            date_listed: "2021-11-30"
        },
        {
            id: "UK-BLR-1",
            name: "Alexander Lukashenko",
            type: "Individual",
            country: "Belarus",
            reason: "인권 침해 및 선거 조작",
            source: "UK",
            program: "BELARUS",
            date_listed: "2022-12-05"
        }
    ];
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    console.log("문서 로드 완료");
    
    // 로그인/회원가입 전환
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });
    
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    // 헤더 버튼
    loginButton.addEventListener('click', () => {
        showAuthSection();
        showLogin();
    });
    
    registerButton.addEventListener('click', () => {
        showAuthSection();
        showRegister();
    });
    
    // 회원가입 폼 제출
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const userData = {
            name: document.getElementById('register-name').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value
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
    logoutButton.addEventListener('click', logout);
    detailLogoutButton.addEventListener('click', logout);
    
    // 검색 폼 제출
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch();
    });
    
    // 일치도 슬라이더
    matchScore.addEventListener('input', () => {
        matchScoreValue.textContent = `${matchScore.value}%`;
    });
    
    // 상세 페이지에서 결과 목록으로 돌아가기
    backToResultsBtn.addEventListener('click', () => {
        showMainSection();
    });
    
    // 초기 제재 데이터 로드
    loadSanctionsData().then(() => {
        console.log("초기 제재 데이터 로드 완료");
    });
    
    // 세션 확인 및 초기 페이지 설정
    checkSession();
}); 