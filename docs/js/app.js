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
    // 로그인 폼 제출 이벤트
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 로그아웃 버튼 클릭 이벤트
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 비밀번호 토글 이벤트
    const togglePassword = document.querySelector('.toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', togglePasswordVisibility);
    }
    
    // 검색 버튼 클릭 이벤트
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }
    
    // 검색창 엔터 키 이벤트
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // 고급 검색 토글 버튼
    const advancedSearchBtn = document.getElementById('advanced-search-button');
    if (advancedSearchBtn) {
        advancedSearchBtn.addEventListener('click', toggleAdvancedSearch);
    }
    
    // 정렬 드롭다운 변경 이벤트
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortResults);
    }

    // 이용약관, 개인정보처리방침, 도움말 링크 이벤트 리스너
    const termsLink = document.getElementById('terms-link');
    const privacyLink = document.getElementById('privacy-link');
    const helpLink = document.getElementById('help-link');
    
    if (termsLink) {
        termsLink.addEventListener('click', showTermsModal);
    }
    
    if (privacyLink) {
        privacyLink.addEventListener('click', showPrivacyModal);
    }
    
    if (helpLink) {
        helpLink.addEventListener('click', showHelpModal);
    }
    
    // 필터 옵션 이벤트
    setupFilterOptionEvents();
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
            localStorage.setItem('userName', '재수');
            
            // 메인 페이지로 전환
            showMainSection(email);
            
            // 성공 메시지
            showAlert('로그인 성공!', 'success');
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
 * 검색 처리 함수
 */
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    // 로딩 상태 표시
    showLoading();
    
    // 필터 옵션 수집
    const options = {
        countries: activeFilters.countries,
        programs: activeFilters.programs,
        startDate: document.getElementById('start-date')?.value,
        endDate: document.getElementById('end-date')?.value,
        searchType: document.querySelector('input[name="search-type"]:checked')?.value || 'text',
        numberType: document.querySelector('input[name="number-type"]:checked')?.value || 'passport'
    };
    
    // 검색 API 호출
    searchSanctions(query, options)
        .then(results => {
            // 결과 표시
            displayResults(results);
            updateResultsCount(results.length);
            hideLoading();
        })
        .catch(error => {
            console.error('검색 오류:', error);
            showAlert('검색 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
            hideLoading();
        });
}

/**
 * 결과 표시 함수
 * @param {Array} results 검색 결과
 */
