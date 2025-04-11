/**
 * api.js - 제재 데이터 API 서비스
 * 제재 데이터 검색 및 관리 기능을 제공합니다.
 */

// API 서비스 객체 생성
const ApiService = {};

// 캐시 및 상태 관리
const apiState = {
  sanctions: null,
  lastFetched: null,
  isLoading: false,
  error: null
};

/**
 * 초기화 함수
 */
ApiService.init = function() {
  console.log('API 서비스 초기화...');

  // 캐시된 데이터 복원 시도
  const cached = this.getCachedSanctionsData();
  if (cached && cached.data) {
    apiState.sanctions = cached.data;
    apiState.lastFetched = cached.timestamp ? new Date(cached.timestamp) : null;
    console.log(`캐시된 제재 데이터 ${apiState.sanctions.length}개 항목 로드됨`);
  }

  // apiModule 함수들을 ApiService로 통합
  if (window.apiModule) {
    // 기존 apiModule 함수들을 보존하면서 ApiService 함수도 제공
    if (typeof window.apiModule.fetchSanctionsData === 'function' && !this.fetchSanctionsData) {
      this.fetchSanctionsData_legacy = window.apiModule.fetchSanctionsData;
    }

    if (typeof window.apiModule.searchSanctions === 'function' && !this.searchSanctions) {
      this.searchSanctions_legacy = window.apiModule.searchSanctions;
    }

    if (typeof window.apiModule.getSanctionDetails === 'function' && !this.getSanctionDetails) {
      this.getSanctionDetails_legacy = window.apiModule.getSanctionDetails;
    }

    if (typeof window.apiModule.getRecentSanctions === 'function' && !this.getRecentSanctions) {
      this.getRecentSanctions_legacy = window.apiModule.getRecentSanctions;
    }
  }

  console.log('API 서비스 초기화 완료');
};

/**
 * 캐시에서 제재 데이터 가져오기
 * @returns {Object|null} 캐시된 데이터 객체 또는 null
 */
ApiService.getCachedSanctionsData = function() {
  try {
    const cachedStr = localStorage.getItem('sanctionsCachedData');
    if (!cachedStr) return null;

    const cached = JSON.parse(cachedStr);
    return cached;
  } catch (e) {
    console.warn('캐시된 데이터 파싱 오류:', e);
    return null;
  }
};

/**
 * 제재 데이터 캐싱
 * @param {Array} data 제재 데이터 배열
 */
ApiService.cacheSanctionsData = function(data) {
  try {
    const cacheObj = {
      timestamp: new Date().toISOString(),
      data: data
    };
    localStorage.setItem('sanctionsCachedData', JSON.stringify(cacheObj));
    console.log('제재 데이터 캐싱 완료');
  } catch (e) {
    console.warn('데이터 캐싱 오류:', e);
  }
};

/**
 * 제재 데이터 가져오기
 * @param {boolean} forceRefresh 강제 새로고침 여부
 * @returns {Promise<Array>} 제재 데이터 목록
 */
