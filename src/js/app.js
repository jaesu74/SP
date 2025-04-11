/**
 * 세계 경제 제재 검색 서비스
 * 메인 애플리케이션 파일
 */

// 전역 앱 객체 생성
window.app = window.app || {};

// API 함수들을 설정
const apiModule = {
    // 실제 제재 데이터 가져오기
    fetchSanctionsData: async () => {
        try {
            // 실제 API 엔드포인트에서 데이터 가져오기
            const response = await fetch('https://api.wvl.co.kr/sanctions/all');
            if (!response.ok) {
                throw new Error('API 응답 오류: ' + response.status);
            }
            const data = await response.json();
            return data.data || [];
        } catch (e) {
            console.error('제재 데이터 로드 실패:', e);
            // 실패 시 백업 JSON 파일에서 로드
            try {
                const backupResponse = await fetch('data/sanctions_data.json');
                const backupData = await backupResponse.json();
                console.warn('백업 데이터 사용 중');
                return backupData.data || [];
            } catch (backupError) {
                console.error('백업 데이터도 로드 실패:', backupError);
                // 백업 데이터도 실패할 경우 하드코딩된 샘플 데이터 반환
                return getSampleSanctionsData();
            }
        }
    },
    
    // 제재 대상 검색
    searchSanctions: async (query, options = {}) => {
        try {
            const searchType = options.searchType || 'text';
            const numberType = options.numberType || 'all';
            
            // 실제 API 검색
            const apiUrl = new URL('https://api.wvl.co.kr/sanctions/search');
            apiUrl.searchParams.append('q', query);
            apiUrl.searchParams.append('type', searchType);
            
            if (searchType === 'number') {
                apiUrl.searchParams.append('numberType', numberType);
            }
            
            const response = await fetch(apiUrl.toString());
            if (!response.ok) {
                throw new Error('검색 API 응답 오류: ' + response.status);
            }
            
            const data = await response.json();
            return { results: data.data || [] };
        } catch (e) {
            console.error('API 검색 오류:', e);
            
            // API 실패 시 로컬 검색 수행
            console.warn('로컬 검색으로 대체');
            const data = await apiModule.fetchSanctionsData();
            
            if (!query) return { results: data };
            
            let filtered;
            
            if (options.searchType === 'number') {
                // 번호 검색 로직
                filtered = data.filter(item => {
                    // 식별 번호 검색
                    if (!item.identifications) return false;
                    
                    return item.identifications.some(id => {
                        // 번호 유형에 따라 필터링
                        if (options.numberType !== 'all' && 
                            id.type && 
                            !id.type.toLowerCase().includes(options.numberType.toLowerCase())) {
                            return false;
                        }
                        
                        // 번호 검색
                        return id.number && id.number.toLowerCase().includes(query.toLowerCase());
                    });
                });
            } else {
                // 텍스트 검색 로직
                filtered = data.filter(item => 
                    (item.name && item.name.toLowerCase().includes(query.toLowerCase())) ||
                    (item.aliases && item.aliases.some(alias => 
                        alias.toLowerCase().includes(query.toLowerCase())
                    )) ||
                    (item.country && item.country.toLowerCase().includes(query.toLowerCase())) ||
                    (item.type && item.type.toLowerCase().includes(query.toLowerCase()))
                );
            }
            
            return { results: filtered };
        }
    },
    
    // 제재 대상 상세 정보 가져오기
    getSanctionDetails: async (id) => {
        try {
            // 실제 API에서 상세 정보 가져오기
            const response = await fetch(`https://api.wvl.co.kr/sanctions/details/${id}`);
            if (!response.ok) {
                throw new Error('상세 정보 API 응답 오류: ' + response.status);
            }
            
            const data = await response.json();
            return data.data || null;
        } catch (e) {
            console.error('API 상세 정보 조회 오류:', e);
            
            // API 실패 시 로컬 데이터에서 조회
            console.warn('로컬 데이터에서 상세 정보 조회');
            const data = await apiModule.fetchSanctionsData();
            return data.find(item => item.id === id) || null;
        }
    },
    
    // 최근 제재 데이터 가져오기
    getRecentSanctions: async (limit = 10) => {
        try {
            // 실제 API에서 최근 제재 데이터 가져오기
            const response = await fetch(`https://api.wvl.co.kr/sanctions/recent?limit=${limit}`);
            if (!response.ok) {
                throw new Error('최근 제재 API 응답 오류: ' + response.status);
            }
            
            const data = await response.json();
            return data.data || [];
        } catch (e) {
            console.error('최근 제재 데이터 로드 실패:', e);
            
            // API 실패 시 전체 데이터에서 최근 항목 필터링
            const allData = await apiModule.fetchSanctionsData();
            
            // 날짜 기준으로 정렬 (최신순)
            const sorted = [...allData].sort((a, b) => {
                const dateA = a.date_listed ? new Date(a.date_listed) : new Date(0);
                const dateB = b.date_listed ? new Date(b.date_listed) : new Date(0);
                return dateB - dateA;
            });
            
            return sorted.slice(0, limit);
        }
    }
};

// 전역 변수
let currentResults = [];
let activeFilters = {
    countries: new Set(),
    programs: new Set(),
    startDate: null,
    endDate: null
};
let users = [];

try {
    users = JSON.parse(localStorage.getItem('users')) || [];
} catch (e) {
    console.error('로컬 스토리지 데이터 파싱 오류:', e);
    users = [];
}

// 로그인 상태 관리
let currentUser = null;

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * 애플리케이션 초기화
 */
