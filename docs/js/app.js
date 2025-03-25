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

/**
 * 검색 수행
 */
function performSearch(query) {
    // 로딩 인디케이터 표시
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    // 결과 영역 초기화
    const resultsArea = document.getElementById('results-area');
    const resultsList = document.getElementById('results-list');
    const noResults = document.getElementById('no-results');
    const resultsCount = document.getElementById('results-count');
    
    if (resultsList) resultsList.innerHTML = '';
    if (resultsCount) resultsCount.textContent = '0';
    if (noResults) noResults.style.display = 'none';
    
    // 검색 쿼리 실행 (데모용 임시 데이터)
    setTimeout(() => {
        // 샘플 데이터 생성
        const results = generateSampleResults(query);
        
        // 결과 표시
        displaySearchResults(results);
        
        // 로딩 인디케이터 숨기기
        if (loading) loading.style.display = 'none';
        
        // 결과 영역 표시
        if (resultsArea) resultsArea.style.display = 'block';
    }, 1000); // 1초 지연 - 실제 API 호출 시뮬레이션
}

/**
 * 샘플 검색 결과 생성 (데모용)
 */
function generateSampleResults(query) {
    // 데모용 샘플 데이터
    const sampleData = [
        {
            id: 'NK001',
            name: '김정은',
            type: 'individual',
            country: '북한',
            program: 'DPRK',
            listingDate: '2016-04-15',
            details: {
                aliases: ['Kim Jong Un', 'Kim Jong-un'],
                dateOfBirth: '1984-01-08',
                placeOfBirth: '평양',
                nationality: '북한',
                passportDetails: 'Diplomatic Passport 29001',
                addresses: ['평양시 중구역'],
                position: '국무위원장',
                otherInformation: '유엔 안전보장이사회 결의안 1718호에 따른 제재 대상'
            }
        },
        {
            id: 'RU002',
            name: '러시아 대외무역은행',
            type: 'entity',
            country: '러시아',
            program: 'RUSSIA',
            listingDate: '2022-02-24',
            details: {
                aliases: ['VTB Bank', 'ВТБ Банк'],
                registrationDetails: '1990년 설립',
                addresses: ['모스크바 시 미라 대로 29'],
                activities: '금융, 은행',
                otherInformation: '러시아 정부 소유 은행으로 국제 제재 대상'
            }
        },
        {
            id: 'IR003',
            name: 'Sepah Shipping Line',
            type: 'entity',
            country: '이란',
            program: 'IRAN',
            listingDate: '2018-11-05',
            details: {
                aliases: ['IRISL Group Affiliate', 'Sepah Line'],
                registrationDetails: 'IMO Company No. 1234567',
                addresses: ['테헤란, 이란'],
                activities: '해운, 물류',
                otherInformation: '이란 혁명수비대 소유 기업으로 핵 프로그램 관련 물자 운송 의혹'
            }
        },
        {
            id: 'SY004',
            name: 'Syrian Scientific Studies and Research Center',
            type: 'entity',
            country: '시리아',
            program: 'SYRIA',
            listingDate: '2017-04-24',
            details: {
                aliases: ['SSRC', 'Centre d\'Etudes et de Recherches Scientifiques'],
                registrationDetails: '1971년 설립',
                addresses: ['다마스쿠스, 시리아'],
                activities: '연구, 군사',
                otherInformation: '시리아 정부의 화학무기 개발 프로그램 수행 기관'
            }
        },
        {
            id: 'NK005',
            name: 'M/V Wise Honest',
            type: 'vessel',
            country: '북한',
            program: 'DPRK',
            listingDate: '2018-09-30',
            details: {
                IMO: '8905490',
                callSign: 'DPRK1234',
                vesselType: '화물선',
                tonnage: '17,601 GT',
                yearBuilt: '1989',
                otherInformation: '북한 석탄 불법 수출에 관여한 선박'
            }
        }
    ];
    
    // 검색어가 포함된 결과만 필터링 (대소문자 구분 없이)
    const lowerQuery = query.toLowerCase();
    return sampleData.filter(item => {
        return item.name.toLowerCase().includes(lowerQuery) || 
               item.country.toLowerCase().includes(lowerQuery) ||
               (item.details && JSON.stringify(item.details).toLowerCase().includes(lowerQuery));
    });
}

/**
 * 검색 결과 표시
 */
