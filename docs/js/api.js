/**
 * api.js - 제재 데이터 API 및 데이터 처리 함수
 * 
 * UN, EU, US의 제재 데이터를 가져오고 검색, 필터링하는 기능을 제공합니다.
 * 최적화된 버전: 메모리 효율성 향상 및 페이지네이션 구현
 */

// 캐시 및 상태 관리
const apiState = {
    // 데이터 캐시
    indexCache: {
        un: null,
        eu: null,
        us: null
    },
    chunkCache: {}, // 키: 'source_chunkIndex', 값: 청크 데이터
    // 색인 만료 시간 (30분)
    indexExpiry: 30 * 60 * 1000,
    // 청크 만료 시간 (10분)
    chunkExpiry: 10 * 60 * 1000,
    // 마지막 업데이트 시간
    lastFetched: {
        un: null,
        eu: null,
        us: null
    },
    // 청크 마지막 접근 시간
    chunkLastAccessed: {},
    // 로딩 상태
    isLoading: false,
    // 오류 정보
    error: null
};

// 메모리 관리 설정
const MEMORY_CONFIG = {
    // 최대 청크 캐시 크기
    maxCachedChunks: 5,
    // 청크 캐시 정리 주기 (밀리초)
    cleanupInterval: 60 * 1000
};

/**
 * 제재 데이터를 가져옵니다.
 * @param {Object} options 옵션 객체
 * @param {boolean} options.forceRefresh 캐시된 데이터가 있더라도 강제로 새로고침할지 여부
 * @param {number} options.page 페이지 번호 (1부터 시작)
 * @param {number} options.pageSize 페이지당 항목 수
 * @param {Array<string>} options.sources 가져올 데이터 소스 (un, eu, us)
 * @returns {Promise<Object>} 페이지네이션이 적용된 제재 데이터
 */
async function fetchSanctionsData(options = {}) {
    const {
        forceRefresh = false,
        page = 1,
        pageSize = 50,
        sources = ['un', 'eu', 'us']
    } = options;
    
    if (apiState.isLoading) {
        console.log('이미 데이터를 로드 중입니다.');
        return {
            data: [],
            pagination: { page, pageSize, total: 0, totalPages: 0 }
        };
    }
    
    try {
        apiState.isLoading = true;
        console.log('제재 데이터 로드 중...');
        
        // 색인 파일 로드
        const indexPromises = sources.map(source => loadSourceIndex(source, forceRefresh));
        const indices = await Promise.all(indexPromises);
        
        // 총 항목 수 계산
        const totalItems = indices.reduce((total, index) => total + (index ? index.totalItems : 0), 0);
        const totalPages = Math.ceil(totalItems / pageSize);
        
        // 페이지 범위 검증
        const validPage = Math.max(1, Math.min(page, totalPages));
        
        // 필요한 청크 결정
        const neededChunks = determineNeededChunks(indices, validPage, pageSize);
        
        // 청크 로드
        const chunkPromises = neededChunks.map(chunk => loadChunk(chunk.source, chunk.index));
        const chunks = await Promise.all(chunkPromises);
        
        // 데이터 통합
        const startOffset = (validPage - 1) * pageSize;
        const endOffset = startOffset + pageSize;
        
        // 페이지 데이터 구성
        const paginatedData = extractPaginatedData(chunks, neededChunks, startOffset, endOffset);
        
        console.log(`데이터 로드 완료: ${paginatedData.length}개 항목 (페이지 ${validPage}/${totalPages})`);
        
        // 최신 업데이트 시간 표시
        updateLastUpdateTime(new Date().toISOString());
        
        // 주기적으로 캐시 정리
        scheduleCleanup();
        
        return {
            data: paginatedData,
            pagination: {
                page: validPage,
                pageSize,
                total: totalItems,
                totalPages
            }
        };
    } catch (error) {
        console.error('제재 데이터 로드 오류:', error);
        apiState.error = error.message;
        
        return {
            data: [],
            pagination: { page, pageSize, total: 0, totalPages: 0 }
        };
    } finally {
        apiState.isLoading = false;
    }
}

/**
 * 소스 색인 파일을 로드합니다.
 * @param {string} source 데이터 소스 (un, eu, us)
 * @param {boolean} forceRefresh 강제 새로고침 여부
 * @returns {Promise<Object>} 소스 색인 정보
 */
