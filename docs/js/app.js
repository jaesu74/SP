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
    console.log('앱 초기화 시작');
    
    try {
        // 기존 로컬 스토리지 정리 (필요시)
        try {
            // 스토리지 확인
            if (localStorage.length > 10) { // 너무 많은 항목이 있는 경우 정리
                console.log('로컬 스토리지 정리 중...');
                localStorage.clear();
            }
        } catch (storageError) {
            console.error('로컬 스토리지 접근 오류:', storageError);
        }
        
        // 페이지 섹션들의 초기 상태 설정
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // 초기에 모든 섹션 숨기기
        hideAllSections();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // 로딩 인디케이터 숨기기
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        
        // 로그인 상태 확인 - 약간의 지연을 두어 DOM이 완전히 로드된 후 실행
        setTimeout(function() {
            console.log('로그인 상태 확인 타이머 실행...');
            checkLoginStatus();
        }, 300);
        
        console.log('앱 초기화 완료');
    } catch (error) {
        console.error('앱 초기화 중 오류 발생:', error);
        
        // 초기화 오류 시 기본적으로 로그인 화면 표시
        const loginSection = document.querySelector('#login-section');
        if (loginSection) {
            loginSection.style.display = 'block';
        }
    }
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
    
    console.log('모든 섹션 숨김 처리 완료');
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    try {
        console.log('이벤트 리스너 설정 시작');
        
        // 로그인 폼 이벤트 리스너
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                handleLogin(email, password);
            });
            console.log('로그인 폼 이벤트 리스너 설정 완료');
        } else {
            console.warn('로그인 폼 요소를 찾을 수 없음');
        }

        // 로그아웃 버튼 이벤트 리스너
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
            console.log('로그아웃 버튼 이벤트 리스너 설정 완료');
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

        // 필터 버튼 이벤트 리스너
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // 기존 활성 버튼 제거
                const activeBtn = document.querySelector('.filter-btn.active');
                if (activeBtn) {
                    activeBtn.classList.remove('active');
                }
                
                // 클릭한 버튼 활성화
                this.classList.add('active');
                
                // 검색 결과가 있으면 필터링 적용
                const resultsArea = document.getElementById('results-area');
                if (resultsArea && resultsArea.style.display !== 'none') {
                    applyFilters();
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
            detailDownload.addEventListener('click', function() {
                alert('PDF 다운로드 기능은 개발 중입니다.');
            });
        }

        // 이용약관 및 개인정보처리방침 링크
        setupPageSectionLinks();

        // 첫 번째 필터 버튼 활성화
        if (filterBtns.length > 0) {
            filterBtns[0].classList.add('active');
        }
        
        console.log('이벤트 리스너 설정 완료');
    } catch (error) {
        console.error('이벤트 리스너 설정 중 오류 발생:', error);
    }
}

/**
 * 페이지 섹션 링크 설정
 */
function setupPageSectionLinks() {
    try {
        // 이용약관 및 개인정보처리방침 링크
        const termsLink = document.getElementById('terms-link');
        if (termsLink) {
            termsLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPageSection('terms-section');
            });
        }

        const privacyLink = document.getElementById('privacy-link');
        if (privacyLink) {
            privacyLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPageSection('privacy-section');
            });
        }

        const helpLink = document.getElementById('help-link');
        if (helpLink) {
            helpLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPageSection('help-section');
            });
        }

        // 뒤로가기 버튼
        const termsBackBtn = document.getElementById('terms-back-btn');
        if (termsBackBtn) {
            termsBackBtn.addEventListener('click', function() {
                hidePageSection('terms-section');
            });
        }

        const privacyBackBtn = document.getElementById('privacy-back-btn');
        if (privacyBackBtn) {
            privacyBackBtn.addEventListener('click', function() {
                hidePageSection('privacy-section');
            });
        }

        const helpBackBtn = document.getElementById('help-back-btn');
        if (helpBackBtn) {
            helpBackBtn.addEventListener('click', function() {
                hidePageSection('help-section');
            });
        }
    } catch (error) {
        console.error('페이지 섹션 링크 설정 중 오류 발생:', error);
    }
}

/**
 * 로그인 상태 확인
 */