function displaySearchResults(results) {
    const resultsList = document.getElementById('results-list');
    const noResults = document.getElementById('no-results');
    const resultsCount = document.getElementById('results-count');
    
    if (!resultsList || !noResults || !resultsCount) return;
    
    // 결과 개수 표시
    resultsCount.textContent = results.length;
    
    if (results.length === 0) {
        // 결과 없음 표시
        resultsList.innerHTML = '';
        noResults.style.display = 'flex';
        return;
    }
    
    // 결과 있음
    noResults.style.display = 'none';
    resultsList.innerHTML = '';
    
    // 결과 목록 생성
    results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.dataset.id = item.id;
        
        // 항목 타입에 따른 아이콘 클래스
        let iconClass = 'fa-user';
        if (item.type === 'entity') iconClass = 'fa-building';
        else if (item.type === 'vessel') iconClass = 'fa-ship';
        else if (item.type === 'aircraft') iconClass = 'fa-plane';
        
        // 결과 항목 HTML 생성
        resultItem.innerHTML = `
            <div class="result-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="result-content">
                <h4 class="result-title">${item.name}</h4>
                <div class="result-meta">
                    <span class="result-type">${translateType(item.type)}</span>
                    <span class="result-country">${item.country}</span>
                    <span class="result-date">제재일: ${formatDate(item.listingDate)}</span>
                </div>
            </div>
            <div class="result-action">
                <button class="view-detail-btn" data-id="${item.id}">상세보기</button>
            </div>
        `;
        
        // 결과 목록에 추가
        resultsList.appendChild(resultItem);
        
        // 상세보기 버튼 이벤트 리스너
        const viewDetailBtn = resultItem.querySelector('.view-detail-btn');
        if (viewDetailBtn) {
            viewDetailBtn.addEventListener('click', function() {
                showDetailView(item);
            });
        }
    });
    
    // 결과 항목 클릭 이벤트 리스너
    document.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // 버튼 영역 클릭은 무시 (이미 버튼에 이벤트가 있음)
            if (e.target.closest('.view-detail-btn')) return;
            
            // 해당 항목의 ID로 상세 정보 표시
            const id = this.dataset.id;
            const result = results.find(item => item.id === id);
            if (result) {
                showDetailView(result);
            }
        });
    });
}

/**
 * 상세 정보 보기
 */
