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
    if (apiState.isLoading) {
        console.log('이미 데이터를 로드하는 중입니다.');
        return apiState.sanctions || [];
    }
    
    const now = new Date();
    if (!forceRefresh && 
        apiState.sanctions && 
        apiState.lastFetched && 
        (now - apiState.lastFetched) < 30 * 60 * 1000) {
        console.log('캐시된 데이터를 사용합니다.');
        return apiState.sanctions;
    }
    
    try {
        apiState.isLoading = true;
        showLoadingIndicator('results-container', '제재 데이터를 불러오는 중...');
        
        // 실제 데이터 소스에서 데이터 가져오기
        // GitHub Pages와 커스텀 도메인 모두 호환되도록 경로 수정
        const baseUrl = window.location.hostname.includes('github.io') ? '/SP/' : '/';
        
        const sources = [
            { name: 'un', url: `${baseUrl}data/un_sanctions.json` },
            { name: 'eu', url: `${baseUrl}data/eu_sanctions.json` },
            { name: 'us', url: `${baseUrl}data/us_sanctions.json` }
        ];
        
        console.log('데이터 로드 시도: 경로 설정', sources);
        
        let sanctionsData = [];
        let loadedSources = [];
        let failedSources = [];
        
        for (const source of sources) {
            try {
                console.log(`${source.name} 데이터 로드 시도:`, source.url);
                
                // 타임아웃 설정 및 요청 제어를 위한 컨트롤러 생성
                const controller = new AbortController();
                const signal = controller.signal;
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20초 타임아웃
                
                const response = await fetch(source.url, { 
                    method: 'GET',
                    signal,
                    headers: { 'Cache-Control': 'no-cache' }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.data)) {
                        console.log(`${source.name.toUpperCase()} 제재 데이터 로드 완료: ${data.data.length}개 항목`);
                        sanctionsData = [...sanctionsData, ...data.data];
                        loadedSources.push(source.name);
                    } else {
                        console.warn(`${source.name.toUpperCase()} 데이터 형식 오류:`, data);
                        failedSources.push(source.name);
                    }
                } else {
                    console.warn(`${source.name.toUpperCase()} 응답 오류:`, response.status, response.statusText);
                    failedSources.push(source.name);
                }
            } catch (error) {
                console.warn(`${source.name.toUpperCase()} 제재 데이터 로드 실패:`, error);
                failedSources.push(source.name);
            }
        }
        
        if (sanctionsData.length === 0) {
            if (failedSources.length === sources.length) {
                throw new Error('모든 데이터 소스에서 데이터를 로드할 수 없습니다.');
            }
            
            // 대체 데이터로 시도
            try {
                console.log('통합 데이터 파일 시도...');
                const integratedResponse = await fetch(`${baseUrl}data/integrated_sanctions.json`);
                if (integratedResponse.ok) {
                    const data = await integratedResponse.json();
                    if (data && Array.isArray(data.data)) {
                        console.log(`통합 데이터 로드 완료: ${data.data.length}개 항목`);
                        sanctionsData = data.data;
                    }
                }
            } catch (error) {
                console.warn('통합 데이터 로드 실패:', error);
            }
            
            // 여전히 데이터가 없으면 로컬 스토리지 확인
            if (sanctionsData.length === 0) {
                const cachedData = getCachedSanctionsData();
                if (cachedData && cachedData.length > 0) {
                    console.log('캐시된 데이터 사용:', cachedData.length);
                    sanctionsData = cachedData;
                } else {
                    console.log('대체 더미 데이터 생성');
                    // 대체 데이터 생성 - 서비스 중단 방지
                    sanctionsData = generateDummySanctions(50);
                }
            }
        } else {
            // 데이터 캐싱
            cacheSanctionsData(sanctionsData);
        }
        
        // 사용자에게 데이터 로드 상태 알림
        if (failedSources.length > 0) {
            const failedSourcesStr = failedSources.join(', ').toUpperCase();
            showAlert(`일부 데이터(${failedSourcesStr})를 로드하지 못했습니다. 제한된 결과만 표시됩니다.`, 'warning', { duration: 5000 });
        }
        
        // 데이터 정규화 및 중복 제거
        sanctionsData = sanctionsData.map(item => ({
            id: item.id || generateId(),
            name: item.name || '이름 없음',
            type: item.type || 'UNKNOWN',
            country: item.country || '미상',
            programs: Array.isArray(item.programs) ? item.programs : (item.program ? [item.program] : []),
            source: item.source || 'UNKNOWN',
            date_listed: item.date_listed || item.listDate || '',
            reason: item.reason || (item.details && item.details.sanctions && item.details.sanctions[0] ? item.details.sanctions[0].reason : ''),
            details: {
                aliases: Array.isArray(item.aliases) ? item.aliases : 
                         (item.details && Array.isArray(item.details.aliases) ? item.details.aliases : []),
                addresses: Array.isArray(item.addresses) ? item.addresses : 
                           (item.details && Array.isArray(item.details.addresses) ? item.details.addresses : []),
                nationalities: Array.isArray(item.nationalities) ? item.nationalities : 
                               (item.details && Array.isArray(item.details.nationalities) ? item.details.nationalities : []),
                identifications: Array.isArray(item.identifications) ? item.identifications : 
                                 (item.details && Array.isArray(item.details.identifications) ? item.details.identifications : []),
                sanctions: Array.isArray(item.sanctions) ? item.sanctions : 
                           (item.details && Array.isArray(item.details.sanctions) ? item.details.sanctions : []),
                birthDate: item.birthDate || (item.details ? item.details.birthDate : ''),
                birthPlace: item.birthPlace || (item.details ? item.details.birthPlace : '')
            }
        }));
        
        apiState.sanctions = sanctionsData;
        apiState.lastFetched = now;
        apiState.error = null;
        
        updateLastUpdateTime(now.toISOString());
        console.log('데이터 로드 완료:', sanctionsData.length);
        return apiState.sanctions;
        
    } catch (error) {
        console.error('제재 데이터 로드 오류:', error);
        apiState.error = error.message;
        showAlert('제재 데이터를 불러오는 도중 오류가 발생했습니다. 제한된 기능으로 운영됩니다.', 'error', { duration: 7000 });
        
        // 캐시된 데이터 또는 더미 데이터 반환
        const cachedData = getCachedSanctionsData();
        if (cachedData && cachedData.length > 0) {
            apiState.sanctions = cachedData;
            return cachedData;
        }
        
        // 더미 데이터 생성 - 서비스 중단 방지
        const dummyData = generateDummySanctions(50);
        apiState.sanctions = dummyData;
        return dummyData;
    } finally {
        apiState.isLoading = false;
        hideLoadingIndicator(document.querySelector('.loading-indicator'));
    }
}

