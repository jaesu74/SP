/**
 * 세계 경제 제재 검색 서비스
 * 메인 애플리케이션 파일
 */

import { fetchSanctionsData, searchSanctions, getSanctionDetails } from './api.js';

// 전역 변수
let currentResults = [];
let activeFilters = {
    countries: new Set(),
    programs: new Set()
};
let users = JSON.parse(localStorage.getItem('users')) || [];

// 로그인 상태 관리
let currentUser = null;

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * 애플리케이션 초기화
 */
function initializeApp() {
    console.log('세계 경제 제재 검색 서비스 초기화...');
    
    // 로그인 상태 확인
    checkSession();
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 필터 및 검색 옵션 설정
    setupFilterOptions();
    setupSearchOptions();
    setupAutocomplete();
    
    // 초기 데이터 로드
    loadInitialData();
    
    // 맥시멀리즘 UI 스타일 적용
    applyMaximalistStyle();
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
 * 로그인 상태 확인
 */
function checkSession() {
    // 하드코딩된 테스트 사용자 세션 확인 - URL 파라미터로 autologin=true가 있으면 강제 로그인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autologin') === 'true') {
        console.log('자동 로그인 활성화');
        currentUser = {
            email: 'jaesu@kakao.com',
            name: '류재수'
        };
        
        // 세션에 사용자 정보 저장
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainSection();
        return;
    }
    
    // 테스트 계정 확인 - 이전에 jaesu@kakao.com으로 로그인한 적이 있으면 항상 로그인 유지
    const savedUser = sessionStorage.getItem('currentUser');
    
    if(savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            
            // 테스트 계정인 경우 항상 로그인 성공 처리
            if(currentUser.email === 'jaesu@kakao.com') {
                currentUser = {
                    email: 'jaesu@kakao.com',
                    name: '김재수'
                };
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                showMainSection();
                return;
            }
            
            // 일반 사용자 세션 처리
            showMainSection();
        } catch(error) {
            console.error('세션 파싱 오류:', error);
            sessionStorage.removeItem('currentUser');
        }
    }
}

/**
 * 메인 섹션 표시
 * @param {string} email 사용자 이메일
 */
function showMainSection(email) {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    
    if (loginSection) loginSection.style.display = 'none';
    if (mainSection) mainSection.style.display = 'block';
    
    // 사용자 이름 표시
    const { name } = getUserFromStorage();
    const userName = name || email.split('@')[0];
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) userNameElement.textContent = userName;
    
    // 푸터 스타일 조정
    adjustFooterForMainSection();
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
    // 필터 옵션들 설정
    setupCountryFilter();
    setupProgramFilter();
    setupDateFilter();
    
    // 고급 검색 토글 버튼
    const advancedSearchButton = document.getElementById('advanced-search-button');
    const advancedSearchOptions = document.getElementById('advanced-search-options');
    
    if (advancedSearchButton && advancedSearchOptions) {
        advancedSearchButton.addEventListener('click', function() {
            advancedSearchOptions.classList.toggle('show');
            
            // 아이콘 회전
            const icon = this.querySelector('i');
            if (icon) {
                if (advancedSearchOptions.classList.contains('show')) {
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    icon.style.transform = 'rotate(0)';
                }
            }
        });
    }
}

/**
 * 국가 필터 설정
 */
function setupCountryFilter() {
    const filterContainer = document.querySelector('.filter-group.country-filter');
    if (!filterContainer) return;
    
    const options = filterContainer.querySelectorAll('.filter-option');
    options.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            
            // 모든 국가 선택 시
            if (!value) {
                options.forEach(opt => {
                    if (opt.getAttribute('data-value')) {
                        opt.classList.remove('selected');
                    } else {
                        opt.classList.add('selected');
                    }
                });
                activeFilters.countries.clear();
            } else {
                // 개별 국가 선택 시
                options[0].classList.remove('selected'); // '모든 국가' 옵션 해제
                
                this.classList.toggle('selected');
                
                // 필터 상태 업데이트
                if (this.classList.contains('selected')) {
                    activeFilters.countries.add(value);
                } else {
                    activeFilters.countries.delete(value);
                }
                
                // 아무것도 선택되지 않으면 '모든 국가' 다시 선택
                const hasSelectedCountry = Array.from(options).some(opt => 
                    opt.getAttribute('data-value') && opt.classList.contains('selected')
                );
                
                if (!hasSelectedCountry) {
                    options[0].classList.add('selected');
                }
            }
            
            // 검색 결과 업데이트
            performSearch();
        });
    });
}