function showDetailView(item) {
    const detailModal = document.getElementById('detail-modal');
    if (!detailModal) return;
    
    // 모달 제목과 정보 설정
    const detailTitle = document.getElementById('detail-title');
    const detailType = document.getElementById('detail-type');
    const detailCountry = document.getElementById('detail-country');
    const detailDate = document.getElementById('detail-date');
    const detailSource = document.getElementById('detail-source');
    const detailContent = document.getElementById('detail-content');
    
    if (detailTitle) detailTitle.textContent = item.name;
    if (detailType) detailType.textContent = translateType(item.type);
    if (detailCountry) detailCountry.textContent = item.country;
    if (detailDate) detailDate.textContent = formatDate(item.listingDate);
    if (detailSource) detailSource.textContent = translateProgram(item.program);
    
    // 상세 정보 콘텐츠 생성
    if (detailContent) {
        let contentHTML = '<div class="detail-sections">';
        
        // 기본 정보 섹션
        contentHTML += `
            <div class="detail-section">
                <h3 class="section-title">기본 정보</h3>
                <div class="detail-data">
                    <div class="data-item">
                        <span class="data-label">ID:</span>
                        <span class="data-value">${item.id}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">이름:</span>
                        <span class="data-value">${item.name}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">제재 프로그램:</span>
                        <span class="data-value">${translateProgram(item.program)}</span>
                    </div>
                </div>
            </div>
        `;
        
        // 항목 유형별 추가 정보
        if (item.details) {
            if (item.type === 'individual') {
                // 개인 정보
                contentHTML += `
                    <div class="detail-section">
                        <h3 class="section-title">개인 정보</h3>
                        <div class="detail-data">
                            ${item.details.dateOfBirth ? `
                                <div class="data-item">
                                    <span class="data-label">생년월일:</span>
                                    <span class="data-value">${item.details.dateOfBirth}</span>
                                </div>
                            ` : ''}
                            ${item.details.placeOfBirth ? `
                                <div class="data-item">
                                    <span class="data-label">출생지:</span>
                                    <span class="data-value">${item.details.placeOfBirth}</span>
                                </div>
                            ` : ''}
                            ${item.details.nationality ? `
                                <div class="data-item">
                                    <span class="data-label">국적:</span>
                                    <span class="data-value">${item.details.nationality}</span>
                                </div>
                            ` : ''}
                            ${item.details.position ? `
                                <div class="data-item">
                                    <span class="data-label">직위:</span>
                                    <span class="data-value">${item.details.position}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            } else if (item.type === 'entity') {
                // 기관/기업 정보
                contentHTML += `
                    <div class="detail-section">
                        <h3 class="section-title">기관 정보</h3>
                        <div class="detail-data">
                            ${item.details.registrationDetails ? `
                                <div class="data-item">
                                    <span class="data-label">등록 정보:</span>
                                    <span class="data-value">${item.details.registrationDetails}</span>
                                </div>
                            ` : ''}
                            ${item.details.activities ? `
                                <div class="data-item">
                                    <span class="data-label">활동 분야:</span>
                                    <span class="data-value">${item.details.activities}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            } else if (item.type === 'vessel') {
                // 선박 정보
                contentHTML += `
                    <div class="detail-section">
                        <h3 class="section-title">선박 정보</h3>
                        <div class="detail-data">
                            ${item.details.IMO ? `
                                <div class="data-item">
                                    <span class="data-label">IMO 번호:</span>
                                    <span class="data-value">${item.details.IMO}</span>
                                </div>
                            ` : ''}
                            ${item.details.callSign ? `
                                <div class="data-item">
                                    <span class="data-label">호출 부호:</span>
                                    <span class="data-value">${item.details.callSign}</span>
                                </div>
                            ` : ''}
                            ${item.details.vesselType ? `
                                <div class="data-item">
                                    <span class="data-label">선박 유형:</span>
                                    <span class="data-value">${item.details.vesselType}</span>
                                </div>
                            ` : ''}
                            ${item.details.tonnage ? `
                                <div class="data-item">
                                    <span class="data-label">톤수:</span>
                                    <span class="data-value">${item.details.tonnage}</span>
                                </div>
                            ` : ''}
                            ${item.details.yearBuilt ? `
                                <div class="data-item">
                                    <span class="data-label">건조 연도:</span>
                                    <span class="data-value">${item.details.yearBuilt}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            
            // 별칭 정보
            if (item.details.aliases && item.details.aliases.length > 0) {
                contentHTML += `
                    <div class="detail-section">
                        <h3 class="section-title">별칭</h3>
                        <div class="detail-data">
                            <div class="data-item">
                                <ul class="aliases-list">
                                    ${item.details.aliases.map(alias => `<li>${alias}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // 주소 정보
            if (item.details.addresses && item.details.addresses.length > 0) {
                contentHTML += `
                    <div class="detail-section">
                        <h3 class="section-title">주소</h3>
                        <div class="detail-data">
                            <div class="data-item">
                                <ul class="addresses-list">
                                    ${item.details.addresses.map(address => `<li>${address}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // 기타 정보
            if (item.details.otherInformation) {
                contentHTML += `
                    <div class="detail-section">
                        <h3 class="section-title">기타 정보</h3>
                        <div class="detail-data">
                            <div class="data-item">
                                <p class="other-info">${item.details.otherInformation}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        contentHTML += '</div>';
        detailContent.innerHTML = contentHTML;
    }
    
    // 모달 표시
    detailModal.classList.add('active');
}

/**
 * 프로그램 코드 변환
 */
function translateProgram(programCode) {
    const programs = {
        'DPRK': '북한 제재 프로그램',
        'RUSSIA': '러시아 제재 프로그램',
        'IRAN': '이란 제재 프로그램',
        'SYRIA': '시리아 제재 프로그램'
    };
    
    return programs[programCode] || programCode;
}

/**
 * 항목 유형 변환
 */
function translateType(type) {
    const types = {
        'individual': '개인',
        'entity': '기관/기업',
        'vessel': '선박',
        'aircraft': '항공기'
    };
    
    return types[type] || type;
}

/**
 * 날짜 형식 변환
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * 필터 적용
 */
function applyFilters() {
    // 현재 활성화된 필터 버튼 가져오기
    const activeFilters = Array.from(document.querySelectorAll('.filter-btn.active'))
        .map(btn => btn.getAttribute('data-filter'));
    
    // 모든 결과 항목 가져오기
    const resultItems = document.querySelectorAll('.result-item');
    
    // 결과가 없으면 종료
    if (resultItems.length === 0) return;
    
    // 'all' 필터가 활성화되어 있으면 모든 항목 표시
    if (activeFilters.includes('all')) {
        resultItems.forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }
    
    // 각 항목에 필터 적용
    resultItems.forEach(item => {
        const type = item.querySelector('.result-type').textContent;
        
        // 유형 매핑
        let itemType = '';
        if (type === '개인') itemType = 'individual';
        else if (type === '기관/기업') itemType = 'entity';
        else if (type === '선박') itemType = 'vessel';
        else if (type === '항공기') itemType = 'aircraft';
        
        // 활성화된 필터에 항목 유형이 포함되어 있으면 표시, 아니면 숨김
        if (activeFilters.includes(itemType)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}