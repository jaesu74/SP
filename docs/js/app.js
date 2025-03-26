/**
 * 세계 경제 제재 검색 서비스
 * 메인 애플리케이션 파일
 */

import { fetchSanctionsData, searchSanctions, getSanctionDetails } from './api.js';

// 전역 변수
let currentResults = [];

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
}

/**
 * 로그인 상태 확인
 */
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    
    if (isLoggedIn && userEmail) {
        showMainSection(userEmail);
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
    const userName = email.split('@')[0];
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) userNameElement.textContent = userName || '사용자';
    
    // 푸터 스타일 조정
    adjustFooterForMainSection();
    
    // 초기 데이터 로드
    loadInitialData();
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
 * 푸터 스타일 로그인 페이지용으로 조정
 */
function adjustFooterForLoginSection() {
    const footer = document.querySelector('.main-footer');
    if (footer) {
        footer.classList.add('login-footer');
    }
}

/**
 * 푸터 스타일 메인 페이지용으로 조정
 */
function adjustFooterForMainSection() {
    const footer = document.querySelector('.main-footer');
    if (footer) {
        footer.classList.remove('login-footer');
    }
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
        searchForm.addEventListener('submit', handleSearch);
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
    
    // 비밀번호 표시 토글
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }
    
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
            
            // 메인 페이지로 전환
            showMainSection(email);
            
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
 * 검색 처리
 * @param {Event} e 이벤트 객체
 */
async function handleSearch(e) {
    e.preventDefault();
    
    const query = document.getElementById('search-input').value.trim();
    const country = document.getElementById('country').value;
    const program = document.getElementById('program').value;
    const searchType = document.getElementById('search-type').value;
    const numberType = document.getElementById('number-type').value;
    
    if (!query) {
        showAlert('검색어를 입력해주세요.', 'error');
        return;
    }
    
    try {
        // 검색 수행
        const results = await searchSanctions(query, country, program, searchType, numberType);
        
        // 전역 변수에 결과 저장
        currentResults = results;
        
        // 결과 표시
        displayResults(results);
        
        // 결과 수 업데이트
        document.getElementById('results-count').textContent = results.length;
    } catch (error) {
        console.error('검색 오류:', error);
        showAlert('검색 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 검색 결과 표시
 * @param {Array} results 검색 결과 배열
 */
function displayResults(results) {
    const resultsList = document.getElementById('results-list');
    
    if (!resultsList) return;
    
    if (!results.length) {
        resultsList.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
        return;
    }
    
    resultsList.innerHTML = results.map((result, index) => `
        <div class="result-item" data-id="${index}">
            <div class="result-header">
                <h3>${result.name}</h3>
                <span class="result-type">${result.type}</span>
            </div>
            <div class="result-body">
                <p class="result-country">국가: ${result.country}</p>
                <p class="result-programs">제재 프로그램: ${result.programs.join(', ')}</p>
            </div>
            <div class="result-footer">
                <button class="btn-detail" onclick="showDetail(${index})">
                    상세 정보
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * 상세 정보 표시
 * @param {number} index 결과 인덱스
 */
function showDetail(index) {
    if (!currentResults || !currentResults[index]) {
        showAlert('상세 정보를 찾을 수 없습니다.', 'error');
        return;
    }
    
    const result = currentResults[index];
    const detailContent = document.getElementById('detail-content');
    const detailModal = document.getElementById('detail-modal');
    
    if (!detailContent || !detailModal) return;
    
    detailContent.innerHTML = `
        <div class="detail-header">
            <h2>${result.name}</h2>
            <span class="detail-type">${result.type}</span>
        </div>
        <div class="detail-body">
            <div class="detail-section">
                <h3>기본 정보</h3>
                <p><strong>국가:</strong> ${result.country}</p>
                <p><strong>제재 프로그램:</strong> ${result.programs.join(', ')}</p>
            </div>
            <div class="detail-section">
                <h3>별칭</h3>
                <ul>
                    ${result.details.aliases.map(alias => `<li>${alias}</li>`).join('')}
                </ul>
            </div>
            <div class="detail-section">
                <h3>주소</h3>
                <ul>
                    ${result.details.addresses.map(addr => `<li>${addr}</li>`).join('')}
                </ul>
            </div>
            ${result.details.identifications && result.details.identifications.length ? `
                <div class="detail-section">
                    <h3>신분증 정보</h3>
                    <ul>
                        ${result.details.identifications.map(id => `<li>${id.type}: ${id.number}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${result.details.relatedSanctions && result.details.relatedSanctions.length ? `
                <div class="detail-section">
                    <h3>관련 제재</h3>
                    <ul>
                        ${result.details.relatedSanctions.map(sanction => `<li>${sanction.name} (${sanction.type})</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    detailModal.classList.add('show');
}

/**
 * 초기 데이터 로드
 */
async function loadInitialData() {
    try {
        await fetchSanctionsData();
        console.log('초기 데이터 로드 완료');
    } catch (error) {
        console.error('초기 데이터 로드 오류:', error);
        showAlert('데이터 로드 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 알림 표시
 * @param {string} message 메시지
 * @param {string} type 알림 유형
 */
function showAlert(message, type = 'info') {
    const alertContainers = document.querySelectorAll('.alert-container');
    
    if (!alertContainers.length) return;
    
    // 현재 보이는 alert-container에 알림 추가
    const visibleContainer = Array.from(alertContainers).find(container => {
        const parent = container.closest('section');
        return parent && window.getComputedStyle(parent).display !== 'none';
    }) || alertContainers[0];
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    visibleContainer.appendChild(alert);
    
    // 3초 후 알림 제거
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// 전역 함수로 노출 (HTML 이벤트 처리용)
window.showDetail = showDetail;