function checkLoginStatus() {
    try {
        console.log('로그인 상태 확인 시작');
        
        // 화면 기본 상태 설정
        hideAllSections();
        
        // 로컬 스토리지 오류 가능성 처리
        let userInfo = null;
        try {
            userInfo = localStorage.getItem('userInfo');
            console.log('저장된 사용자 정보:', userInfo ? '있음' : '없음');
        } catch (storageError) {
            console.error('로컬 스토리지 접근 오류:', storageError);
            // 로컬 스토리지 오류 시 로그인되지 않은 상태로 처리
            userInfo = null;
        }
        
        const mainSection = document.getElementById(MAIN_SECTION_ID);
        const loginSection = document.getElementById(LOGIN_SECTION_ID);
        
        if (!mainSection || !loginSection) {
            console.error('필수 섹션 요소를 찾을 수 없음');
            // 요소가 없을 경우 로그인 화면 표시 시도
            const fallbackLoginSection = document.querySelector('#login-section');
            if (fallbackLoginSection) {
                fallbackLoginSection.style.display = 'block';
            }
            return;
        }
        
        if (userInfo) {
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
                
                console.log('로그인 상태 - 메인 섹션 표시됨');
            } catch (parseError) {
                console.error('사용자 정보 파싱 오류:', parseError);
                localStorage.removeItem('userInfo'); // 잘못된 데이터 제거
                
                // 비로그인 상태로 전환
                mainSection.style.display = 'none';
                loginSection.style.display = 'block';
            }
        } else {
            // 비로그인 상태
            mainSection.style.display = 'none';
            loginSection.style.display = 'block';
            
            console.log('비로그인 상태 - 로그인 섹션 표시됨');
        }
    } catch (error) {
        console.error('로그인 상태 확인 중 오류 발생:', error);
        
        // 오류 발생 시 로그인 화면 표시
        const loginSection = document.getElementById(LOGIN_SECTION_ID);
        if (loginSection) {
            loginSection.style.display = 'block';
        }
    }
}

/**
 * 로그인 처리
 */
function handleLogin(email, password) {
    try {
        console.log('로그인 시도:', email);
        
        // 입력값 검증
        if (!email || !password) {
            showAlert('이메일과 비밀번호를 입력해주세요.', 'error');
            return;
        }
        
        // 테스트 계정 체크
        if (email === TEST_EMAIL && password === TEST_PASSWORD) {
            console.log('로그인 성공: 테스트 계정 인증 완료');
            
            // 로그인 성공 - 최소한의 사용자 정보만 저장
            const userInfo = {
                name: '김재수',
                email: email
            };
            
            try {
                // 기존 데이터 정리
                localStorage.clear();
                
                // 로컬 스토리지에 사용자 정보 저장
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                console.log('사용자 정보 저장 완료');
            } catch (storageError) {
                console.error('로컬 스토리지 저장 오류:', storageError);
                // 스토리지 오류가 발생해도 로그인은 진행
            }
            
            // 성공 알림 표시
            showAlert('로그인 성공! 환영합니다.', 'success');
            
            // 메인 화면으로 즉시 전환
            const mainSection = document.getElementById(MAIN_SECTION_ID);
            const loginSection = document.getElementById(LOGIN_SECTION_ID);
            
            // 사용자 이름 표시
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = userInfo.name;
            }
            
            if (mainSection) mainSection.style.display = 'block';
            if (loginSection) loginSection.style.display = 'none';
            
            console.log('로그인 성공 - 메인 섹션으로 전환 완료');
            
            return true;
        } else {
            // 로그인 실패
            console.log('로그인 실패: 인증 정보 불일치');
            showAlert('로그인 실패. 이메일 또는 비밀번호가 일치하지 않습니다.', 'error');
            return false;
        }
    } catch (error) {
        console.error('로그인 처리 중 오류 발생:', error);
        showAlert('로그인 과정에서 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        return false;
    }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
    try {
        console.log('로그아웃 시도');
        
        // 로컬 스토리지에서 사용자 정보 삭제
        localStorage.removeItem('userInfo');
        
        // 알림 표시
        showAlert('로그아웃되었습니다.', 'info');
        
        // 로그인 화면으로 즉시 전환
        const loginSection = document.getElementById(LOGIN_SECTION_ID);
        const mainSection = document.getElementById(MAIN_SECTION_ID);
        
        if (loginSection) loginSection.style.display = 'block';
        if (mainSection) mainSection.style.display = 'none';
        
        console.log('로그아웃 완료 - 로그인 섹션으로 전환 완료');
        
        return true;
    } catch (error) {
        console.error('로그아웃 처리 중 오류 발생:', error);
        return false;
    }
}