function initializeApp() {
    console.log('세계 경제 제재 검색 서비스 초기화...');
    
    // API 서비스 초기화
    if (window.ApiService && typeof window.ApiService.init === 'function') {
        window.ApiService.init();
    }
    
    // 검색 컴포넌트 초기화
    if (window.SearchComponent && typeof window.SearchComponent.init === 'function') {
        window.SearchComponent.init();
    }
    
    // 맥시멀리즘 UI 스타일 적용
    applyMaximalistStyle();
    
    // 이벤트 리스너 등록 (세션 체크 전에 등록하여 요소들이 준비되도록)
    setupEventListeners();
    
    // 필터 및 검색 옵션 설정
    setupFilterOptions();
    // SearchComponent로 이동된 기능은 제거
    // setupSearchOptions();
    // setupAdvancedSearch();
    // setupAutocomplete();
    
    // 로그인 상태 확인 (이벤트 리스너 등록 후에 실행)
    setTimeout(() => {
        checkSession();
        console.log('세션 체크 완료');
    }, 100);
    
    // 초기 데이터 로드
    loadInitialData();
    
    console.log('세계 경제 제재 검색 서비스 초기화 완료');
}

/**
 * 맥시멀리즘 UI 스타일 적용
 */
function applyMaximalistStyle() {
    // 컨테이너 요소들에 맥시멀리즘 클래스 적용
    document.querySelectorAll('.modern-background, .rounded-modern, .blur-gradient').forEach(element => {
        element.classList.add('maximalist');
        element.classList.remove('modern-background', 'rounded-modern', 'blur-gradient');
    });
    
    // 검색 버튼에 스타일 적용
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.classList.add('maximalist');
    }
    
    // 배경 요소에 텍스처 레이어 적용
    document.body.classList.add('textured-layer');
}

/**
 * 디바운스 함수 - 연속 호출 방지
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// localStorage에서 사용자 정보 가져오기 공통 함수
function getUserFromStorage() {
    return {
        isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName')
    };
}

/**
 * 세션 확인 - 로그인 상태 확인
 */
function checkSession() {
    console.log('세션 확인 중...');
    
    try {
        // 하드코딩된 테스트 사용자 세션 확인 - URL 파라미터로 autologin=true가 있으면 강제 로그인
        const urlParams = new URLSearchParams(window.location.search);
        
        // 디버깅을 위한 로그 추가
        console.log('URL 파라미터:', urlParams.toString());
        console.log('자동 로그인 파라미터 존재 여부:', urlParams.has('autologin'));
        console.log('자동 로그인 값:', urlParams.get('autologin'));
        
        if (urlParams.get('autologin') === 'true') {
            console.log('자동 로그인 파라미터 감지됨');
            // 테스트 계정으로 자동 로그인
            currentUser = {
                email: 'jaesu@kakao.com',
                name: '김재수'
            };
            
            try {
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('isLoggedIn', 'true');
                console.log('세션 및 로컬 스토리지에 저장 완료!');
                console.log('현재 사용자:', JSON.parse(sessionStorage.getItem('currentUser')));
                console.log('로그인 상태:', localStorage.getItem('isLoggedIn'));
            } catch (storageError) {
                console.warn('자동 로그인 - 스토리지 저장 실패:', storageError);
            }
            
            // 메인 섹션 표시
            showMainSection('jaesu@kakao.com');
            console.log('메인 섹션 표시 완료');
            return true;
        }
        
        // 브라우저 스토리지에서 세션 확인
        let isLoggedIn = false;
        let userInfo = null;
        
        try {
            isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const userInfoStr = sessionStorage.getItem('currentUser');
            if (userInfoStr) {
                userInfo = JSON.parse(userInfoStr);
            }
            console.log('스토리지 확인 결과:', { isLoggedIn, userInfo });
        } catch (storageError) {
            console.warn('스토리지 읽기 실패:', storageError);
        }
        
        console.log('로그인 상태:', isLoggedIn, '사용자 정보:', userInfo);
        
        if (isLoggedIn && userInfo) {
            // 이미 로그인된 상태
            currentUser = userInfo;
            
            // 메인 섹션 표시
            showMainSection(userInfo.email);
            console.log('세션 기반 로그인 성공 - 메인 섹션 표시됨');
            return true;
        }
        
        // 로그인 섹션 표시 (로그인 안된 상태)
        const loginSection = document.getElementById('login-section');
        const mainSection = document.getElementById('main-section');
        
        console.log('로그인 섹션:', loginSection);
        console.log('메인 섹션:', mainSection);
        
        if (loginSection) {
            loginSection.style.display = 'block';
            adjustFooterForLoginSection();
            console.log('로그인 섹션 표시됨');
        }
        
        if (mainSection) {
            mainSection.style.display = 'none';
            console.log('메인 섹션 숨김');
        }
        
        return false;
    } catch (error) {
        console.error('세션 확인 중 오류 발생:', error);
        
        // 오류 발생 시 로그인 페이지로 리디렉션
        const loginSection = document.getElementById('login-section');
        const mainSection = document.getElementById('main-section');
        
        if (loginSection) loginSection.style.display = 'block';
        if (mainSection) mainSection.style.display = 'none';
        
        adjustFooterForLoginSection();
        return false;
    }
}

/**
 * 메인 섹션 표시
 * @param {string} email 사용자 이메일
 */