/**
 * 프로그램 필터 설정
 */
function setupProgramFilter() {
    const filterContainer = document.querySelector('.filter-group.program-filter');
    if (!filterContainer) return;
    
    const options = filterContainer.querySelectorAll('.filter-option');
    options.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            
            // 모든 프로그램 선택 시
            if (!value) {
                options.forEach(opt => {
                    if (opt.getAttribute('data-value')) {
                        opt.classList.remove('selected');
                    } else {
                        opt.classList.add('selected');
                    }
                });
                activeFilters.programs.clear();
            } else {
                // 개별 프로그램 선택 시
                options[0].classList.remove('selected'); // '모든 프로그램' 옵션 해제
                
                this.classList.toggle('selected');
                
                // 필터 상태 업데이트
                if (this.classList.contains('selected')) {
                    activeFilters.programs.add(value);
                } else {
                    activeFilters.programs.delete(value);
                }
                
                // 아무것도 선택되지 않으면 '모든 프로그램' 다시 선택
                const hasSelectedProgram = Array.from(options).some(opt => 
                    opt.getAttribute('data-value') && opt.classList.contains('selected')
                );
                
                if (!hasSelectedProgram) {
                    options[0].classList.add('selected');
                }
            }
            
            // 검색 결과 업데이트
            performSearch();
        });
    });
}

/**
 * 날짜 필터 설정
 */
function setupDateFilter() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
        // 날짜 입력 이벤트
        startDateInput.addEventListener('change', performSearch);
        endDateInput.addEventListener('change', performSearch);
        
        // 오늘 날짜 기준 최근 1년을 기본값으로 설정
        const today = new Date();
        const lastYear = new Date();
        lastYear.setFullYear(today.getFullYear() - 1);
        
        endDateInput.valueAsDate = today;
        startDateInput.valueAsDate = lastYear;
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
 * 이벤트 리스너 등록
 */
function setupEventListeners() {
    // 로그인 폼 제출
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 검색 폼 제출
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', performSearch);
    }
    
    // 검색 버튼 클릭
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    // 엔터 키 검색 실행
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
    
    // 고급 검색 토글
    const advancedToggle = document.getElementById('advanced-toggle');
    const advancedSearch = document.getElementById('advanced-search');
    if (advancedToggle && advancedSearch) {
        advancedToggle.addEventListener('click', () => {
            advancedSearch.classList.toggle('show');
        });
    }
    
    // 상세 정보 모달 닫기
    const detailClose = document.getElementById('detail-close');
    const detailModal = document.getElementById('detail-modal');
    if (detailClose && detailModal) {
        detailClose.addEventListener('click', () => {
            detailModal.classList.remove('show');
        });
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
    
    // 비밀번호 표시 토글
    const togglePasswordElements = document.querySelectorAll('.toggle-password');
    togglePasswordElements.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggle.classList.toggle('fa-eye');
            toggle.classList.toggle('fa-eye-slash');
        });
    });
    
    // 푸터 링크
    setupFooterLinks();
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
 * 로그인 처리
 * @param {Event} e 이벤트 객체
 */