/**
 * 특정 섹션 표시
 */
function showSection(sectionId) {
    // 모든 섹션 숨기기
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 지정된 섹션 표시
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        
        // 섹션이 메인 섹션인 경우 추가 초기화 작업
        if (sectionId === 'main-section') {
            initMainSection();
        }
        
        console.log(`섹션 전환: ${sectionId}`);
    } else {
        console.error(`섹션을 찾을 수 없음: ${sectionId}`);
    }
}

/**
 * 메인 섹션 초기화
 */
function initMainSection() {
    // 검색 입력창 초기화
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    // 결과 영역 초기화
    const resultsArea = document.getElementById('results-area');
    if (resultsArea) resultsArea.style.display = 'none';
    
    // 로딩 인디케이터 숨기기
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

/**
 * 검색 수행
 */
function performSearch(searchTerm) {
    // 로딩 표시
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('results-area').style.display = 'none';
    
    // 실제 API 요청을 시뮬레이션 (1초 후 결과 표시)
    setTimeout(() => {
        // 샘플 검색 결과 데이터
        const sampleResults = [
            {
                id: 'NK001',
                name: '김정은',
                type: 'individual',
                country: '북한',
                program: 'DPRK',
                date: '2016-03-02',
                source: 'UN',
                description: '북한 국무위원장',
                aliases: ['Kim Jong Un', 'Kim Jong-un'],
                addresses: ['평양시, 북한']
            },
            {
                id: 'RU002',
                name: '블라디미르 푸틴',
                type: 'individual',
                country: '러시아',
                program: 'RUSSIA',
                date: '2022-02-25',
                source: 'EU',
                description: '러시아 대통령',
                aliases: ['Vladimir Putin', 'Vladimir Vladimirovich Putin'],
                addresses: ['모스크바, 러시아']
            },
            {
                id: 'ENT001',
                name: '조선무역은행',
                type: 'entity',
                country: '북한',
                program: 'DPRK',
                date: '2017-08-05',
                source: 'OFAC',
                description: '북한 금융기관',
                aliases: ['Foreign Trade Bank of the DPRK', 'FTB'],
                addresses: ['중구 동교동, 평양, 북한']
            },
            {
                id: 'VS001',
                name: 'M/V WISE HONEST',
                type: 'vessel',
                country: '북한',
                program: 'DPRK',
                date: '2018-10-21',
                source: 'UN',
                description: '북한 화물선',
                aliases: ['IMO 8905490'],
                addresses: []
            },
            {
                id: 'IR001',
                name: '이란 항공',
                type: 'entity',
                country: '이란',
                program: 'IRAN',
                date: '2011-06-23',
                source: 'OFAC',
                description: '이란 항공사',
                aliases: ['Iran Air', 'Airline of the Islamic Republic of Iran'],
                addresses: ['테헤란, 이란']
            }
        ];
        
        // 간단한 검색어 매칭 (실제 구현에서는 API 응답 처리)
        const results = sampleResults.filter(item => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                item.name.toLowerCase().includes(searchTermLower) ||
                item.aliases.some(alias => alias.toLowerCase().includes(searchTermLower)) ||
                item.description.toLowerCase().includes(searchTermLower)
            );
        });
        
        // 결과 표시
        displaySearchResults(results);
        
        // 로딩 숨기기
        document.getElementById('loading').style.display = 'none';
        document.getElementById('results-area').style.display = 'block';
    }, 1000);
}

/**
 * 검색 결과 표시
 */