function showMainSection(email) {
    console.log('메인 섹션 표시 호출됨', email);
    
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    
    console.log('로그인 섹션:', loginSection);
    console.log('메인 섹션:', mainSection);
    
    if (loginSection) {
        loginSection.style.display = 'none';
        console.log('로그인 섹션 숨김 처리됨');
    }
    
    if (mainSection) {
        mainSection.style.display = 'block';
        console.log('메인 섹션 표시 처리됨');
    } else {
        console.error('메인 섹션 요소를 찾을 수 없음');
    }
    
    // 사용자 정보 설정
    let userName = '';
    
    // 1. 전달된 이메일이 있는 경우 사용
    if (email) {
        userName = email.split('@')[0];
    } 
    // 2. currentUser가 있는 경우 사용
    else if (currentUser && currentUser.name) {
        userName = currentUser.name;
    } 
    // 3. localStorage에서 가져오기
    else {
        const { name } = getUserFromStorage();
        userName = name || '사용자';
    }
    
    // 사용자 이름 표시
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = userName;
        console.log('사용자 이름 설정됨:', userName);
    } else {
        console.error('사용자 이름 요소를 찾을 수 없음');
    }
    
    // localStorage에도 로그인 상태 저장
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email || (currentUser && currentUser.email) || '');
    localStorage.setItem('userName', userName);
    
    // 푸터 스타일 조정
    adjustFooterForMainSection();
    
    console.log('메인 섹션 표시 완료');
}

/**
 * 로그인 섹션 표시
 */
function showLoginSection() {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    
    if (mainSection) mainSection.style.display = 'none';
    if (loginSection) loginSection.style.display = 'block';
    
    // 푸터 스타일 조정
    adjustFooterForLoginSection();
    
    // 폼 초기화
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.reset();
    }
}

/**
 * 필터 옵션 설정 (다중 선택 UI로 변경)
 */
function setupFilterOptions() {
    // 국가 필터 설정
    setupCountryFilters();
    
    // 프로그램 필터 설정
    setupProgramFilters();
    
    // 날짜 필터 설정
    setupDateFilters();
}

/**
 * 국가 필터 설정
 */
function setupCountryFilters() {
    const countryOptions = document.querySelectorAll('.country-filter .filter-option');
    
    countryOptions.forEach(option => {
        option.addEventListener('click', function() {
            const countryValue = this.getAttribute('data-value');
            
            // "모든 국가" 옵션 처리
            if (!countryValue) {
                // 모든 국가 선택 시 다른 필터 해제
                countryOptions.forEach(opt => {
                    if (opt !== this) {
                        opt.classList.remove('selected');
                    } else {
                        opt.classList.add('selected');
                    }
                });
                activeFilters.countries.clear();
            } else {
                // "모든 국가" 옵션 해제
                countryOptions[0].classList.remove('selected');
                
                // 현재 옵션 토글
                this.classList.toggle('selected');
                
                if (this.classList.contains('selected')) {
                    activeFilters.countries.add(countryValue);
                } else {
                    activeFilters.countries.delete(countryValue);
                }
                
                // 선택된 항목이 없으면 "모든 국가" 자동 선택
                if (activeFilters.countries.size === 0) {
                    countryOptions[0].classList.add('selected');
                }
            }
            
            console.log('활성화된 국가 필터:', Array.from(activeFilters.countries));
        });
    });
}

/**
 * 프로그램 필터 설정
 */
function setupProgramFilters() {
    const programOptions = document.querySelectorAll('.program-filter .filter-option');
    
    programOptions.forEach(option => {
        option.addEventListener('click', function() {
            const programValue = this.getAttribute('data-value');
            
            // "모든 프로그램" 옵션 처리
            if (!programValue) {
                // 모든 프로그램 선택 시 다른 필터 해제
                programOptions.forEach(opt => {
                    if (opt !== this) {
                        opt.classList.remove('selected');
                    } else {
                        opt.classList.add('selected');
                    }
                });
                activeFilters.programs.clear();
            } else {
                // "모든 프로그램" 옵션 해제
                programOptions[0].classList.remove('selected');
                
                // 현재 옵션 토글
                this.classList.toggle('selected');
                
                if (this.classList.contains('selected')) {
                    activeFilters.programs.add(programValue);
                } else {
                    activeFilters.programs.delete(programValue);
                }
                
                // 선택된 항목이 없으면 "모든 프로그램" 자동 선택
                if (activeFilters.programs.size === 0) {
                    programOptions[0].classList.add('selected');
                }
            }
            
            console.log('활성화된 프로그램 필터:', Array.from(activeFilters.programs));
        });
    });
}

/**
 * 날짜 필터 설정
 */
function setupDateFilters() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', function() {
            activeFilters.startDate = this.value ? new Date(this.value) : null;
            console.log('시작일 필터:', activeFilters.startDate);
        });
        
        endDateInput.addEventListener('change', function() {
            activeFilters.endDate = this.value ? new Date(this.value) : null;
            console.log('종료일 필터:', activeFilters.endDate);
        });
    }
}

/**
 * 필터 표시 텍스트 업데이트
 * @param {HTMLElement} container 필터 컨테이너
 * @param {string} text 표시할 텍스트
 * @param {boolean} isAll 모든 항목 선택 여부
 */
function updateFilterDisplay(container, text, isAll) {
    const selectedDisplay = container.querySelector('.filter-selected');
    if (selectedDisplay) {
        selectedDisplay.textContent = text;
        selectedDisplay.setAttribute('data-all', isAll ? 'true' : 'false');
    }
}

/**
 * 선택된 옵션 스타일 업데이트
 * @param {HTMLElement} container 필터 컨테이너
 */
