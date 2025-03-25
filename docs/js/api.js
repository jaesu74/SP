/**
 * WVL Sanctions API
 * 제재 데이터 API 호출 및 처리 담당
 */

// API URL 설정 (로컬 파일 경로 또는 서버 URL)
const API_BASE_URL = './data';
const SANCTIONS_DATA_FILE = `${API_BASE_URL}/sanctions.json`;

// 캐시 설정
const CACHE_TIMEOUT = 3600000; // 1시간 (밀리초)
let sanctionsDataCache = null;
let lastCacheTime = 0;

/**
 * 제재 데이터 가져오기
 * @returns {Promise<Array>} 제재 데이터 배열
 */
async function fetchSanctionsData() {
  // 캐시 확인
  const now = Date.now();
  if (sanctionsDataCache && (now - lastCacheTime < CACHE_TIMEOUT)) {
    return sanctionsDataCache;
  }

  try {
    const response = await fetch(SANCTIONS_DATA_FILE);
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    
    // 캐시 업데이트
    sanctionsDataCache = data;
    lastCacheTime = now;
    
    // 콘솔에 메타데이터 표시
    console.log(`제재 데이터 로드 완료: ${data.meta.totalEntries}건, 마지막 업데이트: ${new Date(data.meta.lastUpdated).toLocaleString()}`);
    
    return data;
  } catch (error) {
    console.error('제재 데이터 로드 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 제재 대상 검색
 * @param {string} query 검색어
 * @param {Object} options 검색 옵션 (필터, 국가, 프로그램 등)
 * @returns {Promise<Array>} 검색 결과 배열
 */
async function searchSanctions(query, options = {}) {
  try {
    const sanctionsData = await fetchSanctionsData();
    const items = sanctionsData.data;
    
    if (!items || !Array.isArray(items)) {
      console.error('올바른 제재 데이터 형식이 아닙니다');
      return [];
    }
    
    // 검색어 처리
    const searchTerm = query ? query.toLowerCase().trim() : '';
    
    // 필터링 함수
    const filterItem = (item) => {
      // 검색어 필터링
      if (searchTerm) {
        const nameMatch = item.name && item.name.toLowerCase().includes(searchTerm);
        const countryMatch = item.country && item.country.toLowerCase().includes(searchTerm);
        const aliasMatch = item.details && item.details.aliases && 
          item.details.aliases.some(alias => alias.toLowerCase().includes(searchTerm));
          
        // 상세 정보에서 검색 (address, otherInformation 등)
        const detailsMatch = item.details && 
          JSON.stringify(item.details).toLowerCase().includes(searchTerm);
        
        if (!(nameMatch || countryMatch || aliasMatch || detailsMatch)) {
          return false;
        }
      }
      
      // 국가 필터링
      if (options.country && options.country !== '') {
        if (!item.country || !item.country.toLowerCase().includes(options.country.toLowerCase())) {
          return false;
        }
      }
      
      // 유형 필터링
      if (options.types && options.types.length > 0 && options.types[0] !== 'all') {
        // 타입이 options.types 배열에 포함되어 있지 않으면 필터링
        const itemType = getEntityType(item);
        if (!options.types.includes(itemType)) {
          return false;
        }
      }
      
      // 프로그램 필터링
      if (options.program && options.program !== '') {
        if (!item.programs || !item.programs.some(prog => 
          prog.toLowerCase().includes(options.program.toLowerCase()))) {
          return false;
        }
      }
      
      return true;
    };
    
    // 필터링 적용
    const results = items.filter(filterItem);
    
    // 결과 정렬 (관련성 점수, 이름순)
    results.sort((a, b) => {
      // 먼저 매치 점수로 정렬
      const scoreA = a.matchScore || 0;
      const scoreB = b.matchScore || 0;
      
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      
      // 점수가 같으면 이름으로 정렬
      return a.name.localeCompare(b.name);
    });
    
    return results;
  } catch (error) {
    console.error('검색 중 오류 발생:', error);
    return [];
  }
}

/**
 * 제재 대상 ID로 상세 정보 조회
 * @param {string} id 제재 대상 ID
 * @returns {Promise<Object>} 제재 대상 상세 정보
 */
async function getSanctionDetails(id) {
  try {
    const sanctionsData = await fetchSanctionsData();
    return sanctionsData.data.find(item => item.id === id) || null;
  } catch (error) {
    console.error('상세 정보 조회 중 오류 발생:', error);
    return null;
  }
}

/**
 * 최근 제재 대상 가져오기
 * @param {number} limit 가져올 항목 수
 * @param {string} type 유형 필터 (개인, 기업/기관, 선박, 항공기)
 * @returns {Promise<Array>} 최근 제재 대상 배열
 */
async function getRecentSanctions(limit = 10, type = null) {
  try {
    const sanctionsData = await fetchSanctionsData();
    let results = sanctionsData.data;
    
    // 유형 필터링
    if (type && type !== 'all') {
      results = results.filter(item => getEntityType(item) === type);
    }
    
    // 최신순 정렬 (나중에 추가된 데이터가 앞에 오도록)
    results.sort((a, b) => {
      // sanctions 배열이 있고, startDate가 있다면 그것으로 정렬
      const getLatestDate = (item) => {
        if (item.details && item.details.sanctions && item.details.sanctions.length > 0) {
          return new Date(item.details.sanctions[0].startDate || '1900-01-01').getTime();
        }
        return 0;
      };
      
      return getLatestDate(b) - getLatestDate(a);
    });
    
    // 제한된 수의 결과 반환
    return results.slice(0, limit);
  } catch (error) {
    console.error('최근 제재 데이터 조회 중 오류 발생:', error);
    return [];
  }
}

/**
 * 엔티티 유형 변환
 * @param {Object} item 제재 항목
 * @returns {string} 유형 (individual, entity, vessel, aircraft)
 */
function getEntityType(item) {
  if (!item.type) return 'entity';
  
  const type = item.type.toLowerCase();
  if (type.includes('개인') || type.includes('individual') || type === 'person') {
    return 'individual';
  } else if (type.includes('선박') || type.includes('vessel') || type.includes('ship')) {
    return 'vessel';
  } else if (type.includes('항공') || type.includes('aircraft')) {
    return 'aircraft';
  } else {
    return 'entity'; // 기업/기관 기본값
  }
}

// 모듈 내보내기
export {
  fetchSanctionsData,
  searchSanctions,
  getSanctionDetails,
  getRecentSanctions,
  getEntityType
}; 