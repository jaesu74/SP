/**
 * api.js - 제재 데이터 API 및 데이터 처리 함수
 * 
 * UN, EU, US의 제재 데이터를 가져오고 검색, 필터링하는 기능을 제공합니다.
 */

// 캐시 및 상태 관리
const apiState = {
    sanctions: null,
    lastFetched: null,
    isLoading: false,
    error: null
};

// 모의 데이터 제거

/**
 * 제재 데이터를 가져옵니다.
 * @param {boolean} forceRefresh 캐시된 데이터가 있더라도 강제로 새로고침할지 여부
 * @returns {Promise<Array>} 제재 데이터 배열
 */
async function fetchSanctionsData(forceRefresh = false) {
    // 이미 로딩 중이면 기존 데이터 반환
    if (apiState.isLoading) {
        return apiState.sanctions || [];
    }
    
    // 캐시된 데이터가 있고 30분 이내라면 캐시 사용
    const now = new Date();
    if (!forceRefresh && 
        apiState.sanctions && 
        apiState.lastFetched && 
        (now - apiState.lastFetched) < 30 * 60 * 1000) {
        return apiState.sanctions;
    }
    
    try {
        apiState.isLoading = true;
        
        // 통합된 제재 데이터 파일 불러오기
        const integrated_file = 'data/integrated_sanctions.json';
        let sanctionsData = [];
        
        try {
            const response = await fetch(integrated_file);
            if (response.ok) {
                const data = await response.json();
                sanctionsData = data.data || [];
                console.log(`통합 제재 데이터 로드 완료: ${sanctionsData.length}개 항목`);
            } else {
                console.warn('통합 제재 데이터 파일을 찾을 수 없습니다. 개별 소스 파일 시도...');
                throw new Error('통합 데이터 없음');
            }
        } catch (e) {
            // 개별 소스 파일 시도
            const sources = ['un', 'eu', 'us'];
            for (const source of sources) {
                try {
                    const sourceFile = `data/${source.toLowerCase()}_sanctions.json`;
                    const response = await fetch(sourceFile);
                    if (response.ok) {
                        const sourceData = await response.json();
                        if (sourceData.data && Array.isArray(sourceData.data)) {
                            sanctionsData = [...sanctionsData, ...sourceData.data];
                            console.log(`${source} 제재 데이터 로드 완료: ${sourceData.data.length}개 항목`);
                        }
                    }
                } catch (sourceError) {
                    console.warn(`${source} 제재 데이터 로드 실패:`, sourceError);
                }
            }
        }
        
        // 제재 데이터가 없으면 빈 배열 반환
        if (sanctionsData.length === 0) {
            console.warn('제재 데이터를 로드할 수 없습니다.');
            showAlert('제재 데이터를 불러올 수 없습니다. 관리자에게 문의하세요.', 'error');
            return [];
        }
        
        apiState.sanctions = sanctionsData;
        apiState.lastFetched = now;
        apiState.error = null;
        
        // 최신 업데이트 시간 표시
        updateLastUpdateTime(now.toISOString());
        
        return apiState.sanctions;
    } catch (error) {
        console.error('제재 데이터 로드 오류:', error);
        apiState.error = error.message;
        showAlert('제재 데이터를 불러오는 도중 오류가 발생했습니다.', 'error');
        return [];
    } finally {
        apiState.isLoading = false;
    }
}

/**
 * 최신 업데이트 시간을 표시합니다.
 * @param {string} updateTime ISO 형식의 업데이트 시간
 */
function updateLastUpdateTime(updateTime) {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        const date = new Date(updateTime);
        const formattedDate = date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        lastUpdateElement.textContent = formattedDate;
    }
}

/**
 * 검색 유연성 향상을 위한 함수 추가
 * 
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
 * 제재 데이터를 검색합니다. 검색 유연성 향상
 * @param {string} query 검색어
 * @param {string} country 국가 필터
 * @param {string} program 제재 프로그램 필터
 * @param {string} searchType 검색 유형 (text, number, image)
 * @param {string} numberType 번호 유형 (passport, id, other)
 * @returns {Promise<Object>} 검색 결과 객체
 */
async function searchSanctions(query, country = '', program = '', searchType = 'text', numberType = '') {
    const data = await fetchSanctionsData();
    
    // 전역 변수에 결과 저장 (상세 정보 표시용)
    window.currentResults = data;
    
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
            // 번호 검색은 기존 방식 유지하되 결과 형식 통일
            const numberResults = searchByNumber(data, query, numberType);
            searchResults = {
                results: numberResults,
                hasExactMatches: numberResults.length > 0,
                hasSimilarMatches: false,
                suggestions: null
            };
            break;
        case 'image':
            // 이미지 검색은 추후 구현
            console.log('이미지 검색은 추후 구현 예정입니다.');
            searchResults = {
                results: [],
                hasExactMatches: false,
                hasSimilarMatches: false,
                suggestions: null
            };
            break;
        default:
            // 텍스트 검색 (유사어 검색 지원)
            searchResults = searchByText(data, query);
    }
    
    // 국가 필터링
    if (country) {
        searchResults.results = searchResults.results.filter(item => item.country === country);
    }
    
    // 프로그램 필터링
    if (program) {
        searchResults.results = searchResults.results.filter(item => item.programs.includes(program));
    }
    
    return searchResults;
}

