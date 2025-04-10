/**
 * 세계 경제 제재 검색 서비스
 * 메인 애플리케이션 파일
 * 
 * 모듈화된 구조:
 * - 유틸리티: app-helpers.js, common.js
 * - 컴포넌트: alerts.js, filters.js, user-auth.js, detail.js, search.js
 * - API: api.js
 */

// 전역 앱 객체 생성 - 상태 유지 및 컴포넌트 간 데이터 공유
window.app = window.app || {
    state: {
        currentResults: [],
        lastSearch: null,
        isLoading: false
    }
};

// 전역 함수 노출 (다른 파일에서 직접 호출할 수 있도록)
window.initializeApp = initializeApp;
window.performSearch = performSearch;
window.updateSearchResults = updateSearchResults;

/**
 * 애플리케이션 초기화
 */
function initializeApp() {
    console.log('애플리케이션 초기화 중...');
    
    // 각 컴포넌트 초기화 (일부는 자체 DOMContentLoaded 이벤트로 초기화됨)
    initializeComponents();
    
    // 이벤트 리스너 설정
    setupMainEventListeners();
    
    // 최신 데이터 가져오기
    fetchLatestData();
    
    console.log('애플리케이션 초기화 완료');
}

/**
 * 컴포넌트 초기화 - 일부 컴포넌트는 자체적으로 DOMContentLoaded 이벤트를 처리할 수 있음
 */
function initializeComponents() {
    // 전역 컴포넌트 참조 초기화 - 컴포넌트가 로드되지 않았을 경우 대비
    window.AlertsComponent = window.AlertsComponent || { init: () => console.warn('알림 컴포넌트가 로드되지 않았습니다.') };
    window.FiltersComponent = window.FiltersComponent || { generateFilterOptions: () => {} };
    window.UserAuth = window.UserAuth || { checkLoginStatus: () => {} };
    
    // API 모듈 로드 확인
    ensureAPIModuleLoaded();
}

/**
 * API 모듈 로드 확인 및 폴백 구현
 */
function ensureAPIModuleLoaded() {
    // API 모듈이 로드되지 않은 경우 기본 구현 제공
    if (!window.apiModule) {
        console.warn('API 모듈이 로드되지 않았습니다. 기본 구현을 사용합니다.');
        
        window.apiModule = {
            fetchSanctionsData: async () => {
                try {
                    const response = await fetch('data/all_sanctions.json');
                    const data = await response.json();
                    return data.data || [];
                } catch (e) {
                    console.error('제재 데이터 로드 실패:', e);
                    return [];
                }
            },
            searchSanctions: async (query) => {
                try {
                    const data = await window.apiModule.fetchSanctionsData();
                    if (!query) return { results: data };
                    
                    const filtered = data.filter(item => 
                        item.name.toLowerCase().includes(query.toLowerCase()) ||
                        (item.aliases && item.aliases.some(alias => 
                            alias.toLowerCase().includes(query.toLowerCase())
                        ))
                    );
                    
                    return { results: filtered };
                } catch (e) {
                    console.error('검색 오류:', e);
                    return { results: [] };
                }
            },
            getSanctionDetails: async (id) => {
                try {
                    const data = await window.apiModule.fetchSanctionsData();
                    return data.find(item => item.id === id) || null;
                } catch (e) {
                    console.error('상세 정보 조회 오류:', e);
                    return null;
                }
            }
        };
    }
}

/**
 * 기본 이벤트 리스너 설정
 */
function setupMainEventListeners() {
    // 검색 이벤트 설정
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            performSearch();
        });
    }
    
    // 검색 버튼 이벤트 설정
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    // Enter 키로 검색 설정
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
    
    // 결과 컨테이너 클릭 이벤트 (상세 정보 표시)
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
        resultsContainer.addEventListener('click', (e) => {
            // 결과 항목 클릭 처리
            const resultItem = e.target.closest('.result-item');
            if (resultItem && resultItem.dataset.id) {
                showDetailById(resultItem.dataset.id);
            }
        });
    }
}

/**
 * 최신 데이터 가져오기
 */
