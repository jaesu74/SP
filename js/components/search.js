/**
 * search.js - 검색 관련 컴포넌트
 */

import { debounce, showAlert } from '../utils/common.js';
import { searchSanctions, getSuggestedSearchTerms } from '../services/api.js';

// 현재 검색 결과 저장
let currentResults = [];

/**
 * 검색 컴포넌트 초기화
 */
export function initSearchComponent() {
    setupSearchOptions();
    setupAdvancedSearch();
    setupAutocomplete();
    setupFilterEventListeners();
}

/**
 * 검색 옵션 설정
 */
function setupSearchOptions() {
    // 검색 유형 라디오 버튼 이벤트 리스너
    const searchTypeRadios = document.querySelectorAll('input[name="search-type"]');
    const numberTypeOptions = document.querySelector('.number-type-options');
    
    searchTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            // 액티브 클래스 처리
            document.querySelectorAll('.search-type-options .search-option').forEach(option => {
                option.classList.remove('active');
            });
            e.target.closest('.search-option').classList.add('active');
            
            // 번호 검색 유형 표시/숨김
            if (e.target.value === 'number') {
                numberTypeOptions.style.display = 'flex';
            } else {
                numberTypeOptions.style.display = 'none';
            }
        });
    });
    
    // 번호 유형 라디오 버튼 이벤트 리스너
    const numberTypeRadios = document.querySelectorAll('input[name="number-type"]');
    numberTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            // 액티브 클래스 처리
            document.querySelectorAll('.number-type-options .search-option').forEach(option => {
                option.classList.remove('active');
            });
            e.target.closest('.search-option').classList.add('active');
        });
    });
}

/**
 * 고급 검색 설정
 */
function setupAdvancedSearch() {
    const advancedSearchButton = document.getElementById('advanced-search-button');
    const advancedSearchOptions = document.getElementById('advanced-search-options');
    
    if (advancedSearchButton && advancedSearchOptions) {
        advancedSearchButton.addEventListener('click', () => {
            const isExpanded = advancedSearchOptions.classList.contains('expanded');
            
            if (isExpanded) {
                advancedSearchOptions.classList.remove('expanded');
                advancedSearchButton.innerHTML = '고급 검색 <i class="fas fa-chevron-down"></i>';
            } else {
                advancedSearchOptions.classList.add('expanded');
                advancedSearchButton.innerHTML = '기본 검색 <i class="fas fa-chevron-up"></i>';
            }
        });
    }
}

/**
 * 자동완성 설정
 */
function setupAutocomplete() {
    const searchInput = document.getElementById('search-input');
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    
    // 자동완성 컨테이너 추가
    if (searchInput) {
        searchInput.parentNode.appendChild(suggestionsContainer);
        
        // 검색어 입력 이벤트
        searchInput.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            const suggestions = await getSuggestedSearchTerms(query);
            
            if (suggestions.length === 0) {
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            // 자동완성 목록 표시
            suggestionsContainer.innerHTML = '';
            suggestions.forEach(term => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = term;
                item.addEventListener('click', () => {
                    searchInput.value = term;
                    suggestionsContainer.style.display = 'none';
                    performSearch();
                });
                suggestionsContainer.appendChild(item);
            });
            
            suggestionsContainer.style.display = 'block';
        }, 300));
        
        // 검색창 포커스 이벤트
        searchInput.addEventListener('focus', () => {
            if (suggestionsContainer.children.length > 0) {
                suggestionsContainer.style.display = 'block';
            }
        });
        
        // 검색창 외부 클릭 시 자동완성 닫기
        document.addEventListener('click', (e) => {
            if (e.target !== searchInput && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }
}

/**
 * 필터 이벤트 리스너 설정
 */
function setupFilterEventListeners() {
    // 필터 옵션 클릭 이벤트
    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            const filterGroup = this.closest('.filter-group');
            const isMultiSelect = filterGroup.classList.contains('multi-select');
            
            if (isMultiSelect) {
                // 다중 선택 처리
                this.classList.toggle('selected');
            } else {
                // 단일 선택 처리
                filterGroup.querySelectorAll('.filter-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
            }
        });
    });
}

/**
 * 검색 실행
 */
export async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    
    if (!searchInput || !resultsContainer) {
        console.error('검색 요소를 찾을 수 없음');
        return;
    }
    
    const query = searchInput.value.trim();
    
    // 쿼리가 너무 짧은 경우 검색하지 않음
    if (query.length > 0 && query.length < 2) {
        showAlert('검색어는 2글자 이상 입력해주세요.', 'warning');
        return;
    }
    
    // 검색 옵션 가져오기
    const searchType = document.querySelector('input[name="search-type"]:checked').value;
    const numberType = searchType === 'number' 
        ? document.querySelector('input[name="number-type"]:checked').value 
        : '';
    
    // 필터 옵션 가져오기
    const countryFilter = document.querySelector('.country-filter .filter-option.selected');
    const programFilter = document.querySelector('.program-filter .filter-option.selected');
    
    const country = countryFilter?.dataset.value || '';
    const program = programFilter?.dataset.value || '';
    
    try {
        // 로딩 표시
        resultsContainer.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>검색 중...</p></div>';
        
        // 검색 실행
        const searchResult = await searchSanctions(query, country, program, searchType, numberType);
        
        // 결과 저장
        currentResults = searchResult.results;
        
        // 검색 결과 표시
        displaySearchResults(searchResult);
        
    } catch (error) {
        console.error('검색 오류:', error);
        resultsContainer.innerHTML = `<div class="search-error">검색 중 오류가 발생했습니다: ${error.message}</div>`;
    }
}

