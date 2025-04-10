/**
 * filters.js - 제재 데이터 필터링 컴포넌트
 * 검색 결과 필터링 및 정렬 기능을 제공합니다.
 */

// 필터 상태 관리
let activeFilters = {
    countries: new Set(),
    programs: new Set(),
    types: new Set(),
    startDate: null,
    endDate: null
};

// 정렬 상태
let sortConfig = {
    field: 'date_listed',  // 기본: 등재일 순
    order: 'desc'          // 기본: 내림차순 (최신순)
};

/**
 * 필터 컴포넌트 초기화
 */
function initFiltersComponent() {
    console.log('필터 컴포넌트 초기화 중...');
    
    // 필터 UI 이벤트 리스너 설정
    setupFilterUIEventListeners();
    
    // 전역 객체에 필터 함수 노출
    exposeGlobalFunctions();
    
    console.log('필터 컴포넌트 초기화 완료');
}

/**
 * 필터 UI 이벤트 리스너 설정
 * @private
 */
function setupFilterUIEventListeners() {
    // 필터 토글 버튼
    const filterToggleBtn = document.getElementById('filter-toggle');
    if (filterToggleBtn) {
        filterToggleBtn.addEventListener('click', toggleFilterPanel);
    }
    
    // 필터 패널 닫기 버튼
    const filterCloseBtn = document.querySelector('.filter-close');
    if (filterCloseBtn) {
        filterCloseBtn.addEventListener('click', hideFilterPanel);
    }
    
    // 필터 적용 버튼
    const applyFilterBtn = document.getElementById('apply-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyFilters);
    }
    
    // 필터 초기화 버튼
    const resetFilterBtn = document.getElementById('reset-filter');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilters);
    }
    
    // 정렬 선택 변경 이벤트
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', changeSortOrder);
    }
    
    // 날짜 필터 입력 필드
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput) {
        startDateInput.addEventListener('change', () => {
            activeFilters.startDate = startDateInput.value || null;
        });
    }
    
    if (endDateInput) {
        endDateInput.addEventListener('change', () => {
            activeFilters.endDate = endDateInput.value || null;
        });
    }
}

/**
 * 필터 패널 표시/숨김 전환
 */
function toggleFilterPanel() {
    const filterPanel = document.getElementById('filter-panel');
    if (!filterPanel) return;
    
    const isVisible = filterPanel.classList.contains('active');
    
    if (isVisible) {
        hideFilterPanel();
    } else {
        showFilterPanel();
    }
}

/**
 * 필터 패널 표시
 */