async function loadSourceIndex(source, forceRefresh = false) {
    // 캐시된 색인이 있고 유효 기간 내라면 사용
    const now = new Date();
    if (!forceRefresh && 
        apiState.indexCache[source] && 
        apiState.lastFetched[source] && 
        (now - apiState.lastFetched[source]) < apiState.indexExpiry) {
        return apiState.indexCache[source];
    }
    
    try {
        // 분할된 데이터 색인 파일 로드 시도
        const response = await fetch(`data/split/${source}_index.json`);
        
        if (response.ok) {
            const indexData = await response.json();
            apiState.indexCache[source] = indexData;
            apiState.lastFetched[source] = now;
            return indexData;
        }
        
        // 분할 색인 파일이 없으면 (아직 분할이 안 된 경우) 전체 파일 처리 방식 사용
        console.log(`${source} 분할 색인 파일이 없습니다. 전체 파일을 사용합니다.`);
        apiState.indexCache[source] = {
            source: source.toUpperCase(),
            totalItems: 0,
            totalChunks: 1,
            chunks: [
                {
                    filename: `${source}_sanctions.json`,
                    itemCount: 0,
                    startIndex: 0,
                    endIndex: 0
                }
            ]
        };
        apiState.lastFetched[source] = now;
        return apiState.indexCache[source];
    } catch (error) {
        console.error(`${source} 색인 로드 오류:`, error);
        return null;
    }
}

/**
 * 청크 데이터를 로드합니다.
 * @param {string} source 데이터 소스 (un, eu, us)
 * @param {number} chunkIndex 청크 인덱스
 * @returns {Promise<Array>} 청크 데이터
 */
async function loadChunk(source, chunkIndex) {
    const cacheKey = `${source}_${chunkIndex}`;
    const now = new Date();
    
    // 캐시 접근 시간 업데이트
    apiState.chunkLastAccessed[cacheKey] = now;
    
    // 캐시된 청크가 있으면 사용
    if (apiState.chunkCache[cacheKey] && 
        (now - apiState.chunkLastAccessed[cacheKey]) < apiState.chunkExpiry) {
        return apiState.chunkCache[cacheKey];
    }
    
    try {
        // 분할된 청크 파일 로드 시도
        const chunkPath = `data/split/${source}_sanctions_${chunkIndex + 1}.json`;
        const response = await fetch(chunkPath);
        
        if (response.ok) {
            const chunkData = await response.json();
            
            // 데이터 정규화 및 가공
            const processedData = chunkData.data.map(item => ({
                ...item,
                // 소스 정보가 없으면 추가
                id: item.id.startsWith(`${source.toUpperCase()}_`) ? item.id : `${source.toUpperCase()}_${item.id}`,
                source: source.toUpperCase()
            }));
            
            // 캐시 저장
            apiState.chunkCache[cacheKey] = processedData;
            
            // 캐시 사이즈 관리
            manageChunkCacheSize();
            
            return processedData;
        }
        
        // 분할 파일이 없으면 전체 파일 로드
        console.log(`${source} 분할 파일이 없습니다. 전체 파일을 로드합니다.`);
        const fullDataPath = `data/${source}_sanctions.json`;
        const fullDataResponse = await fetch(fullDataPath);
        
        if (fullDataResponse.ok) {
            const fullData = await fullDataResponse.json();
            let dataArray = [];
            
            // 데이터 형식에 따라 처리
            if (fullData.data && Array.isArray(fullData.data)) {
                dataArray = fullData.data;
            } else if (Array.isArray(fullData)) {
                dataArray = fullData;
            }
            
            // 소스에 따른 데이터 정규화
            const normalizedData = normalizeSourceData(dataArray, source);
            
            apiState.chunkCache[cacheKey] = normalizedData;
            return normalizedData;
        }
        
        throw new Error(`${source} 데이터 파일을 찾을 수 없습니다.`);
    } catch (error) {
        console.error(`${source} 청크 ${chunkIndex} 로드 오류:`, error);
        return [];
    }
}

/**
 * 소스 데이터를 정규화합니다.
 * @param {Array} data 원본 데이터 
 * @param {string} source 데이터 소스
 * @returns {Array} 정규화된 데이터
 */
function normalizeSourceData(data, source) {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => {
        const sourcePrefix = source.toUpperCase();
        const id = item.id ? `${sourcePrefix}_${item.id}` : `${sourcePrefix}_${generateId(item)}`;
        
        return {
            id,
            name: item.name || getNameFromFields(item),
            type: mapEntityType(item, source),
            country: item.country || item.nationality || sourcePrefix,
            programs: [`${sourcePrefix}_SANCTIONS`],
            source: sourcePrefix,
            details: {
                aliases: getAliases(item, source),
                addresses: item.addresses || [],
                identifications: getIdentifications(item, source),
                birthDate: getBirthDate(item, source),
                description: getDescription(item, source),
                sanctionDate: getSanctionDate(item, source)
            }
        };
    });
}

