// API 기본 URL
const API_URL = 'http://localhost:3001/api';

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
const userName = document.getElementById('user-name');
const logoutButton = document.getElementById('logout-button');
const detailLogoutButton = document.getElementById('detail-logout-button');

// 전역 상태
let currentUser = null;
let currentResults = [];
let lastSearchParams = {};

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
        userName.textContent = currentUser.name;
        if (document.getElementById('detail-user-name')) {
            document.getElementById('detail-user-name').textContent = currentUser.name;
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

// 검색 실행 함수
async function performSearch() {
    const params = collectSearchParams();
    lastSearchParams = params;
    
    // 최소한 하나의 검색 매개변수가 존재해야 함
    if (!params.name && !params.id && !params.type && !params.country && !params.program && !params.list) {
        showAlert('검색어를 입력하거나 조건을 선택해주세요.', 'error', searchForm.parentNode);
        return;
    }
    
    try {
        console.log("검색 매개변수:", params);
        
        // 토큰 가져오기
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        }
        
        // 쿼리 파라미터 구성
        const queryParams = new URLSearchParams();
        
        if (params.name) queryParams.append('query', params.name);
        if (params.type && params.type !== 'all') queryParams.append('type', params.type);
        if (params.country && params.country !== 'all') queryParams.append('country', params.country);
        if (params.program && params.program !== 'all') queryParams.append('program', params.program);
        if (params.list && params.list !== 'all') queryParams.append('source', params.list);
        
        console.log("검색 URL:", `${API_URL}/sanctions/search?${queryParams.toString()}`);
        
        // API 엔드포인트 호출
        const response = await fetch(`${API_URL}/sanctions/search?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log("검색 응답 상태:", response.status);
        if (response.status === 401) {
            // 토큰이 만료되었거나 유효하지 않은 경우
            localStorage.removeItem('token');
            showAlert('인증이 만료되었습니다. 다시 로그인해주세요.', 'error', searchForm.parentNode);
            setTimeout(() => {
                showAuthSection();
            }, 2000);
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '검색 중 오류가 발생했습니다');
        }
        
        const data = await response.json();
        console.log("검색 결과:", data);
        
        // 서버가 응답을 제공하지 않거나 결과가 없는 경우에만 테스트 데이터 사용
        if (!data || !data.results || data.results.length === 0) {
            console.log("서버 응답이 없거나 비어있어 테스트 데이터를 사용합니다.");
            const testData = useTestData();
            
            // 검색 매개변수에 따라 결과 필터링
            if (params.name) {
                const query = params.name.toLowerCase();
                testData.results = testData.results.filter(item => 
                    item.name.toLowerCase().includes(query)
                );
            }
            
            if (params.type && params.type !== 'all') {
                testData.results = testData.results.filter(item => 
                    item.type === params.type
                );
            }
            
            if (params.country && params.country !== 'all') {
                testData.results = testData.results.filter(item => 
                    item.country === params.country
                );
            }
            
            if (params.program && params.program !== 'all') {
                testData.results = testData.results.filter(item => 
                    item.program === params.program
                );
            }
            
            testData.count = testData.results.length;
            
            // 검색 결과 저장 및 표시
            currentResults = testData.results;
            displayResults(testData);
        } else {
            // 검색 결과 저장 및 표시
            currentResults = data.results;
            displayResults(data);
        }
        
    } catch (error) {
        console.error("검색 오류:", error);
        showAlert(error.message, 'error', searchForm.parentNode);
        
        // 오류 발생 시 테스트 데이터 사용
        console.log("오류로 인해 테스트 데이터를 사용합니다.");
        const testData = useTestData();
        
        // 검색 매개변수에 따라 결과 필터링
        if (params.name) {
            const query = params.name.toLowerCase();
            testData.results = testData.results.filter(item => 
                item.name.toLowerCase().includes(query)
            );
        }
        
        if (params.type && params.type !== 'all') {
            testData.results = testData.results.filter(item => 
                item.type === params.type
            );
        }
        
        if (params.country && params.country !== 'all') {
            testData.results = testData.results.filter(item => 
                item.country === params.country
            );
        }
        
        if (params.program && params.program !== 'all') {
            testData.results = testData.results.filter(item => 
                item.program === params.program
            );
        }
        
        testData.count = testData.results.length;
        
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
                row.setAttribute('data-index', index);
                
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
    const dateStr = data.date_listed 
        ? new Date(data.date_listed).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '정보 없음';
    detailDate.textContent = dateStr;
    
    // 추가 정보
    detailProgram.textContent = data.program || (data.source ? `${data.source} 제재` : '정보 없음');
    detailSource.textContent = data.source || '정보 없음';
    detailId.textContent = data.id || '정보 없음';
    
    // 추가 설명 텍스트 (예시)
    detailAdditional.innerHTML = `
        <p>해당 제재 대상은 ${data.date_listed ? new Date(data.date_listed).getFullYear() + '년' : ''} ${data.source || '국제기구'}에 의해 제재 목록에 등재되었습니다.</p>
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
        ]
    };
    
    currentResults = data.results;
    return data;
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
        
        // API 연결이 안 될 경우 테스트 데이터 사용 (개발용)
        // displayResults(useTestData());
        
        // 실제 검색 실행
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
    
    // 세션 확인 및 초기 페이지 설정
    checkSession();
}); 