function updateOptionStyles(container) {
    const options = container.querySelectorAll('.filter-option');
    const isCountryFilter = container.querySelector('.country-options') !== null;
    const isProgramFilter = container.querySelector('.program-options') !== null;
    
    options.forEach(option => {
        const value = option.getAttribute('data-value');
        option.classList.remove('selected');
        
        // 선택된 옵션에 selected 클래스 추가
        if (!value) {
            // '모든 X' 옵션은 다른 선택이 없을 때만 선택됨
            if ((isCountryFilter && activeFilters.countries.size === 0) ||
                (isProgramFilter && activeFilters.programs.size === 0)) {
                option.classList.add('selected');
            }
        } else {
            // 개별 옵션은 선택 목록에 있을 때 선택됨
            if ((isCountryFilter && activeFilters.countries.has(value)) ||
                (isProgramFilter && activeFilters.programs.has(value))) {
                option.classList.add('selected');
            }
        }
    });
}

/**
 * 선택된 필터 텍스트 가져오기
 * @param {Set} filterSet 선택된 필터 Set
 * @returns {string} 선택된 필터 텍스트
 */
function getSelectedFiltersText(filterSet) {
    if (filterSet.size === 0) return '';
    
    // 선택된 필터 텍스트 매핑
    const filterMap = {
        // 국가
        'NK': '북한',
        'RU': '러시아',
        'IR': '이란',
        'SY': '시리아',
        // 프로그램
        'UN_SANCTIONS': 'UN',
        'EU_SANCTIONS': 'EU',
        'US_SANCTIONS': 'US'
    };
    
    // 필터셋 내용을 배열로 변환하고 이름으로 매핑
    const selectedTexts = Array.from(filterSet).map(key => filterMap[key] || key);
    
    // 선택항목이 많으면 축약
    if (selectedTexts.length > 2) {
        return `${selectedTexts[0]}, ${selectedTexts[1]} 외 ${selectedTexts.length - 2}개`;
    } else {
        return selectedTexts.join(', ');
    }
}

/**
 * 푸터 스타일 로그인/메인 페이지용으로 조정
 */
function adjustFooterForLoginSection() {
    const footer = document.querySelector('.main-footer');
    if (footer) footer.classList.add('login-footer');
}

function adjustFooterForMainSection() {
    const footer = document.querySelector('.main-footer');
    if (footer) footer.classList.remove('login-footer');
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 로그인 폼 이벤트 설정
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(e);
        });
        
        // 비밀번호 토글 버튼
        const togglePassword = document.querySelector('.toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });
        }
    }
    
    // 자동 로그인 버튼 이벤트 설정
    const autoLoginBtn = document.getElementById('auto-login-btn');
    if (autoLoginBtn) {
        autoLoginBtn.addEventListener('click', function() {
            console.log('자동 로그인 버튼 클릭됨');
            // 테스트 계정으로 로그인
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', 'jaesu@kakao.com');
            localStorage.setItem('userName', '김재수');
            
            // 세션 스토리지에도 저장
            try {
                const userInfo = {
                    email: 'jaesu@kakao.com',
                    name: '김재수'
                };
                sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
                currentUser = userInfo;
            } catch(e) {
                console.error('세션 스토리지 저장 오류:', e);
            }
            
            // 메인 섹션으로 전환
            showMainSection('jaesu@kakao.com');
            
            // 알림 표시
            window.showAlert('테스트 계정으로 로그인되었습니다.', 'success');
        });
    }
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 회원가입 모달 표시
    const registerLink = document.getElementById('register-link');
    const registerModal = document.getElementById('register-modal');
    if (registerLink && registerModal) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.classList.add('show');
        });
    }
    
    // 회원가입 모달 닫기
    const registerClose = document.getElementById('register-close');
    if (registerClose && registerModal) {
        registerClose.addEventListener('click', () => {
            registerModal.classList.remove('show');
        });
    }
    
    // 회원가입 폼 제출
    const registerSubmit = document.getElementById('register-submit');
    if (registerSubmit) {
        registerSubmit.addEventListener('click', handleRegister);
    }
    
    // 약관 링크 이벤트
    const termsLink = document.getElementById('terms-link');
    const privacyLink = document.getElementById('privacy-link');
    
    if (termsLink) {
        termsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('footer-terms');
        });
    }
    
    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('footer-privacy');
        });
    }
    
    // 푸터 링크
    setupFooterLinks();
}

/**
 * 로그인 처리
 * @param {Event} e 이벤트 객체
 */
function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        console.error('로그인 폼 요소를 찾을 수 없습니다.');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email) {
        showAlert('이메일을 입력해주세요.', 'warning');
        return;
    }
    
    if (!password) {
        showAlert('비밀번호를 입력해주세요.', 'warning');
        return;
    }
    
    // 테스트 계정 검증
    if (email === 'jaesu@kakao.com' && password === '1234') {
        // 로그인 성공
        currentUser = {
            email: 'jaesu@kakao.com',
            name: '김재수'
        };
        
        // 로컬 스토리지에 정보 저장
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', '김재수');
        
        // 세션 스토리지에도 저장
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 메인 섹션으로 전환
        showMainSection(email);
        
        // 성공 메시지
        showAlert('로그인 성공!', 'success');
    } else {
        // 로그인 실패
        showAlert('이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
    }
}

/**
 * 푸터 링크 이벤트 설정
 */
function setupFooterLinks() {
    const footerLinks = document.querySelectorAll('.footer-section a, .login-links a');
    
    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal(link.id);
        });
    });
}

/**
 * 정보 모달 표시
 * @param {string} type 모달 타입
 */