/**
 * 필요한 청크를 결정합니다.
 * @param {Array} indices 색인 배열
 * @param {number} page 페이지 번호
 * @param {number} pageSize 페이지 크기
 * @returns {Array} 필요한 청크 정보 배열
 */
function determineNeededChunks(indices, page, pageSize) {
    const startOffset = (page - 1) * pageSize;
    const endOffset = startOffset + pageSize - 1;
    
    const neededChunks = [];
    let currentOffset = 0;
    
    for (const index of indices) {
        if (!index) continue;
        
        const sourceItemCount = index.totalItems;
        
        // 이 소스의 데이터가 현재 페이지 범위에 포함되는지 확인
        if (currentOffset + sourceItemCount <= startOffset) {
            // 이 소스의 모든 항목이 시작 오프셋 이전에 있음
            currentOffset += sourceItemCount;
            continue;
        }
        
        if (currentOffset > endOffset) {
            // 이 소스의 모든 항목이 종료 오프셋 이후에 있음
            break;
        }
        
        // 이 소스의 일부 또는 전체 항목이 페이지 범위에 포함됨
        for (let i = 0; i < index.totalChunks; i++) {
            const chunk = index.chunks[i];
            const chunkStartOffset = currentOffset + chunk.startIndex;
            const chunkEndOffset = currentOffset + chunk.endIndex;
            
            // 청크가 페이지 범위와 겹치는지 확인
            if (chunkEndOffset >= startOffset && chunkStartOffset <= endOffset) {
                neededChunks.push({
                    source: index.source.toLowerCase(),
                    index: i,
                    globalStartOffset: chunkStartOffset,
                    globalEndOffset: chunkEndOffset,
                    itemCount: chunk.itemCount
                });
            }
        }
        
        currentOffset += sourceItemCount;
    }
    
    return neededChunks;
}

/**
 * 페이지네이션이 적용된 데이터를 추출합니다.
 * @param {Array} chunks 청크 데이터 배열
 * @param {Array} chunkInfo 청크 정보 배열
 * @param {number} startOffset 시작 오프셋
 * @param {number} endOffset 종료 오프셋
 * @returns {Array} 페이지 데이터
 */
function extractPaginatedData(chunks, chunkInfo, startOffset, endOffset) {
    const result = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const info = chunkInfo[i];
        
        if (!chunk || !info) continue;
        
        // 이 청크에서 필요한 항목만 추출
        for (let j = 0; j < chunk.length; j++) {
            const globalIndex = info.globalStartOffset + j;
            
            if (globalIndex >= startOffset && globalIndex < endOffset) {
                result.push(chunk[j]);
                
                // 충분한 항목을 얻었으면 중단
                if (result.length >= (endOffset - startOffset)) {
                    break;
                }
            }
        }
    }
    
    return result;
}

/**
 * 캐시된 청크 수를 관리합니다.
 */
function manageChunkCacheSize() {
    const chunkKeys = Object.keys(apiState.chunkCache);
    
    if (chunkKeys.length <= MEMORY_CONFIG.maxCachedChunks) {
        return;
    }
    
    // 가장 오래 접근하지 않은 청크부터 제거
    const sortedKeys = chunkKeys.sort((a, b) => {
        return apiState.chunkLastAccessed[a] - apiState.chunkLastAccessed[b];
    });
    
    // 최대 캐시 크기를 초과하는 청크 제거
    const keysToRemove = sortedKeys.slice(0, sortedKeys.length - MEMORY_CONFIG.maxCachedChunks);
    
    for (const key of keysToRemove) {
        delete apiState.chunkCache[key];
        delete apiState.chunkLastAccessed[key];
    }
    
    console.log(`캐시 정리: ${keysToRemove.length}개 청크 제거됨`);
}

/**
 * 주기적인 캐시 정리를 예약합니다.
 */
function scheduleCleanup() {
    if (typeof window !== 'undefined' && !window._cacheCleanupScheduled) {
        window._cacheCleanupScheduled = true;
        
        setInterval(() => {
            manageChunkCacheSize();
        }, MEMORY_CONFIG.cleanupInterval);
    }
}

/**
 * 명칭 필드에서 이름을 추출합니다.
 * @param {Object} item 항목 데이터
 * @returns {string} 이름
 */
function getNameFromFields(item) {
    if (item.first_name || item.last_name) {
        return [item.first_name, item.second_name, item.third_name, item.last_name]
            .filter(Boolean)
            .join(' ');
    }
    
    return item.entity_name || '미상';
}