function displayResults(results) {
    const resultsContainer = document.getElementById('results-container');
    
    if (!resultsContainer) return;
    
    // 컨테이너 초기화
    resultsContainer.innerHTML = '';
    
    // 결과가 없는 경우
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>검색 결과가 없습니다</h3>
                <p>다른 검색어로 다시 시도하거나 필터를 조정해보세요.</p>
            </div>
        `;
        return;
    }
    
    // 결과가 있는 경우, 각 항목을 카드로 표시
    results.forEach(item => {
        // 결과 카드 생성
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.dataset.id = item.id;
        resultCard.dataset.type = item.type;
        
        // 카드 콘텐츠 설정
        resultCard.innerHTML = `
            <h3>${item.name}</h3>
            <div class="result-meta">
                <div class="result-meta-item">
                    <i class="fas fa-globe"></i> ${item.country}
                </div>
                <div class="result-meta-item">
                    <i class="fas fa-tag"></i> ${item.type}
                </div>
                ${item.details && item.details.sanctionDate ? `
                <div class="result-meta-item">
                    <i class="fas fa-calendar"></i> ${formatDate(item.details.sanctionDate)}
                </div>` : ''}
            </div>
            <div class="result-description">
                ${item.details && item.details.description ? item.details.description.substring(0, 150) + (item.details.description.length > 150 ? '...' : '') : '상세 설명 없음'}
            </div>
            <div class="result-programs">
                ${item.programs.map(program => `<span class="program-tag">${formatProgramName(program)}</span>`).join('')}
            </div>
            <button class="view-details-button" data-id="${item.id}">상세 정보 보기</button>
        `;
        
        // 상세 정보 버튼 이벤트 추가
        setTimeout(() => {
            const detailBtn = resultCard.querySelector('.view-details-button');
            if (detailBtn) {
                detailBtn.addEventListener('click', function() {
                    showSanctionDetails(this.getAttribute('data-id'));
                });
            }
        }, 0);
        
        // 카드를 결과 컨테이너에 추가
        resultsContainer.appendChild(resultCard);
    });
}

/**
 * 고급 검색 토글 함수
 */
function toggleAdvancedSearch() {
    const advancedSearch = document.querySelector('.advanced-search-options');
    const toggleBtn = document.getElementById('advanced-search-button');
    
    if (advancedSearch) {
        const isVisible = advancedSearch.style.display !== 'none';
        advancedSearch.style.display = isVisible ? 'none' : 'block';
        
        // 버튼 아이콘 회전
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
}

/**
 * 초기 필터 옵션 활성화
 */
function activateFilters() {
    // 국가별 필터 활성화
    const countryOptions = document.querySelectorAll('.filter-option.country');
    countryOptions.forEach(option => {
        option.addEventListener('click', function() {
            const isSelected = this.classList.contains('selected');
            const value = this.getAttribute('data-value');
            
            if (isSelected) {
                this.classList.remove('selected');
                activeFilters.countries.delete(value);
            } else {
                this.classList.add('selected');
                activeFilters.countries.add(value);
            }
            
            console.log('활성화된 국가 필터:', activeFilters.countries);
        });
    });
    
    // 프로그램별 필터 활성화
    const programOptions = document.querySelectorAll('.filter-option.program');
    programOptions.forEach(option => {
        option.addEventListener('click', function() {
            const isSelected = this.classList.contains('selected');
            const value = this.getAttribute('data-value');
            
            if (isSelected) {
                this.classList.remove('selected');
                activeFilters.programs.delete(value);
            } else {
                this.classList.add('selected');
                activeFilters.programs.add(value);
            }
            
            console.log('활성화된 프로그램 필터:', activeFilters.programs);
        });
    });
    
    // 날짜 필터 활성화
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    
    if (startDate) {
        startDate.addEventListener('change', function() {
            if (endDate && endDate.value && new Date(this.value) > new Date(endDate.value)) {
                showAlert('시작일은 종료일보다 이전이어야 합니다.', 'error');
                this.value = '';
            }
        });
    }
    
    if (endDate) {
        endDate.addEventListener('change', function() {
            if (startDate && startDate.value && new Date(this.value) < new Date(startDate.value)) {
                showAlert('종료일은 시작일보다 이후여야 합니다.', 'error');
                this.value = '';
            }
        });
    }
}

/**
 * 필터 결과 적용
 */
function filterResults() {
    // 현재 검색어 가져오기
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.trim() : '';
    
    // 필터 옵션 수집
    const options = {
        countries: activeFilters.countries,
        programs: activeFilters.programs,
        startDate: document.getElementById('start-date')?.value,
        endDate: document.getElementById('end-date')?.value
    };
    
    // 검색 API 호출
    searchSanctions(query, options)
        .then(results => {
            // 결과 표시
            displayResults(results);
            updateResultsCount(results.length);
        })
        .catch(error => {
            console.error('필터 적용 오류:', error);
            showAlert('필터 적용 중 오류가 발생했습니다.', 'error');
        });
}

/**
 * 검색 옵션 설정
 */
function setupSearchOptions() {
    // 검색 유형 옵션 설정
    const searchTypeOptions = document.querySelectorAll('.search-type-options .search-option');
    const numberTypeOptions = document.querySelector('.number-type-options');
    
    searchTypeOptions.forEach(option => {
        const input = option.querySelector('input');
        if (input) {
            input.addEventListener('change', function() {
                // 모든 옵션에서 active 클래스 제거
                searchTypeOptions.forEach(opt => opt.classList.remove('active'));
                // 선택된 옵션에만 active 클래스 추가
                this.closest('.search-option').classList.add('active');
                
                // 번호 검색일 경우 번호 유형 옵션 표시
                if (this.value === 'number' && numberTypeOptions) {
                    numberTypeOptions.style.display = 'flex';
                } else if (numberTypeOptions) {
                    numberTypeOptions.style.display = 'none';
                }
            });
        }
    });
    
    // 번호 유형 옵션 설정
    const numberTypeRadios = document.querySelectorAll('.number-type-options .search-option input');
    numberTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.number-type-options .search-option').forEach(opt => 
                opt.classList.remove('active'));
            this.closest('.search-option').classList.add('active');
        });
    });
}

/**
 * 페이지 초기 데이터 로드
 */
async function loadInitialData() {
    try {
        // 로딩 상태 표시
        showLoading();
        
        // 결과 카운트 초기화
        updateResultsCount(0);
        
        // 필터 초기화 및 활성화
        activateFilters();
        
        // 로딩 상태 제거
        hideLoading();
        
    } catch (error) {
        console.error('초기 데이터 로드 오류:', error);
        showAlert('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
        hideLoading();
    }
}

/**
 * 프로그램 이름 포맷팅
 * @param {string} program 프로그램 코드
 * @returns {string} 포맷팅된 프로그램 이름
 */
function formatProgramName(program) {
    if (program.includes('UN_SANCTIONS')) {
        return 'UN 제재';
    } else if (program.includes('EU_SANCTIONS')) {
        return 'EU 제재';
    } else if (program.includes('US_SANCTIONS')) {
        return 'US 제재';
    } else if (program.includes('KR')) {
        return '한국 제재';
    }
    return program;
}

/**
 * 날짜 포맷팅
 * @param {string} dateString 날짜 문자열
 * @returns {string} 포맷팅된 날짜
 */
function formatDate(dateString) {
    if (!dateString) return '날짜 정보 없음';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * 제재 상세 정보 표시
 * @param {number} id 제재 ID
 */
async function showSanctionDetails(id) {
    try {
        // 로딩 상태 표시
        showLoading();
        
        // 제재 상세 정보 가져오기
        const sanctionDetails = await getSanctionDetails(id);
        if (!sanctionDetails) {
            throw new Error('상세 정보를 가져올 수 없습니다.');
        }
        
        // 상세 정보 모달 생성
        const modalContent = createDetailModalContent(sanctionDetails);
        
        // 모달 표시
        showModal('제재 상세 정보', modalContent);
        
        // 로딩 상태 제거
        hideLoading();
        
    } catch (error) {
        console.error('상세 정보 표시 오류:', error);
        showAlert('상세 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        hideLoading();
    }
}

/**
 * 상세 정보 모달 콘텐츠 생성
 * @param {Object} data 제재 상세 데이터
 * @returns {HTMLElement} 모달 콘텐츠 요소
 */
function createDetailModalContent(data) {
    const modalContent = document.createElement('div');
    modalContent.className = 'detail-modal-content';
    
    // 헤더 정보 (이름, 유형, 국적 등)
    const headerInfo = document.createElement('div');
    headerInfo.className = 'detail-header';
    headerInfo.innerHTML = `
        <h2>${data.name}</h2>
        <div class="detail-type">
            <span class="detail-label">유형:</span>
            <span class="detail-value">${data.type || '정보 없음'}</span>
        </div>
        <div class="detail-nationality">
            <span class="detail-label">국적:</span>
            <span class="detail-value">${data.nationality || '정보 없음'}</span>
        </div>
        ${data.dateOfBirth ? `
        <div class="detail-dob">
            <span class="detail-label">생년월일:</span>
            <span class="detail-value">${data.dateOfBirth}</span>
        </div>` : ''}
    `;
    
    // 프로그램 정보
    const programsInfo = document.createElement('div');
    programsInfo.className = 'detail-programs';
    let programsHTML = '<h3>적용 제재 프로그램</h3><div class="programs-list">';
    
    if (data.programs && data.programs.length > 0) {
        data.programs.forEach(program => {
            programsHTML += `<div class="program-tag">${program}</div>`;
        });
    } else {
        programsHTML += '<p>등록된 제재 프로그램이 없습니다.</p>';
    }
    
    programsHTML += '</div>';
    programsInfo.innerHTML = programsHTML;
    
    // 별칭 정보
    const aliasesInfo = document.createElement('div');
    aliasesInfo.className = 'detail-aliases';
    let aliasesHTML = '<h3>별칭</h3><ul class="aliases-list">';
    
    if (data.aliases && data.aliases.length > 0) {
        data.aliases.forEach(alias => {
            aliasesHTML += `<li>${alias}</li>`;
        });
    } else {
        aliasesHTML += '<li>등록된 별칭이 없습니다.</li>';
    }
    
    aliasesHTML += '</ul>';
    aliasesInfo.innerHTML = aliasesHTML;
    
    // 주소 정보
    const addressesInfo = document.createElement('div');
    addressesInfo.className = 'detail-addresses';
    let addressesHTML = '<h3>알려진 주소</h3><ul class="addresses-list">';
    
    if (data.addresses && data.addresses.length > 0) {
        data.addresses.forEach(address => {
            addressesHTML += `<li>${address}</li>`;
        });
    } else {
        addressesHTML += '<li>등록된 주소가 없습니다.</li>';
    }
    
    addressesHTML += '</ul>';
    addressesInfo.innerHTML = addressesHTML;
    
    // 관련 제재 정보
    const relatedSanctionsInfo = document.createElement('div');
    relatedSanctionsInfo.className = 'detail-related-sanctions';
    let relatedHTML = '<h3>관련 제재</h3>';
    
    if (data.relatedSanctions && data.relatedSanctions.length > 0) {
        relatedHTML += '<ul class="related-sanctions-list">';
        data.relatedSanctions.forEach(sanction => {
            relatedHTML += `
                <li>
                    <span class="related-name">${sanction.name}</span>
                    <span class="related-relationship">(${sanction.relationship})</span>
                    <button class="btn-link view-related-details" data-id="${sanction.id}">상세보기</button>
                </li>
            `;
        });
        relatedHTML += '</ul>';
    } else {
        relatedHTML += '<p>관련 제재 정보가 없습니다.</p>';
    }
    
    relatedSanctionsInfo.innerHTML = relatedHTML;
    
    // 모달 콘텐츠에 모든 섹션 추가
    modalContent.appendChild(headerInfo);
    modalContent.appendChild(programsInfo);
    modalContent.appendChild(aliasesInfo);
    modalContent.appendChild(addressesInfo);
    modalContent.appendChild(relatedSanctionsInfo);
    
    // 관련 제재 상세 보기 버튼 이벤트 추가
    setTimeout(() => {
        const relatedButtons = modalContent.querySelectorAll('.view-related-details');
        relatedButtons.forEach(button => {
            button.addEventListener('click', function() {
                const relatedId = this.getAttribute('data-id');
                // 현재 모달 닫고 관련 제재 상세 정보 표시
                closeModal();
                showSanctionDetails(relatedId);
            });
        });
    }, 0);
    
    return modalContent;
}

/**
 * 결과 카운트 업데이트
 * @param {number} count 결과 수
 */
function updateResultsCount(count) {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

/**
 * 로딩 상태 표시
 */
function showLoading() {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="loading-spinner"></div>';
    }
}

/**
 * 로딩 상태 숨김
 */
function hideLoading() {
    // 로딩 스피너가 있으면 제거
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

/**
 * 검색 결과 정렬
 */
function sortResults() {
    const sortSelect = document.getElementById('sort-select');
    const resultsContainer = document.getElementById('results-container');
    
    if (!sortSelect || !resultsContainer) return;
    
    // 현재 결과 카드들 수집
    const cards = Array.from(resultsContainer.querySelectorAll('.result-card'));
    if (cards.length === 0) return;
    
    // 정렬 기준
    const sortBy = sortSelect.value;
    
    // 카드 정렬
    cards.sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                const dateA = a.querySelector('.fa-calendar')?.parentNode.textContent.trim() || '';
                const dateB = b.querySelector('.fa-calendar')?.parentNode.textContent.trim() || '';
                return new Date(dateB) - new Date(dateA);
                
            case 'date-asc':
                const dateAsc1 = a.querySelector('.fa-calendar')?.parentNode.textContent.trim() || '';
                const dateAsc2 = b.querySelector('.fa-calendar')?.parentNode.textContent.trim() || '';
                return new Date(dateAsc1) - new Date(dateAsc2);
                
            case 'name-asc':
                const nameA = a.querySelector('h3').textContent.trim();
                const nameB = b.querySelector('h3').textContent.trim();
                return nameA.localeCompare(nameB);
                
            default: // relevance (기본값)
                return 0;
        }
    });
    
    // 결과 컨테이너 비우기
    resultsContainer.innerHTML = '';
    
    // 정렬된 카드 추가
    cards.forEach(card => {
        resultsContainer.appendChild(card);
    });
}