function showFilterPanel() {
    const filterPanel = document.getElementById('filter-panel');
    if (!filterPanel) return;
    
    filterPanel.classList.add('active');
    document.body.classList.add('filter-open');
    
    // 필터 패널이 표시되면 배경 오버레이 추가
    const overlay = document.createElement('div');
    overlay.id = 'filter-overlay';
    overlay.className = 'filter-overlay';
    overlay.addEventListener('click', hideFilterPanel);
    document.body.appendChild(overlay);
    
    // 애니메이션 효과
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

/**
 * 필터 패널 숨김
 */
function hideFilterPanel() {
    const filterPanel = document.getElementById('filter-panel');
    if (!filterPanel) return;
    
    filterPanel.classList.remove('active');
    document.body.classList.remove('filter-open');
    
    // 오버레이 제거
    const overlay = document.getElementById('filter-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        
        // 제거 전 애니메이션 완료 대기
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}

/**
 * 검색 결과 필터링 적용
 */
function applyFilters() {
    // 체크박스에서 필터 값 수집
    collectFilterValues();
    
    // 필터 적용 후 결과 업데이트
    if (typeof window.updateSearchResults === 'function') {
        window.updateSearchResults();
    } else {
        console.error('updateSearchResults 함수를 찾을 수 없습니다.');
    }
    
    // 필터 패널 닫기
    hideFilterPanel();
    
    // 필터 적용 알림
    if (window.showToast) {
        window.showToast('필터가 적용되었습니다.', 'success');
    }
}

/**
 * 필터 초기화
 */
function resetFilters() {
    // 필터 상태 초기화
    activeFilters = {
        countries: new Set(),
        programs: new Set(),
        types: new Set(),
        startDate: null,
        endDate: null
    };
    
    // 체크박스 초기화
    const checkboxes = document.querySelectorAll('#filter-panel input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // 날짜 필터 초기화
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    
    // 결과 업데이트
    if (typeof window.updateSearchResults === 'function') {
        window.updateSearchResults();
    }
    
    // 필터 초기화 알림
    if (window.showToast) {
        window.showToast('필터가 초기화되었습니다.', 'info');
    }
}

/**
 * 체크박스에서 필터 값 수집
 * @private
 */
function collectFilterValues() {
    // 국가 필터
    activeFilters.countries.clear();
    document.querySelectorAll('.country-filter:checked').forEach(checkbox => {
        activeFilters.countries.add(checkbox.value);
    });
    
    // 프로그램 필터
    activeFilters.programs.clear();
    document.querySelectorAll('.program-filter:checked').forEach(checkbox => {
        activeFilters.programs.add(checkbox.value);
    });
    
    // 유형 필터
    activeFilters.types.clear();
    document.querySelectorAll('.type-filter:checked').forEach(checkbox => {
        activeFilters.types.add(checkbox.value);
    });
    
    // 날짜 필터는 input change 이벤트에서 처리됨
}

/**
 * 정렬 순서 변경
 * @param {Event} e 이벤트 객체
 */
function changeSortOrder(e) {
    const value = e.target.value;
    
    // 정렬 기준 파싱
    const [field, order] = value.split('-');
    
    sortConfig.field = field;
    sortConfig.order = order;
    
    // 결과 업데이트
    if (typeof window.updateSearchResults === 'function') {
        window.updateSearchResults();
    }
}

/**
 * 검색 결과에 필터 적용
 * @param {Array} results 검색 결과 배열
 * @returns {Array} 필터링된 결과 배열
 */
function applyFiltersToResults(results) {
    if (!results || !Array.isArray(results)) return [];
    
    // 필터 적용
    let filteredResults = [...results];
    
    // 1. 국가 필터 적용
    if (activeFilters.countries.size > 0) {
        filteredResults = filteredResults.filter(item => 
            item.country && activeFilters.countries.has(item.country)
        );
    }
    
    // 2. 프로그램 필터 적용
    if (activeFilters.programs.size > 0) {
        filteredResults = filteredResults.filter(item => {
            // 프로그램이 배열인 경우
            if (Array.isArray(item.programs)) {
                return item.programs.some(program => activeFilters.programs.has(program));
            }
            // 프로그램이 문자열인 경우
            return item.program && activeFilters.programs.has(item.program);
        });
    }
    
    // 3. 유형 필터 적용
    if (activeFilters.types.size > 0) {
        filteredResults = filteredResults.filter(item => 
            item.type && activeFilters.types.has(item.type)
        );
    }
    
    // 4. 날짜 필터 적용
    if (activeFilters.startDate) {
        const startDate = new Date(activeFilters.startDate);
        filteredResults = filteredResults.filter(item => {
            if (!item.date_listed) return true;
            const itemDate = new Date(item.date_listed);
            return !isNaN(itemDate.getTime()) && itemDate >= startDate;
        });
    }
    
    if (activeFilters.endDate) {
        const endDate = new Date(activeFilters.endDate);
        // 종료일은 해당 일자의 끝(23:59:59)까지 포함
        endDate.setHours(23, 59, 59, 999);
        
        filteredResults = filteredResults.filter(item => {
            if (!item.date_listed) return true;
            const itemDate = new Date(item.date_listed);
            return !isNaN(itemDate.getTime()) && itemDate <= endDate;
        });
    }
    
    // 정렬 적용
    return sortResults(filteredResults);
}

/**
 * 검색 결과 정렬
 * @param {Array} results 결과 배열
 * @returns {Array} 정렬된 결과 배열
 */
function sortResults(results) {
    if (!results || !Array.isArray(results)) return [];
    
    const { field, order } = sortConfig;
    
    return [...results].sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];
        
        // 날짜 필드인 경우 Date 객체로 변환
        if (field === 'date_listed') {
            valueA = valueA ? new Date(valueA).getTime() : 0;
            valueB = valueB ? new Date(valueB).getTime() : 0;
        }
        
        // 문자열인 경우 대소문자 구분 없이 비교
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        // 값이 없는 경우 처리
        if (valueA === undefined || valueA === null) return 1;
        if (valueB === undefined || valueB === null) return -1;
        
        // 정렬 방향에 따른 비교
        if (order === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });
}

/**
 * 필터 옵션 동적 생성
 * @param {Array} results 검색 결과
 */
function generateFilterOptions(results) {
    if (!results || !Array.isArray(results) || results.length === 0) return;
    
    // 국가 옵션 추출
    const countries = new Set();
    
    // 프로그램 옵션 추출
    const programs = new Set();
    
    // 유형 옵션 추출
    const types = new Set();
    
    // 데이터에서 고유한 값 추출
    results.forEach(item => {
        // 국가 추가
        if (item.country) {
            countries.add(item.country);
        }
        
        // 프로그램 추가
        if (Array.isArray(item.programs)) {
            item.programs.forEach(program => programs.add(program));
        } else if (item.program) {
            programs.add(item.program);
        }
        
        // 유형 추가
        if (item.type) {
            types.add(item.type);
        }
    });
    
    // 국가 필터 옵션 생성
    const countryContainer = document.getElementById('country-filters');
    if (countryContainer) {
        generateCheckboxOptions(countryContainer, Array.from(countries), 'country-filter');
    }
    
    // 프로그램 필터 옵션 생성
    const programContainer = document.getElementById('program-filters');
    if (programContainer) {
        generateCheckboxOptions(programContainer, Array.from(programs), 'program-filter');
    }
    
    // 유형 필터 옵션 생성
    const typeContainer = document.getElementById('type-filters');
    if (typeContainer) {
        generateCheckboxOptions(typeContainer, Array.from(types), 'type-filter');
    }
}

/**
 * 체크박스 옵션 생성
 * @param {HTMLElement} container 컨테이너 요소
 * @param {Array} options 옵션 배열
 * @param {string} className 체크박스 클래스명
 * @private
 */
function generateCheckboxOptions(container, options, className) {
    // 기존 옵션 제거
    container.innerHTML = '';
    
    // 옵션 정렬
    options.sort();
    
    // 새 옵션 생성
    options.forEach(option => {
        const checkboxId = `${className}-${option.replace(/\s+/g, '-').toLowerCase()}`;
        
        const label = document.createElement('label');
        label.className = 'filter-option';
        label.htmlFor = checkboxId;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = checkboxId;
        checkbox.className = className;
        checkbox.value = option;
        
        // 이미 활성화된 필터면 체크 상태로 설정
        if (className === 'country-filter' && activeFilters.countries.has(option)) {
            checkbox.checked = true;
        } else if (className === 'program-filter' && activeFilters.programs.has(option)) {
            checkbox.checked = true;
        } else if (className === 'type-filter' && activeFilters.types.has(option)) {
            checkbox.checked = true;
        }
        
        const text = document.createTextNode(option);
        
        label.appendChild(checkbox);
        label.appendChild(text);
        container.appendChild(label);
    });
}

/**
 * 전역 객체에 필터 함수 노출
 * @private
 */
function exposeGlobalFunctions() {
    window.FiltersComponent = {
        applyFiltersToResults,
        generateFilterOptions,
        showFilterPanel,
        hideFilterPanel,
        resetFilters
    };
}

// 브라우저 환경에서 초기화
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initFiltersComponent);
}

// ESM/CommonJS 모듈로 내보내기 (선택적)
if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = {
        applyFiltersToResults,
        generateFilterOptions,
        sortResults
    };
} 