function displaySearchResults(results) {
    const resultsList = document.getElementById('results-list');
    const resultsCount = document.getElementById('results-count');
    const noResults = document.getElementById('no-results');
    
    // 결과 개수 업데이트
    resultsCount.textContent = results.length;
    
    // 결과 목록 초기화
    resultsList.innerHTML = '';
    
    if (results.length === 0) {
        // 결과 없음 표시
        resultsList.style.display = 'none';
        noResults.style.display = 'block';
    } else {
        // 결과 표시
        resultsList.style.display = 'grid';
        noResults.style.display = 'none';
        
        // 각 결과 항목 생성
        results.forEach(item => {
            const resultCard = document.createElement('div');
            resultCard.className = `result-card ${item.type}`;
            resultCard.setAttribute('data-id', item.id);
            resultCard.setAttribute('data-type', item.type);
            
            // 카드 내용 생성
            resultCard.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${item.name}</h3>
                    <span class="card-type">${getTypeLabel(item.type)}</span>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <p><strong>국가:</strong> ${item.country}</p>
                        <p><strong>프로그램:</strong> ${item.program}</p>
                        <p><strong>등록일:</strong> ${formatDate(item.date)}</p>
                        <p><strong>출처:</strong> ${item.source}</p>
                    </div>
                    <div class="card-description">
                        ${item.description}
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn-view-detail" data-id="${item.id}">상세 보기</button>
                </div>
            `;
            
            // 결과 목록에 추가
            resultsList.appendChild(resultCard);
            
            // 상세 보기 버튼 이벤트 리스너
            const viewDetailBtn = resultCard.querySelector('.btn-view-detail');
            viewDetailBtn.addEventListener('click', function() {
                showDetailView(item);
            });
        });
    }
}

/**
 * 필터 적용
 */
function applyFilters() {
    // 선택된 필터 가져오기
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    
    // 모든 결과 카드 선택
    const resultCards = document.querySelectorAll('.result-card');
    
    // 필터링
    resultCards.forEach(card => {
        if (activeFilter === 'all' || card.getAttribute('data-type') === activeFilter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // 결과 개수 업데이트
    const visibleCards = document.querySelectorAll('.result-card[style="display: block;"]');
    document.getElementById('results-count').textContent = visibleCards.length;
    
    // 결과 없음 표시
    if (visibleCards.length === 0) {
        document.getElementById('no-results').style.display = 'block';
    } else {
        document.getElementById('no-results').style.display = 'none';
    }
}

/**
 * 상세 정보 표시
 */
function showDetailView(item) {
    // 상세 정보 모달 참조
    const detailModal = document.getElementById('detail-modal');
    
    // 타이틀 설정
    document.getElementById('detail-title').textContent = item.name;
    
    // 메타 정보 설정
    document.getElementById('detail-type').textContent = getTypeLabel(item.type);
    document.getElementById('detail-country').textContent = item.country;
    document.getElementById('detail-date').textContent = formatDate(item.date);
    document.getElementById('detail-source').textContent = item.source;
    
    // 상세 내용 생성
    let detailContent = `
        <div class="detail-section">
            <h3>개요</h3>
            <p>${item.description}</p>
        </div>
    `;
    
    // 별칭 정보 추가
    if (item.aliases && item.aliases.length > 0) {
        detailContent += `
            <div class="detail-section">
                <h3>별칭</h3>
                <ul class="detail-list">
                    ${item.aliases.map(alias => `<li>${alias}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // 주소 정보 추가
    if (item.addresses && item.addresses.length > 0) {
        detailContent += `
            <div class="detail-section">
                <h3>주소</h3>
                <ul class="detail-list">
                    ${item.addresses.map(address => `<li>${address}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // 추가 정보 (샘플)
    detailContent += `
        <div class="detail-section">
            <h3>제재 사유</h3>
            <p>국제 평화와 안보에 대한 위협, UN 안전보장이사회 결의안 위반, 경제 제재 대상 국가와의 불법 거래 등의 이유로 제재 대상으로 지정되었습니다.</p>
        </div>
    `;
    
    // 상세 내용 업데이트
    document.getElementById('detail-content').innerHTML = detailContent;
    
    // 모달 표시
    detailModal.classList.add('active');
}

/**
 * 유형 라벨 가져오기
 */
function getTypeLabel(type) {
    const typeLabels = {
        'individual': '개인',
        'entity': '기업/기관',
        'vessel': '선박',
        'aircraft': '항공기'
    };
    
    return typeLabels[type] || type;
}

/**
 * 날짜 형식 변환
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 상세 정보 인쇄
 */
function printDetail() {
    const detailTitle = document.getElementById('detail-title').textContent;
    const detailContent = document.getElementById('detail-content').innerHTML;
    
    // 인쇄용 팝업 창 열기
    const printWindow = window.open('', '', 'width=800,height=600');
    
    // 인쇄용 HTML 생성
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${detailTitle} - 제재 정보</title>
            <style>
                body { font-family: 'Noto Sans KR', sans-serif; margin: 20px; }
                h1 { color: #333; }
                h3 { margin-top: 20px; color: #444; }
                .detail-section { margin-bottom: 20px; }
                .detail-list { margin: 10px 0; padding-left: 20px; }
                .meta-info { display: flex; background: #f5f5f5; padding: 10px; margin-bottom: 20px; }
                .meta-item { margin-right: 20px; }
                .meta-label { font-weight: bold; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <h1>${detailTitle}</h1>
            <div class="meta-info">
                <div class="meta-item"><span class="meta-label">유형:</span> ${document.getElementById('detail-type').textContent}</div>
                <div class="meta-item"><span class="meta-label">국가:</span> ${document.getElementById('detail-country').textContent}</div>
                <div class="meta-item"><span class="meta-label">제재 일자:</span> ${document.getElementById('detail-date').textContent}</div>
                <div class="meta-item"><span class="meta-label">출처:</span> ${document.getElementById('detail-source').textContent}</div>
            </div>
            ${detailContent}
            <div class="footer">
                <p>출력일: ${new Date().toLocaleDateString()} / 주식회사 팩션 제재 대상 조회 시스템</p>
            </div>
        </body>
        </html>
    `);
    
    // 페이지 로드 후 인쇄
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };
}

/**
 * 알림 표시
 */
function showAlert(message, type) {
    try {
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
        
        if (!container) {
            console.error('알림 컨테이너를 찾을 수 없습니다.');
            console.log('알림 메시지:', message, '타입:', type);
            return;
        }
        
        // 알림 요소 생성
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = message;
        
        // 컨테이너에 알림 추가
        container.innerHTML = '';
        container.appendChild(alertDiv);
        
        // 5초 후 알림 자동 제거
        setTimeout(() => {
            try {
                if (alertDiv && alertDiv.parentNode) {
                    alertDiv.style.opacity = '0';
                    setTimeout(() => {
                        try {
                            if (alertDiv.parentNode) {
                                alertDiv.parentNode.removeChild(alertDiv);
                            }
                        } catch (innerError) {
                            console.error('알림 제거 중 오류 발생:', innerError);
                        }
                    }, 300);
                }
            } catch (fadeError) {
                console.error('알림 페이드아웃 중 오류 발생:', fadeError);
            }
        }, 5000);
    } catch (error) {
        console.error('알림 표시 중 오류 발생:', error);
        console.log('알림 메시지:', message, '타입:', type);
    }
}

/**
 * 페이지 섹션 표시
 */
function showPageSection(sectionId) {
    // 현재 화면 저장
    const currentMainDisplay = document.getElementById(MAIN_SECTION_ID).style.display;
    const currentLoginDisplay = document.getElementById(LOGIN_SECTION_ID).style.display;
    
    // 섹션 표시
    const section = document.getElementById(sectionId);
    if (section) {
        // 페이지 섹션 데이터 설정
        section.dataset.previousMain = currentMainDisplay;
        section.dataset.previousLogin = currentLoginDisplay;
        
        // 현재 페이지 숨기기
        document.getElementById(MAIN_SECTION_ID).style.display = 'none';
        document.getElementById(LOGIN_SECTION_ID).style.display = 'none';
        
        // 페이지 섹션 표시
        section.style.display = 'block';
        
        // 스크롤 맨 위로
        window.scrollTo(0, 0);
    }
}

/**
 * 페이지 섹션 숨기기
 */
function hidePageSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // 페이지 섹션 숨기기
        section.style.display = 'none';
        
        // 이전 화면으로 복귀
        const previousMain = section.dataset.previousMain;
        const previousLogin = section.dataset.previousLogin;
        
        if (previousMain === 'block') {
            document.getElementById(MAIN_SECTION_ID).style.display = 'block';
        } else if (previousLogin === 'block') {
            document.getElementById(LOGIN_SECTION_ID).style.display = 'block';
        } else {
            // 기본값: 로그인 상태에 따라 결정
            checkLoginStatus();
        }
    }
} 