/**
 * 검색 결과 표시
 * @param {Object} searchResult 검색 결과 객체
 */
function displaySearchResults(searchResult) {
    const resultsContainer = document.getElementById('results-container');
    
    if (!resultsContainer) return;
    
    // 컨테이너 내용 지우기
    resultsContainer.innerHTML = '';
    
    const { results, hasExactMatches, suggestions } = searchResult;
    
    // 검색 결과가 없는 경우
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>검색 결과가 없습니다.</p>
                ${suggestions ? `<p>혹시 <a href="#" class="suggested-term">${suggestions}</a>을(를) 찾으시나요?</p>` : ''}
            </div>
        `;
        
        // 제안 검색어 클릭 이벤트
        const suggestedTerm = resultsContainer.querySelector('.suggested-term');
        if (suggestedTerm) {
            suggestedTerm.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('search-input').value = suggestions;
                performSearch();
            });
        }
        
        return;
    }
    
    // 검색 결과 카운트
    const resultCount = document.createElement('div');
    resultCount.className = 'result-count';
    resultCount.textContent = `총 ${results.length}개의 결과`;
    resultsContainer.appendChild(resultCount);
    
    // 결과 그리드
    const resultGrid = document.createElement('div');
    resultGrid.className = 'result-grid';
    
    // 결과 항목 생성
    results.forEach(item => {
        // 유형에 따른 클래스 설정
        let typeClass = '';
        switch((item.type || '').toLowerCase()) {
            case 'individual':
                typeClass = 'individual';
                break;
            case 'entity':
                typeClass = 'entity';
                break;
            case 'vessel':
                typeClass = 'vessel';
                break;
            case 'aircraft':
                typeClass = 'aircraft';
                break;
            default:
                typeClass = 'unknown';
        }
        
        // 날짜 형식화
        let formattedDate = '날짜 미상';
        if (item.date_listed) {
            try {
                const date = new Date(item.date_listed);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                } else {
                    formattedDate = item.date_listed;
                }
            } catch (e) {
                formattedDate = item.date_listed;
            }
        }
        
        // 프로그램 텍스트 (최대 2개까지만 표시)
        const programs = Array.isArray(item.programs) ? item.programs : [];
        let programText = programs.length > 0 
            ? (programs.length > 2 
                ? `${programs[0]} 외 ${programs.length - 1}개` 
                : programs.join(', '))
            : '';
        
        // 별칭 (최대 2개까지만 표시)
        const aliases = item.details && Array.isArray(item.details.aliases) 
            ? item.details.aliases 
            : [];
        let aliasText = aliases.length > 0 
            ? (aliases.length > 2 
                ? `${aliases[0]} 외 ${aliases.length - 1}개` 
                : aliases.join(', '))
            : '';
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.dataset.id = item.id;
        resultItem.dataset.type = item.type;
        
        // 항목 컨텐츠
        resultItem.innerHTML = `
            <div class="result-header">
                <h3>${item.name || '이름 없음'}</h3>
                <span class="result-type ${typeClass}">${item.type || 'UNKNOWN'}</span>
            </div>
            <div class="result-body">
                <p class="result-country"><i class="fas fa-globe"></i> ${item.country || '국가 미상'}</p>
                <p class="result-date"><i class="far fa-calendar"></i> ${formattedDate}</p>
                <p class="result-source"><i class="fas fa-database"></i> ${item.source || ''}</p>
                ${programText ? `<p class="result-program"><i class="fas fa-tag"></i> ${programText}</p>` : ''}
                ${aliasText ? `<p class="result-alias"><i class="fas fa-user-tag"></i> ${aliasText}</p>` : ''}
            </div>
            <div class="result-footer">
                <button class="btn-details" onclick="window.showDetail('${item.id}')">상세정보</button>
            </div>
        `;
        
        resultGrid.appendChild(resultItem);
    });
    
    resultsContainer.appendChild(resultGrid);
    
    // 상세 정보 표시 함수를 전역에 등록
    if (typeof window.showDetail !== 'function') {
        window.showDetail = (id) => {
            // js/components/detail.js에서 가져온 showDetail 함수 사용
            import('./detail.js').then(module => {
                module.showDetail(id);
            }).catch(error => {
                console.error('상세 정보 모듈 로드 실패:', error);
                showAlert('상세 정보를 표시할 수 없습니다.', 'error');
            });
        };
    }
}

/**
 * 현재 검색 결과 반환
 * @returns {Array} 현재 검색 결과
 */
export function getCurrentResults() {
    return currentResults;
} 