function showInfoModal(type) {
    let title = '';
    let content = '';
    
    // 타입에 따른 내용 설정
    switch (type) {
        case 'footer-terms':
        case 'terms-link':
            title = '이용약관';
            content = `
                <div class="info-content">
                    <h3>제1조 (목적)</h3>
                    <p>이 약관은 WVL(이하 "회사")이 제공하는 세계 경제 제재 검색 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                    
                    <h3>제2조 (용어의 정의)</h3>
                    <p>1. "서비스"란 회사가 제공하는 세계 경제 제재 검색 서비스를 의미합니다.</p>
                    <p>2. "회원"이란 회사와 서비스 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 개인 또는 법인을 말합니다.</p>
                    
                    <h3>제3조 (약관의 효력 및 변경)</h3>
                    <p>1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
                    <p>2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있으며, 약관이 변경된 경우에는 지체 없이 서비스를 통해 공지합니다.</p>
                </div>
            `;
            break;
        case 'footer-privacy':
        case 'privacy-link':
            title = '개인정보처리방침';
            content = `
                <div class="info-content">
                    <h3>1. 개인정보의 수집 및 이용 목적</h3>
                    <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                    <ul>
                        <li>회원 관리 및 서비스 제공</li>
                        <li>서비스 이용 기록 분석 및 통계</li>
                        <li>서비스 개선 및 신규 서비스 개발</li>
                    </ul>
                </div>
            `;
            break;
        case 'footer-help':
        case 'help-link':
            title = '도움말';
            content = `
                <div class="info-content">
                    <h3>서비스 소개</h3>
                    <p>세계 경제 제재 검색 서비스는 UN, EU, US 등의 제재 목록에 등재된 개인, 단체, 선박 등의 정보를 검색할 수 있는 서비스입니다.</p>
                    
                    <h3>사용 방법</h3>
                    <ol>
                        <li>로그인: 이메일과 비밀번호를 입력하여 로그인합니다.</li>
                        <li>검색: 이름, 기관명, 키워드 등을 입력하여 검색합니다.</li>
                        <li>고급 검색: 국가, 제재 프로그램 등으로 검색 결과를 필터링할 수 있습니다.</li>
                        <li>상세 정보: 검색 결과에서 '상세 정보' 버튼을 클릭하여 제재 대상의 상세 정보를 확인합니다.</li>
                    </ol>
                </div>
            `;
            break;
        case 'footer-about':
        case 'about-link':
            title = '회사 소개';
            content = `
                <div class="info-content">
                    <h3>WVL 소개</h3>
                    <p>WVL은 글로벌 제재 정보 검색 및 관리 시스템을 제공하는 기업입니다. 우리는 복잡한 국제 제재 정보를 누구나 쉽게 검색하고 활용할 수 있도록 돕고 있습니다.</p>
                    
                    <h3>비전</h3>
                    <p>글로벌 비즈니스 환경에서 기업과 기관들이 제재 관련 규정을 준수하고 위험을 관리할 수 있도록 지원하여, 안전하고 투명한 국제 거래를 촉진하는 것을 목표로 합니다.</p>
                    
                    <h3>연락처</h3>
                    <p>주소: 서울특별시 강남구 테헤란로 123, 10층</p>
                    <p>이메일: info@wvl.co.kr</p>
                    <p>전화: 02-123-4567</p>
                </div>
            `;
            break;
        case 'footer-faq':
            title = '자주 묻는 질문';
            content = `
                <div class="info-content">
                    <h3>Q: 서비스 이용 비용은 얼마인가요?</h3>
                    <p>A: 기본 검색 서비스는 무료로 제공됩니다. 고급 기능과 API 연동은 유료 구독 서비스로 제공됩니다.</p>
                    
                    <h3>Q: 제재 정보는 얼마나 자주 업데이트되나요?</h3>
                    <p>A: 제재 정보는 매일 업데이트됩니다. 각 소스(UN, EU, US)의 최신 정보를 반영합니다.</p>
                </div>
            `;
            break;
        case 'footer-contact':
            title = '문의하기';
            content = `
                <div class="info-content">
                    <h3>고객 지원 문의</h3>
                    <p>서비스 이용 중 궁금한 점이나 문제가 있으시면 아래 연락처로 문의해주세요.</p>
                    
                    <h3>연락처</h3>
                    <p>이메일: support@wvl.co.kr</p>
                    <p>전화: 02-123-4567 (평일 09:00 - 18:00)</p>
                </div>
            `;
            break;
        case 'register-link':
            title = '회원가입';
            content = `
                <div class="info-content">
                    <h3>회원가입</h3>
                    <p>현재 회원가입은 관리자를 통해서만 가능합니다. 회원가입을 원하시면 아래 이메일로 문의해주세요.</p>
                    <p>이메일: membership@wvl.co.kr</p>
                </div>
            `;
            break;
        default:
            title = '정보';
            content = '<p>정보를 준비 중입니다.</p>';
    }
    
    // 모달 창에 내용 추가 및 표시
    const detailModal = document.getElementById('detail-modal');
    const detailContent = document.getElementById('detail-content');
    
    if (detailModal && detailContent) {
        detailContent.innerHTML = `
            <div class="info-modal">
                <h2>${title}</h2>
                ${content}
            </div>
        `;
        detailModal.classList.add('show');
    }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
    // 로그인 정보 삭제
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    
    // 로그인 페이지로 전환
    showLoginSection();
    
    // 성공 메시지
    showAlert('로그아웃 되었습니다.', 'success');
}

/**
 * 초기 데이터 로드
 */
