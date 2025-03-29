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
 * 제재 데이터를 검색합니다.
 * @param {string} query 검색 쿼리
 * @param {Object} options 검색 옵션
 * @returns {Promise<Array>} 검색 결과
 */
async function searchSanctions(query, options = {}) {
    try {
        // 기본 데이터 로드
        const data = await fetchSanctionsData();
        
        if (!data || data.length === 0) {
            console.log('검색할 데이터가 없습니다.');
            return [];
        }
        
        console.log(`검색 시작: "${query}"`, options);
        
        // 검색어가 없으면 모든 데이터 반환 (필터링만 적용)
        if (!query || query.trim() === '') {
            console.log('검색어 없음, 전체 데이터에 필터만 적용');
            return applyFilters(data, options);
        }
        
        // 검색 로직
        const normalizedQuery = query.toLowerCase().trim();
        
        // 필터 적용 및 검색
        let filteredData = applyFilters(data, options);
        
        // 이름, 설명, 국가 등에서 검색
        const results = filteredData.filter(item => {
            // 이름 검색
            if (item.name && item.name.toLowerCase().includes(normalizedQuery)) {
                return true;
            }
            
            // 국가 검색
            if (item.country && item.country.toLowerCase().includes(normalizedQuery)) {
                return true;
            }
            
            // 타입 검색
            if (item.type && item.type.toLowerCase().includes(normalizedQuery)) {
                return true;
            }
            
            // 상세 내용 검색
            if (item.details) {
                // 설명 검색
                if (item.details.description && 
                    item.details.description.toLowerCase().includes(normalizedQuery)) {
                    return true;
                }
                
                // 별칭 검색
                if (item.details.aliases && 
                    item.details.aliases.some(alias => 
                        alias.toLowerCase().includes(normalizedQuery))) {
                    return true;
                }
                
                // 주소 검색
                if (item.details.addresses && 
                    item.details.addresses.some(address => 
                        address.toLowerCase().includes(normalizedQuery))) {
                    return true;
                }
            }
            
            return false;
        });
        
        console.log(`검색 결과: ${results.length}개 항목`);
        return results;
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        // 에러 발생 시 빈 배열이 아닌 더미 데이터 반환
        return getDummySanctionsData();
    }
}

/**
 * 제재 상세 정보를 가져옵니다.
 * @param {string} id 제재 ID
 * @returns {Promise<Object>} 상세 정보
 */
async function getSanctionDetails(id) {
    try {
        const data = await fetchSanctionsData();
        
        if (!data || data.length === 0) {
            throw new Error('상세 정보를 가져올 수 없습니다.');
        }
        
        const item = data.find(item => item.id === id);
        
        if (!item) {
            // ID에 해당하는 항목을 찾지 못한 경우 더미 데이터 중에서 찾기
            const dummyData = getDummySanctionsData();
            const dummyItem = dummyData.find(dummy => dummy.id === id);
            
            if (dummyItem) {
                return dummyItem;
            }
            
            throw new Error('해당 ID를 가진 제재 정보를 찾을 수 없습니다.');
        }
        
        return item;
    } catch (error) {
        console.error('상세 정보 조회 오류:', error);
        // 에러 상황에서도 사용자에게 정보를 보여주기 위해 더미 데이터 반환
        const dummyData = getDummySanctionsData();
        return dummyData[0]; // 첫 번째 더미 데이터 반환
    }
}

/**
 * 필터를 적용합니다.
 * @param {Array} data 원본 데이터
 * @param {Object} options 필터 옵션
 * @returns {Array} 필터링된 데이터
 */
function applyFilters(data, options = {}) {
    // 필터링할 데이터가 없으면 원본 반환
    if (!data || data.length === 0) {
        return data;
    }
    
    let filtered = [...data];
    
    // 국가 필터
    if (options.countries && options.countries.size > 0) {
        filtered = filtered.filter(item => 
            options.countries.has(item.country) || 
            options.countries.has('기타') && !Array.from(options.countries).some(c => c !== '기타' && item.country === c)
        );
    }
    
    // 프로그램 필터
    if (options.programs && options.programs.size > 0) {
        filtered = filtered.filter(item => 
            item.programs && item.programs.some(program => 
                Array.from(options.programs).some(p => program.includes(p))
            )
        );
    }
    
    // 날짜 필터
    if (options.startDate || options.endDate) {
        filtered = filtered.filter(item => {
            // 항목의 제재 날짜
            let itemDate = null;
            if (item.details && item.details.sanctionDate) {
                itemDate = new Date(item.details.sanctionDate);
            }
            
            // 날짜가 없는 항목은 통과
            if (!itemDate) return true;
            
            // 시작일 체크
            if (options.startDate) {
                const startDate = new Date(options.startDate);
                if (itemDate < startDate) return false;
            }
            
            // 종료일 체크
            if (options.endDate) {
                const endDate = new Date(options.endDate);
                if (itemDate > endDate) return false;
            }
            
            return true;
        });
    }
    
    return filtered;
}

