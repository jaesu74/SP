/**
 * search.js - 검색 컴포넌트
 * 검색 폼 및 결과 표시 기능을 담당합니다.
 */

// 검색 컴포넌트 객체 생성
const SearchComponent = {};

// 로컬 변수
let currentResults = [];
let activeFilters = {
    countries: new Set(),
    programs: new Set(),
    startDate: null,
    endDate: null
};

/**
 * 컴포넌트 초기화
 */
SearchComponent.init = function() {
    console.log('검색 컴포넌트 초기화...');
    
    // API 서비스 초기화 확인
    if (window.ApiService && typeof window.ApiService.init === 'function' && !window.ApiService.initialized) {
        window.ApiService.init();
    }
    
    // 검색 옵션 설정
    this.setupSearchOptions();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 자동완성 기능 설정
    this.setupAutocomplete();
    
    console.log('검색 컴포넌트 초기화 완료');
};

/**
 * 검색 수행
 * @param {Event} e 이벤트 객체 (옵션)
 */
SearchComponent.performSearch = async function(e) {
    if (e) e.preventDefault();
    
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    const searchType = document.querySelector('input[name="search-type"]:checked')?.value || 'text';
    const numberType = document.querySelector('input[name="number-type"]:checked')?.value || 'all';
    
    // 검색어 없는 경우 확인
    if (!query) {
        window.showAlert ?
            window.showAlert('검색어를 입력해주세요.', 'warning') :
            this._showSimpleAlert('검색어를 입력해주세요.', 'warning');
        return;
    }
    
    const options = {
        searchType: searchType,
        numberType: numberType,
        country: Array.from(activeFilters.countries)[0] || 'all',
        program: Array.from(activeFilters.programs)[0] || 'all',
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate
    };
    
    // 로딩 표시
    const loadingIndicator = 
        (window.showLoadingIndicator ? 
            window.showLoadingIndicator('results-container', '검색 중...') :
            this._showSimpleLoadingIndicator('results-container'));
    
    try {
        // 검색 수행 - ApiService 우선 사용
        let results;
        if (window.ApiService && typeof window.ApiService.searchSanctions === 'function') {
            results = await window.ApiService.searchSanctions(query, options);
        } else if (window.apiModule && typeof window.apiModule.searchSanctions === 'function') {
            results = await window.apiModule.searchSanctions(query, options);
        } else {
            throw new Error('검색 API를 찾을 수 없습니다.');
        }
        
        currentResults = results.results || [];
        
        // 검색 결과 표시
        this.displayResults(currentResults);
        
        // 결과 수 업데이트
        this.updateResultsCount(currentResults.length);
        
        // 검색어가 있지만 결과가 없는 경우 추천 검색어 표시
        if (query && currentResults.length === 0) {
            let suggestions = [];
            if (window.ApiService && typeof window.ApiService.getSuggestedSearchTerms === 'function') {
                suggestions = window.ApiService.getSuggestedSearchTerms(query);
            }
            this.displaySearchSuggestions(suggestions);
        }
    } catch (error) {
        console.error('검색 오류:', error);
        
        // 오류 메시지 표시
        window.showAlert ? 
            window.showAlert('검색 중 오류가 발생했습니다. 다시 시도해주세요.', 'error') :
            this._showSimpleAlert('검색 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        
        // 빈 결과 표시
        this.displayResults([]);
    } finally {
        // 로딩 인디케이터 제거
        if (window.hideLoadingIndicator) {
            window.hideLoadingIndicator(loadingIndicator);
        } else {
            this._hideSimpleLoadingIndicator('results-container');
        }
    }
};

/**
 * 검색 결과 수 업데이트
 * @param {number} count 결과 수
 */
SearchComponent.updateResultsCount = function(count) {
    const countElement = document.querySelector('.results-count');
    if (countElement) {
        countElement.textContent = `${count}개의 결과 발견`;
        countElement.style.display = 'block';
    }
};

/**
 * 검색 결과 표시
 * @param {Array} results 검색 결과 배열
 */
SearchComponent.displayResults = function(results) {
    const container = document.getElementById('results-container');
    if (!container) return;
    
    // 컨테이너 초기화
    container.innerHTML = '';
    
    // 결과가 없는 경우
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <h3>검색 결과가 없습니다</h3>
                <p>다른 검색어로 다시 시도해보세요</p>
            </div>
        `;
        return;
    }
    
    // 결과 항목 생성
    for (const item of results) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // 날짜 포맷팅
        const formattedDate = this._formatDate(item.date_listed);
        
        // 아이템 타입에 따른 클래스 및 아이콘
        let typeClass = '';
        let typeIcon = '';
        let typeLabel = '정보 없음';
        
        if (item.type) {
            const type = item.type.toLowerCase();
            
            if (type.includes('individual') || type.includes('개인')) {
                typeClass = 'individual';
                typeIcon = 'user';
                typeLabel = '개인';
            } else if (type.includes('entity') || type.includes('단체') || type.includes('기업')) {
                typeClass = 'entity';
                typeIcon = 'building';
                typeLabel = '단체/기업';
            } else if (type.includes('vessel') || type.includes('선박')) {
                typeClass = 'vessel';
                typeIcon = 'ship';
                typeLabel = '선박';
            } else if (type.includes('aircraft') || type.includes('항공')) {
                typeClass = 'aircraft';
                typeIcon = 'plane';
                typeLabel = '항공기';
            }
        }
        
        // 국가 정보
        const country = item.country || '정보 없음';
        
        // 프로그램 정보
        const programs = Array.isArray(item.programs) && item.programs.length > 0
            ? item.programs.join(', ')
            : (item.program || '정보 없음');
        
        // HTML 구성
        resultItem.innerHTML = `
            <div class="item-header">
                <h3 class="item-name">${item.name || '이름 정보 없음'}</h3>
                <span class="type-badge ${typeClass}">
                    <i class="fas fa-${typeIcon}"></i> ${typeLabel}
                </span>
            </div>
            <div class="item-meta">
                <div class="item-country">
                    <i class="fas fa-globe"></i> ${country}
                </div>
                <div class="item-program">
                    <i class="fas fa-tag"></i> ${programs}
                </div>
                <div class="item-date">
                    <i class="fas fa-calendar"></i> ${formattedDate}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-detail" data-id="${item.id}">상세 정보</button>
            </div>
        `;
        
        // 상세 정보 버튼 이벤트
        const detailButton = resultItem.querySelector('.btn-detail');
        if (detailButton) {
            detailButton.addEventListener('click', async () => {
                await this.showDetail(item.id);
            });
        }
        
        // 결과 항목 추가
        container.appendChild(resultItem);
    }
    
    // 그리드 레이아웃으로 표시
    if (results.length > 0) {
        container.classList.add('results-grid');
        
        // 항목 페이드인 애니메이션
        const items = container.querySelectorAll('.result-item');
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.05}s`;
            item.classList.add('animated', 'fadeIn');
        });
    }
};

