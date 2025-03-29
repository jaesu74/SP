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
        console.log('실제 제재 데이터 로드 중...');
        
        // 모든 제재 데이터 병렬 로드
        const [unData, euData, usData] = await Promise.all([
            fetch('data/un_sanctions.json').then(res => res.json()),
            fetch('data/eu_sanctions.json').then(res => res.json()),
            fetch('data/us_sanctions.json').then(res => res.json())
        ]);
        
        console.log(`데이터 로드 완료: UN(${unData.length}), EU(${euData.length}), US(${usData.length})`);
        
        // 모든 데이터 통합 및 정규화
        const combinedData = [
            ...processUNData(unData),
            ...processEUData(euData),
            ...processUSData(usData)
        ];
        
        // 중복 제거 (같은 이름과 국가를 가진 항목)
        const uniqueData = removeDuplicates(combinedData);
        
        console.log(`통합 데이터 생성 완료: ${uniqueData.length}개 항목`);
        
        apiState.sanctions = uniqueData;
        apiState.lastFetched = now;
        apiState.error = null;
        
        // 최신 업데이트 시간 표시
        updateLastUpdateTime(now.toISOString());
        
        return uniqueData;
    } catch (error) {
        console.error('제재 데이터 로드 오류:', error);
        apiState.error = error.message;
        return [];
    } finally {
        apiState.isLoading = false;
    }
}

/**
 * UN 제재 데이터 처리
 */
function processUNData(data) {
    return data.map(item => ({
        id: `UN_${item.id || generateId(item)}`,
        name: item.name || item.first_name + ' ' + item.last_name,
        type: mapEntityType(item.type),
        country: item.country || item.nationality || 'UN',
        programs: ['UN_SANCTIONS'],
        details: {
            aliases: item.aliases || [],
            addresses: item.addresses || [],
            identifications: mapIdentifications(item.identifications),
            relatedSanctions: mapRelatedEntities(item.related_entities),
            birthDate: item.birth_date,
            description: item.description || '',
            sanctionDate: item.listed_on,
            updatedAt: item.updated_at
        }
    }));
}

/**
 * EU 제재 데이터 처리
 */
function processEUData(data) {
    return data.map(item => ({
        id: `EU_${item.id || generateId(item)}`,
        name: item.name || item.first_name + ' ' + item.last_name,
        type: mapEntityType(item.entity_type),
        country: item.country_of_origin || item.nationality || 'EU',
        programs: ['EU_SANCTIONS'],
        details: {
            aliases: item.aliases || [],
            addresses: item.addresses || [],
            identifications: mapIdentifications(item.documents),
            relatedSanctions: mapRelatedEntities(item.related_entities),
            birthDate: item.date_of_birth,
            description: item.remarks || '',
            sanctionDate: item.listing_date,
            updatedAt: item.last_updated
        }
    }));
}

/**
 * US 제재 데이터 처리
 */
function processUSData(data) {
    return data.map(item => ({
        id: `US_${item.id || generateId(item)}`,
        name: item.name || item.first_name + ' ' + item.last_name,
        type: mapEntityType(item.sdnType),
        country: item.country || item.nationality || 'US',
        programs: ['US_SANCTIONS'],
        details: {
            aliases: item.aka || [],
            addresses: item.addresses || [],
            identifications: mapIdentifications(item.idList),
            relatedSanctions: mapRelatedEntities(item.relatedSDN),
            birthDate: item.dateOfBirth,
            description: item.remarks || '',
            sanctionDate: item.listedDate,
            updatedAt: item.updatedDate
        }
    }));
}

/**
 * 중복 항목 제거
 */
function removeDuplicates(data) {
    const seen = new Map();
    
    return data.filter(item => {
        const key = `${item.name.toLowerCase()}_${item.country.toLowerCase()}_${item.type.toLowerCase()}`;
        
        if (seen.has(key)) {
            // 이미 있는 항목에 프로그램 추가
            const existingItem = seen.get(key);
            existingItem.programs = [...new Set([...existingItem.programs, ...item.programs])];
            return false;
        } else {
            seen.set(key, item);
            return true;
        }
    });
}

/**
 * 식별자 정보 매핑
 */
function mapIdentifications(ids) {
    if (!ids || !Array.isArray(ids)) return [];
    
    return ids.map(id => ({
        type: id.type || id.docType || '기타',
        number: id.number || id.docNumber || id.value || '',
        country: id.country || id.issuer || '',
        issueDate: id.issueDate || id.dateOfIssue || ''
    }));
}

/**
 * 관련 엔티티 매핑
 */
function mapRelatedEntities(entities) {
    if (!entities || !Array.isArray(entities)) return [];
    
    return entities.map(entity => ({
        name: entity.name || entity.entity_name || '',
        type: mapEntityType(entity.type || entity.entity_type || ''),
        relationship: entity.relationship || entity.relation_type || '관련'
    }));
}

/**
 * 엔티티 유형 매핑
 */
function mapEntityType(type) {
    if (!type) return '기타';
    
    type = type.toLowerCase();
    
    if (type.includes('individual') || type.includes('person') || type === 'individual') {
        return '개인';
    } else if (type.includes('entity') || type.includes('organization') || type.includes('vessel')) {
        return '단체';
    } else if (type.includes('vessel') || type.includes('ship')) {
        return '선박';
    } else if (type.includes('aircraft')) {
        return '항공기';
    } else {
        return '기타';
    }
}

/**
 * ID 생성 (이름 및 타입 기반)
 */
