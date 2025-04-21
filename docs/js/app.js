/**
 * 세계 경제 제재 검색 서비스
 * 메인 애플리케이션 파일
 */

// 전역 변수
let currentResults = [];
let activeFilters = {
    countries: new Set(),
    programs: new Set(),
    startDate: null,
    endDate: null
};

// 전역 scope에 sanctionsAPI 변수 설정
window.sanctionsAPI = null;

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    // API URL 설정
    window.AUTH_API_URL = window.AUTH_API_URL || "http://localhost:8000/api";
    window.API_BASE_URL = window.API_BASE_URL || "http://localhost:8000/api";
    
    // 페이지 초기화
    initPage();
});

/**
 * 애플리케이션 초기화
 */
async function initPage() {
    try {
        // 인증 상태 확인
        const isLoggedIn = isAuthenticated();
        
        // 로그인 상태에 따라 적절한 섹션 표시
        if (isLoggedIn) {
            showMainSection();
        } else {
            showLoginForm();
        }
        
        // 이벤트 리스너 등록
        attachEventListeners();
    } catch (error) {
        console.error('페이지 초기화 중 오류:', error);
        showAlert('어플리케이션 초기화 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 메인 섹션 표시
 */
function showMainSection() {
    try {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    
        if (loginSection) loginSection.style.display = 'none';
        if (mainSection) mainSection.style.display = 'block';
        
        // 사용자 정보 가져오기 - 직접 localStorage에서 읽어옴
        let user = null;
        try {
            const userStr = localStorage.getItem('wvl_user');
            if (userStr) user = JSON.parse(userStr);
        } catch (e) {
            console.error('사용자 정보 읽기 오류:', e);
        }
        
        // 외부 showMainSection 함수가 있으면 사용하지만, 현재 함수 이름이 같아서 무한 루프 방지
        if (typeof window.showMainSection === 'function' && window.showMainSection !== showMainSection && user) {
            window.showMainSection(user);
            return;
        }
        
        if (user) {
            const userInfoElement = document.getElementById('user-info');
            if (userInfoElement) {
                let userName = user.name || (user.email ? user.email.split('@')[0] : '사용자');
                userInfoElement.textContent = `${userName}님 환영합니다.`;
            }
            
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
                let displayName = user.name || (user.email ? user.email.split('@')[0] : '사용자');
                userNameElement.textContent = displayName;
            }
        }
        
        // 제재 검색 기능 초기화 - 직접 함수를 찾아서 호출
        if (typeof window.initSanctions === 'function') {
            window.initSanctions();
        }
    } catch (error) {
        console.error('메인 섹션 표시 중 오류:', error);
    }
}

/**
 * 로그인 폼 표시
 */
function showLoginForm() {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    
    if (loginSection) loginSection.style.display = 'block';
    if (mainSection) mainSection.style.display = 'none';
}

/**
 * 이벤트 리스너 등록
 */
function attachEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }
    
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function(e) {
                e.preventDefault();
            if (typeof window.performSearch === 'function') {
                window.performSearch();
            } else if (typeof performSearch === 'function') {
                performSearch();
            }
        });
    }
    
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof window.performSearch === 'function') {
                    window.performSearch();
                } else if (typeof performSearch === 'function') {
                    performSearch();
                }
            }
        });
    }
}

/**
 * 로그인 폼 제출 처리
 */
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    try {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (!emailInput || !passwordInput) {
            showAlert('로그인 폼에 오류가 있습니다.', 'error');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            showAlert('이메일과 비밀번호를 모두 입력해주세요.', 'warning');
            return;
        }
        
        if (typeof window.login === 'function') {
            const result = await window.login(email, password);
            
            if (result.success) {
                showAlert('로그인 성공!', 'success');
                showMainSection();
            } else {
                showAlert(result.error || '로그인 실패. 이메일과 비밀번호를 확인해주세요.', 'error');
            }
        } else {
            showAlert('로그인 기능에 문제가 있습니다.', 'error');
        }
    } catch (error) {
        console.error('로그인 처리 중 오류:', error);
        showAlert('로그인 처리 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
    try {
        if (typeof window.logout === 'function') {
            window.logout();
        } else {
            localStorage.removeItem('wvl_token');
            localStorage.removeItem('wvl_user');
            localStorage.removeItem('isLoggedIn');
        }
        
        showLoginForm();
        showAlert('로그아웃되었습니다.', 'info');
    } catch (error) {
        console.error('로그아웃 처리 중 오류:', error);
    }
}

/**
 * 검색 폼 제출 처리
 */
function handleSearchSubmit(event) {
    if (event) event.preventDefault();
    
    try {
        if (typeof window.performSearch === 'function') {
            window.performSearch();
        } else if (typeof performSearch === 'function') {
            performSearch();
        } else {
            showAlert('검색 기능에 문제가 있습니다.', 'error');
        }
    } catch (error) {
        console.error('검색 처리 중 오류:', error);
        showAlert('검색 처리 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 인증 상태 확인
 */
function isAuthenticated() {
    try {
        const token = localStorage.getItem('wvl_token');
        const hasToken = token && token !== 'null' && token !== 'undefined';
        
        const userInfoStr = localStorage.getItem('wvl_user');
        const hasUser = userInfoStr && userInfoStr !== 'null' && userInfoStr !== 'undefined';
        
        return hasToken && hasUser;
    } catch (e) {
        console.error('인증 상태 확인 오류:', e);
        return false;
    }
}

/**
 * 알림 표시 함수 (무한 루프 방지)
 */
function showAlert(message, type = 'info', options = {}) {
    // 외부 showAlert 함수를 직접 사용하지 않고 기본 동작 수행
    try {
        // 알림 컨테이너 찾기
        let container = document.querySelector('.alert-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'alert-container';
            document.body.appendChild(container);
        }
        
        // 알림 생성
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // 닫기 버튼 추가
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'alert');
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.addEventListener('click', function() {
            container.removeChild(alert);
        });
        
        alert.appendChild(closeButton);
        
        // 컨테이너에 추가
        container.appendChild(alert);
        
        // 자동 제거 타이머 설정
        setTimeout(() => {
            if (container.contains(alert)) {
                container.removeChild(alert);
            }
        }, options.timeout || 5000);
    } catch (error) {
        console.error('알림 표시 오류:', error);
    }
}

// 전역 함수로 showMessage 함수 등록
window.showMessage = function(message, type = 'info') {
    showAlert(message, type);
};