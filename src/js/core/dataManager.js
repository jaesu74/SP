/**
 * dataManager.js
 * 데이터 관리 및 처리 모듈
 */

const DataManager = {
  // 현재 데이터 상태
  state: {
    sanctionsData: null,
    currentResults: [],
    lastFetched: null,
    isLoading: false,
    error: null
  },

  /**
     * 데이터 모듈 초기화
     */
  async init() {
    console.log('데이터 관리 모듈 초기화...');

    // 캐시된 데이터 복원 시도
    const cached = this.getCachedData('sanctionsCachedData');
    if (cached && cached.data) {
      this.state.sanctionsData = cached.data;
      this.state.lastFetched = cached.timestamp ? new Date(cached.timestamp) : null;
      console.log(`캐시된 제재 데이터 ${this.state.sanctionsData.length}개 항목 로드됨`);
    }

    // 최종 업데이트 시간 표시
    this.updateLastUpdatedDisplay();
  },

  /**
     * 데이터 캐시에서 가져오기
     * @param {string} key 캐시 키
     * @returns {Object|null} 캐시된 데이터 또는 null
     */
  getCachedData(key) {
    try {
      const cachedStr = localStorage.getItem(key);
      if (!cachedStr) return null;
      return JSON.parse(cachedStr);
    } catch (e) {
      console.warn(`캐시된 데이터(${key}) 파싱 오류:`, e);
      return null;
    }
  },

  /**
     * 데이터 캐싱
     * @param {string} key 캐시 키
     * @param {any} data 캐싱할 데이터
     */
  cacheData(key, data) {
    try {
      const cacheObj = {
        timestamp: new Date().toISOString(),
        data: data
      };
      localStorage.setItem(key, JSON.stringify(cacheObj));
      console.log(`데이터 캐싱 완료: ${key}`);
    } catch (e) {
      console.warn(`데이터 캐싱 오류(${key}):`, e);
    }
  },

  /**
     * 마지막 업데이트 시간 표시 업데이트
     */
  updateLastUpdatedDisplay() {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement && this.state.lastFetched) {
      const date = new Date(this.state.lastFetched);
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };

      lastUpdateElement.textContent = date.toLocaleString('ko-KR', options) + ' LT';
    }
  },

  /**
     * 제재 데이터 가져오기
     * @param {boolean} forceRefresh 강제 새로고침 여부
     * @param {string} containerId 로딩 표시할 컨테이너 ID
     * @returns {Promise<Array>} 제재 데이터 목록
     */
  async fetchSanctionsData(forceRefresh = false, containerId = 'results-container') {
    // 이미 로딩 중이면 현재 데이터 반환
    if (this.state.isLoading) {
      return this.state.sanctionsData || [];
    }

    // 캐시 확인 (30분)
    const now = new Date();
    if (!forceRefresh &&
            this.state.sanctionsData &&
            this.state.lastFetched &&
            (now - this.state.lastFetched) < 30 * 60 * 1000) {
      return this.state.sanctionsData;
    }

    try {
      this.state.isLoading = true;
      this.state.error = null;

      // 로딩 인디케이터 표시
      if (window.UIManager && typeof window.UIManager.showLoading === 'function') {
        window.UIManager.showLoading(containerId, '제재 데이터를 불러오는 중...');
      }

      // Progressive Loading 적용: 각 소스 별로 순차적 로드
      const sources = [
        { name: 'un', url: 'data/un_sanctions.json' },
        { name: 'eu', url: 'data/eu_sanctions.json' },
        { name: 'us', url: 'data/us_sanctions.json' }
      ];

      let sanctionsData = [];
      const loadedSources = [];
      const failedSources = [];

      // 각 소스에서 데이터 가져오기
      for (const source of sources) {
        try {
          // 진행 상태 업데이트
          this.updateLoadingProgress(containerId, `${source.name.toUpperCase()} 제재 데이터 로드 중...`);

          const response = await fetch(source.url);
          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.data)) {
              sanctionsData = [...sanctionsData, ...data.data];
              loadedSources.push(source.name.toUpperCase());

              // 중간 캐싱 (큰 데이터셋인 경우 유용)
              if (sanctionsData.length > 5000) {
                this.cacheData('sanctionsCachedData_partial', sanctionsData);
              }

              console.log(`${source.name.toUpperCase()} 제재 데이터 로드 완료: ${data.data.length}개 항목`);

              // 진행 업데이트 (소스별로 결과 표시 업데이트 가능)
              if (this.state.currentResults.length === 0) {
                this.state.currentResults = sanctionsData;
                this.triggerDataUpdate('partial', sanctionsData);
              }
            }
          } else {
            throw new Error(`응답 코드: ${response.status}`);
          }
        } catch (error) {
          console.warn(`${source.name.toUpperCase()} 제재 데이터 로드 실패:`, error);
          failedSources.push(source.name.toUpperCase());
        }
      }

      // 데이터가 없는 경우 통합 데이터로 폴백
      if (sanctionsData.length === 0) {
        this.updateLoadingProgress(containerId, '통합 제재 데이터 로드 중...');

        try {
          const response = await fetch('data/integrated_sanctions.json');
          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.data)) {
              sanctionsData = data.data;
              console.log(`통합 제재 데이터 로드 완료: ${sanctionsData.length}개 항목`);
            }
          } else {
            throw new Error(`통합 데이터 응답 코드: ${response.status}`);
          }
        } catch (error) {
          console.error('통합 제재 데이터 로드 실패:', error);

          // API 폴백 시도
          this.updateLoadingProgress(containerId, 'API에서 데이터 로드 중...');

          try {
            const apiResponse = await fetch('https://api.wvl.co.kr/sanctions/all');
            if (apiResponse.ok) {
              const apiData = await apiResponse.json();
              if (apiData && Array.isArray(apiData.data)) {
                sanctionsData = apiData.data;
                console.log(`API에서 ${sanctionsData.length}개 항목 로드됨`);
              } else {
                throw new Error('API 응답 형식 오류');
              }
            } else {
              throw new Error(`API 응답 코드: ${apiResponse.status}`);
            }
          } catch (apiError) {
            console.error('API 데이터 로드 실패:', apiError);
            throw new Error('모든 데이터 소스 로드 실패');
          }
        }
      }

      // 데이터 정규화 및 중복 제거
      this.updateLoadingProgress(containerId, '데이터 처리 중...');

      // 데이터 정규화
      sanctionsData = this.normalizeData(sanctionsData);

      // 상태 업데이트
      this.state.sanctionsData = sanctionsData;
      this.state.lastFetched = new Date();
      this.state.currentResults = sanctionsData;

      // 데이터 캐싱
      this.cacheData('sanctionsCachedData', sanctionsData);

      // 마지막 업데이트 시간 표시 업데이트
      this.updateLastUpdatedDisplay();

      // 결과 표시
      if (failedSources.length > 0) {
        const message = `일부 소스(${failedSources.join(', ')})에서 데이터를 불러오지 못했습니다.`;
        if (window.UIManager && typeof window.UIManager.showAlert === 'function') {
          window.UIManager.showAlert(message, 'warning');
        }
      }

      return sanctionsData;

    } catch (e) {
      this.state.error = e.message;
      console.error('제재 데이터 로드 실패:', e);

      // 오류 알림
      if (window.UIManager && typeof window.UIManager.showAlert === 'function') {
        window.UIManager.showAlert(`데이터 로드 오류: ${e.message}`, 'error');
      }

      // 부분 캐시 데이터 복원 시도
      const partialCache = this.getCachedData('sanctionsCachedData_partial');
      if (partialCache && Array.isArray(partialCache.data) && partialCache.data.length > 0) {
        return partialCache.data;
      }

      // 기존 캐시 데이터 반환
      return this.state.sanctionsData || [];

    } finally {
      this.state.isLoading = false;

      // 로딩 인디케이터 제거
      if (window.UIManager && typeof window.UIManager.hideLoading === 'function') {
        window.UIManager.hideLoading(containerId);
      }

      // 완료 이벤트 발생
      this.triggerDataUpdate('complete', this.state.sanctionsData);
    }
  },

  /**
     * 로딩 진행 상태 업데이트
     * @param {string} containerId 컨테이너 ID
     * @param {string} message 진행 메시지
     */
  updateLoadingProgress(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const loadingElement = container.querySelector('.loading-indicator');
    if (loadingElement) {
      const messageEl = loadingElement.querySelector('.loading-message');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
  },

  /**
     * 제재 데이터 정규화
     * @param {Array} data 정규화할 데이터
     * @returns {Array} 정규화된 데이터
     */
  normalizeData(data) {
    // 중복 ID 처리를 위한 세트
    const uniqueIds = new Set();

    // 데이터 정규화 및 중복 제거
    const normalized = data
      .map(item => ({
        id: item.id || ('sanction_' + Math.random().toString(36).substr(2, 9)),
        name: item.name,
        type: item.type || 'UNKNOWN',
        country: item.country,
        programs: Array.isArray(item.programs) ? item.programs :
          item.program ? [item.program] : [],
        source: item.source,
        date_listed: item.date_listed || item.listDate,
        reason: item.reason,
        details: item.details || {
          aliases: item.aliases || [],
          addresses: item.addresses || [],
          nationalities: item.nationalities || [],
          identifications: item.identifications || []
        }
      }))
      .filter(item => {
        // 중복 ID 제거
        if (uniqueIds.has(item.id)) {
          return false;
        }
        uniqueIds.add(item.id);
        return true;
      });

    return normalized;
  },

  /**
     * 데이터 업데이트 이벤트 발생
     * @param {string} type 업데이트 유형 (partial, complete)
     * @param {Array} data 업데이트된 데이터
     */
  triggerDataUpdate(type, data) {
    const event = new CustomEvent('data:update', {
      detail: {
        type: type,
        data: data
      }
    });
    document.dispatchEvent(event);
  },

  /**
     * 제재 대상 검색
     * @param {string} query 검색어
     * @param {Object} options 검색 옵션
     * @returns {Promise<Object>} 검색 결과
     */
  async searchSanctions(query, options = {}) {
    try {
      const searchType = options.searchType || 'text';
      const numberType = options.numberType || 'all';

      // 로딩 상태 표시
      this.state.isLoading = true;

      // 검색 인디케이터 표시
      if (window.UIManager && typeof window.UIManager.showLoading === 'function') {
        window.UIManager.showLoading('results-container', '검색 중...');
      }

      // 데이터 확인
      let data;
      if (!this.state.sanctionsData || this.state.sanctionsData.length === 0) {
        // 데이터가 없으면 로드
        data = await this.fetchSanctionsData();
      } else {
        data = this.state.sanctionsData;
      }

      // 검색어가 없으면 전체 데이터 반환
      if (!query) {
        this.state.currentResults = data;
        return { results: data };
      }

      // 로컬 검색 수행
      let filtered;
      const normalizedQuery = query.toLowerCase().trim();

      if (searchType === 'number') {
        // 번호 검색 로직
        filtered = data.filter(item => {
          const details = item.details || {};
          const identifications = details.identifications || [];

          return identifications.some(id => {
            // 번호 유형에 따라 필터링
            if (numberType !== 'all' &&
                            id.type &&
                            !id.type.toLowerCase().includes(numberType.toLowerCase())) {
              return false;
            }

            // 번호 검색
            return id.number && id.number.toLowerCase().includes(normalizedQuery);
          });
        });
      } else {
        // 텍스트 검색 로직 - 성능 최적화 버전
        filtered = data.filter(item => {
          // 이름 검색
          if (item.name && item.name.toLowerCase().includes(normalizedQuery)) {
            return true;
          }

          // 별칭 검색
          const details = item.details || {};
          const aliases = details.aliases || [];
          if (aliases.some(alias => alias.toLowerCase().includes(normalizedQuery))) {
            return true;
          }

          // 국가 검색
          if (item.country && item.country.toLowerCase().includes(normalizedQuery)) {
            return true;
          }

          // 유형 검색
          if (item.type && item.type.toLowerCase().includes(normalizedQuery)) {
            return true;
          }

          // 프로그램 검색
          if (item.programs && item.programs.some(program =>
            program.toLowerCase().includes(normalizedQuery))) {
            return true;
          }

          // 주소 검색
          const addresses = details.addresses || [];
          if (addresses.some(addr => addr.toLowerCase().includes(normalizedQuery))) {
            return true;
          }

          return false;
        });
      }

      // 결과 업데이트
      this.state.currentResults = filtered;

      return { results: filtered };

    } catch (e) {
      console.error('검색 오류:', e);

      // 오류 알림
      if (window.UIManager && typeof window.UIManager.showAlert === 'function') {
        window.UIManager.showAlert(`검색 오류: ${e.message}`, 'error');
      }

      return { results: [], error: e.message };

    } finally {
      this.state.isLoading = false;

      // 로딩 인디케이터 제거
      if (window.UIManager && typeof window.UIManager.hideLoading === 'function') {
        window.UIManager.hideLoading('results-container');
      }
    }
  },

  /**
     * 제재 대상 상세 정보 조회
     * @param {string} id 제재 ID
     * @returns {Promise<Object>} 상세 정보
     */
  async getSanctionDetails(id) {
    try {
      // 데이터 확인
      let data;
      if (!this.state.sanctionsData || this.state.sanctionsData.length === 0) {
        // 데이터가 없으면 로드
        data = await this.fetchSanctionsData();
      } else {
        data = this.state.sanctionsData;
      }

      // ID로 상세 정보 검색
      const details = data.find(item => item.id === id);

      if (!details) {
        // API에서 상세 정보 시도
        try {
          const response = await fetch(`https://api.wvl.co.kr/sanctions/details/${id}`);
          if (response.ok) {
            const result = await response.json();
            return result.data || null;
          }
        } catch (apiError) {
          console.warn('API에서 상세 정보 조회 실패:', apiError);
        }

        return null;
      }

      return details;

    } catch (e) {
      console.error('상세 정보 조회 오류:', e);

      // 오류 알림
      if (window.UIManager && typeof window.UIManager.showAlert === 'function') {
        window.UIManager.showAlert(`상세 정보 조회 오류: ${e.message}`, 'error');
      }

      return null;
    }
  },

  /**
     * 현재 결과 데이터 반환
     * @returns {Array} 현재 결과 데이터
     */
  getCurrentResults() {
    return this.state.currentResults;
  },

  /**
     * 결과 개수 업데이트
     */
  updateResultsCount() {
    const countElement = document.getElementById('results-count');
    if (countElement) {
      countElement.textContent = this.state.currentResults.length;
    }
  }
};

// 전역 객체에 등록
window.DataManager = DataManager;

// 외부 모듈에서 사용할 수 있도록 export
export default DataManager;