/**
 * 추천 검색어 표시
 * @param {Array<string>} suggestions 추천 검색어 배열
 */
SearchComponent.displaySearchSuggestions = function(suggestions) {
    if (!suggestions || suggestions.length === 0) return;
    
    const container = document.getElementById('results-container');
    if (!container) return;
    
    // 추천 검색어 섹션 생성
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    
    let html = '<h4>추천 검색어:</h4><ul>';
    
    suggestions.forEach(term => {
        html += `<li><a href="#" class="suggestion-link">${term}</a></li>`;
    });
    
    html += '</ul>';
    suggestionsContainer.innerHTML = html;
    
    // 추천 검색어 클릭 이벤트
    suggestionsContainer.querySelectorAll('.suggestion-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = link.textContent;
                this.performSearch();
            }
        });
    });
    
    // 추천 검색어 추가
    container.appendChild(suggestionsContainer);
};

/**
 * 상세 정보 표시
 * @param {string} id 항목 ID
 */
SearchComponent.showDetail = async function(id) {
    if (!id) return;
    
    console.log('상세 정보 표시:', id);
    
    try {
        let item = null;
        
        // 현재 결과에서 먼저 찾기
        if (currentResults && currentResults.length > 0) {
            item = currentResults.find(result => result.id === id);
        }
        
        // 현재 결과에 없으면 API에서 가져오기
        if (!item) {
            if (window.ApiService && typeof window.ApiService.getSanctionDetails === 'function') {
                item = await window.ApiService.getSanctionDetails(id);
            } else if (window.apiModule && typeof window.apiModule.getSanctionDetails === 'function') {
                item = await window.apiModule.getSanctionDetails(id);
            } else {
                throw new Error('상세 정보 API를 찾을 수 없습니다.');
            }
        }
        
        if (!item) {
            window.showAlert ?
                window.showAlert('상세 정보를 찾을 수 없습니다.', 'error') :
                this._showSimpleAlert('상세 정보를 찾을 수 없습니다.', 'error');
            return;
        }
        
        // 상세 정보 모달 요소 확인
        const detailModal = document.getElementById('detail-modal');
        const detailContent = document.getElementById('detail-content');
        
        if (!detailModal || !detailContent) {
            console.error('상세 정보 모달 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 현재 아이템 저장 (PDF 생성용)
        window.currentItem = item;
        
        // 상세 정보 컨텐츠 렌더링 함수 호출
        if (window.detailModule && typeof window.detailModule.renderDetailContent === 'function') {
            window.detailModule.renderDetailContent(item);
        } else if (window.renderDetailContent) {
            window.renderDetailContent(item, detailContent);
        } else {
            // 기본 렌더링 로직
            this.renderDetailContent(item, detailContent);
        }
        
        // 모달 표시
        detailModal.style.display = 'block';
        detailModal.classList.add('show');
        document.body.classList.add('modal-open');
    } catch (error) {
        console.error('상세 정보 로드 중 오류:', error);
        window.showAlert ?
            window.showAlert('상세 정보를 가져오는 중 오류가 발생했습니다.', 'error') :
            this._showSimpleAlert('상세 정보를 가져오는 중 오류가 발생했습니다.', 'error');
    }
};

/**
 * 검색 옵션 설정
 */
SearchComponent.setupSearchOptions = function() {
    // 검색 타입 라디오 버튼
    const searchTypeRadios = document.querySelectorAll('input[name="search-type"]');
    const numberTypeOptions = document.querySelector('.number-type-options');
    
    if (searchTypeRadios.length > 0 && numberTypeOptions) {
        // 초기 상태 설정
        const initialSearchType = document.querySelector('input[name="search-type"]:checked')?.value || 'text';
        numberTypeOptions.style.display = initialSearchType === 'number' ? 'block' : 'none';
        
        // 이벤트 리스너 등록
        searchTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                // 활성 상태 업데이트
                searchTypeRadios.forEach(r => {
                    const label = r.closest('.search-option');
                    if (label) {
                        label.classList.toggle('active', r.checked);
                    }
                });
                
                // 번호 타입 옵션 표시/숨김
                numberTypeOptions.style.display = this.value === 'number' ? 'block' : 'none';
            });
        });
    }
    
    // 번호 타입 라디오 버튼
    const numberTypeRadios = document.querySelectorAll('input[name="number-type"]');
    if (numberTypeRadios.length > 0) {
        // 이벤트 리스너 등록
        numberTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                // 활성 상태 업데이트
                numberTypeRadios.forEach(r => {
                    const label = r.closest('.search-option');
                    if (label) {
                        label.classList.toggle('active', r.checked);
                    }
                });
            });
        });
    }
};