async function loadInitialData() {
    try {
        console.log('초기 데이터 로드 시작...');
        const loadingIndicator = window.showLoadingIndicator ? 
            window.showLoadingIndicator('results-container', '데이터를 불러오는 중...') :
            showLoadingIndicator('results-container', '데이터를 불러오는 중...');
        
        // API 서비스를 통해 데이터 로드
        let data;
        if (window.ApiService && typeof window.ApiService.fetchSanctionsData === 'function') {
            data = await window.ApiService.fetchSanctionsData();
        } else {
            // 대체 로드 방법
            data = await apiModule.fetchSanctionsData();
        }
        
        if (data && data.length > 0) {
            console.log(`${data.length}개의 제재 데이터 로드 성공`);
            
            try {
                // 최근 제재 데이터 표시
                let recentSanctions;
                if (window.ApiService && typeof window.ApiService.getRecentSanctions === 'function') {
                    recentSanctions = await window.ApiService.getRecentSanctions(10);
                } else {
                    recentSanctions = await apiModule.getRecentSanctions(10);
                }
                
                if (recentSanctions && recentSanctions.length > 0) {
                    console.log(`${recentSanctions.length}개의 최근 제재 데이터 표시`);
                    if (window.SearchComponent && typeof window.SearchComponent.displayResults === 'function') {
                        window.SearchComponent.displayResults(recentSanctions);
                    } else {
                        displayResults(recentSanctions);
                    }
                } else {
                    console.warn('최근 제재 데이터가 없어 전체 데이터 중 일부 표시');
                    if (window.SearchComponent && typeof window.SearchComponent.displayResults === 'function') {
                        window.SearchComponent.displayResults(data.slice(0, 10));
                    } else {
                        displayResults(data.slice(0, 10));
                    }
                }
            } catch (recentError) {
                console.error('최근 제재 데이터 로드 실패, 전체 데이터 사용:', recentError);
                if (window.SearchComponent && typeof window.SearchComponent.displayResults === 'function') {
                    window.SearchComponent.displayResults(data.slice(0, 10));
                } else {
                    displayResults(data.slice(0, 10));
                }
            }
        } else {
            console.error('데이터 로드 실패, 샘플 데이터 사용');
            const sampleData = getSampleSanctionsData();
            if (window.SearchComponent && typeof window.SearchComponent.displayResults === 'function') {
                window.SearchComponent.displayResults(sampleData);
            } else {
                displayResults(sampleData);
            }
            window.showAlert ? window.showAlert('실제 데이터를 불러오는데 실패했습니다. 샘플 데이터를 표시합니다.', 'warning') :
                showAlert('실제 데이터를 불러오는데 실패했습니다. 샘플 데이터를 표시합니다.', 'warning');
        }
        
        if (window.hideLoadingIndicator) {
            window.hideLoadingIndicator(loadingIndicator);
        } else {
            hideLoadingIndicator(loadingIndicator);
        }
    } catch (error) {
        console.error('초기 데이터 로드 중 오류:', error);
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            if (window.hideLoadingIndicator) {
                window.hideLoadingIndicator(loadingIndicator);
            } else {
                hideLoadingIndicator(loadingIndicator);
            }
        }
        
        // 오류 발생 시 샘플 데이터 표시
        const sampleData = getSampleSanctionsData();
        if (window.SearchComponent && typeof window.SearchComponent.displayResults === 'function') {
            window.SearchComponent.displayResults(sampleData);
        } else {
            displayResults(sampleData);
        }
        window.showAlert ? window.showAlert('데이터를 불러오는데 문제가 발생했습니다. 샘플 데이터를 표시합니다.', 'warning') :
            showAlert('데이터를 불러오는데 문제가 발생했습니다. 샘플 데이터를 표시합니다.', 'warning');
    }
}

/**
 * 샘플 제재 데이터 반환 (API 오류 시 대체 데이터)
 */
function getSampleSanctionsData() {
    return [
        {
            id: 'NK001',
            name: '김정은',
            aliases: ['Kim Jong Un', 'Kim Jong-un'],
            type: '개인',
            country: 'NK',
            source: 'UN, EU, US',
            programs: ['UN_SANCTIONS', 'EU_SANCTIONS', 'US_SANCTIONS'],
            date_listed: '2016-03-02',
            reason: '북한 정권 지도자로서 핵무기 프로그램 및 탄도 미사일 프로그램과 관련된 정책 결정에 책임이 있음'
        },
        {
            id: 'RU001',
            name: '블라디미르 푸틴',
            aliases: ['Vladimir Putin', 'Putin'],
            type: '개인',
            country: 'RU',
            source: 'EU, US',
            programs: ['EU_SANCTIONS', 'US_SANCTIONS'],
            date_listed: '2022-02-25',
            reason: '우크라이나 침공과 관련된 국제법 위반 및 인권 침해 행위에 책임이 있음'
        },
        {
            id: 'IR001',
            name: '이란 혁명수비대',
            aliases: ['IRGC', 'Islamic Revolutionary Guard Corps'],
            type: '단체',
            country: 'IR',
            source: 'US',
            programs: ['US_SANCTIONS'],
            date_listed: '2019-04-15',
            reason: '테러 지원 및 이란의 탄도 미사일 및 핵무기 프로그램 지원과 관련된 활동'
        },
        {
            id: 'SY001',
            name: '바샤르 알아사드',
            aliases: ['Bashar al-Assad', 'Assad'],
            type: '개인',
            country: 'SY',
            source: 'EU, US',
            programs: ['EU_SANCTIONS', 'US_SANCTIONS'],
            date_listed: '2011-05-18',
            reason: '시리아 내전 중 민간인에 대한 인권 침해 및 화학무기 사용에 대한 책임'
        },
        {
            id: 'NK002',
            name: '조선무역은행',
            aliases: ['Foreign Trade Bank of the Democratic People\'s Republic of Korea', 'FTB'],
            type: '단체',
            country: 'NK',
            source: 'UN, EU, US',
            programs: ['UN_SANCTIONS', 'EU_SANCTIONS', 'US_SANCTIONS'],
            date_listed: '2013-03-11',
            reason: '북한의 핵 및 탄도 미사일 프로그램 관련 금융 지원'
        },
        {
            id: 'RU002',
            name: '북방선박',
            aliases: ['Northern Shipping Company', 'Severnoe Morskoe Parokhodstvo'],
            type: '단체',
            country: 'RU',
            source: 'EU',
            programs: ['EU_SANCTIONS'],
            date_listed: '2022-06-03',
            reason: '러시아 군수 물자 및 장비 수송을 통한 우크라이나 침공 지원'
        },
        {
            id: 'IR002',
            name: '마흐무드 아흐마디네자드',
            aliases: ['Mahmoud Ahmadinejad'],
            type: '개인',
            country: 'IR',
            source: 'US',
            programs: ['US_SANCTIONS'],
            date_listed: '2012-07-12',
            reason: '이란 핵 프로그램 추진 및 테러 지원 활동'
        },
        {
            id: 'NK003',
            name: '제2자연과학원',
            aliases: ['Second Academy of Natural Sciences', 'SANS'],
            type: '단체',
            country: 'NK',
            source: 'UN, EU, US',
            programs: ['UN_SANCTIONS', 'EU_SANCTIONS', 'US_SANCTIONS'],
            date_listed: '2013-01-22',
            reason: '북한의 핵무기 및 장거리 미사일 개발 참여'
        },
        {
            id: 'RU003',
            name: '세르게이 라브로프',
            aliases: ['Sergei Lavrov', 'Sergey Lavrov'],
            type: '개인',
            country: 'RU',
            source: 'EU, US',
            programs: ['EU_SANCTIONS', 'US_SANCTIONS'],
            date_listed: '2022-02-25',
            reason: '러시아의 우크라이나 침공 관련 정책 결정 및 지원'
        },
        {
            id: 'SY002',
            name: '시리아 과학연구센터',
            aliases: ['Scientific Studies and Research Center', 'SSRC'],
            type: '단체',
            country: 'SY',
            source: 'EU, US',
            programs: ['EU_SANCTIONS', 'US_SANCTIONS'],
            date_listed: '2017-04-24',
            reason: '시리아 화학무기 프로그램 개발 및 생산 담당'
        }
    ];
}

