/**
 * api.js - 제재 데이터 API 및 데이터 처리 함수
 */

import { showAlert, showLoadingIndicator, hideLoadingIndicator, generateId, updateLastUpdateTime } from '../utils/common.js';

// 캐시 및 상태 관리
const apiState = {
    sanctions: null,
    lastFetched: null,
    isLoading: false,
    error: null
};

/**
 * 유사어 사전 - 검색어 확장에 사용
 */
const similarTerms = {
    // 인물 관련
    '김정은': ['김정운', 'kim jong un', 'kim jong-un', '북한 지도자'],
    '푸틴': ['블라디미르 푸틴', 'vladimir putin', 'putin', '러시아 대통령'],
    '아사드': ['바샤르 알 아사드', 'bashar al-assad', 'assad', '시리아 대통령'],
    
    // 단체 관련
    '노동당': ['조선노동당', 'kwp', 'workers party', '북한 노동당'],
    '혁명수비대': ['이란 혁명수비대', 'irgc', 'revolutionary guard'],
    
    // 국가 관련
    '북한': ['north korea', 'dprk', '조선민주주의인민공화국', 'nk'],
    '러시아': ['russia', 'russian federation', 'ru'],
    '이란': ['iran', 'islamic republic of iran', 'ir'],
    '시리아': ['syria', 'syrian arab republic', 'sy'],
    
    // 제재 프로그램 관련
    'un': ['un sanctions', '유엔', '유엔 제재', '국제연합'],
    'eu': ['eu sanctions', '유럽연합', '유럽 제재'],
    'us': ['us sanctions', '미국', '미국 제재', 'ofac']
};

/**
 * 검색 결과가 없을 때 추천할 유사 검색어
 */
const suggestedTerms = {
    '김정운': '김정은',
    '김정일': '김정은',
    'jong': '김정은',
    'kju': '김정은',
    'putin': '푸틴',
    'assad': '아사드',
    'north korea': '북한',
    'dprk': '북한',
    'kwp': '노동당',
    'irgc': '혁명수비대',
    'russia': '러시아'
};

/**
 * 제재 데이터를 가져옵니다.
 * @param {boolean} forceRefresh 캐시된 데이터가 있더라도 강제로 새로고침할지 여부
 * @returns {Promise<Array>} 제재 데이터 배열
 */
export async function fetchSanctionsData(forceRefresh = false) {
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
        showLoadingIndicator('results-container', '제재 데이터를 불러오는 중...');
        
        // 실제 데이터 소스에서 데이터 가져오기
        const sources = [
            { name: 'un', url: 'data/un_sanctions.json' },
            { name: 'eu', url: 'data/eu_sanctions.json' },
            { name: 'us', url: 'data/us_sanctions.json' }
        ];
        
        let sanctionsData = [];
        
        for (const source of sources) {
            try {
                const response = await fetch(source.url);
                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.data)) {
                        sanctionsData = [...sanctionsData, ...data.data];
                    }
                }
            } catch (error) {
                console.warn(`${source.name.toUpperCase()} 제재 데이터 로드 실패:`, error);
            }
        }
        
        if (sanctionsData.length === 0) {
            throw new Error('제재 데이터를 로드할 수 없습니다.');
        }
        
        // 데이터 정규화 및 중복 제거
        sanctionsData = sanctionsData.map(item => ({
            id: item.id || generateId(),
            name: item.name,
            type: item.type || 'UNKNOWN',
            country: item.country,
            programs: Array.isArray(item.programs) ? item.programs : [item.program],
            source: item.source,
            date_listed: item.date_listed || item.listDate,
            details: {
                aliases: item.aliases || [],
                addresses: item.addresses || [],
                nationalities: item.nationalities || [],
                identifications: item.identifications || []
            }
        }));
        
        apiState.sanctions = sanctionsData;
        apiState.lastFetched = now;
        apiState.error = null;
        
        updateLastUpdateTime(now.toISOString());
        return apiState.sanctions;
        
    } catch (error) {
        console.error('제재 데이터 로드 오류:', error);
        apiState.error = error.message;
        showAlert('제재 데이터를 불러오는 도중 오류가 발생했습니다.', 'error');
        return [];
    } finally {
        apiState.isLoading = false;
        hideLoadingIndicator(document.querySelector('.loading-indicator'));
    }
}

/**
 * 제재 데이터를 검색합니다.
 * @param {string} query 검색어
 * @param {string} country 국가 필터
 * @param {string} program 제재 프로그램 필터
 * @param {string} searchType 검색 유형 (text, number, image)
 * @param {string} numberType 번호 유형 (passport, id, other)
 * @returns {Promise<Object>} 검색 결과 객체
 */
