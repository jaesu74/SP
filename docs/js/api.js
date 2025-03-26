/**
 * api.js - 제재 데이터 API 및 데이터 처리 함수
 * 
 * EU, US, UN의 제재 데이터를 가져오고 검색, 필터링하는 기능을 제공합니다.
 */

// 캐시 및 상태 관리
const apiState = {
    sanctions: null,
    lastFetched: null,
    isLoading: false,
    error: null
};

/**
 * 제재 데이터를 가져옵니다.
 * @param {boolean} forceRefresh 캐시된 데이터가 있더라도 강제로 새로고침할지 여부
 * @returns {Promise<Object>} 제재 데이터 객체
 */
async function fetchSanctionsData(forceRefresh = false) {
    // 이미 로딩 중이면 대기
    if (apiState.isLoading) {
        return new Promise((resolve) => {
            const checkLoaded = setInterval(() => {
                if (!apiState.isLoading) {
                    clearInterval(checkLoaded);
                    resolve(apiState.sanctions);
                }
            }, 100);
        });
    }

    // 캐시된 데이터가 있고 30분 이내면 캐시 사용
    const now = new Date();
    if (!forceRefresh && 
        apiState.sanctions && 
        apiState.lastFetched && 
        (now - apiState.lastFetched) < 30 * 60 * 1000) {
        return apiState.sanctions;
    }

    try {
        apiState.isLoading = true;
        apiState.error = null;
        
        // EU, US, UN 제재 데이터 로드
        const [euResponse, usResponse, unResponse] = await Promise.all([
            fetch('data/eu_sanctions.json'),
            fetch('data/us_sanctions.json'),
            fetch('data/un_sanctions.json')
        ]);
        
        if (!euResponse.ok || !usResponse.ok || !unResponse.ok) {
            throw new Error(`데이터를 가져오는데 실패했습니다: ${euResponse.status}, ${usResponse.status}, ${unResponse.status}`);
        }
        
        const [euData, usData, unData] = await Promise.all([
            euResponse.json(),
            usResponse.json(),
            unResponse.json()
        ]);
        
        // 데이터 병합
        const combinedData = {
            data: [...euData, ...usData, ...unData]
        };
        
        // 데이터 처리 및 캐시 업데이트
        apiState.sanctions = combinedData;
        apiState.lastFetched = now;
        
        console.log(`제재 데이터 로드 완료: ${combinedData.data.length}개 항목`);
        return combinedData;
    } catch (error) {
        console.error('제재 데이터 로드 오류:', error);
        apiState.error = error.message;
        
        // 오류 발생 시 기존 캐시된 데이터 반환
        return apiState.sanctions;
    } finally {
        apiState.isLoading = false;
    }
}

/**
 * 제재 데이터를 검색합니다.
 * @param {string} query 검색어
 * @param {Object} filters 필터 옵션 (소스, 유형, 국가 등)
 * @param {Object} options 정렬 및 페이징 옵션
 * @returns {Promise<Array>} 검색 결과 배열
 */
async function searchSanctions(query = '', filters = {}, options = {}) {
    const data = await fetchSanctionsData();
    
    if (!data || !data.data) {
        return [];
    }

    let results = [...data.data];
    
    // 검색어로 필터링
    if (query && query.trim() !== '') {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        results = results.filter(sanction => {
            // 이름 검색
            const nameMatch = searchTerms.some(term => 
                sanction.name.toLowerCase().includes(term)
            );
            
            // 별칭 검색
            const aliasMatch = sanction.details.aliases && 
                sanction.details.aliases.some(alias => 
                    searchTerms.some(term => alias.toLowerCase().includes(term))
                );
            
            return nameMatch || aliasMatch;
        });
    }
    
    // 필터 적용
    if (filters.sources && filters.sources.length > 0) {
        results = results.filter(sanction => {
            const sources = sanction.source.split(',');
            return filters.sources.some(source => sources.includes(source));
        });
    }
    
    if (filters.types && filters.types.length > 0) {
        results = results.filter(sanction => 
            filters.types.includes(sanction.type)
        );
    }
    
    if (filters.countries && filters.countries.length > 0) {
        results = results.filter(sanction => 
            sanction.country && filters.countries.includes(sanction.country)
        );
    }
    
    if (filters.programs && filters.programs.length > 0) {
        results = results.filter(sanction => 
            sanction.programs.some(program => 
                filters.programs.includes(program)
            )
        );
    }
    
    // 가중치 점수 계산 및 정렬
    results.forEach(sanction => {
        let score = 0;
        
        // 검색어 일치도
        if (query && query.trim() !== '') {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            
            // 이름에 검색어가 포함되면 가중치 추가
            if (searchTerms.some(term => sanction.name.toLowerCase().includes(term))) {
                score += 10;
                
                // 정확히 일치하면 추가 가중치
                if (searchTerms.some(term => sanction.name.toLowerCase() === term)) {
                    score += 20;
                }
            }
            
            // 별칭에 검색어가 포함되면 가중치 추가
            if (sanction.details.aliases && 
                sanction.details.aliases.some(alias => 
                    searchTerms.some(term => alias.toLowerCase().includes(term))
                )) {
                score += 5;
            }
        }
        
        // 다수 소스에서 제재 대상이면 가중치 추가
        if (sanction.source.includes(',')) {
            score += sanction.source.split(',').length * 5;
        }
        
        sanction.matchScore = score;
    });
    
    // 정렬
    const sortField = options.sortBy || 'matchScore';
    const sortDirection = options.sortDirection || 'desc';
    
    results.sort((a, b) => {
        if (sortField === 'name') {
            return sortDirection === 'asc' 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name);
        } else if (sortField === 'matchScore') {
            return sortDirection === 'asc' 
                ? a.matchScore - b.matchScore 
                : b.matchScore - a.matchScore;
        }
        
        return 0;
    });
    
    // 페이징
    if (options.page && options.pageSize) {
        const startIndex = (options.page - 1) * options.pageSize;
        results = results.slice(startIndex, startIndex + options.pageSize);
    }
    
    return results;
}