function handleLogin(e) {
    if (e) e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if(!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // 입력 확인
    if(!email || !password) {
        showAlert('이메일과 비밀번호를 모두 입력해주세요.', 'error');
        return;
    }
    
    // 테스트 계정 확인 - 항상 로그인 성공
    if(email === 'jaesu@kakao.com' && password === '1234') {
        // 로그인 성공 - 테스트 계정
        currentUser = {
            email: 'jaesu@kakao.com',
            name: '김재수'
        };
        
        // 세션에 사용자 정보 저장
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 메인 섹션 표시
        showMainSection(email);
        return;
    }
    
    // 다른 계정은 일반 인증 처리
    const user = authenticateUser(email, password);
    
    if(user) {
        // 로그인 성공
        currentUser = user;
        
        // 세션에 사용자 정보 저장
        sessionStorage.setItem('currentUser', JSON.stringify({
            email: user.email,
            name: user.name
        }));
        
        // 메인 섹션 표시
        showMainSection(email);
    } else {
        // 로그인 실패
        showAlert('이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
        passwordInput.value = '';
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
 * 검색 처리 - 통합된 검색 함수
 * @param {Event} e 이벤트 객체 (선택적)
 */
async function performSearch(e) {
    if (e) e.preventDefault();
    
    const query = document.getElementById('search-input').value.trim();
    const searchType = document.querySelector('input[name="search-type"]:checked')?.value || 
                       document.getElementById('search-type')?.value || 'text';
    
    const numberType = searchType === 'number' ? 
                      (document.querySelector('input[name="number-type"]:checked')?.value || 
                       document.getElementById('number-type')?.value || '') : '';
    
    // 검색 중 UI 표시
    const resultsContainer = document.getElementById('results-container') || document.getElementById('results-list');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="loading-spinner"></div>';
    }
    
    // 페이징 초기화
    window.resultPaging = {
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1
    };
    
    try {
        // 국가 필터 적용
        let country = '';
        if (activeFilters.countries.size > 0) {
            const countryArray = Array.from(activeFilters.countries);
            if (countryArray.length === 1) {
                country = countryArray[0];
            }
            // 다중 국가 선택은 searchSanctions 함수에서 후처리
        }
        
        // 프로그램 필터 적용
        let program = '';
        if (activeFilters.programs.size > 0) {
            const programArray = Array.from(activeFilters.programs);
            if (programArray.length === 1) {
                program = programArray[0];
            }
            // 다중 프로그램 선택은 searchSanctions 함수에서 후처리
        }
        
        // 날짜 필터 적용
        const startDate = document.getElementById('start-date')?.value || '';
        const endDate = document.getElementById('end-date')?.value || '';
        
        // 검색 실행
        const searchResult = await searchSanctions(query, country, program, searchType, numberType);
        
        // 날짜 필터링 (searchSanctions 함수에 날짜 필터 기능이 없어서 여기서 처리)
        if (startDate || endDate) {
            const startTimestamp = startDate ? new Date(startDate).getTime() : 0;
            const endTimestamp = endDate ? new Date(endDate).getTime() : Number.MAX_SAFE_INTEGER;
            
            searchResult.results = searchResult.results.filter(item => {
                // 날짜 필드가 있는지 확인 (date_listed, startDate 등)
                const itemDate = item.date_listed || 
                                (item.details && item.details.sanctions && 
                                 item.details.sanctions[0] && 
                                 item.details.sanctions[0].startDate);
                
                if (!itemDate) return true; // 날짜 없으면 포함
                
                const itemTimestamp = new Date(itemDate).getTime();
                return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
            });
        }
        
        // 다중 국가 필터링
        if (activeFilters.countries.size > 1) {
            const countries = Array.from(activeFilters.countries);
            searchResult.results = searchResult.results.filter(item => 
                countries.includes(item.country)
            );
        }
        
        // 다중 프로그램 필터링
        if (activeFilters.programs.size > 1) {
            const programs = Array.from(activeFilters.programs);
            searchResult.results = searchResult.results.filter(item => 
                item.programs && item.programs.some(prog => programs.includes(prog))
            );
        }
        
        // 검색 결과가 없는 경우
        if (searchResult.results.length === 0) {
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="no-results">
                        <h3>검색 결과가 없습니다</h3>
                        <p>다른 검색어를 시도하거나 필터를 조정해보세요.</p>
                    </div>
                `;
            }
            
            // 추천 검색어가 있는 경우
            if (searchResult.suggestions && searchResult.suggestions.length > 0) {
                displaySearchSuggestions(searchResult.suggestions);
            }
            return;
        }
        
        // 검색 결과 표시
        displayResults(searchResult.results);
        
        // 유사 검색어로 찾은 결과가 있는 경우 알림
        if (searchResult.hasSimilarMatches && !searchResult.hasExactMatches) {
            showAlert('정확한 일치 결과는 없지만 유사한 검색어로 결과를 찾았습니다.', 'info');
        }
        
    } catch (error) {
        console.error('검색 오류:', error);
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <h3>검색 중 오류가 발생했습니다</h3>
                    <p>나중에 다시 시도해주세요.</p>
                </div>
            `;
        }
        showAlert('검색 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 결과 카운트 업데이트
 * @param {number} count 결과 수
 */
function updateResultsCount(count) {
    const countElements = document.querySelectorAll('#results-count');
    countElements.forEach(element => {
        if (element) element.textContent = count;
    });
}

/**
 * 검색 결과 표시 - 통합된 함수
 * @param {Array} results 검색 결과 배열
 */
function displayResults(results) {
    // 새로운 UI (grid 레이아웃)용 결과 표시
    const resultsContainer = document.getElementById('results-container');
    // 이전 UI (list 레이아웃)용 결과 표시 호환성
    const resultsList = document.getElementById('results-list');
    
    // 타겟 컨테이너 결정
    const targetContainer = resultsContainer || resultsList;
    if (!targetContainer) return;
    
    // 검색 결과가 없는 경우
    if (!results || !results.length) {
        targetContainer.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
        return;
    }
    
    // 전역 변수에 결과 저장 (상세 정보 표시용)
    currentResults = results;
    
    // 결과 페이징 처리
    const itemsPerPage = 10;
    const totalPages = Math.ceil(results.length / itemsPerPage);
    
    // 페이지 상태 초기화
    if (!window.resultPaging) {
        window.resultPaging = {
            currentPage: 1,
            itemsPerPage: itemsPerPage,
            totalPages: totalPages
        };
    } else {
        window.resultPaging.totalPages = totalPages;
    }
    
    // 현재 페이지에 해당하는 결과만 표시
    const startIndex = (window.resultPaging.currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, results.length);
    const pageResults = results.slice(startIndex, endIndex);
    
    // UI 타입에 따라 다른 형태의 결과 표시
    if (resultsContainer) {
        // Grid UI 결과 표시 (모던 UI)
        let html = '';
        
        // 페이지가 1이면 기존 내용 지우고 새로 표시, 아니면 추가
        if (window.resultPaging.currentPage === 1) {
            resultsContainer.innerHTML = '';
        }
        
        pageResults.forEach((result) => {
            const resultTypeClass = result.type === '개인' || result.type === 'Individual' ? 'individual' : 'entity';
            const resultType = result.type === '개인' || result.type === 'Individual' ? '개인' : '단체';
            
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.dataset.id = result.id;
            
            resultCard.innerHTML = `
                <div class="result-header">
                    <h3 class="result-title">${result.name}</h3>
                    <span class="result-type ${resultTypeClass}">${resultType}</span>
                </div>
                <div class="result-body">
                    <div class="result-info">
                        <p><span class="info-label">국가:</span> ${result.country}</p>
                        <p><span class="info-label">출처:</span> ${result.source || (result.programs && result.programs.join(', ')) || '-'}</p>
                    </div>
                    <div class="result-meta">
                        ${result.date_listed ? `<p class="date-listed">등재일: ${result.date_listed}</p>` : ''}
                    </div>
                </div>
                <div class="result-footer">
                    <button class="btn-detail" onclick="showDetail('${result.id}')">상세 정보</button>
                </div>
            `;
            
            resultsContainer.appendChild(resultCard);
            
            // 카드 클릭 이벤트 등록 (상세 정보 표시)
            resultCard.addEventListener('click', function(e) {
                // 버튼 클릭은 무시 (이미 onclick 이벤트가 있음)
                if (e.target.classList.contains('btn-detail')) return;
                
                // 카드 클릭 시 상세 정보 표시
                const id = this.getAttribute('data-id');
                showDetail(id);
            });
        });
        
        // 더보기 버튼 추가
        if (window.resultPaging.currentPage < window.resultPaging.totalPages) {
            const loadMoreContainer = document.createElement('div');
            loadMoreContainer.className = 'load-more-container';
            loadMoreContainer.innerHTML = `
                <button id="load-more-btn" class="btn-primary">더 보기 (${startIndex + pageResults.length}/${results.length})</button>
            `;
            resultsContainer.appendChild(loadMoreContainer);
            
            // 더보기 버튼 클릭 이벤트
            document.getElementById('load-more-btn').addEventListener('click', function() {
                window.resultPaging.currentPage++;
                displayResults(results);
            });
        }
        
    } else if (resultsList) {
        // List UI 결과 표시 (기존 UI 호환성)
        let html = '<ul class="results-list">';
        
        pageResults.forEach((result, index) => {
            html += `
                <li class="result-item">
                    <div class="result-info">
                        <h3>${result.name}</h3>
                        <p>${result.type} | ${result.country}</p>
                        <p class="result-source">${result.source || (result.programs && result.programs.join(', ')) || '-'}</p>
                    </div>
                    <div class="result-actions">
                        <button class="btn-detail" onclick="showDetail('${result.id}')">상세 정보</button>
                    </div>
                </li>
            `;
        });
        
        html += '</ul>';
        
        // 페이지가 1이면 기존 내용 지우고 새로 표시, 아니면 추가
        if (window.resultPaging.currentPage === 1) {
            resultsList.innerHTML = html;
        } else {
            const ul = resultsList.querySelector('ul');
            if (ul) {
                ul.innerHTML += html.substring(21, html.length - 5); // <ul class="results-list"> 와 </ul> 제외
            } else {
                resultsList.innerHTML = html;
            }
        }
        
        // 더보기 버튼 추가
        if (window.resultPaging.currentPage < window.resultPaging.totalPages) {
            const loadMoreContainer = document.createElement('div');
            loadMoreContainer.className = 'load-more-container';
            loadMoreContainer.innerHTML = `
                <button id="load-more-btn" class="btn-primary">더 보기 (${startIndex + pageResults.length}/${results.length})</button>
            `;
            resultsList.appendChild(loadMoreContainer);
            
            // 더보기 버튼 클릭 이벤트
            document.getElementById('load-more-btn').addEventListener('click', function() {
                window.resultPaging.currentPage++;
                displayResults(results);
            });
        }
    }
    
    // 결과 수 업데이트
    updateResultsCount(results.length);
}

/**
 * 상세 정보 표시
 * @param {string|number} id 결과 ID 또는 인덱스
 */
function showDetail(id) {
    let result;
    
    console.log("상세정보 표시 호출, ID:", id, "현재 결과:", currentResults);
    
    // ID가 숫자인 경우 인덱스로 처리 (이전 방식)
    if (!isNaN(id)) {
        if (!currentResults || !currentResults[id]) {
            showAlert('상세 정보를 찾을 수 없습니다.', 'error');
            return;
        }
        result = currentResults[id];
    } else {
        // ID가 문자열인 경우 ID로 검색 (새 방식)
        if (!currentResults) {
            showAlert('검색 결과가 없습니다.', 'error');
            return;
        }
        result = currentResults.find(item => item.id === id);
        if (!result) {
            showAlert('상세 정보를 찾을 수 없습니다.', 'error');
            return;
        }
    }
    
    console.log("상세정보 표시 항목:", result);
    
    // UI 라이브러리에 의존하는 경우 함수 활용
    if (typeof displayDetailView === 'function') {
        displayDetailView(result);
        return;
    }
    
    const detailContent = document.getElementById('detail-content');
    const detailModal = document.getElementById('detail-modal');
    
    if (!detailContent || !detailModal) {
        console.error("상세정보 모달 요소를 찾을 수 없습니다.");
        return;
    }
    
    // 기본 상세 정보 표시 로직
    let contentHTML = `
        <div class="detail-container">
            <div class="detail-header">
                <h3>${result.name}</h3>
                <span class="detail-type ${result.type === '개인' ? 'individual' : 'entity'}">${result.type}</span>
            </div>
            <div class="detail-section">
                <h3 class="section-title">기본 정보</h3>
                <div class="detail-data">
                    <div class="data-item">
                        <span class="data-label">ID:</span>
                        <span class="data-value">${result.id}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">국가:</span>
                        <span class="data-value">${result.country}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">제재 프로그램:</span>
                        <span class="data-value">${result.programs ? result.programs.join(', ') : '-'}</span>
                    </div>
                </div>
            </div>
    `;
    
    // 상세 정보가 있는 경우 추가
    if (result.details) {
        // 별칭 정보
        if (result.details.aliases && result.details.aliases.length) {
            contentHTML += `
                <div class="detail-section">
                    <h3 class="section-title">별칭</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="aliases-list">
                                ${result.details.aliases.map(alias => `<li>${alias}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 주소 정보
        if (result.details.addresses && result.details.addresses.length) {
            contentHTML += `
                <div class="detail-section">
                    <h3 class="section-title">주소</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="addresses-list">
                                ${result.details.addresses.map(address => `<li>${address}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 신분증 정보
        if (result.details.identifications && result.details.identifications.length) {
            contentHTML += `
                <div class="detail-section">
                    <h3 class="section-title">신분증 정보</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="id-list">
                                ${result.details.identifications.map(id => `<li><strong>${id.type}:</strong> ${id.number}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 관련 제재 정보
        if (result.details.relatedSanctions && result.details.relatedSanctions.length) {
            contentHTML += `
                <div class="detail-section">
                    <h3 class="section-title">관련 제재</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="related-list">
                                ${result.details.relatedSanctions.map(sanction => `<li>${sanction.name} (${sanction.type})</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    contentHTML += '</div>';
    detailContent.innerHTML = contentHTML;
    
    // 모달 표시
    detailModal.classList.add('show');
    
    // 닫기 버튼 이벤트 등록
    const closeBtn = document.getElementById('detail-close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            detailModal.classList.remove('show');
        };
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && detailModal.classList.contains('show')) {
            detailModal.classList.remove('show');
        }
    });
}

/**
 * 초기 데이터 로드
 */
async function loadInitialData() {
    try {
        // 초기 데이터 로드 - 빈 검색으로 모든 결과 가져오기
        await performSearch();
        console.log('초기 데이터 로드 완료');
    } catch (error) {
        console.error('초기 데이터 로드 오류:', error);
        showAlert('데이터 로드 중 오류가 발생했습니다.', 'error');
    }
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
 * 고급 검색 토글 및 검색 유형 선택 이벤트 핸들러 설정
 */
function setupSearchOptions() {
    // 고급 검색 토글
    const advancedSearchButton = document.getElementById('advanced-search-button');
    const advancedSearchOptions = document.querySelector('.advanced-search-options');
    
    if (advancedSearchButton && advancedSearchOptions) {
        advancedSearchButton.addEventListener('click', () => {
            const isVisible = advancedSearchOptions.style.display !== 'none';
            advancedSearchOptions.style.display = isVisible ? 'none' : 'block';
            
            // 아이콘 회전
            const icon = advancedSearchButton.querySelector('i');
            if (icon) {
                icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
                icon.style.transition = 'transform 0.3s';
            }
        });
    }
    
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

/**
 * 알림 표시
 * @param {string} message 알림 메시지
 * @param {string} type 알림 타입 (info, success, warning, error)
 * @param {Object} options 옵션 객체
 */
function showAlert(message, type = 'info', options = {}) {
    const defaults = {
        duration: 3000,            // 알림 표시 시간 (ms)
        isStatic: false,           // true면 자동으로 사라지지 않음
        target: '.alert-container' // 알림을 표시할 컨테이너 선택자
    };
    
    const settings = { ...defaults, ...options };
    
    const alertContainer = document.querySelector(settings.target);
    if (!alertContainer) return;
    
    // 새 알림 생성
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    
    // 알림 내용 추가
    alertElement.innerHTML = `
        <div class="alert-content">${message}</div>
        <button class="alert-close">&times;</button>
    `;
    
    // 닫기 버튼 설정
    const closeButton = alertElement.querySelector('.alert-close');
    closeButton.addEventListener('click', () => {
        alertElement.classList.add('fade-out');
        setTimeout(() => {
            if (alertContainer.contains(alertElement)) {
                alertContainer.removeChild(alertElement);
            }
        }, 300);
    });
    
    // 컨테이너에 알림 추가
    alertContainer.appendChild(alertElement);
    
    // 일정 시간 후 자동으로 사라지기
    if (!settings.isStatic) {
        setTimeout(() => {
            alertElement.classList.add('fade-out');
            setTimeout(() => {
                if (alertContainer.contains(alertElement)) {
                    alertContainer.removeChild(alertElement);
                }
            }, 300);
        }, settings.duration);
    }
}


/**
 * 제재 데이터 검색 API 호출 시뮬레이션
 * @param {Object} params 검색 파라미터
 * @returns {Promise<Array>} 검색 결과 배열
 */
async function searchSanctionData(params) {
    console.log('API 호출 파라미터:', params);
    
    return new Promise((resolve) => {
        // 서버 응답 시뮬레이션 (1초 딜레이)
        setTimeout(() => {
            // 데이터 가져오기
            const sanctions = getSampleSanctionsData();
            let results = [...sanctions];
            
            // 필터링 로직
            // 텍스트 검색
            if(params.query && params.type === 'text') {
                const query = params.query.toLowerCase();
                results = results.filter(item => 
                    item.name.toLowerCase().includes(query) || 
                    (item.alias && item.alias.toLowerCase().includes(query))
                );
            }
            
            // 번호 검색
            if(params.query && params.type === 'number') {
                const query = params.query;
                results = results.filter(item => {
                    // 개인인 경우 여권번호나 신분증번호 확인
                    if(item.type === '개인') {
                        const passportMatch = item.details.passportNumbers && 
                            item.details.passportNumbers.some(num => num.includes(query));
                        const idMatch = item.details.idNumbers && 
                            item.details.idNumbers.some(num => num.includes(query));
                        
                        if(params.numberType === 'passport') {
                            return passportMatch;
                        } else if(params.numberType === 'id') {
                            return idMatch;
                        } else {
                            return passportMatch || idMatch;
                        }
                    }
                    return false;
                });
            }
            
            // 국가 필터
            if(params.country) {
                results = results.filter(item => item.country === params.country);
            }
            
            // 프로그램 필터
            if(params.program) {
                results = results.filter(item => item.program === params.program);
            }
            
            // 날짜 범위 필터
            if(params.startDate) {
                results = results.filter(item => new Date(item.listDate) >= new Date(params.startDate));
            }
            
            if(params.endDate) {
                results = results.filter(item => new Date(item.listDate) <= new Date(params.endDate));
            }
            
            resolve(results);
        }, 1000);
    });
}

/**
 * 제재 대상 상세 정보 조회 시뮬레이션
 * @param {string} id 제재 대상 ID
 * @returns {Promise<Object>} 제재 대상 상세 정보
 */
async function getSanctionDetail(id) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // 샘플 데이터에서 ID로 검색
            const sanctions = getSampleSanctionsData();
            const foundItem = sanctions.find(item => item.id === id);
            resolve(foundItem || null);
        }, 500);
    });
}

// 전역 함수 노출
window.showDetail = showDetail;
window.performSearch = performSearch;

// 함수 내보내기
export {
    showDetail,
    performSearch,
    showAlert,
    handleLogin,
    handleLogout,
    checkSession,
    searchSanctionData,
    getSanctionDetail
};