export async function searchSanctions(query, country = '', program = '', searchType = 'text', numberType = '') {
    const data = await fetchSanctionsData();
    
    // 검색어가 없으면 전체 결과 반환
    if (!query) {
        return {
            results: data,
            hasExactMatches: true,
            hasSimilarMatches: false,
            suggestions: null
        };
    }
    
    let searchResults;
    
    // 검색 유형에 따른 검색
    switch (searchType) {
        case 'number':
            searchResults = searchByNumber(data, query, numberType);
            break;
        case 'text':
        default:
            searchResults = searchByText(data, query);
            break;
    }
    
    // 필터링
    searchResults = filterResults(searchResults, country, program);
    
    // 검색 결과 없을 때 제안어 찾기
    let suggestions = null;
    if (searchResults.length === 0 && searchType === 'text') {
        suggestions = suggestedTerms[query.toLowerCase()] || null;
    }
    
    return {
        results: searchResults,
        hasExactMatches: searchResults.length > 0,
        hasSimilarMatches: false,
        suggestions
    };
}

/**
 * 텍스트 검색 수행
 * @param {Array} data 검색 대상 데이터
 * @param {string} query 검색어
 * @returns {Array} 검색 결과
 */
function searchByText(data, query) {
    const lowercaseQuery = query.toLowerCase();
    
    // 유사어 검색 준비
    let expandedTerms = [lowercaseQuery];
    
    // 유사어 사전에서 검색어 확장
    for (const [term, similarWords] of Object.entries(similarTerms)) {
        if (term.toLowerCase() === lowercaseQuery || similarWords.some(word => word.toLowerCase() === lowercaseQuery)) {
            // 원래 단어와 모든 유사어 추가
            expandedTerms = [...expandedTerms, term.toLowerCase(), ...similarWords.map(w => w.toLowerCase())];
            break;
        }
    }
    
    // 중복 제거
    expandedTerms = [...new Set(expandedTerms)];
    
    return data.filter(item => {
        // 이름 검색
        if (item.name && expandedTerms.some(term => item.name.toLowerCase().includes(term))) {
            return true;
        }
        
        // 별칭 검색
        if (item.details && item.details.aliases && 
            item.details.aliases.some(alias => expandedTerms.some(term => alias.toLowerCase().includes(term)))) {
            return true;
        }
        
        // 국가명 검색
        if (item.country && expandedTerms.some(term => item.country.toLowerCase().includes(term))) {
            return true;
        }
        
        return false;
    });
}

/**
 * 번호 검색 수행
 * @param {Array} data 검색 대상 데이터
 * @param {string} query 검색어
 * @param {string} numberType 번호 유형
 * @returns {Array} 검색 결과
 */
function searchByNumber(data, query, numberType) {
    return data.filter(item => {
        if (!item.details || !item.details.identifications) return false;
        
        return item.details.identifications.some(id => {
            // 특정 번호 유형 필터링
            if (numberType && numberType !== 'all') {
                return id.type.toLowerCase().includes(numberType.toLowerCase()) && 
                       id.number.includes(query);
            }
            return id.number.includes(query);
        });
    });
}

/**
 * 검색 결과 필터링
 * @param {Array} results 검색 결과
 * @param {string} country 국가 필터
 * @param {string} program 프로그램 필터
 * @returns {Array} 필터링된 결과
 */
function filterResults(results, country, program) {
    let filteredResults = [...results];
    
    // 국가 필터
    if (country) {
        filteredResults = filteredResults.filter(item => item.country === country);
    }
    
    // 프로그램 필터
    if (program) {
        filteredResults = filteredResults.filter(item => {
            if (Array.isArray(item.programs)) {
                return item.programs.includes(program);
            }
            return item.program === program;
        });
    }
    
    return filteredResults;
}

/**
 * 제재 대상 상세 정보 조회
 * @param {string} id 제재 대상 ID
 * @returns {Promise<Object>} 제재 대상 상세 정보
 */
export async function getSanctionDetails(id) {
    try {
        // 실제 데이터에서 ID로 검색
        const sanctions = await fetchSanctionsData();
        return sanctions.find(item => item.id === id) || null;
    } catch (error) {
        console.error('상세 정보 조회 오류:', error);
        showAlert('상세 정보를 불러오는 중 오류가 발생했습니다.', 'error');
        return null;
    }
}

/**
 * 최근 제재 목록 조회
 * @param {number} limit 조회할 최대 갯수
 * @returns {Promise<Array>} 최근 제재 목록
 */
export async function getRecentSanctions(limit = 10) {
    try {
        const sanctions = await fetchSanctionsData();
        
        // 날짜 기준 정렬
        return sanctions
            .filter(item => item.date_listed)
            .sort((a, b) => new Date(b.date_listed) - new Date(a.date_listed))
            .slice(0, limit);
    } catch (error) {
        console.error('최근 제재 목록 조회 오류:', error);
        return [];
    }
}

/**
 * 검색어 제안 목록 조회
 * @param {string} query 검색어
 * @returns {Array<string>} 제안 검색어 목록
 */
export function getSuggestedSearchTerms(query) {
    if (!query) return [];
    
    const lowercaseQuery = query.toLowerCase();
    
    // 샘플 데이터 (실제로는 API 통신으로 받아와야 함)
    const sampleTerms = [
        '김정은', '푸틴', '아사드', '북한', '러시아', '이란', '시리아',
        '핵무기', '미사일', '제재', 'UN', 'EU', '위반', '테러', '인권'
    ];
    
    // 검색어와 유사한 단어 필터링
    return sampleTerms
        .filter(term => term.toLowerCase().includes(lowercaseQuery))
        .slice(0, 5); // 최대 5개 표시
} 