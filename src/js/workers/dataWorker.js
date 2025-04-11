/**
 * dataWorker.js
 * 백그라운드 스레드에서 데이터 처리를 담당하는 웹 워커
 */

// 데이터 캐시
let cachedData = null;
let searchCache = new Map();

// 웹 워커 메시지 리스너
self.addEventListener('message', function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'load':
      loadData(data);
      break;
    case 'search':
      searchData(data.query, data.options);
      break;
    case 'filter':
      filterData(data.filters);
      break;
    case 'details':
      getDetails(data.id);
      break;
    case 'clear-cache':
      clearCache();
      break;
    default:
      self.postMessage({
        type: 'error',
        error: `Unknown command: ${type}`
      });
  }
});

/**
 * 데이터 로드 및 전처리
 * @param {Array|null} data 로드할 데이터
 */
function loadData(data) {
  try {
    if (!data) {
      throw new Error('No data provided');
    }
    
    // 데이터 정규화 및 색인화
    const startTime = performance.now();
    
    // 데이터 정규화
    const normalizedData = data.map(normalizeItem);
    
    // 데이터 색인화 (검색 최적화)
    const indexedData = buildSearchIndex(normalizedData);
    
    // 데이터 캐싱
    cachedData = {
      items: normalizedData,
      index: indexedData,
      loadTime: new Date().toISOString()
    };
    
    const processTime = performance.now() - startTime;
    
    // 완료 알림
    self.postMessage({
      type: 'load-complete',
      count: normalizedData.length,
      processTime: processTime,
      timestamp: cachedData.loadTime
    });
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
}

/**
 * 데이터 항목 정규화
 * @param {Object} item 원본 데이터 항목
 * @returns {Object} 정규화된 항목
 */
function normalizeItem(item) {
  // 기본 필드 확인 및 정규화
  return {
    id: item.id || ('sanction_' + Math.random().toString(36).substr(2, 9)),
    name: item.name || '',
    type: item.type || 'UNKNOWN',
    country: item.country || '',
    programs: Array.isArray(item.programs) ? item.programs : 
              item.program ? [item.program] : [],
    source: item.source || '',
    date_listed: item.date_listed || item.listDate || '',
    reason: item.reason || '',
    
    // 상세 정보 정규화
    details: {
      aliases: Array.isArray(item.details?.aliases) ? item.details.aliases : 
               Array.isArray(item.aliases) ? item.aliases : [],
               
      addresses: Array.isArray(item.details?.addresses) ? item.details.addresses : 
                 Array.isArray(item.addresses) ? item.addresses : [],
                 
      nationalities: Array.isArray(item.details?.nationalities) ? item.details.nationalities : 
                     Array.isArray(item.nationalities) ? item.nationalities : [],
                     
      identifications: Array.isArray(item.details?.identifications) ? item.details.identifications : 
                       Array.isArray(item.identifications) ? item.identifications : []
    },
    
    // 색인용 토큰화된 텍스트
    _searchableText: ''
  };
}

/**
 * 검색 색인 구축
 * @param {Array} data 정규화된 데이터
 * @returns {Object} 검색 색인
 */
function buildSearchIndex(data) {
  const index = {
    nameIndex: new Map(),
    countryIndex: new Map(),
    typeIndex: new Map(),
    programIndex: new Map(),
    numberIndex: new Map(),
    aliasIndex: new Map(),
    textIndex: new Map()
  };
  
  data.forEach((item, idx) => {
    // 이름 색인화
    if (item.name) {
      const normalizedName = item.name.toLowerCase();
      
      // 전체 이름으로 색인
      if (!index.nameIndex.has(normalizedName)) {
        index.nameIndex.set(normalizedName, []);
      }
      index.nameIndex.get(normalizedName).push(idx);
      
      // 이름을 단어로 분리하여 색인
      const words = normalizedName.split(/\s+/);
      words.forEach(word => {
        if (word.length > 1) {
          if (!index.textIndex.has(word)) {
            index.textIndex.set(word, []);
          }
          if (!index.textIndex.get(word).includes(idx)) {
            index.textIndex.get(word).push(idx);
          }
        }
      });
    }
    
    // 국가 색인화
    if (item.country) {
      const country = item.country.toLowerCase();
      if (!index.countryIndex.has(country)) {
        index.countryIndex.set(country, []);
      }
      index.countryIndex.get(country).push(idx);
    }
    
    // 유형 색인화
    if (item.type) {
      const type = item.type.toLowerCase();
      if (!index.typeIndex.has(type)) {
        index.typeIndex.set(type, []);
      }
      index.typeIndex.get(type).push(idx);
    }
    
    // 프로그램 색인화
    if (item.programs && item.programs.length) {
      item.programs.forEach(program => {
        const normalizedProgram = program.toLowerCase();
        if (!index.programIndex.has(normalizedProgram)) {
          index.programIndex.set(normalizedProgram, []);
        }
        index.programIndex.get(normalizedProgram).push(idx);
      });
    }
    
    // 별칭 색인화
    if (item.details.aliases && item.details.aliases.length) {
      item.details.aliases.forEach(alias => {
        const normalizedAlias = alias.toLowerCase();
        if (!index.aliasIndex.has(normalizedAlias)) {
          index.aliasIndex.set(normalizedAlias, []);
        }
        index.aliasIndex.get(normalizedAlias).push(idx);
        
        // 별칭 단어도 텍스트 색인에 추가
        const words = normalizedAlias.split(/\s+/);
        words.forEach(word => {
          if (word.length > 1) {
            if (!index.textIndex.has(word)) {
              index.textIndex.set(word, []);
            }
            if (!index.textIndex.get(word).includes(idx)) {
              index.textIndex.get(word).push(idx);
            }
          }
        });
      });
    }
    
    // 식별 번호 색인화
    if (item.details.identifications && item.details.identifications.length) {
      item.details.identifications.forEach(id => {
        if (id.number) {
          const normalizedNumber = id.number.toLowerCase();
          if (!index.numberIndex.has(normalizedNumber)) {
            index.numberIndex.set(normalizedNumber, []);
          }
          index.numberIndex.get(normalizedNumber).push(idx);
        }
      });
    }
    
    // 통합 검색 텍스트 생성
    item._searchableText = [
      item.name,
      item.country,
      item.type,
      ...item.programs,
      ...item.details.aliases,
      ...(item.details.identifications || []).map(id => id.number)
    ].filter(Boolean).join(' ').toLowerCase();
  });
  
  return index;
}

/**
 * 데이터 검색
 * @param {string} query 검색어
 * @param {Object} options 검색 옵션
 */
function searchData(query, options = {}) {
  try {
    if (!cachedData || !cachedData.items || !cachedData.items.length) {
      throw new Error('No data available for search');
    }
    
    const startTime = performance.now();
    
    // 검색 결과
    let results;
    
    // 캐시 키 생성
    const cacheKey = `${query}|${JSON.stringify(options)}`;
    
    // 캐시 확인
    if (searchCache.has(cacheKey)) {
      results = searchCache.get(cacheKey);
    } else {
      // 검색 수행
      if (!query || query.trim() === '') {
        // 빈 검색은 전체 결과 반환
        results = cachedData.items.map((_, idx) => idx);
      } else {
        const normalizedQuery = query.toLowerCase().trim();
        
        if (options.searchType === 'number') {
          // 번호 검색
          results = searchByNumber(normalizedQuery, options.numberType);
        } else {
          // 일반 텍스트 검색 (색인 기반)
          results = searchByText(normalizedQuery);
        }
      }
      
      // 결과 캐싱 (최대 50개 캐시 유지)
      if (searchCache.size >= 50) {
        // 가장 오래된 항목 제거
        const firstKey = searchCache.keys().next().value;
        searchCache.delete(firstKey);
      }
      searchCache.set(cacheKey, results);
    }
    
    // 결과 항목 생성
    const resultItems = results.map(idx => cachedData.items[idx]);
    
    const processTime = performance.now() - startTime;
    
    // 결과 전송
    self.postMessage({
      type: 'search-results',
      query: query,
      count: resultItems.length,
      results: resultItems,
      processTime: processTime
    });
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
}

/**
 * 번호로 검색
 * @param {string} query 검색어
 * @param {string} numberType 번호 유형
 * @returns {Array} 결과 인덱스 배열
 */
function searchByNumber(query, numberType) {
  const results = new Set();
  
  // 번호 색인에서 검색
  cachedData.index.numberIndex.forEach((indices, number) => {
    if (number.includes(query)) {
      indices.forEach(idx => {
        // 번호 유형 필터링
        if (numberType !== 'all') {
          const item = cachedData.items[idx];
          const matchesType = item.details.identifications.some(id => 
            id.number && id.number.toLowerCase().includes(query) &&
            id.type && id.type.toLowerCase().includes(numberType.toLowerCase())
          );
          
          if (matchesType) {
            results.add(idx);
          }
        } else {
          results.add(idx);
        }
      });
    }
  });
  
  return Array.from(results);
}

/**
 * 텍스트로 검색
 * @param {string} query 검색어
 * @returns {Array} 결과 인덱스 배열
 */
function searchByText(query) {
  const results = new Set();
  const words = query.split(/\s+/).filter(w => w.length > 1);
  
  // 검색어가 없으면 빈 결과 반환
  if (words.length === 0) {
    return [];
  }
  
  // 정확한 이름 매치 검색
  if (cachedData.index.nameIndex.has(query)) {
    cachedData.index.nameIndex.get(query).forEach(idx => {
      results.add(idx);
    });
  }
  
  // 정확한 별칭 매치 검색
  if (cachedData.index.aliasIndex.has(query)) {
    cachedData.index.aliasIndex.get(query).forEach(idx => {
      results.add(idx);
    });
  }
  
  // 정확한 국가 매치 검색
  if (cachedData.index.countryIndex.has(query)) {
    cachedData.index.countryIndex.get(query).forEach(idx => {
      results.add(idx);
    });
  }
  
  // 단어 기반 검색
  words.forEach(word => {
    // 텍스트 색인에서 검색
    if (cachedData.index.textIndex.has(word)) {
      cachedData.index.textIndex.get(word).forEach(idx => {
        results.add(idx);
      });
    }
  });
  
  // 부분 일치 검색 (색인에 없는 경우)
  if (results.size === 0) {
    cachedData.items.forEach((item, idx) => {
      if (item._searchableText.includes(query)) {
        results.add(idx);
      }
    });
  }
  
  return Array.from(results);
}

/**
 * 필터 적용
 * @param {Object} filters 필터 객체
 */
function filterData(filters) {
  try {
    if (!cachedData || !cachedData.items) {
      throw new Error('No data available for filtering');
    }
    
    const startTime = performance.now();
    
    // 결과 필터링
    const filteredIndices = [];
    
    cachedData.items.forEach((item, idx) => {
      // 국가 필터
      if (filters.countries && filters.countries.size > 0) {
        if (!item.country || !filters.countries.has(item.country)) {
          return;
        }
      }
      
      // 프로그램 필터
      if (filters.programs && filters.programs.size > 0) {
        if (!item.programs || !item.programs.some(program => 
          filters.programs.has(program)
        )) {
          return;
        }
      }
      
      // 날짜 필터
      if (filters.startDate || filters.endDate) {
        const itemDate = item.date_listed ? new Date(item.date_listed) : null;
        
        if (!itemDate) return;
        
        if (filters.startDate && itemDate < new Date(filters.startDate)) {
          return;
        }
        
        if (filters.endDate && itemDate > new Date(filters.endDate)) {
          return;
        }
      }
      
      // 모든 필터 통과
      filteredIndices.push(idx);
    });
    
    // 필터링된 결과 항목 생성
    const filteredItems = filteredIndices.map(idx => cachedData.items[idx]);
    
    const processTime = performance.now() - startTime;
    
    // 결과 전송
    self.postMessage({
      type: 'filter-results',
      count: filteredItems.length,
      results: filteredItems,
      processTime: processTime
    });
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
}

/**
 * 상세 정보 조회
 * @param {string} id 항목 ID
 */
function getDetails(id) {
  try {
    if (!cachedData || !cachedData.items) {
      throw new Error('No data available for retrieving details');
    }
    
    // ID로 항목 찾기
    const item = cachedData.items.find(item => item.id === id);
    
    if (!item) {
      throw new Error(`Item with ID ${id} not found`);
    }
    
    // 결과 전송
    self.postMessage({
      type: 'details-result',
      id: id,
      item: item
    });
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
}

/**
 * 캐시 초기화
 */
function clearCache() {
  cachedData = null;
  searchCache.clear();
  
  self.postMessage({
    type: 'cache-cleared'
  });
}