/**
 * 검색 결과가 없을 때 추천 검색어 표시
 * @param {Array<string>} suggestions 추천 검색어 배열
 */
function displaySearchSuggestions(suggestions) {
    const container = document.createElement('div');
    container.className = 'search-suggestions';
    
    const heading = document.createElement('h4');
    heading.textContent = '다음 검색어는 어떠세요?';
    container.appendChild(heading);
    
    const list = document.createElement('ul');
    suggestions.forEach(suggestion => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = suggestion;
        link.href = '#';
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('search-input').value = suggestion;
            performSearch();
        });
        item.appendChild(link);
        list.appendChild(item);
    });
    
    container.appendChild(list);
    
    // 결과 컨테이너에 추천어 추가
    const resultsContainer = document.getElementById('results-container') || document.getElementById('results-list');
    if (resultsContainer) {
        resultsContainer.appendChild(container);
    }
}

/**
 * 검색어 자동완성 기능
 */
function setupAutocomplete() {
    const searchInput = document.getElementById('search-input');
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'autocomplete-container';
    autocompleteContainer.style.display = 'none';
    
    // 자동완성 컨테이너 추가
    searchInput.parentNode.appendChild(autocompleteContainer);
    
    // 입력 이벤트에 자동완성 기능 연결
    searchInput.addEventListener('input', debounce(async () => {
        const query = searchInput.value.trim();
        
        if (query.length < 2) {
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        // 검색어 추천 가져오기
        const suggestions = getSuggestedSearchTerms(query);
        
        if (suggestions.length > 0) {
            // 자동완성 목록 표시
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.style.display = 'block';
            
            suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = suggestion;
                
                // 클릭 이벤트 추가
                item.addEventListener('click', () => {
                    searchInput.value = suggestion;
                    autocompleteContainer.style.display = 'none';
                    performSearch();
                });
                
                autocompleteContainer.appendChild(item);
            });
        } else {
            autocompleteContainer.style.display = 'none';
        }
    }, 300));
    
    // 외부 클릭 시 자동완성 숨기기
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            autocompleteContainer.style.display = 'none';
        }
    });
}

/**
 * 고급 검색 설정
 * 고급 검색 관련 이벤트 핸들러와 기능을 설정합니다.
 */
function setupAdvancedSearch() {
    const advancedButton = document.getElementById('advanced-search-button');
    const advancedOptions = document.getElementById('advanced-search-options');
    
    if (advancedButton && advancedOptions) {
        // 고급 검색 토글
        advancedButton.addEventListener('click', () => {
            advancedOptions.classList.toggle('show');
            const icon = advancedButton.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            }
        });
        
        // 필터 옵션 설정
        setupFilterOptions();
        
        // 검색 유형 변경 이벤트
        const searchTypeInputs = document.querySelectorAll('input[name="search-type"]');
        const numberTypeOptions = document.querySelector('.number-type-options');
        
        searchTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.value === 'number') {
                    numberTypeOptions.style.display = 'block';
                } else {
                    numberTypeOptions.style.display = 'none';
                }
            });
        });
    }
}

/**
 * 검색 옵션 설정
 */