/**
 * 텍스트 기반 검색을 수행합니다. (유사어 검색 지원)
 * @param {Array} data 검색할 데이터 배열
 * @param {string} query 검색어
 * @returns {Object} 검색 결과와 관련 정보를 포함한 객체
 */
function searchByText(data, query) {
    const lowerQuery = query.toLowerCase();
    const exactMatches = [];
    const similarMatches = [];
    let suggestions = null;
    
    // 유사어 확장을 위한 검색어 집합
    const searchTerms = new Set([lowerQuery]);
    
    // 검색어의 유사어 추가
    Object.keys(similarTerms).forEach(term => {
        if (term.toLowerCase().includes(lowerQuery) || 
            similarTerms[term].some(similar => similar.toLowerCase().includes(lowerQuery))) {
            // 주요 용어나 유사어가 검색어를 포함하면 모든 유사어 추가
            searchTerms.add(term.toLowerCase());
            similarTerms[term].forEach(similar => searchTerms.add(similar.toLowerCase()));
        }
    });
    
    // 검색 실행
    data.forEach(item => {
        // 정확한 일치 확인
        if (item.name.toLowerCase().includes(lowerQuery) || 
            item.details.aliases.some(alias => alias.toLowerCase().includes(lowerQuery))) {
            exactMatches.push(item);
            return;
        }
        
        // 유사어 일치 확인
        const hasMatch = Array.from(searchTerms).some(term => {
            return (
                item.name.toLowerCase().includes(term) ||
                item.details.aliases.some(alias => alias.toLowerCase().includes(term)) ||
                item.details.addresses.some(address => address.toLowerCase().includes(term))
            );
        });
        
        if (hasMatch) {
            similarMatches.push(item);
        }
    });
    
    // 검색 결과가 없으면 추천 검색어 제안
    if (exactMatches.length === 0 && similarMatches.length === 0) {
        const possibleSuggestions = Object.keys(suggestedTerms)
            .filter(term => term.includes(lowerQuery) || lowerQuery.includes(term))
            .map(term => suggestedTerms[term]);
        
        if (possibleSuggestions.length > 0) {
            suggestions = [...new Set(possibleSuggestions)];
        }
    }
    
    return {
        results: [...exactMatches, ...similarMatches],
        hasExactMatches: exactMatches.length > 0,
        hasSimilarMatches: similarMatches.length > 0,
        suggestions
    };
}

/**
 * 번호 기반 검색을 수행합니다.
 * @param {Array} data 검색할 데이터 배열
 * @param {string} query 검색어
 * @param {string} numberType 번호 유형
 * @returns {Array} 검색 결과 배열
 */
function searchByNumber(data, query, numberType) {
    const normalizedQuery = query.replace(/[^0-9]/g, '');
    
    return data.filter(item => {
        return item.details.identifications.some(id => {
            if (!numberType || numberType === 'all') {
                return id.number.replace(/[^0-9]/g, '').includes(normalizedQuery);
            }
            
            return id.type.toLowerCase().includes(numberType.toLowerCase()) &&
                   id.number.replace(/[^0-9]/g, '').includes(normalizedQuery);
        });
    });
}

/**
 * 제재 대상 상세 정보 가져오기
 * @param {string} id 제재 대상 ID
 * @returns {Promise<Object>} 제재 대상 정보
 */
async function getSanctionDetails(id) {
    const data = await fetchSanctionsData();
    return data.find(item => item.id === id);
}

/**
 * 최근 제재 대상 가져오기
 * @param {number} limit 결과 수 제한
 * @returns {Promise<Array>} 최근 제재 대상 배열
 */
async function getRecentSanctions(limit = 10) {
    const data = await fetchSanctionsData();
    return data.slice(0, limit);
}

/**
 * 추천 검색어 가져오기
 * @param {string} query 검색어
 * @returns {Array<string>} 추천 검색어 목록
 */
function getSuggestedSearchTerms(query) {
    const lowerQuery = query.toLowerCase();
    const suggestions = [];
    
    // 직접적인 추천 검색어 확인
    Object.keys(suggestedTerms).forEach(term => {
        if (term.includes(lowerQuery) || lowerQuery.includes(term)) {
            suggestions.push(suggestedTerms[term]);
        }
    });
    
    // 유사어 사전에서 검색어 확인
    Object.keys(similarTerms).forEach(term => {
        if (term.toLowerCase().includes(lowerQuery)) {
            suggestions.push(term);
        } else if (similarTerms[term].some(similar => similar.toLowerCase().includes(lowerQuery))) {
            suggestions.push(term);
        }
    });
    
    return [...new Set(suggestions)];
}

// API 함수 내보내기
window.SanctionsAPI = {
    fetchSanctionsData,
    searchSanctions,
    getSanctionDetails,
    getRecentSanctions
}; 