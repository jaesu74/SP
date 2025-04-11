/**
 * filter.js
 * 제재 데이터 필터링 및 검색 기능 모듈
 */

const FilterManager = {
  // 활성화된 필터 상태
  activeFilters: {
    countries: new Set(),
    programs: new Set(),
    startDate: null,
    endDate: null
  },

  /**
     * 필터 모듈 초기화
     */
  init() {
    console.log('필터 모듈 초기화...');
    this.setupFilterOptions();
  },

  /**
     * 필터 옵션 설정
     */
  setupFilterOptions() {
    this.setupCountryFilters();
    this.setupProgramFilters();
    this.setupDateFilters();
  },

  /**
     * 국가 필터 설정
     */
  setupCountryFilters() {
    const container = document.getElementById('country-filters');
    if (!container) return;

    // DOM 요소 업데이트는 UI 매니저로 분리될 예정
    this.updateOptionStyles(container);

    // 이벤트 위임 패턴으로 처리
    container.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('filter-option')) {
        const value = e.target.dataset.value;

        if (value === 'all') {
          // '전체' 옵션 선택 시 모든 필터 해제
          this.activeFilters.countries.clear();
        } else if (this.activeFilters.countries.has(value)) {
          // 이미 선택된 필터 해제
          this.activeFilters.countries.delete(value);
        } else {
          // 새 필터 추가
          this.activeFilters.countries.add(value);
        }

        // 필터 표시 업데이트
        const text = this.getSelectedFiltersText(this.activeFilters.countries);
        const isAll = this.activeFilters.countries.size === 0;
        this.updateFilterDisplay(container, text, isAll);

        // 필터링 적용 이벤트 발생
        this.triggerFilterChange();
      }
    });
  },

  /**
     * 프로그램 필터 설정
     */
  setupProgramFilters() {
    const container = document.getElementById('program-filters');
    if (!container) return;

    this.updateOptionStyles(container);

    container.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('filter-option')) {
        const value = e.target.dataset.value;

        if (value === 'all') {
          this.activeFilters.programs.clear();
        } else if (this.activeFilters.programs.has(value)) {
          this.activeFilters.programs.delete(value);
        } else {
          this.activeFilters.programs.add(value);
        }

        const text = this.getSelectedFiltersText(this.activeFilters.programs);
        const isAll = this.activeFilters.programs.size === 0;
        this.updateFilterDisplay(container, text, isAll);

        this.triggerFilterChange();
      }
    });
  },

  /**
     * 날짜 필터 설정
     */
  setupDateFilters() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    if (startDateInput) {
      startDateInput.addEventListener('change', (e) => {
        this.activeFilters.startDate = e.target.value ? new Date(e.target.value) : null;
        this.triggerFilterChange();
      });
    }

    if (endDateInput) {
      endDateInput.addEventListener('change', (e) => {
        this.activeFilters.endDate = e.target.value ? new Date(e.target.value) : null;
        this.triggerFilterChange();
      });
    }
  },

  /**
     * 필터 표시 업데이트
     */
  updateFilterDisplay(container, text, isAll) {
    const dropdown = container.querySelector('.filter-dropdown-btn');
    if (dropdown) {
      const label = dropdown.querySelector('.dropdown-label');
      if (label) {
        label.textContent = isAll ? '전체' : text;
        dropdown.classList.toggle('has-selection', !isAll);
      }
    }
  },

  /**
     * 옵션 스타일 업데이트
     */
  updateOptionStyles(container) {
    const options = container.querySelectorAll('.filter-option');
    const filterType = container.id === 'country-filters' ? 'countries' : 'programs';
    const activeSet = this.activeFilters[filterType];

    options.forEach(option => {
      const value = option.dataset.value;

      if (value === 'all') {
        // '전체' 옵션은 필터 집합이 비어있을 때 활성화
        option.classList.toggle('active', activeSet.size === 0);
      } else {
        // 일반 옵션은 해당 값이 필터 집합에 있을 때 활성화
        option.classList.toggle('active', activeSet.has(value));
      }
    });
  },

  /**
     * 선택된 필터 텍스트 가져오기
     */
  getSelectedFiltersText(filterSet) {
    if (filterSet.size === 0) return '전체';

    // 선택된 필터가 1-3개면 모두 표시
    if (filterSet.size <= 3) {
      return Array.from(filterSet).join(', ');
    }

    // 3개 초과면 개수로 표시
    return `${filterSet.size}개 선택됨`;
  },

  /**
     * 필터 변경 이벤트 발생
     */
  triggerFilterChange() {
    const event = new CustomEvent('filter:change', {
      detail: {
        filters: { ...this.activeFilters }
      }
    });
    document.dispatchEvent(event);
  },

  /**
     * 결과 데이터 필터링
     * @param {Array} data 필터링할 데이터 배열
     * @returns {Array} 필터링된 결과
     */
  applyFilters(data) {
    if (!data || !Array.isArray(data)) return [];

    return data.filter(item => {
      // 국가 필터
      if (this.activeFilters.countries.size > 0) {
        if (!item.country || !this.activeFilters.countries.has(item.country)) {
          return false;
        }
      }

      // 프로그램 필터
      if (this.activeFilters.programs.size > 0) {
        if (!item.programs || !item.programs.some(program =>
          this.activeFilters.programs.has(program)
        )) {
          return false;
        }
      }

      // 날짜 필터
      if (this.activeFilters.startDate || this.activeFilters.endDate) {
        const itemDate = item.date_listed ? new Date(item.date_listed) : null;

        if (!itemDate) return false;

        if (this.activeFilters.startDate && itemDate < this.activeFilters.startDate) {
          return false;
        }

        if (this.activeFilters.endDate && itemDate > this.activeFilters.endDate) {
          return false;
        }
      }

      return true;
    });
  },

  /**
     * 모든 필터 초기화
     */
  resetFilters() {
    this.activeFilters.countries.clear();
    this.activeFilters.programs.clear();
    this.activeFilters.startDate = null;
    this.activeFilters.endDate = null;

    // 필터 UI 업데이트
    const countryContainer = document.getElementById('country-filters');
    const programContainer = document.getElementById('program-filters');

    if (countryContainer) {
      this.updateFilterDisplay(countryContainer, '전체', true);
      this.updateOptionStyles(countryContainer);
    }

    if (programContainer) {
      this.updateFilterDisplay(programContainer, '전체', true);
      this.updateOptionStyles(programContainer);
    }

    // 날짜 입력 초기화
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';

    // 변경 이벤트 발생
    this.triggerFilterChange();
  },

  /**
     * 현재 활성화된 필터 반환
     * @returns {Object} 활성화된 필터
     */
  getActiveFilters() {
    return { ...this.activeFilters };
  }
};

// 전역 객체에 등록
window.FilterManager = FilterManager;

// 외부 모듈에서 사용할 수 있도록 export
export default FilterManager;