/**
 * 제재 데이터를 로컬 스토리지에 캐싱
 */
function cacheSanctionsData(data) {
    try {
        // 데이터 크기 문제를 해결하기 위해 전체 데이터 대신 중요 필드만 캐싱
        const simplifiedData = data.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            country: item.country,
            programs: item.programs,
            source: item.source,
            date_listed: item.date_listed
        }));
        
        localStorage.setItem('cachedSanctionsData', JSON.stringify(simplifiedData));
        localStorage.setItem('sanctionsDataCachedAt', new Date().toISOString());
        console.log('제재 데이터 캐싱 완료');
    } catch (error) {
        console.warn('제재 데이터 캐싱 실패:', error);
        // 스토리지 용량 초과 시 캐시 정리
        try {
            localStorage.removeItem('cachedSanctionsData');
            localStorage.removeItem('sanctionsDataCachedAt');
        } catch (e) {
            console.error('캐시 정리 실패:', e);
        }
    }
}

/**
 * 캐시된 제재 데이터 가져오기
 */
function getCachedSanctionsData() {
    try {
        const cachedData = localStorage.getItem('cachedSanctionsData');
        const cachedAt = localStorage.getItem('sanctionsDataCachedAt');
        
        if (!cachedData || !cachedAt) return null;
        
        // 캐시 유효성 검사 - 24시간 이내 캐시만 사용
        const cachedDate = new Date(cachedAt);
        const now = new Date();
        const cacheDuration = now - cachedDate;
        
        if (cacheDuration > 24 * 60 * 60 * 1000) {
            console.log('캐시 만료됨');
            return null;
        }
        
        return JSON.parse(cachedData);
    } catch (error) {
        console.warn('캐시된 데이터 로드 실패:', error);
        return null;
    }
}

/**
 * 더미 제재 데이터 생성
 */
function generateDummySanctions(count = 50) {
    const sources = ['UN', 'EU', 'US'];
    const types = ['INDIVIDUAL', 'ENTITY', 'VESSEL', 'AIRCRAFT'];
    const countries = ['North Korea', 'Russia', 'Iran', 'Syria', 'Belarus', 'Venezuela'];
    const programs = ['Nuclear', 'Terrorism', 'Human Rights', 'Narcotics', 'Cyber'];
    
    const dummyData = [];
    
    for (let i = 0; i < count; i++) {
        const source = sources[Math.floor(Math.random() * sources.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const country = countries[Math.floor(Math.random() * countries.length)];
        const program = programs[Math.floor(Math.random() * programs.length)];
        
        dummyData.push({
            id: `SAMPLE_${source}_${i}`,
            name: `Sample ${type} ${i} (For Testing)`,
            type: type,
            country: country,
            programs: [`${source}-${program}`],
            source: source,
            date_listed: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            details: {
                aliases: [`별명 1 (${i})`, `별명 2 (${i})`],
                addresses: [`${country} 주소 ${i}`],
                nationalities: [country],
                identifications: []
            }
        });
    }
    
    return dummyData;
}

// 고유 ID 생성 함수
function generateId() {
    return 'sanction_' + Math.random().toString(36).substr(2, 9);
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
 * 결과 필터링
 * @param {Array} results 검색 결과
 * @param {string} country 국가 필터
 * @param {string} program 프로그램 필터
 * @returns {Array} 필터링된 결과
 */
function filterResults(results, country, program) {
    let filteredResults = [...results];
    
    // 국가 필터링
    if (country) {
        filteredResults = filteredResults.filter(item => 
            item.country.toLowerCase() === country.toLowerCase());
    }
    
    // 프로그램 필터링
    if (program) {
        filteredResults = filteredResults.filter(item => 
            item.programs.some(p => p.toLowerCase() === program.toLowerCase()));
    }
    
    return filteredResults;
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
        const aliases = item.details && item.details.aliases ? item.details.aliases : [];
        if (aliases.some(alias => expandedTerms.some(term => alias.toLowerCase().includes(term)))) {
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
    const normalizedQuery = query.replace(/[^0-9]/g, '');
    
    return data.filter(item => {
        if (!item.details || !item.details.identifications) return false;
        
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