async function fetchLatestData() {
    try {
        // 로딩 인디케이터 표시
        const loadingIndicator = AppHelpers.showLoadingIndicator('results-container', '최신 제재 데이터를 불러오는 중...');
        
        // 최신 제재 데이터 가져오기
        const recentSanctions = await getRecentSanctions(20); // 최근 20개 항목
        
        // 결과 표시
        if (recentSanctions && recentSanctions.length > 0) {
            displayResults(recentSanctions);
            
            // 필터 옵션 생성
            if (window.FiltersComponent && typeof window.FiltersComponent.generateFilterOptions === 'function') {
                window.FiltersComponent.generateFilterOptions(recentSanctions);
            }
        } else {
            // 데이터 로드 실패 메시지
            window.showToast('데이터를 불러오는데 실패했습니다.', 'error');
        }
        
        // 로딩 인디케이터 숨기기
        AppHelpers.hideLoadingIndicator(loadingIndicator);
        
    } catch (error) {
        console.error('초기 데이터 로드 중 오류:', error);
        window.showToast('데이터를 불러오는데 실패했습니다.', 'error');
    }
}

/**
 * 최근 제재 데이터 가져오기
 * @param {number} limit 가져올 항목 수
 * @returns {Promise<Array>} 최근 제재 데이터 배열
 */
async function getRecentSanctions(limit = 10) {
    try {
        // API 모듈 사용
        const allSanctions = await window.apiModule.fetchSanctionsData();
        
        // 날짜별로 정렬 (최신순)
        const sorted = [...allSanctions].sort((a, b) => {
            const dateA = a.date_listed ? new Date(a.date_listed) : new Date(0);
            const dateB = b.date_listed ? new Date(b.date_listed) : new Date(0);
            return dateB - dateA;
        });
        
        // 최근 항목 반환
        return sorted.slice(0, limit);
    } catch (error) {
        console.error('최근 제재 데이터 로드 중 오류:', error);
        return [];
    }
}

/**
 * 검색 수행
 */
async function performSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    
    // 검색어 없으면 알림 표시
    if (!query) {
        window.showToast('검색어를 입력해주세요.', 'warning');
        return;
    }
    
    // 검색어가 2글자 미만이면 검색하지 않음
    if (query.length < 2) {
        window.showToast('검색어는 최소 2글자 이상 입력해주세요.', 'warning');
        return;
    }
    
    // 앱 상태 업데이트
    window.app.state.lastSearch = query;
    window.app.state.isLoading = true;
    
    try {
        // 로딩 인디케이터 표시
        const loadingIndicator = AppHelpers.showLoadingIndicator('results-container', '검색 중...');
        
        // API 모듈로 검색
        const { results } = await window.apiModule.searchSanctions(query);
        
        // 현재 결과 저장
        window.app.state.currentResults = results;
        
        // 결과가 있으면 표시
        if (results.length > 0) {
            // 필터 생성 후 필터 적용
            if (window.FiltersComponent) {
                window.FiltersComponent.generateFilterOptions(results);
                
                // 필터 적용된 결과 표시
                updateSearchResults();
            } else {
                // 필터 컴포넌트가 없으면 직접 표시
                displayResults(results);
            }
        } else {
            // 결과 없음 메시지
            displayNoResults(query);
        }
        
        // 로딩 인디케이터 숨기기
        AppHelpers.hideLoadingIndicator(loadingIndicator);
        
    } catch (error) {
        console.error('검색 중 오류:', error);
        window.showToast('검색 중 오류가 발생했습니다.', 'error');
    } finally {
        window.app.state.isLoading = false;
    }
}

/**
 * 검색 결과 업데이트 (필터 적용)
 */
function updateSearchResults() {
    // 필터 컴포넌트 사용
    if (window.FiltersComponent && typeof window.FiltersComponent.applyFiltersToResults === 'function') {
        const filteredResults = window.FiltersComponent.applyFiltersToResults(window.app.state.currentResults);
        displayResults(filteredResults);
    } else {
        // 필터 컴포넌트가 없으면 원본 결과 표시
        displayResults(window.app.state.currentResults);
    }
}

