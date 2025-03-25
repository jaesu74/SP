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
    // 초기에 모든 섹션 숨기기
    hideAllSections();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 로딩 인디케이터 숨기기
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    
    // 로그인 상태 확인
    setTimeout(checkLoginStatus, 300);
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
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 로그인 폼 이벤트 리스너
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            handleLogin(email, password);
        });
    }

    // 로그아웃 버튼 이벤트 리스너
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
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
}

/**
 * 로그인 상태 확인
 */
function checkLoginStatus() {
    // 화면 기본 상태 설정
    hideAllSections();
    
    // 사용자 정보 확인 - localStorage와 sessionStorage 모두 시도
    let userInfo = null;
    let isLoggedIn = false;
    
    // 먼저 localStorage 확인
    try {
        userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            isLoggedIn = true;
        }
    } catch (e) {
        // localStorage 오류 무시
    }
    
    // localStorage에 없으면 sessionStorage 확인
    if (!isLoggedIn) {
        try {
            userInfo = sessionStorage.getItem('userInfo');
            if (userInfo) {
                isLoggedIn = true;
            }
        } catch (e) {
            // sessionStorage 오류 무시
        }
    }
    
    // 쿠키에서도 확인 (최후의 대안)
    if (!isLoggedIn && document.cookie.includes('loggedInUser=')) {
        isLoggedIn = true;
        userInfo = '{"name":"김재수"}';
    }
    
    const mainSection = document.getElementById(MAIN_SECTION_ID);
    const loginSection = document.getElementById(LOGIN_SECTION_ID);
    
    if (!mainSection || !loginSection) {
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
        } catch (e) {
            // 잘못된 데이터 제거
            try {
                localStorage.removeItem('userInfo');
                sessionStorage.removeItem('userInfo');
            } catch (e) {
                // 스토리지 항목 제거 실패 무시
            }
            
            // 비로그인 상태로 전환
            mainSection.style.display = 'none';
            loginSection.style.display = 'block';
        }
    } else {
        // 비로그인 상태
        mainSection.style.display = 'none';
        loginSection.style.display = 'block';
    }
}

/**
 * 로그인 처리
 */
function handleLogin(email, password) {
    // 입력값 검증
    if (!email || !password) {
        showAlert('이메일과 비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    // 테스트 계정 체크
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
        // 최소한의 데이터만 저장
        const userInfo = { 
            name: '김재수',
            loginTime: new Date().toISOString().split('T')[0]
        };
        
        // localStorage에 저장 시도
        try {
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
        } catch (e) {
            // 세션 스토리지 대체 사용 시도
            try {
                sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
            } catch (e) {
                // 오류 무시
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
        
        return true;
    } else {
        // 로그인 실패
        showAlert('로그인 실패. 이메일 또는 비밀번호가 일치하지 않습니다.', 'error');
        return false;
    }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
    // 로컬 스토리지에서 사용자 정보 삭제
    try {
        localStorage.removeItem('userInfo');
    } catch (e) {
        // 오류 무시
    }
    
    // 세션 스토리지에서도 삭제
    try {
        sessionStorage.removeItem('userInfo');
    } catch (e) {
        // 오류 무시
    }
    
    // 알림 표시
    showAlert('로그아웃되었습니다.', 'info');
    
    // 로그인 화면으로 즉시 전환
    const loginSection = document.getElementById(LOGIN_SECTION_ID);
    const mainSection = document.getElementById(MAIN_SECTION_ID);
    
    if (loginSection) loginSection.style.display = 'block';
    if (mainSection) mainSection.style.display = 'none';
    
    return true;
}

/**
 * 알림 표시
 */
function showAlert(message, type) {
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
    
    if (!container) return;
    
    // 알림 요소 생성
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = message;
    
    // 컨테이너에 알림 추가
    container.innerHTML = '';
    container.appendChild(alertDiv);
    
    // 5초 후 알림 자동 제거
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 300);
    }, 5000);
}