function generateId(item) {
    const name = item.name || item.first_name || '';
    const type = item.type || item.entity_type || '';
    return `${name}_${type}_${Date.now()}`.replace(/\s+/g, '_');
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
 * 제재 대상을 검색합니다.
 * @param {string} query 검색어
 * @param {string} country 국가 필터 (옵션)
 * @param {string} program 프로그램 필터 (옵션)
 * @param {string} searchType 검색 유형 (text, number, image)
 * @param {string} numberType 번호 유형 (passport, id, other)
 * @returns {Promise<Array>} 검색 결과 배열
 */
async function searchSanctions(query, country = '', program = '', searchType = 'text', numberType = '') {
    if (!query && !country && !program) {
        return [];
    }
    
    // 제재 데이터 로드
    const data = await fetchSanctionsData();
    
    // 검색 형태에 따라 다른 검색 함수 사용
    let results;
    if (searchType === 'number') {
        results = searchByNumber(data, query, numberType);
    } else {
        results = searchByText(data, query);
    }
    
    // 필터링
    if (country) {
        results = results.filter(item => item.country.toLowerCase().includes(country.toLowerCase()));
    }
    
    if (program) {
        results = results.filter(item => item.programs.some(p => 
            p.toLowerCase().includes(program.toLowerCase())));
    }
    
    // 결과 로그
    console.log(`검색 결과: "${query}" - ${results.length}개 항목 찾음`);
    
    return results;
}

/**
 * 텍스트 기반 제재 대상 검색
 * @param {Array} data 제재 데이터
 * @param {string} query 검색어
 * @returns {Array} 검색 결과
 */
function searchByText(data, query) {
    if (!query) return data;
    
    const lowerQuery = query.toLowerCase();
    
    // 유사어 확장
    let expandedQueries = [lowerQuery];
    for (const [key, synonyms] of Object.entries(similarTerms)) {
        if (key.toLowerCase().includes(lowerQuery) || 
            synonyms.some(syn => syn.toLowerCase().includes(lowerQuery))) {
            expandedQueries.push(key.toLowerCase());
            expandedQueries = [...expandedQueries, ...synonyms.map(s => s.toLowerCase())];
        }
    }
    
    // 중복 제거
    expandedQueries = [...new Set(expandedQueries)];
    
    // 확장된 검색어로 검색
    return data.filter(item => {
        // 이름 검색
        if (expandedQueries.some(q => item.name.toLowerCase().includes(q))) {
            return true;
        }
        
        // 국가 검색
        if (expandedQueries.some(q => item.country.toLowerCase().includes(q))) {
            return true;
        }
        
        // 별칭 검색
        if (item.details.aliases && 
            item.details.aliases.some(alias => 
                expandedQueries.some(q => alias.toLowerCase().includes(q)))) {
            return true;
        }
        
        // 주소 검색
        if (item.details.addresses && 
            item.details.addresses.some(address => 
                expandedQueries.some(q => address.toLowerCase().includes(q)))) {
            return true;
        }
        
        // 설명 검색
        if (item.details.description && 
            expandedQueries.some(q => item.details.description.toLowerCase().includes(q))) {
            return true;
        }
        
        return false;
    });
}

/**
 * 번호 기반 제재 대상 검색
 * @param {Array} data 제재 데이터
 * @param {string} query 검색 번호
 * @param {string} numberType 번호 유형 (passport, id, other)
 * @returns {Array} 검색 결과
 */
function searchByNumber(data, query, numberType) {
    if (!query) return [];
    
    const normalizedQuery = query.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    return data.filter(item => {
        if (!item.details.identifications) return false;
        
        return item.details.identifications.some(id => {
            // 번호 정규화
            const normalizedNumber = id.number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            
            // 유형 필터링
            if (numberType && numberType !== 'other') {
                if (numberType === 'passport' && !id.type.toLowerCase().includes('passport') && 
                    !id.type.toLowerCase().includes('여권')) {
                    return false;
                }
                
                if (numberType === 'id' && !id.type.toLowerCase().includes('id') && 
                    !id.type.toLowerCase().includes('신분증')) {
                    return false;
                }
            }
            
            return normalizedNumber.includes(normalizedQuery);
        });
    });
}

/**
 * 제재 대상의 상세 정보를 가져옵니다.
 * @param {string} id 제재 대상 ID
 * @returns {Promise<Object>} 제재 대상 상세 정보
 */
async function getSanctionDetails(id) {
    const data = await fetchSanctionsData();
    return data.find(item => item.id === id) || null;
}

/**
 * 최근 추가된 제재 대상을 가져옵니다.
 * @param {number} limit 가져올 항목 수
 * @returns {Promise<Array>} 최근 제재 대상 배열
 */
async function getRecentSanctions(limit = 10) {
    const data = await fetchSanctionsData();
    
    // 날짜 기준으로 정렬
    return data
        .filter(item => item.details.sanctionDate)
        .sort((a, b) => new Date(b.details.sanctionDate) - new Date(a.details.sanctionDate))
        .slice(0, limit);
}

/**
 * 검색어에 대한 추천 검색어를 가져옵니다.
 * @param {string} query 검색어
 * @returns {Array<string>} 추천 검색어 배열
 */
function getSuggestedSearchTerms(query) {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    const suggestions = [];
    
    // 유사어 사전에서 추천어 찾기
    for (const [key, synonyms] of Object.entries(similarTerms)) {
        if (key.toLowerCase().includes(lowerQuery) && key.toLowerCase() !== lowerQuery) {
            suggestions.push(key);
        }
        
        for (const synonym of synonyms) {
            if (synonym.toLowerCase().includes(lowerQuery) && synonym.toLowerCase() !== lowerQuery) {
                suggestions.push(synonym);
            }
        }
    }
    
    // 중복 제거 및 제한
    return [...new Set(suggestions)].slice(0, 5);
}

// 모듈 내보내기
export {
    fetchSanctionsData,
    searchSanctions,
    getSanctionDetails,
    getRecentSanctions,
    getSuggestedSearchTerms
}; 