/**
 * 결과 화면에 표시
 * @param {Array} results 검색 결과 배열
 */
function displayResults(results) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    // 컨테이너 초기화
    resultsContainer.innerHTML = '';
    
    // 결과 개수 표시
    const countText = document.createElement('div');
    countText.className = 'results-count';
    countText.textContent = `총 ${results.length}개의 결과`;
    resultsContainer.appendChild(countText);
    
    // 결과 그리드 컨테이너 생성
    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'results-grid';
    
    // 결과 항목 생성
    results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.dataset.id = item.id;
        
        // 결과 항목에 알맞은 클래스 추가 (유형별)
        if (item.type) {
            resultItem.classList.add(`type-${item.type.toLowerCase()}`);
        }
        
        // 날짜 포맷팅
        const listedDate = item.date_listed ? AppHelpers.formatDate(item.date_listed) : '정보 없음';
        
        // 항목 내용 구성
        resultItem.innerHTML = `
            <div class="result-header">
                <h3 class="result-name">${item.name || '이름 없음'}</h3>
                <span class="result-type ${item.type ? 'type-' + item.type.toLowerCase() : ''}">${item.type || '유형 미상'}</span>
            </div>
            <div class="result-info">
                <div class="result-field">
                    <span class="field-label">국가:</span>
                    <span class="field-value">${item.country || '정보 없음'}</span>
                </div>
                <div class="result-field">
                    <span class="field-label">등재일:</span>
                    <span class="field-value">${listedDate}</span>
                </div>
                <div class="result-field">
                    <span class="field-label">출처:</span>
                    <span class="field-value">${item.source || '정보 없음'}</span>
                </div>
            </div>
            <div class="result-footer">
                <button class="view-details-btn">상세 정보 보기</button>
            </div>
        `;
        
        // 상세 보기 버튼 이벤트
        const viewDetailsBtn = resultItem.querySelector('.view-details-btn');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 버블링 방지
                showDetailById(item.id);
            });
        }
        
        // 그리드에 항목 추가
        resultsGrid.appendChild(resultItem);
    });
    
    // 결과 그리드를 컨테이너에 추가
    resultsContainer.appendChild(resultsGrid);
}

/**
 * 결과 없음 메시지 표시
 * @param {string} query 검색어
 */
function displayNoResults(query) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    // 컨테이너 초기화
    resultsContainer.innerHTML = '';
    
    // 결과 없음 메시지
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
        <div class="no-results-icon">
            <i class="fas fa-search"></i>
        </div>
        <h3>검색 결과가 없습니다.</h3>
        <p>"${query}"에 대한 제재 정보를 찾을 수 없습니다.</p>
        <div class="no-results-tips">
            <h4>제안:</h4>
            <ul>
                <li>모든 단어의 철자가 정확한지 확인하세요.</li>
                <li>다른 검색어를 사용해보세요.</li>
                <li>더 일반적인 검색어를 사용해보세요.</li>
                <li>국가, 이름 등 키워드를 정확히 입력해보세요.</li>
            </ul>
        </div>
    `;
    
    resultsContainer.appendChild(noResults);
}

/**
 * ID로 항목 상세 정보 표시
 * @param {string} id 항목 ID
 */
async function showDetailById(id) {
    if (!id) return;
    
    try {
        // 항목 상세 정보 가져오기
        const item = await window.apiModule.getSanctionDetails(id);
        
        if (item) {
            // 상세 컴포넌트 확인
            if (window.detailModule && typeof window.detailModule.showDetail === 'function') {
                window.detailModule.showDetail(item);
            } else {
                console.error('상세 정보 표시 컴포넌트를 찾을 수 없습니다.');
                window.showToast('상세 정보를 표시할 수 없습니다.', 'error');
            }
        } else {
            console.error('ID에 해당하는 항목을 찾을 수 없습니다:', id);
            window.showToast('해당 항목의 상세 정보를 찾을 수 없습니다.', 'error');
        }
    } catch (error) {
        console.error('상세 정보 로드 중 오류:', error);
        window.showToast('상세 정보를 불러오는데 실패했습니다.', 'error');
    }
}

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', initializeApp);