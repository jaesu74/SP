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

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * 애플리케이션 초기화
 */
function initializeApp() {
    console.log('세계 경제 제재 검색 서비스 초기화...');
    
    // 로그인 상태 확인
    checkLoginStatus();
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 필터 및 검색 옵션 설정
    setupFilterOptions();
    setupSearchOptions();
    setupAutocomplete();
    
    // 초기 데이터 로드
    loadInitialData();
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
function checkLoginStatus() {
    const { isLoggedIn, email } = getUserFromStorage();
    
    if (isLoggedIn && email) {
        showMainSection(email);
    } else {
        showLoginSection();
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
    const countrySelect = document.getElementById('country');
    const programSelect = document.getElementById('program');
    
    if (countrySelect) {
        // 국가 선택 드롭다운을 다중 선택 목록으로 대체
        const countryOptions = `
            <div class="filter-options country-options">
                <div class="filter-option" data-value="">모든 국가</div>
                <div class="filter-option" data-value="NK">북한</div>
                <div class="filter-option" data-value="RU">러시아</div>
                <div class="filter-option" data-value="IR">이란</div>
                <div class="filter-option" data-value="SY">시리아</div>
            </div>
        `;
        
        // 새로운 필터 컨테이너 생성
        const countryFilterContainer = document.createElement('div');
        countryFilterContainer.className = 'filter-container';
        countryFilterContainer.innerHTML = `
            <label>국가</label>
            <div class="filter-selected">모든 국가</div>
            ${countryOptions}
        `;
        
        // 기존 select 요소 대체
        countrySelect.parentNode.replaceChild(countryFilterContainer, countrySelect);
    }
    
    if (programSelect) {
        // 프로그램 선택 드롭다운을 다중 선택 목록으로 대체
        const programOptions = `
            <div class="filter-options program-options">
                <div class="filter-option" data-value="">모든 프로그램</div>
                <div class="filter-option" data-value="UN_SANCTIONS">UN 제재</div>
                <div class="filter-option" data-value="EU_SANCTIONS">EU 제재</div>
                <div class="filter-option" data-value="US_SANCTIONS">US 제재</div>
            </div>
        `;
        
        // 새로운 필터 컨테이너 생성
        const programFilterContainer = document.createElement('div');
        programFilterContainer.className = 'filter-container';
        programFilterContainer.innerHTML = `
            <label>제재 프로그램</label>
            <div class="filter-selected">모든 프로그램</div>
            ${programOptions}
        `;
        
        // 기존 select 요소 대체
        programSelect.parentNode.replaceChild(programFilterContainer, programSelect);
    }
    
    // 필터 옵션 클릭 이벤트 처리
    const filterContainers = document.querySelectorAll('.filter-container');
    filterContainers.forEach(container => {
        // 선택된 항목 표시 영역에 클릭 이벤트 추가
        const selectedDisplay = container.querySelector('.filter-selected');
        if (selectedDisplay) {
            selectedDisplay.addEventListener('click', () => {
                // 옵션 목록 표시/숨김
                const options = container.querySelector('.filter-options');
                options.classList.toggle('show');
            });
        }
        
        // 옵션 항목 클릭 이벤트 추가
        const options = container.querySelectorAll('.filter-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                const value = option.getAttribute('data-value');
                const isCountryFilter = container.querySelector('.country-options') !== null;
                const isProgramFilter = container.querySelector('.program-options') !== null;
                
                // 모든 필터 선택 시 다른 선택 해제
                if (!value) {
                    if (isCountryFilter) {
                        activeFilters.countries.clear();
                        updateFilterDisplay(container, '모든 국가', true);
                    } else if (isProgramFilter) {
                        activeFilters.programs.clear();
                        updateFilterDisplay(container, '모든 프로그램', true);
                    }
                } else {
                    if (isCountryFilter) {
                        // 모든 국가 옵션이 선택된 상태인지 확인
                        const allSelected = activeFilters.countries.size === 0;
                        
                        if (allSelected) {
                            // 모든 국가가 선택된 상태라면 새로운 선택으로 대체
                            activeFilters.countries.add(value);
                        } else {
                            // 이미 선택된 항목이면 제거, 아니면 추가
                            if (activeFilters.countries.has(value)) {
                                activeFilters.countries.delete(value);
                                // 모든 필터가 제거되면 '모든 국가' 선택
                                if (activeFilters.countries.size === 0) {
                                    updateFilterDisplay(container, '모든 국가', true);
                                } else {
                                    updateFilterDisplay(container, getSelectedFiltersText(activeFilters.countries), false);
                                }
                            } else {
                                activeFilters.countries.add(value);
                                updateFilterDisplay(container, getSelectedFiltersText(activeFilters.countries), false);
                            }
                        }
                    } else if (isProgramFilter) {
                        // 모든 프로그램 옵션이 선택된 상태인지 확인
                        const allSelected = activeFilters.programs.size === 0;
                        
                        if (allSelected) {
                            // 모든 프로그램이 선택된 상태라면 새로운 선택으로 대체
                            activeFilters.programs.add(value);
                        } else {
                            // 이미 선택된 항목이면 제거, 아니면 추가
                            if (activeFilters.programs.has(value)) {
                                activeFilters.programs.delete(value);
                                // 모든 필터가 제거되면 '모든 프로그램' 선택
                                if (activeFilters.programs.size === 0) {
                                    updateFilterDisplay(container, '모든 프로그램', true);
                                } else {
                                    updateFilterDisplay(container, getSelectedFiltersText(activeFilters.programs), false);
                                }
                            } else {
                                activeFilters.programs.add(value);
                                updateFilterDisplay(container, getSelectedFiltersText(activeFilters.programs), false);
                            }
                        }
                    }
                }
                
                // 옵션 선택 시 옵션 목록 숨김
                container.querySelector('.filter-options').classList.remove('show');
                
                // 옵션 스타일 업데이트
                updateOptionStyles(container);
            });
        });
    });
    
    // 외부 클릭 시 옵션 목록 닫기
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-container')) {
            document.querySelectorAll('.filter-options').forEach(options => {
                options.classList.remove('show');
            });
        }
    });
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
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // 테스트 계정 확인
        if (email === 'jaesu@kakao.com' && password === '1234') {
            // 로그인 성공
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userName', '김재수');
            
            console.log('테스트 계정으로 로그인 성공!');
            
            // 메인 페이지로 전환
            showMainSection(email);
            
            // 성공 메시지
            showAlert('로그인 성공!', 'success');
            
            // 초기 검색 실행 (전체 데이터 로드)
            performSearch();
            return;
        }
        
        // 등록된 사용자 확인
        const user = users.find(user => user.email === email && user.password === password);
        if (user) {
            // 로그인 성공
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userName', user.name);
            
            // 메인 페이지로 전환
            showMainSection(user.email);
            
            // 성공 메시지
            showAlert('로그인 성공!', 'success');
            
            // 초기 검색 실행 (전체 데이터 로드)
            performSearch();
        } else {
            showAlert('이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        showAlert('로그인 중 오류가 발생했습니다.', 'error');
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
    
    if (!query && !e) {
        // 초기 로드 시에는 빈 쿼리 허용 (모든 결과 표시)
    } else if (!query) {
        showAlert('검색어를 입력해주세요.', 'error');
        return;
    }
    
    // 검색 중 UI 표시
    const resultsContainer = document.getElementById('results-container') || document.getElementById('results-list');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="loading-spinner"></div>';
    }
    
    try {
        // 선택된 필터 가져오기
        const selectedCountries = Array.from(document.querySelectorAll('.filter-option.country.selected'))
            .map(el => el.dataset.value);
        const selectedPrograms = Array.from(document.querySelectorAll('.filter-option.program.selected'))
            .map(el => el.dataset.value);
        
        // API 함수 호출
        const country = selectedCountries.length > 0 ? selectedCountries[0] : '';
        const program = selectedPrograms.length > 0 ? selectedPrograms[0] : '';
        
        let searchResult = await searchSanctions(query, country, program, searchType, numberType);
        
        // 이전 방식 호환 - 다중 필터 적용
        if (activeFilters.countries.size > 0) {
            searchResult.results = searchResult.results.filter(item => 
                Array.from(activeFilters.countries).some(c => item.country === c)
            );
        }
        
        if (activeFilters.programs.size > 0) {
            searchResult.results = searchResult.results.filter(item => 
                item.programs.some(program => activeFilters.programs.has(program))
            );
        }
        
        // 전역 변수에 결과 저장
        currentResults = searchResult.results;
        
        // 결과 수 업데이트
        updateResultsCount(searchResult.results.length);
        
        // 검색 결과가 있는 경우
        if (searchResult.results.length > 0) {
            displayResults(searchResult.results);
            
            // 유사 검색어로 찾은 결과가 있는 경우 알림
            if (searchResult.hasSimilarMatches && !searchResult.hasExactMatches) {
                showAlert('정확한 일치 결과는 없지만 유사한 검색어로 결과를 찾았습니다.', 'info');
            }
        } else {
            // 검색 결과가 없는 경우
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
    
    // UI 타입에 따라 다른 형태의 결과 표시
    if (resultsContainer) {
        // Grid UI 결과 표시 (모던 UI)
        let html = '';
        
        results.forEach((result, index) => {
            const resultTypeClass = result.type === '개인' || result.type === 'Individual' ? 'individual' : 'entity';
            const resultType = result.type === '개인' || result.type === 'Individual' ? '개인' : '단체';
            
            html += `
                <div class="result-card" data-id="${result.id}">
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
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
        
        // 카드 클릭 이벤트 등록 (상세 정보 표시)
        const resultCards = document.querySelectorAll('.result-card');
        resultCards.forEach(card => {
            card.addEventListener('click', function(e) {
                // 버튼 클릭은 무시 (이미 onclick 이벤트가 있음)
                if (e.target.classList.contains('btn-detail')) return;
                
                // 카드 클릭 시 상세 정보 표시
                const id = this.getAttribute('data-id');
                showDetail(id);
            });
        });
        
    } else if (resultsList) {
        // List UI 결과 표시 (기존 UI 호환성)
        let html = '<ul class="results-list">';
        
        results.forEach((result, index) => {
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
        resultsList.innerHTML = html;
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
    
    const detailContent = document.getElementById('detail-content');
    const detailModal = document.getElementById('detail-modal');
    
    if (!detailContent || !detailModal) return;
    
    // UI 라이브러리에 의존하는 경우 함수 활용
    if (typeof displayDetailView === 'function') {
        displayDetailView(result);
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