ApiService.fetchSanctionsData = async function(forceRefresh = false) {
  if (apiState.isLoading) {
    return apiState.sanctions || [];
  }

  const now = new Date();
  if (!forceRefresh &&
        apiState.sanctions &&
        apiState.lastFetched &&
        (now - apiState.lastFetched) < 30 * 60 * 1000) {
    return apiState.sanctions;
  }

  try {
    apiState.isLoading = true;

    // 로딩 인디케이터 표시
    const container = document.getElementById('results-container');
    if (container) {
      const loadingElement = document.createElement('div');
      loadingElement.className = 'loading-indicator';
      loadingElement.innerHTML = '<div class="spinner"></div><p>제재 데이터를 불러오는 중...</p>';
      container.appendChild(loadingElement);
    }

    // 데이터 소스
    const sources = [
      { name: 'un', url: 'data/un_sanctions.json' },
      { name: 'eu', url: 'data/eu_sanctions.json' },
      { name: 'us', url: 'data/us_sanctions.json' }
    ];

    let sanctionsData = [];
    const failedSources = [];

    // 각 소스에서 데이터 가져오기
    for (const source of sources) {
      try {
        const response = await fetch(source.url);
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.data)) {
            sanctionsData = [...sanctionsData, ...data.data];
            console.log(`${source.name.toUpperCase()} 제재 데이터 로드 완료: ${data.data.length}개 항목`);
          }
        }
      } catch (error) {
        console.warn(`${source.name.toUpperCase()} 제재 데이터 로드 실패:`, error);
        failedSources.push(source.name.toUpperCase());
      }
    }

    // 데이터가 없는 경우 기본 데이터로 폴백
    if (sanctionsData.length === 0) {
      try {
        const response = await fetch('data/all_sanctions.json');
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.data)) {
            sanctionsData = data.data;
            console.log(`기본 제재 데이터 로드 완료: ${sanctionsData.length}개 항목`);
          }
        }
      } catch (error) {
        console.error('기본 제재 데이터 로드 실패:', error);

        // 최종 폴백: 레거시 API 모듈 사용
        if (this.fetchSanctionsData_legacy) {
          console.log('레거시 API 모듈을 사용하여 데이터 로드 시도');
          try {
            const legacyData = await this.fetchSanctionsData_legacy();
            if (legacyData && legacyData.length > 0) {
              sanctionsData = legacyData;
              console.log(`레거시 API를 통해 ${sanctionsData.length}개 항목 로드됨`);
            }
          } catch (legacyError) {
            console.error('레거시 API 모듈 로드 실패:', legacyError);
            throw new Error('제재 데이터를 로드할 수 없습니다.');
          }
        } else {
          throw new Error('제재 데이터를 로드할 수 없습니다.');
        }
      }
    }

    // 데이터 정규화 및 중복 제거
    sanctionsData = sanctionsData.map(item => ({
      id: item.id || ('sanction_' + Math.random().toString(36).substr(2, 9)),
      name: item.name,
      type: item.type || 'UNKNOWN',
      country: item.country,
      programs: Array.isArray(item.programs) ? item.programs : [item.program],
      source: item.source,
      date_listed: item.date_listed || item.listDate,
      reason: item.reason,
      details: item.details || {
        aliases: item.aliases || [],
        addresses: item.addresses || [],
        nationalities: item.nationalities || [],
        identifications: item.identifications || []
      }
    }));

    // 중복 제거
    const uniqueIds = new Set();
    sanctionsData = sanctionsData.filter(item => {
      if (uniqueIds.has(item.id)) {
        return false;
      }
      uniqueIds.add(item.id);
      return true;
    });

    // 상태 업데이트
    apiState.sanctions = sanctionsData;
    apiState.lastFetched = now;
    apiState.error = null;

    // 캐시 저장
    this.cacheSanctionsData(sanctionsData);

    // 최종 업데이트 시간 표시
    if (window.Utils && window.Utils.updateLastUpdateTime) {
      window.Utils.updateLastUpdateTime(now);
    } else {
      const lastUpdateElement = document.getElementById('last-update');
      if (lastUpdateElement) {
        lastUpdateElement.textContent = now.toLocaleString('ko-KR');
      }
    }

    // 실패한 소스에 대한 경고 표시
    if (failedSources.length > 0) {
      const failedSourcesStr = failedSources.join(', ');
      console.warn(`일부 데이터(${failedSourcesStr})를 로드하지 못했습니다.`);

      // 알림 표시
      if (window.Utils && window.Utils.showAlert) {
        window.Utils.showAlert(`일부 데이터(${failedSourcesStr})를 로드하지 못했습니다. 제한된 결과만 표시됩니다.`, 'warning');
      } else if (window.showAlert) {
        window.showAlert(`일부 데이터(${failedSourcesStr})를 로드하지 못했습니다. 제한된 결과만 표시됩니다.`, 'warning');
      }
    }

    return apiState.sanctions;

  } catch (error) {
    console.error('제재 데이터 로드 오류:', error);
    apiState.error = error.message;

    // 알림 표시
    if (window.Utils && window.Utils.showAlert) {
      window.Utils.showAlert('제재 데이터를 불러오는 도중 오류가 발생했습니다.', 'error');
    } else if (window.showAlert) {
      window.showAlert('제재 데이터를 불러오는 도중 오류가 발생했습니다.', 'error');
    }

    return [];
  } finally {
    apiState.isLoading = false;

    // 로딩 인디케이터 제거
    setTimeout(() => {
      const loadingIndicator = document.querySelector('.loading-indicator');
      if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
    }, 500);
  }
};