/**
 * 항목 유형을 매핑합니다.
 * @param {Object} item 항목 데이터
 * @param {string} source 데이터 소스
 * @returns {string} 매핑된 유형
 */
function mapEntityType(item, source) {
    if (source === 'un') {
        if (item.first_name) return '개인';
        return '단체';
    } else if (source === 'eu') {
        return item.entity_type === 'person' ? '개인' : '단체';
    } else if (source === 'us') {
        return item.sdnType === 'individual' ? '개인' : '단체';
    }
    
    return '기타';
}

/**
 * 별칭 정보를 가져옵니다.
 * @param {Object} item 항목 데이터
 * @param {string} source 데이터 소스
 * @returns {Array} 별칭 배열
 */
function getAliases(item, source) {
    if (source === 'un' || source === 'eu') {
        return item.aliases || [];
    } else if (source === 'us') {
        return item.aka || [];
    }
    
    return [];
}

/**
 * 식별 정보를 가져옵니다.
 * @param {Object} item 항목 데이터
 * @param {string} source 데이터 소스
 * @returns {Array} 식별 정보 배열
 */
function getIdentifications(item, source) {
    if (source === 'un') {
        if (!item.documents || !Array.isArray(item.documents)) return [];
        
        return item.documents.map(doc => {
            if (typeof doc === 'string') {
                const parts = doc.split(':');
                if (parts.length > 1) {
                    return { type: parts[0], number: parts.slice(1).join(':') };
                }
                return { type: '기타', number: doc };
            }
            return doc;
        });
    } else if (source === 'eu') {
        return Array.isArray(item.documents) ? item.documents : [];
    } else if (source === 'us') {
        return Array.isArray(item.idList) ? item.idList : [];
    }
    
    return [];
}

/**
 * 생년월일 정보를 가져옵니다.
 * @param {Object} item 항목 데이터
 * @param {string} source 데이터 소스
 * @returns {string|null} 생년월일
 */
function getBirthDate(item, source) {
    if (source === 'un') {
        return item.birth_date || null;
    } else if (source === 'eu') {
        return item.date_of_birth || null;
    } else if (source === 'us') {
        return item.dateOfBirth || null;
    }
    
    return null;
}

/**
 * 설명 정보를 가져옵니다.
 * @param {Object} item 항목 데이터
 * @param {string} source 데이터 소스
 * @returns {string} 설명
 */
function getDescription(item, source) {
    if (source === 'un') {
        return item.comments1 || '';
    } else if (source === 'eu' || source === 'us') {
        return item.remarks || '';
    }
    
    return '';
}

/**
 * 제재 지정일 정보를 가져옵니다.
 * @param {Object} item 항목 데이터
 * @param {string} source 데이터 소스
 * @returns {string|null} 제재 지정일
 */
function getSanctionDate(item, source) {
    if (source === 'un') {
        return item.listed_on || null;
    } else if (source === 'eu') {
        return item.listing_date || null;
    } else if (source === 'us') {
        return item.listedDate || null;
    }
    
    return null;
}

/**
 * 항목 ID를 생성합니다.
 * @param {Object} item 항목 데이터
 * @returns {string} 생성된 ID
 */
function generateId(item) {
    const hash = Math.abs(hashCode(JSON.stringify(item))).toString(16);
    return hash.padStart(8, '0');
}

/**
 * 문자열의 해시 코드를 계산합니다.
 * @param {string} str 문자열
 * @returns {number} 해시 코드
 */
function hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash;
}

/**
 * 최종 업데이트 시간을 표시합니다.
 * @param {string} dateStr 날짜 문자열
 */
function updateLastUpdateTime(dateStr) {
    const lastUpdateElement = document.getElementById('last-update-time');
    if (lastUpdateElement) {
        const date = new Date(dateStr);
        lastUpdateElement.textContent = date.toLocaleString();
    }
}

/**
 * UN 제재 데이터 처리
 */
