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
        
        // UN, EU, US 제재 데이터 로드
        const [unResponse, euResponse, usResponse] = await Promise.all([
            fetch('data/un_sanctions.json'),
            fetch('data/eu_sanctions.json'),
            fetch('data/us_sanctions.json')
        ]);
        
        if (!unResponse.ok || !euResponse.ok || !usResponse.ok) {
            throw new Error(`데이터를 가져오는데 실패했습니다: ${unResponse.status}, ${euResponse.status}, ${usResponse.status}`);
        }
        
        const [unData, euData, usData] = await Promise.all([
            unResponse.json(),
            euResponse.json(),
            usResponse.json()
        ]);
        
        // 데이터 병합
        const combinedData = {
            data: [...unData, ...euData, ...usData],
            lastUpdate: new Date().toISOString()
        };
        
        // 데이터 처리 및 캐시 업데이트
        apiState.sanctions = combinedData;
        apiState.lastFetched = now;
        
        // 최신 업데이트 시간 표시
        updateLastUpdateTime(combinedData.lastUpdate);
        
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
 * 최신 업데이트 시간을 표시합니다.
 * @param {string} updateTime ISO 형식의 업데이트 시간
 */
function updateLastUpdateTime(updateTime) {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        const date = new Date(updateTime);
        const formattedDate = date.toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
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
 * 제재 데이터를 검색합니다.
 * @param {string} query 검색어
 * @param {string} country 국가 필터
 * @param {string} program 제재 프로그램 필터
 * @param {string} searchType 검색 유형 (text, number, image)
 * @param {string} numberType 번호 유형 (passport, id, other)
 * @returns {Array} 검색 결과 배열
 */
function searchSanctions(query, country = '', program = '', searchType = 'text', numberType = '') {
    if (!apiState.sanctions || !apiState.sanctions.data) {
        return [];
    }

    let results = [...apiState.sanctions.data];

    // 국가 필터 적용
    if (country) {
        results = results.filter(item => item.country === country);
    }

    // 제재 프로그램 필터 적용
    if (program) {
        results = results.filter(item => item.programs.includes(program));
    }

    // 검색어가 없으면 필터링된 결과 반환
    if (!query) {
        return results;
    }

    // 검색 유형에 따른 검색 수행
    switch (searchType) {
        case 'number':
            return searchByNumber(results, query, numberType);
        case 'image':
            return searchByImage(results, query);
        default:
            return searchByText(results, query);
    }
}

/**
 * 텍스트 기반 검색을 수행합니다.
 * @param {Array} data 검색할 데이터 배열
 * @param {string} query 검색어
 * @returns {Array} 검색 결과 배열
 */
function searchByText(data, query) {
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    return data.filter(item => {
        // 이름 검색
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
            return true;
        }
        
        // 별칭 검색
        if (item.details.aliases.some(alias => 
            alias.toLowerCase().includes(query.toLowerCase()))) {
            return true;
        }
        
        // 주소 검색
        if (item.details.addresses.some(addr => 
            addr.toLowerCase().includes(query.toLowerCase()))) {
            return true;
        }
        
        // 모든 검색어가 포함되어 있는지 확인
        return searchTerms.every(term => 
            item.name.toLowerCase().includes(term) ||
            item.details.aliases.some(alias => alias.toLowerCase().includes(term)) ||
            item.details.addresses.some(addr => addr.toLowerCase().includes(term))
        );
    });
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
        // 신분증 정보 검색
        return item.details.identifications.some(id => {
            if (numberType === 'passport' && id.type.toLowerCase().includes('passport')) {
                return id.number.replace(/[^0-9]/g, '').includes(normalizedQuery);
            }
            if (numberType === 'id' && id.type.toLowerCase().includes('id')) {
                return id.number.replace(/[^0-9]/g, '').includes(normalizedQuery);
            }
            if (numberType === 'other') {
                return id.number.replace(/[^0-9]/g, '').includes(normalizedQuery);
            }
            return false;
        });
    });
}

/**
 * 이미지 기반 검색을 수행합니다.
 * @param {Array} data 검색할 데이터 배열
 * @param {string} query 이미지 데이터
 * @returns {Array} 검색 결과 배열
 */
function searchByImage(data, query) {
    // 이미지 검색 기능은 추후 구현 예정
    console.log('이미지 검색 기능은 추후 구현될 예정입니다.');
    return [];
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