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
    
    const options = {
        searchType: searchType,
        numberType: numberType,
        country: Array.from(activeFilters.countries)[0] || 'all',
        program: Array.from(activeFilters.programs)[0] || 'all',
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate
    };
    
    // 로딩 표시
    const loadingIndicator = window.Utils?.showLoadingIndicator('results-container', '검색 중...') ||
        this._showSimpleLoadingIndicator('results-container');
    
    try {
        // 검색 수행
        const results = await window.ApiService.searchSanctions(query, options);
        currentResults = results.results || [];
        
        // 검색 결과 표시
        this.displayResults(currentResults);
        
        // 결과 수 업데이트
        this.updateResultsCount(currentResults.length);
        
        // 검색어가 있지만 결과가 없는 경우 추천 검색어 표시
        if (query && currentResults.length === 0) {
            const suggestions = window.ApiService.getSuggestedSearchTerms(query);
            this.displaySearchSuggestions(suggestions);
        }
    } catch (error) {
        console.error('검색 오류:', error);
        
        // 오류 메시지 표시
        const alertMessage = window.Utils?.showAlert || this._showSimpleAlert;
        alertMessage('검색 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        
        // 빈 결과 표시
        this.displayResults([]);
    } finally {
        // 로딩 인디케이터 제거
        window.Utils?.hideLoadingIndicator(loadingIndicator) || 
            this._hideSimpleLoadingIndicator('results-container');
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
    try {
        // 로딩 인디케이터 표시
        const loadingIndicator = window.Utils?.showLoadingIndicator('detail-content', '상세 정보를 불러오는 중...') ||
            this._showSimpleLoadingIndicator('detail-content');
        
        // 상세 정보 가져오기
        const data = await window.ApiService.getSanctionDetails(id);
        
        // 로딩 인디케이터 제거
        window.Utils?.hideLoadingIndicator(loadingIndicator) || 
            this._hideSimpleLoadingIndicator('detail-content');
        
        if (!data) {
            window.Utils?.showAlert('상세 정보를 찾을 수 없습니다.', 'error') || 
                this._showSimpleAlert('상세 정보를 찾을 수 없습니다.', 'error');
            return;
        }
        
        // detail.js 컴포넌트 사용
        if (window.detailModule && typeof window.detailModule.showDetail === 'function') {
            window.detailModule.showDetail(data);
        } else {
            // 폴백: 기본 모달 표시
            console.warn('상세 정보 모듈을 찾을 수 없습니다. 기본 방식을 사용합니다.');
            this._showSimpleDetailModal(data);
        }
    } catch (error) {
        console.error('상세 정보 로드 오류:', error);
        window.Utils?.showAlert('상세 정보를 불러오는데 실패했습니다.', 'error') || 
            this._showSimpleAlert('상세 정보를 불러오는데 실패했습니다.', 'error');
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
    // 검색 버튼 이벤트
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', (e) => this.performSearch(e));
    }
    
    // 검색 입력창 Enter 키 이벤트
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch();
            }
        });
    }
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
 * 간단한 상세 정보 모달 표시 (폴백)
 * @param {Object} data 상세 정보 데이터
 * @private
 */
SearchComponent._showSimpleDetailModal = function(data) {
    // 모달 요소 가져오기
    const modal = document.getElementById('detail-modal');
    const detailContent = document.getElementById('detail-content');
    
    if (!modal || !detailContent) {
        console.error('모달 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 날짜 형식화
    const formattedDate = this._formatDate(data.date_listed);
    
    // 상세 정보 HTML 생성
    let html = `
        <div class="detail-header">
            <h3>${data.name}</h3>
            <span class="detail-type ${data.type?.toLowerCase() || ''}">
                <i class="fas fa-${data.type === 'INDIVIDUAL' ? 'user' : 'building'}"></i>
                ${data.type === 'INDIVIDUAL' ? '개인' : '단체'}
            </span>
        </div>
        
        <div class="detail-section">
            <h4>기본 정보</h4>
            <div class="detail-data">
                <div class="data-item">
                    <div class="data-label">국가</div>
                    <div class="data-value">${data.country || '정보 없음'}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">등재일</div>
                    <div class="data-value">${formattedDate}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">제재 출처</div>
                    <div class="data-value">${data.source || '정보 없음'}</div>
                </div>
            </div>
        </div>
    `;
    
    // 프로그램 정보
    if (data.programs && data.programs.length > 0) {
        html += `
            <div class="detail-section">
                <h4>제재 프로그램</h4>
                <div class="detail-data">
                    <div class="data-item">
                        <ul class="program-list">
                            ${data.programs.map(program => `<li>${program}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 별칭 정보
    if (data.details?.aliases && data.details.aliases.length > 0) {
        html += `
            <div class="detail-section">
                <h4>별칭</h4>
                <div class="detail-data">
                    <div class="data-item">
                        <ul class="alias-list">
                            ${data.details.aliases.map(alias => `<li>${alias}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 주소 정보
    if (data.details?.addresses && data.details.addresses.length > 0) {
        html += `
            <div class="detail-section">
                <h4>주소</h4>
                <div class="detail-data">
                    <div class="data-item">
                        <ul class="address-list">
                            ${data.details.addresses.map(address => `<li>${address}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 신분증 정보
    if (data.details?.identifications && data.details.identifications.length > 0) {
        html += `
            <div class="detail-section">
                <h4>신분증 정보</h4>
                <div class="detail-data">
                    <div class="data-item">
                        <ul class="id-list">
                            ${data.details.identifications.map(id => `
                                <li>
                                    <strong>${id.type || '기타'}:</strong> ${id.number || '번호 없음'}
                                    ${id.country ? `(${id.country})` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 내용 설정 및 모달 표시
    detailContent.innerHTML = html;
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // 닫기 버튼 이벤트
    const closeBtn = document.getElementById('detail-close');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        };
    }
    
    // ESC 키로 닫기
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // 모달 외부 클릭 시 닫기
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    };
};

// 전역 객체로 내보내기
window.SearchComponent = SearchComponent;

// DOMContentLoaded 이벤트에서 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (window.SearchComponent) {
        window.SearchComponent.init();
    }
}); 