function processUNData(data) {
    return data.map(item => ({
        id: `UN_${item.id || generateId(item)}`,
        name: item.name || item.first_name + ' ' + item.last_name,
        type: mapEntityType(item, 'un'),
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
        type: mapEntityType(item, 'eu'),
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
        type: mapEntityType(item, 'us'),
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
        type: mapEntityType(entity, entity.source || '기타'),
        relationship: entity.relationship || entity.relation_type || '관련'
    }));
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
 * @returns {Promise<Object>} 검색 결과
 */
async function searchSanctions(query, options = {}) {
    // 실제 API가 개발되기 전까지 더미 데이터 사용
    // TODO: 실제 API 구현 시 아래 코드 대체
    return new Promise((resolve) => {
        // 시뮬레이션된 API 지연 (500ms ~ 1500ms)
        setTimeout(() => {
            const dummyData = getDummySanctionsData();
            let filteredData = [...dummyData];
            
            // 검색어 필터링
            if (query) {
                const searchLower = query.toLowerCase();
                
                // 검색 유형에 따라 다른 필터링 적용
                const searchType = options.searchType || 'text';
                
                if (searchType === 'text') {
                    // 일반 텍스트 검색 (이름, 별명 등)
                    filteredData = filteredData.filter(item => {
                        // 이름 검색
                        if (item.name.toLowerCase().includes(searchLower)) {
                            return true;
                        }
                        
                        // 별명 검색
                        if (item.details.aliases && item.details.aliases.some(alias => 
                            alias.toLowerCase().includes(searchLower))) {
                            return true;
                        }
                        
                        // 설명 검색
                        if (item.details.description && 
                            item.details.description.toLowerCase().includes(searchLower)) {
                            return true;
                        }
                        
                        return false;
                    });
                } else if (searchType === 'id') {
                    // ID 검색
                    filteredData = filteredData.filter(item => 
                        item.id.toLowerCase().includes(searchLower));
                } else if (searchType === 'number') {
                    // 식별 번호 검색 (여권, 신분증 등)
                    const numberType = options.numberType || 'passport';
                    
                    filteredData = filteredData.filter(item => {
                        if (!item.details.identifications) return false;
                        
                        return item.details.identifications.some(id => {
                            if (numberType === 'all' || id.type.toLowerCase() === numberType) {
                                return id.number.toLowerCase().includes(searchLower);
                            }
                            return false;
                        });
                    });
                }
            }
            
            // 국가 필터링
            if (options.countries && options.countries.length > 0) {
                filteredData = filteredData.filter(item => 
                    options.countries.includes(item.country));
            }
            
            // 프로그램 필터링
            if (options.programs && options.programs.length > 0) {
                filteredData = filteredData.filter(item => 
                    item.programs.some(program => options.programs.includes(program)));
            }
            
            // 날짜 필터링
            if (options.startDate) {
                const startDate = new Date(options.startDate);
                filteredData = filteredData.filter(item => {
                    if (!item.details.sanctionDate) return true;
                    const sanctionDate = new Date(item.details.sanctionDate);
                    return sanctionDate >= startDate;
                });
            }
            
            if (options.endDate) {
                const endDate = new Date(options.endDate);
                filteredData = filteredData.filter(item => {
                    if (!item.details.sanctionDate) return true;
                    const sanctionDate = new Date(item.details.sanctionDate);
                    return sanctionDate <= endDate;
                });
            }
            
            // 페이지네이션 처리
            const page = options.page || 1;
            const pageSize = options.pageSize || 20;
            const totalItems = filteredData.length;
            const totalPages = Math.ceil(totalItems / pageSize);
            
            // 현재 페이지 데이터 추출
            const startIndex = (page - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, totalItems);
            const paginatedData = filteredData.slice(startIndex, endIndex);
            
            // 결과 반환
            resolve({
                data: paginatedData,
                pagination: {
                    page: page,
                    pageSize: pageSize,
                    total: totalItems,
                    totalPages: totalPages
                }
            });
        }, Math.random() * 1000 + 500); // 0.5초~1.5초 지연
    });
}

/**
 * 제재 상세 정보를 가져옵니다.
 * @param {string} id 제재 ID
 * @returns {Promise<Object>} 상세 정보
 */
async function getSanctionDetails(id) {
    try {
        // ID에서 소스 추출
        const idParts = id.split('_');
        const source = idParts[0].toLowerCase();
        
        // 모든 소스 색인 로드
        const index = await loadSourceIndex(source);
        
        if (!index) {
            throw new Error(`소스 ${source}의 색인 정보를 찾을 수 없습니다.`);
        }
        
        // 모든 청크를 순회하며 검색
        for (let i = 0; i < index.totalChunks; i++) {
            const chunkData = await loadChunk(source, i);
            
            if (chunkData && chunkData.length > 0) {
                const item = chunkData.find(item => item.id === id);
                if (item) return item;
            }
        }
        
        // 아이템을 찾지 못한 경우 더미 데이터 반환
        throw new Error(`ID ${id}를 가진 항목을 찾을 수 없습니다.`);
    } catch (error) {
        console.error('상세 정보 조회 오류:', error);
        const dummyData = getDummySanctionsData();
        return dummyData[0];
    }
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