/**
 * 이벤트 리스너 설정
 */
SearchComponent.setupEventListeners = function() {
    console.log('검색 컴포넌트 이벤트 리스너 설정...');
    
    // 검색 폼 제출
    const searchForm = document.getElementById('search-form');
    if (searchForm && !searchForm._searchComponentInitialized) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.performSearch();
        });
        searchForm._searchComponentInitialized = true;
    }
    
    // 검색 버튼 클릭
    const searchButton = document.getElementById('search-button');
    if (searchButton && !searchButton._searchComponentInitialized) {
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.performSearch();
        });
        searchButton._searchComponentInitialized = true;
    }
    
    // 엔터 키 검색 실행
    const searchInput = document.getElementById('search-input');
    if (searchInput && !searchInput._searchComponentInitialized) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch();
            }
        });
        searchInput._searchComponentInitialized = true;
    }
    
    // 고급 검색 토글
    const advancedToggle = document.getElementById('advanced-toggle');
    const advancedSearch = document.getElementById('advanced-search');
    if (advancedToggle && advancedSearch && !advancedToggle._searchComponentInitialized) {
        advancedToggle.addEventListener('click', () => {
            advancedSearch.classList.toggle('show');
        });
        advancedToggle._searchComponentInitialized = true;
    }
    
    // 모달 닫기 버튼
    const detailClose = document.getElementById('detail-close');
    const detailModal = document.getElementById('detail-modal');
    if (detailClose && detailModal && !detailClose._searchComponentInitialized) {
        detailClose.addEventListener('click', () => {
            this.hideDetail();
        });
        detailClose._searchComponentInitialized = true;
    }
    
    // 필터 버튼
    const filterButton = document.getElementById('filter-button');
    if (filterButton && !filterButton._searchComponentInitialized) {
        filterButton.addEventListener('click', () => {
            this.applyFilters();
        });
        filterButton._searchComponentInitialized = true;
    }
    
    // 필터 초기화 버튼
    const resetFiltersButton = document.getElementById('reset-filters');
    if (resetFiltersButton && !resetFiltersButton._searchComponentInitialized) {
        resetFiltersButton.addEventListener('click', () => {
            this.resetFilters();
        });
        resetFiltersButton._searchComponentInitialized = true;
    }
    
    console.log('검색 컴포넌트 이벤트 리스너 설정 완료');
};

