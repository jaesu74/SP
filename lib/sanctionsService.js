/**
 * 제재 정보 관련 유틸리티 함수
 */

// 캐시된 데이터를 저장할 변수
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1시간 캐시 (ms)

/**
 * 제재 정보 데이터를 가져오는 함수
 * @returns {Promise<Object>} 제재 정보 데이터
 */
export const fetchSanctionsData = async () => {
  const now = Date.now();
  
  // 캐시된 데이터가 있고, 만료되지 않았으면 사용
  if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedData;
  }
  
  try {
    // 첫 번째 경로 시도: /data 디렉토리
    let response = await fetch('/data/integrated_sanctions.json');
    
    // 실패하면 /docs/data 디렉토리 시도
    if (!response.ok) {
      console.log('/data에서 파일을 찾지 못해 /docs/data에서 시도합니다.');
      response = await fetch('/docs/data/integrated_sanctions.json');
      
      // 두 번째 시도도 실패하면 에러 발생
      if (!response.ok) {
        throw new Error('Failed to fetch sanctions data from both locations');
      }
    }
    
    // 데이터 캐싱
    cachedData = await response.json();
    lastFetchTime = now;
    
    return cachedData;
  } catch (error) {
    console.error('Error fetching sanctions data:', error);
    return { entries: [] };
  }
};

/**
 * 문자열 유사도 계산 (Levenshtein 거리 기반)
 * @param {string} str1 - 첫 번째 문자열
 * @param {string} str2 - 두 번째 문자열
 * @returns {number} 유사도 점수 (0-1)
 */
export const calculateStringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  // 소문자로 변환
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // 완전히 일치하면 1 반환
  if (s1 === s2) return 1;
  
  // 포함 관계인 경우 높은 점수 부여
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }
  
  // 각 단어별로 일치하는지 확인
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  // 공통 단어 수 계산
  const commonWords = words1.filter(w => words2.includes(w));
  if (commonWords.length > 0) {
    return 0.7 * (commonWords.length / Math.max(words1.length, words2.length));
  }
  
  // Levenshtein 거리 계산
  const len1 = s1.length;
  const len2 = s2.length;
  
  // 최대 거리
  const maxDist = Math.max(len1, len2);
  if (maxDist === 0) return 1;
  
  // 편집 거리 계산 간소화 (대략적 계산)
  let dist = 0;
  const minLen = Math.min(len1, len2);
  
  for (let i = 0; i < minLen; i++) {
    if (s1[i] !== s2[i]) dist++;
  }
  
  dist += Math.abs(len1 - len2);
  
  // 거리를 유사도로 변환 (1에 가까울수록 유사)
  return 1 - (dist / maxDist);
};

/**
 * 제재 정보 검색 및 조회 서비스
 * API를 통해 제재 정보를 검색하고 조회하는 함수를 제공합니다.
 */

/**
 * 제재 정보 검색
 * @param {string} query - 검색어
 * @param {Object} options - 검색 옵션
 * @returns {Promise<Array>} 검색 결과 배열
 */
export async function searchSanctions(query, options = {}) {
  try {
    // 검색 파라미터 구성
    const params = new URLSearchParams({
      q: query,
      limit: options.limit || 100
    });

    // 필터 파라미터 추가
    if (options.type) params.append('type', options.type);
    if (options.country) params.append('country', options.country);
    if (options.source) params.append('source', options.source);

    // API 요청
    const response = await fetch(`/api/sanctions?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '검색 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error) {
    console.error('검색 오류:', error);
    throw error;
  }
}

/**
 * ID로 제재 정보 상세 조회
 * @param {string} id - 조회할 제재 정보 ID
 * @returns {Promise<Object>} 제재 정보 객체
 */
export async function getSanctionById(id) {
  try {
    // API 요청
    const response = await fetch(`/api/sanctions/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '데이터 조회 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error) {
    console.error('상세 정보 조회 오류:', error);
    throw error;
  }
} 