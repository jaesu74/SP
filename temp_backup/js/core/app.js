/**
 * app.js - 메인 애플리케이션 파일
 * 세계 경제 제재 검색 서비스
 */

// 모듈 가져오기
import { debounce, showAlert } from '../utils/common.js';
import { fetchSanctionsData } from '../services/api.js';
import { initSearchComponent, performSearch } from '../components/search.js';
import { initDetailComponent, showDetail, hideDetail } from '../components/detail.js';
import { initAuthUI, showMainSection, adjustFooterForLoginSection } from '../components/auth-ui.js';
import { isAuthenticated, getUserFromStorage } from '../services/auth.js';

// 전역 객체
window.app = {
    performSearch,
    showDetail,
    hideDetail
};

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * 애플리케이션 초기화
 */
async function initializeApp() {
    console.log('세계 경제 제재 검색 서비스 초기화...');
    
    try {
        // 맥시멀리즘 UI 스타일 적용
        applyMaximalistStyle();
        
        // 인증 컴포넌트 초기화
        initAuthUI();
        
        // 검색 및 상세 정보 컴포넌트 초기화
        initSearchComponent();
        initDetailComponent();
        
        // 추가 이벤트 리스너 등록
        setupEventListeners();
        
        // 세션 체크 및 초기 데이터 로드
        setTimeout(() => {
            checkSession();
            loadInitialData();
        }, 100);
        
        console.log('세계 경제 제재 검색 서비스 초기화 완료');
    } catch (error) {
        console.error('초기화 중 오류 발생:', error);
        showAlert('서비스 초기화 중 오류가 발생했습니다.', 'error');
    }
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
 * 추가 이벤트 리스너 등록
 */
function setupEventListeners() {
    // 검색 버튼 클릭 이벤트
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            performSearch();
        });
    }
    
    // 검색창 엔터 키 이벤트
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
    
    // URL 파라미터 처리 (자동 로그인용)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autologin') === 'true') {
        console.log('자동 로그인 파라미터 감지됨');
        // URL에서 파라미터 제거 (히스토리 유지)
        const url = new URL(window.location);
        url.searchParams.delete('autologin');
        window.history.replaceState({}, '', url);
    }
}

/**
 * 세션 확인 - 로그인 상태 확인
 */
function checkSession() {
    console.log('세션 확인 중...');
    
    try {
        // URL 파라미터 체크
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('autologin') === 'true') {
            console.log('자동 로그인 파라미터 감지됨');
            
            // 테스트 계정으로 자동 로그인
            const userInfo = {
                email: 'jaesu@kakao.com',
                name: '김재수'
            };
            
            // 메인 섹션 표시
            showMainSection(userInfo);
            return true;
        }
        
        // 로그인 상태 확인
        if (isAuthenticated()) {
            // 이미 로그인된 상태
            const userInfo = getUserFromStorage();
            
            // 메인 섹션 표시
            showMainSection(userInfo);
            return true;
        }
        
        // 로그인 섹션 표시 (로그인 안된 상태)
        const loginSection = document.getElementById('login-section');
        const mainSection = document.getElementById('main-section');
        
        if (loginSection) {
            loginSection.style.display = 'block';
            adjustFooterForLoginSection();
        }
        
        if (mainSection) {
            mainSection.style.display = 'none';
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
 * 초기 데이터 로드
 */
async function loadInitialData() {
    try {
        // 제재 데이터 미리 로드
        await fetchSanctionsData();
        
        // 다크 모드 설정 로드
        loadDarkModePreference();
    } catch (error) {
        console.error('초기 데이터 로드 오류:', error);
    }
}

/**
 * 다크 모드 설정 로드
 */
function loadDarkModePreference() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// 전역 함수 노출
window.performSearch = performSearch;
window.showDetail = showDetail; 