/**
 * 자동완성 기능 설정
 */
SearchComponent.setupAutocomplete = function() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    // 디바운스 함수 생성
    const debouncedSearch = Utils?.debounce || this._debounce;
    
    // 이미 존재하는 자동완성 컨테이너 찾기 또는 생성
    let autocompleteContainer = document.querySelector('.autocomplete-container');
    if (!autocompleteContainer) {
        autocompleteContainer = document.createElement('div');
        autocompleteContainer.className = 'autocomplete-container';
        searchInput.parentNode.appendChild(autocompleteContainer);
    }
    
    // 입력 이벤트 리스너
    searchInput.addEventListener('input', debouncedSearch(async function() {
        const query = searchInput.value.trim();
        
        // 입력이 없거나 너무 짧으면 자동완성 숨기기
        if (!query || query.length < 2) {
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        // 추천 검색어 가져오기
        const suggestions = await window.ApiService.getSuggestedSearchTerms(query);
        
        // 추천 검색어가 없으면 자동완성 숨기기
        if (!suggestions || suggestions.length === 0) {
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        // 자동완성 항목 생성
        let html = '';
        suggestions.forEach(term => {
            html += `<div class="autocomplete-item">${term}</div>`;
        });
        
        autocompleteContainer.innerHTML = html;
        autocompleteContainer.style.display = 'block';
        
        // 자동완성 항목 클릭 이벤트
        const items = autocompleteContainer.querySelectorAll('.autocomplete-item');
        items.forEach(item => {
            item.addEventListener('click', function() {
                searchInput.value = this.textContent;
                autocompleteContainer.innerHTML = '';
                autocompleteContainer.style.display = 'none';
                SearchComponent.performSearch();
            });
        });
    }, 300));
    
    // 포커스 아웃 시 자동완성 숨기기
    document.addEventListener('click', function(e) {
        if (e.target !== searchInput && !autocompleteContainer.contains(e.target)) {
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.style.display = 'none';
        }
    });
};

/**
 * 날짜 포맷팅
 * @param {string} dateStr 날짜 문자열
 * @returns {string} 포맷된 날짜
 * @private
 */
SearchComponent._formatDate = function(dateStr) {
    if (!dateStr) return '정보 없음';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * 간단한 로딩 인디케이터 표시
 * @param {string} containerId 컨테이너 ID
 * @param {string} message 로딩 메시지
 * @returns {HTMLElement} 로딩 인디케이터 요소
 * @private
 */
SearchComponent._showSimpleLoadingIndicator = function(containerId, message = '로딩 중...') {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-indicator';
    loadingElement.innerHTML = `
        <div class="spinner"></div>
        <p>${message}</p>
    `;
    
    container.appendChild(loadingElement);
    return loadingElement;
};

/**
 * 간단한 로딩 인디케이터 숨기기
 * @param {string} containerId 컨테이너 ID
 * @private
 */
SearchComponent._hideSimpleLoadingIndicator = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const loadingIndicator = container.querySelector('.loading-indicator');
    if (loadingIndicator) {
        container.removeChild(loadingIndicator);
    }
};

/**
 * 간단한 알림 표시
 * @param {string} message 메시지
 * @param {string} type 알림 유형
 * @private
 */
SearchComponent._showSimpleAlert = function(message, type = 'info') {
    const alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) return;
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.innerHTML = message;
    
    alertContainer.appendChild(alertElement);
    
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
        }
    }, 5000);
};