/**
 * 제재 데이터 소스들의 목록을 가져옵니다.
 * @returns {Promise<Array>} 소스 목록
 */
async function getSanctionsSources() {
    const data = await fetchSanctionsData();
    
    if (!data || !data.meta) {
        return [];
    }
    
    // 모든 제재 대상의 소스 필드에서 고유한 소스 추출
    const sources = new Set();
    data.data.forEach(sanction => {
        sanction.source.split(',').forEach(source => {
            sources.add(source.trim());
        });
    });
    
    return Array.from(sources);
}

/**
 * 제재 프로그램 목록을 가져옵니다.
 * @returns {Promise<Array>} 프로그램 목록
 */
async function getSanctionsPrograms() {
    const data = await fetchSanctionsData();
    
    if (!data || !data.data) {
        return [];
    }
    
    // 모든 제재 대상의 프로그램 필드에서 고유한 프로그램 추출
    const programs = new Set();
    data.data.forEach(sanction => {
        if (sanction.programs && Array.isArray(sanction.programs)) {
            sanction.programs.forEach(program => {
                programs.add(program);
            });
        }
    });
    
    return Array.from(programs);
}

/**
 * 제재 대상 국가 목록을 가져옵니다.
 * @returns {Promise<Array>} 국가 목록
 */
async function getSanctionsCountries() {
    const data = await fetchSanctionsData();
    
    if (!data || !data.data) {
        return [];
    }
    
    // 모든 제재 대상의 국가 필드에서 고유한 국가 추출
    const countries = new Set();
    data.data.forEach(sanction => {
        if (sanction.country && sanction.country.trim() !== '') {
            countries.add(sanction.country);
        }
    });
    
    return Array.from(countries);
}

/**
 * 제재 대상 유형 목록을 가져옵니다.
 * @returns {Promise<Array>} 유형 목록
 */
async function getSanctionsTypes() {
    const data = await fetchSanctionsData();
    
    if (!data || !data.data) {
        return [];
    }
    
    // 모든 제재 대상의 유형 필드에서 고유한 유형 추출
    const types = new Set();
    data.data.forEach(sanction => {
        if (sanction.type) {
            types.add(sanction.type);
        }
    });
    
    return Array.from(types);
}

/**
 * ID로 제재 대상 상세 정보를 가져옵니다.
 * @param {string} id 제재 대상 ID
 * @returns {Promise<Object>} 제재 대상 상세 정보
 */
async function getSanctionById(id) {
    const data = await fetchSanctionsData();
    
    if (!data || !data.data) {
        return null;
    }
    
    return data.data.find(sanction => sanction.id === id) || null;
}

/**
 * 이름으로 제재 대상을 검색합니다.
 * @param {string} name 검색할 이름
 * @returns {Promise<Array>} 검색 결과 배열
 */
async function getSanctionsByName(name) {
    return searchSanctions(name);
}

// API 함수 내보내기
export {
    fetchSanctionsData,
    searchSanctions,
    getSanctionsSources,
    getSanctionsPrograms,
    getSanctionsCountries,
    getSanctionsTypes,
    getSanctionById,
    getSanctionsByName
}; 