function setupSearchOptions() {
    // 검색 유형 라디오 버튼 이벤트 리스너
    const searchTypeInputs = document.querySelectorAll('input[name="search-type"]');
    const numberTypeOptions = document.querySelector('.number-type-options');
    
    if (searchTypeInputs.length && numberTypeOptions) {
        searchTypeInputs.forEach(input => {
            input.addEventListener('change', () => {
                // 활성 클래스 이동
                document.querySelectorAll('.search-type-options .search-option').forEach(option => {
                    option.classList.remove('active');
                });
                input.closest('.search-option').classList.add('active');
                
                // 번호 유형 옵션 표시 여부
                numberTypeOptions.style.display = input.value === 'number' ? 'flex' : 'none';
            });
        });
    }
    
    // 번호 유형 라디오 버튼 이벤트 리스너
    const numberTypeInputs = document.querySelectorAll('input[name="number-type"]');
    if (numberTypeInputs.length) {
        numberTypeInputs.forEach(input => {
            input.addEventListener('change', () => {
                // 활성 클래스 이동
                document.querySelectorAll('.number-type-options .search-option').forEach(option => {
                    option.classList.remove('active');
                });
                input.closest('.search-option').classList.add('active');
            });
        });
    }
    
    // 정렬 옵션 변경 이벤트
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            // 현재 표시된 결과 재정렬
            const currentResults = [...document.querySelectorAll('.result-card')].map(card => {
                return {
                    element: card,
                    name: card.querySelector('h3').textContent,
                    date: card.dataset.date || '2000-01-01',
                    relevance: parseInt(card.dataset.relevance || '0')
                };
            });
            
            // 정렬 로직
            currentResults.sort((a, b) => {
                switch (sortSelect.value) {
                    case 'date-desc':
                        return new Date(b.date) - new Date(a.date);
                    case 'date-asc':
                        return new Date(a.date) - new Date(b.date);
                    case 'name-asc':
                        return a.name.localeCompare(b.name, 'ko');
                    default: // relevance
                        return b.relevance - a.relevance;
                }
            });
            
            // 화면에 재배치
            const resultsContainer = document.getElementById('results-container');
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
                currentResults.forEach(item => {
                    resultsContainer.appendChild(item.element);
                });
            }
        });
    }
}

/**
 * 회원가입 처리
 * @param {Event} e 이벤트 객체
 */
function handleRegister(e) {
    e.preventDefault();
    
    // 입력값 가져오기
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const passwordConfirmInput = document.getElementById('register-password-confirm');
    const termsAgree = document.getElementById('terms-agree');
    
    // 입력값 검증
    if (!nameInput.value.trim()) {
        showAlert('이름을 입력해주세요.', 'error', { target: '#register-modal .alert-container', isStatic: true });
        return;
    }
    
    if (!emailInput.value.trim()) {
        showAlert('이메일을 입력해주세요.', 'error', { target: '#register-modal .alert-container', isStatic: true });
        return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
        showAlert('유효한 이메일 주소를 입력해주세요.', 'error', { target: '#register-modal .alert-container', isStatic: true });
        return;
    }
    
    if (!passwordInput.value) {
        showAlert('비밀번호를 입력해주세요.', 'error', { target: '#register-modal .alert-container', isStatic: true });
        return;
    }
    
    if (passwordInput.value.length < 4) {
        showAlert('비밀번호는 4자 이상이어야 합니다.', 'error', { target: '#register-modal .alert-container', isStatic: true });
        return;
    }
    
    if (passwordInput.value !== passwordConfirmInput.value) {
        showAlert('비밀번호가 일치하지 않습니다.', 'error', { target: '#register-modal .alert-container', isStatic: true });
        return;
    }
    
    if (!termsAgree.checked) {
        showAlert('이용약관 및 개인정보처리방침에 동의해주세요.', 'error', { target: '#register-modal .alert-container', isStatic: true });
        return;
    }
    
    // 이메일 중복 검사
    const existingUser = users.find(user => user.email === emailInput.value);
    if (existingUser) {
        showAlert('이미 등록된 이메일입니다.', 'error', { target: '#register-modal .alert-container', isStatic: true });
        return;
    }
    
    // 회원 정보 저장
    const newUser = {
        id: Date.now().toString(),
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // 회원가입 성공 메시지
    showAlert('회원가입이 완료되었습니다. 로그인해주세요.', 'success', { target: '#register-modal .alert-container', isStatic: true });
    
    // 폼 초기화 및 모달 닫기
    setTimeout(() => {
        const registerModal = document.getElementById('register-modal');
        if (registerModal) {
            registerModal.classList.remove('show');
            
            // 폼 초기화
            nameInput.value = '';
            emailInput.value = '';
            passwordInput.value = '';
            passwordConfirmInput.value = '';
            termsAgree.checked = false;
        }
    }, 2000);
}

function getSuggestedSearchTerms(query) {
    // 샘플 데이터 (실제로는 API 통신으로 받아와야 함)
    const sampleTerms = [
        '김정은', '푸틴', '아사드', '북한', '러시아', '이란', '시리아',
        '핵무기', '미사일', '제재', 'UN', 'EU', '위반', '테러', '인권'
    ];
    
    // 검색어와 유사한 단어 필터링
    return sampleTerms.filter(term => 
        term.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5); // 최대 5개 표시
}

// 전역 함수 노출
window.initializeApp = initializeApp;
window.app = {
    init: initializeApp,
    performSearch: async function(e) {
        if (e) e.preventDefault();
        await performSearch();
    },
    handleShowDetails: async function(id) {
        // EventManager나 다른 모듈에 있는 showDetail 함수 참조
        if (window.EventManager && typeof window.EventManager.handleShowDetails === 'function') {
            await window.EventManager.handleShowDetails(id);
        } else {
            console.error('상세정보 표시 함수를 찾을 수 없습니다');
        }
    },
    handleLogout: handleLogout
};

// 함수 나머지 함수들은 변경 없이 유지
// ... existing code ...