/**
 * 디바운스 함수 (Utils가 없을 경우 폴백)
 * @param {Function} func 실행할 함수
 * @param {number} wait 지연시간 (ms)
 * @returns {Function} 디바운스된 함수
 * @private
 */
SearchComponent._debounce = function(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
};

/**
 * 상세 정보 렌더링 함수 추가
 * @param {Object} item 상세 정보 객체
 * @param {HTMLElement} container 상세 정보를 표시할 컨테이너
 * @private
 */
SearchComponent.renderDetailContent = function(item, container) {
    if (!item || !container) return;
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '정보 없음';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    const getTypeClass = (type) => {
        if (!type) return '';
        const lowerType = type.toLowerCase();
        
        if (lowerType.includes('개인') || lowerType.includes('individual')) {
            return 'individual';
        } else if (lowerType.includes('단체') || lowerType.includes('entity') || lowerType.includes('기업')) {
            return 'entity';
        } else if (lowerType.includes('선박') || lowerType.includes('vessel')) {
            return 'vessel';
        } else if (lowerType.includes('항공') || lowerType.includes('aircraft')) {
            return 'aircraft';
        }
        return '';
    };
    
    container.innerHTML = `
        <div class="detail-container">
            <div class="detail-header">
                <h3>${item.name || '이름 정보 없음'}</h3>
                <span class="detail-type ${getTypeClass(item.type)}">${item.type || '유형 정보 없음'}</span>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title">기본 정보</h3>
                <div class="detail-data">
                    <div class="data-item">
                        <div class="data-label">ID</div>
                        <div class="data-value">${item.id || '-'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">국가</div>
                        <div class="data-value">${item.country || '정보 없음'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">제재 프로그램</div>
                        <div class="data-value">${Array.isArray(item.programs) ? item.programs.join(', ') : (item.program || '정보 없음')}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">출처</div>
                        <div class="data-value">${item.source || '정보 없음'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">등재일</div>
                        <div class="data-value">${formatDate(item.date_listed)}</div>
                    </div>
                </div>
            </div>
            
            ${item.reason ? `
            <div class="detail-section">
                <h3 class="section-title">제재 사유</h3>
                <div class="detail-data">
                    <div class="data-item reason">
                        <div class="data-value">${item.reason}</div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${item.details && item.details.aliases && item.details.aliases.length > 0 ? `
            <div class="detail-section">
                <h3 class="section-title">별칭</h3>
                <div class="detail-data">
                    <div class="data-item">
                        <div class="data-value">
                            <ul class="detail-list">
                                ${item.details.aliases.map(alias => `<li>${alias}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${item.details && item.details.addresses && item.details.addresses.length > 0 ? `
            <div class="detail-section">
                <h3 class="section-title">주소</h3>
                <div class="detail-data">
                    <div class="data-item">
                        <div class="data-value">
                            <ul class="detail-list">
                                ${item.details.addresses.map(addr => `<li>${addr}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${item.details && item.details.identifications && item.details.identifications.length > 0 ? `
            <div class="detail-section">
                <h3 class="section-title">신분증 정보</h3>
                <div class="detail-data">
                    <div class="data-item">
                        <div class="data-value">
                            <ul class="detail-list">
                                ${item.details.identifications.map(id => `
                                    <li>
                                        ${id.type || '기타'}: ${id.number || '번호 없음'}
                                        ${id.country ? ` (${id.country})` : ''}
                                        ${id.issueDate ? ` - 발급일: ${id.issueDate}` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
};

/**
 * 상세 정보 모달 닫기 함수 추가
 * @private
 */
SearchComponent.hideDetail = function() {
    const detailModal = document.getElementById('detail-modal');
    if (!detailModal) return;
    
    detailModal.classList.remove('show');
    document.body.classList.remove('modal-open');
    
    // 일정 시간 후 display 속성도 변경
    setTimeout(() => {
        detailModal.style.display = 'none';
    }, 300);
};

// 모듈 내보내기 확인
if (typeof window.SearchComponent === 'undefined') {
    window.SearchComponent = SearchComponent;
}

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    // app.js에서 명시적 초기화를 기다리지 않고 자동 초기화
    if (!window.appInitialized) {
        SearchComponent.init();
    }
}); 