/**
 * 제재 대상 검색
 * @param {string} query 검색어
 * @param {Object} options 검색 옵션
 * @param {string} options.searchType 검색 유형 (text, number)
 * @param {string} options.numberType 번호 유형 (passport, id, other)
 * @param {string} options.country 국가 필터
 * @param {string} options.program 프로그램 필터
 * @param {Date} options.startDate 시작일
 * @param {Date} options.endDate 종료일
 * @returns {Promise<Object>} 검색 결과
 */
ApiService.searchSanctions = async function(query, options = {}) {
  console.log('제재 검색 실행:', query, options);

  try {
    // 옵션 초기화
    const searchOptions = {
      searchType: options.searchType || 'text',
      numberType: options.numberType || 'all',
      country: options.country || 'all',
      program: options.program || 'all',
      startDate: options.startDate || null,
      endDate: options.endDate || null
    };

    // 먼저 실제 API 호출 시도
    try {
      const apiUrl = new URL('https://api.wvl.co.kr/sanctions/search');
      apiUrl.searchParams.append('q', query);
      apiUrl.searchParams.append('type', searchOptions.searchType);

      if (searchOptions.searchType === 'number') {
        apiUrl.searchParams.append('numberType', searchOptions.numberType);
      }

      const response = await fetch(apiUrl.toString());
      if (response.ok) {
        const data = await response.json();
        // 결과 필터링
        const filteredResults = this.filterResults(data.data || [], searchOptions);
        return { results: filteredResults };
      }
    } catch (apiError) {
      console.warn('API 검색 오류, 로컬 데이터 사용:', apiError);
    }

    // API 실패 시, 로컬에 캐시된 데이터 사용
    let data = apiState.sanctions;

    // 캐시된 데이터가 없으면 불러오기
    if (!data || !data.length) {
      data = await this.fetchSanctionsData();
    }

    // 결과 없이 반환
    if (!data || !data.length) {
      return { results: [] };
    }

    // 검색어 없는 경우, 전체 데이터 반환 (필터 적용)
    if (!query) {
      return { results: this.filterResults(data, searchOptions) };
    }

    // 로컬 검색 수행
    let results;
    const lowerQuery = query.toLowerCase();

    if (searchOptions.searchType === 'number') {
      // 번호 검색 로직
      results = data.filter(item => {
        if (!item.details || !item.details.identifications) return false;

        return item.details.identifications.some(id => {
          // 번호 유형에 따라 필터링
          if (searchOptions.numberType !== 'all' &&
                        id.type &&
                        !id.type.toLowerCase().includes(searchOptions.numberType.toLowerCase())) {
            return false;
          }

          // 번호 검색
          return id.number && id.number.toLowerCase().includes(lowerQuery);
        });
      });
    } else {
      // 텍스트 검색 로직
      results = data.filter(item =>
        (item.name && item.name.toLowerCase().includes(lowerQuery)) ||
                (item.details && item.details.aliases && item.details.aliases.some(alias =>
                  alias.toLowerCase().includes(lowerQuery)
                )) ||
                (item.country && item.country.toLowerCase().includes(lowerQuery)) ||
                (item.type && item.type.toLowerCase().includes(lowerQuery)) ||
                (item.reason && item.reason.toLowerCase().includes(lowerQuery))
      );
    }

    // 추가 필터 적용
    const filteredResults = this.filterResults(results, searchOptions);

    return { results: filteredResults };
  } catch (error) {
    console.error('제재 검색 오류:', error);

    // 레거시 API 모듈 사용
    if (this.searchSanctions_legacy) {
      try {
        return await this.searchSanctions_legacy(query, options);
      } catch (legacyError) {
        console.error('레거시 검색 API 실패:', legacyError);
        return { results: [] };
      }
    }

    return { results: [] };
  }
};

/**
 * 검색 결과 필터링
 * @private
 * @param {Array} results 검색 결과
 * @param {Object} options 필터 옵션
 * @returns {Array} 필터링된 결과
 */
ApiService.filterResults = function(results, options) {
  if (!results || !results.length) return [];
  if (!options) return results;

  return results.filter(item => {
    // 국가 필터
    if (options.country && options.country !== 'all') {
      if (!item.country || item.country !== options.country) {
        return false;
      }
    }

    // 프로그램 필터
    if (options.program && options.program !== 'all') {
      if (!item.programs || !item.programs.includes(options.program)) {
        return false;
      }
    }

    // 날짜 필터
    if (options.startDate || options.endDate) {
      if (!item.date_listed) return false;

      const itemDate = new Date(item.date_listed);
      if (isNaN(itemDate.getTime())) return false;

      if (options.startDate && itemDate < options.startDate) {
        return false;
      }

      if (options.endDate && itemDate > options.endDate) {
        return false;
      }
    }

    return true;
  });
};