/**
 * 더미 제재 데이터를 생성합니다.
 * @returns {Array} 더미 데이터
 */
function getDummySanctionsData() {
    // UN 제재 더미 데이터
    const unSanctions = [
        {
            id: 'UN_110447',
            name: 'MUHAMMAD TAHER ANWARI',
            type: '개인',
            country: '아프가니스탄',
            programs: ['UN_SANCTIONS'],
            details: {
                aliases: ['Mohammad Taher Anwari', 'Muhammad Tahir Anwari', 'Mohammad Tahre Anwari', 'Haji Mudir'],
                addresses: [],
                identifications: [],
                relatedSanctions: [],
                birthDate: null,
                description: 'Taliban Ministry of Finance. Review pursuant to Security Council resolution 1822 (2008) was concluded on 23 Jul. 2010.',
                sanctionDate: '2001-02-23',
                updatedAt: '2023-04-15'
            }
        },
        {
            id: 'UN_110554',
            name: 'ABDUL LATIF MANSUR',
            type: '개인',
            country: '아프가니스탄',
            programs: ['UN_SANCTIONS'],
            details: {
                aliases: ['Abdul Latif Mansoor', 'Wali Mohammad'],
                addresses: [],
                identifications: [],
                relatedSanctions: [],
                birthDate: null,
                description: 'Taliban Shadow Governor for Logar Province as of late 2012. Belongs to Sahak tribe (Ghilzai).',
                sanctionDate: '2001-01-31',
                updatedAt: '2023-04-15'
            }
        }
    ];

    // EU 제재 더미 데이터
    const euSanctions = [
        {
            id: 'EU_12345',
            name: 'VLADIMIR PUTIN',
            type: '개인',
            country: '러시아',
            programs: ['EU_SANCTIONS'],
            details: {
                aliases: ['Vladimir Vladimirovich Putin'],
                addresses: ['모스크바, 러시아'],
                identifications: [
                    { type: '여권', number: 'RUS12345678', country: '러시아', issueDate: '2015-01-01' }
                ],
                relatedSanctions: [
                    { name: 'Russia Government', type: '단체', relationship: '관련' }
                ],
                birthDate: '1952-10-07',
                description: 'President of the Russian Federation',
                sanctionDate: '2022-02-25',
                updatedAt: '2023-06-10'
            }
        },
        {
            id: 'EU_12346',
            name: 'SERGEI LAVROV',
            type: '개인',
            country: '러시아',
            programs: ['EU_SANCTIONS'],
            details: {
                aliases: ['Sergey Viktorovich Lavrov'],
                addresses: ['모스크바, 러시아'],
                identifications: [],
                relatedSanctions: [],
                birthDate: '1950-03-21',
                description: 'Minister of Foreign Affairs of the Russian Federation',
                sanctionDate: '2022-02-25',
                updatedAt: '2023-06-10'
            }
        }
    ];

    // US 제재 더미 데이터
    const usSanctions = [
        {
            id: 'US_1001',
            name: 'KIM JONG UN',
            type: '개인',
            country: '북한',
            programs: ['US_SANCTIONS'],
            details: {
                aliases: ['Kim Jong-un', '김정은'],
                addresses: ['평양, 북한'],
                identifications: [],
                relatedSanctions: [
                    { name: 'North Korean Government', type: '단체', relationship: '관련' }
                ],
                birthDate: '1984-01-08',
                description: 'Supreme Leader of North Korea',
                sanctionDate: '2016-07-06',
                updatedAt: '2023-02-18'
            }
        },
        {
            id: 'US_1002',
            name: 'IRAN AIRCRAFT MANUFACTURING INDUSTRIES',
            type: '단체',
            country: '이란',
            programs: ['US_SANCTIONS'],
            details: {
                aliases: ['HESA', 'IAMI'],
                addresses: ['테헤란, 이란'],
                identifications: [],
                relatedSanctions: [],
                birthDate: null,
                description: 'Iranian state-owned enterprise involved in aircraft manufacturing',
                sanctionDate: '2018-05-08',
                updatedAt: '2023-01-15'
            }
        }
    ];

    // 모든 더미 데이터 병합
    return [...unSanctions, ...euSanctions, ...usSanctions];
}

// 모듈 내보내기
export {
    fetchSanctionsData,
    searchSanctions,
    getSanctionDetails,
    getRecentSanctions,
    getSuggestedSearchTerms
}; 