/**
 * 제재 대상 상세 정보 가져오기
 * @param {string} id 항목 ID
 * @returns {Promise<Object>} 상세 정보
 */
ApiService.getSanctionDetails = async function(id) {
  if (!id) return null;

  try {
    // 실제 API에서 상세 정보 가져오기
    const response = await fetch(`https://api.wvl.co.kr/sanctions/details/${id}`);
    if (response.ok) {
      const data = await response.json();
      return data.data || null;
    }
  } catch (apiError) {
    console.warn('API 상세 정보 조회 오류, 로컬 데이터 사용:', apiError);
  }

  // API 실패 시 로컬 데이터에서 조회
  const data = apiState.sanctions || await this.fetchSanctionsData();
  const item = data.find(item => item.id === id);

  if (!item && this.getSanctionDetails_legacy) {
    // 레거시 API 모듈 사용
    try {
      return await this.getSanctionDetails_legacy(id);
    } catch (legacyError) {
      console.error('레거시 상세 정보 조회 실패:', legacyError);
      return null;
    }
  }

  return item || null;
};

/**
 * 최근 제재 데이터 가져오기
 * @param {number} limit 결과 수
 * @returns {Promise<Array>} 최근 제재 데이터
 */
ApiService.getRecentSanctions = async function(limit = 10) {
  try {
    // 실제 API에서 최근 제재 데이터 가져오기
    const response = await fetch(`https://api.wvl.co.kr/sanctions/recent?limit=${limit}`);
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
  } catch (apiError) {
    console.warn('최근 제재 API 오류, 로컬 데이터 사용:', apiError);
  }

  // API 실패 시 전체 데이터에서 최근 항목 필터링
  const allData = apiState.sanctions || await this.fetchSanctionsData();

  if (!allData || !allData.length) {
    if (this.getRecentSanctions_legacy) {
      // 레거시 API 모듈 사용
      try {
        return await this.getRecentSanctions_legacy(limit);
      } catch (legacyError) {
        console.error('레거시 최근 제재 데이터 조회 실패:', legacyError);
        return [];
      }
    }
    return [];
  }

  // 날짜 기준으로 정렬 (최신순)
  const sorted = [...allData].sort((a, b) => {
    const dateA = a.date_listed ? new Date(a.date_listed) : new Date(0);
    const dateB = b.date_listed ? new Date(b.date_listed) : new Date(0);
    return dateB - dateA;
  });

  return sorted.slice(0, limit);
};

/**
 * 검색어 기반 추천 검색어 제공
 * @param {string} query 검색어
 * @returns {Array} 추천 검색어 목록
 */
ApiService.getSuggestedSearchTerms = function(query) {
  if (!query || query.length < 2) return [];

  // 샘플 추천 검색어 (실제 구현에서는 데이터 기반 추천 제공)
  const suggestions = [
    '김정은', '푸틴', '이란 혁명수비대', '북한', '러시아', '시리아',
    '선박', '항공기', '핵무기', '인권', '테러', 'UN', 'EU', 'OFAC'
  ];

  // 검색어와 유사한 추천 검색어 필터링
  const lowerQuery = query.toLowerCase();
  const filtered = suggestions.filter(term =>
    term.toLowerCase().includes(lowerQuery) && term.toLowerCase() !== lowerQuery
  );

  return filtered.slice(0, 5); // 최대 5개 추천
};

// API 서비스를 전역 객체로 등록
window.ApiService = ApiService;

// 페이지 로드 시 자동 초기화 - 옵션
document.addEventListener('DOMContentLoaded', () => {
  // app.js에서 명시적 초기화를 기다리지 않고 자동 초기화
  if (!window.appInitialized) {
    ApiService.init();
  }
});

// 기존 apiModule을 ApiService로 대체
if (typeof window.apiModule === 'undefined') {
  window.apiModule = {
    fetchSanctionsData: (...args) => ApiService.fetchSanctionsData(...args),
    searchSanctions: (...args) => ApiService.searchSanctions(...args),
    getSanctionDetails: (...args) => ApiService.getSanctionDetails(...args),
    getRecentSanctions: (...args) => ApiService.getRecentSanctions(...args)
  };
}