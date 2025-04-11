/**
 * api.js - 제재 데이터 API 서비스
 * 제재 데이터 검색 및 관리 기능을 제공합니다.
 */

// API 서비스 객체 생성
const ApiService = {};

// 캐시 및 상태 관리
const apiState = {
    sanctions: null,
    lastFetched: null,
    isLoading: false,
    loadingProgress: 0,
    error: null,
    // 유사어 사전
    similarTerms: {
        '북한': ['dprk', 'north korea', '조선민주주의인민공화국'],
        '러시아': ['russia', 'russian federation', '러시아연방'],
        '미국': ['usa', 'america', 'united states'],
        '중국': ['china', 'prc', '중화인민공화국'],
        '여권': ['passport', 'travel document'],
        '신분증': ['id card', 'identity card', 'identification'],
        '테러': ['terror', 'terrorist', 'terrorism'],
        '제재': ['sanction', 'restriction', 'ban']
    }
};

/**
 * 초기화 함수
 */
ApiService.init = function() {
    console.log('API 서비스 초기화...');
    
    // 캐시된 데이터 복원 시도
    const cached = this.getCachedSanctionsData();
    if (cached && cached.data) {
        apiState.sanctions = cached.data;
        apiState.lastFetched = cached.timestamp ? new Date(cached.timestamp) : null;
        console.log(`캐시된 제재 데이터 ${apiState.sanctions.length}개 항목 로드됨`);
        
        // 캐시된 데이터가 1시간 이상 지났으면 백그라운드에서 새로고침
        const now = new Date();
        if (apiState.lastFetched && (now - apiState.lastFetched) > 60 * 60 * 1000) {
            console.log('캐시된 데이터가 오래되어 백그라운드에서 새로고침합니다.');
            setTimeout(() => this.fetchSanctionsData(true), 2000);
        }
    } else {
        // 캐시된 데이터가 없으면 즉시 로드
        this.fetchSanctionsData();
    }
    
    console.log('API 서비스 초기화 완료');
};

/**
 * 제재 데이터 가져오기
 * @param {boolean} forceRefresh 강제 새로고침 여부
 * @returns {Promise<Array>} 제재 데이터 목록
 */
ApiService.fetchSanctionsData = async function(forceRefresh = false) {
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
        apiState.loadingProgress = 0;
        
        // 로딩 인디케이터 표시
        this._showLoadingIndicator('데이터를 불러오는 중...');
        
        // 데이터 소스
        const sources = [
            { name: 'un', url: 'data/un_sanctions.json' },
            { name: 'eu', url: 'data/eu_sanctions.json' },
            { name: 'us', url: 'data/us_sanctions.json' }
        ];
        
        let sanctionsData = [];
        let failedSources = [];
        
        // 각 소스에서 데이터 가져오기 (병렬 처리)
        const sourcePromises = sources.map(async (source, index) => {
            try {
                const response = await fetch(source.url);
                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.data)) {
                        // 로딩 진행 상황 업데이트
                        apiState.loadingProgress = Math.min(90, apiState.loadingProgress + (30 * (index + 1) / sources.length));
                        this._updateLoadingProgress();
                        
                        console.log(`${source.name.toUpperCase()} 제재 데이터 로드 완료: ${data.data.length}개 항목`);
                        return data.data;
                    }
                }
                throw new Error(`${source.name} 데이터 로드 실패`);
            } catch (error) {
                console.warn(`${source.name.toUpperCase()} 제재 데이터 로드 실패:`, error);
                failedSources.push(source.name.toUpperCase());
                return [];
            }
        });
        
        // 모든 소스의 데이터를 병렬로 가져옴
        const results = await Promise.all(sourcePromises);
        sanctionsData = results.flat();
        
        // 데이터가 없는 경우 기본 데이터로 폴백
        if (sanctionsData.length === 0) {
            try {
                const response = await fetch('data/all_sanctions.json');
                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.data)) {
                        sanctionsData = data.data;
                        console.log(`기본 제재 데이터 로드 완료: ${sanctionsData.length}개 항목`);
                    }
                }
            } catch (error) {
                console.error('기본 제재 데이터 로드 실패:', error);
                throw new Error('제재 데이터를 로드할 수 없습니다.');
            }
        }
        
        // 로딩 진행상황 업데이트
        apiState.loadingProgress = 95;
        this._updateLoadingProgress();
        
        // 데이터 정규화 및 중복 제거
        sanctionsData = sanctionsData.map(item => ({
            id: item.id || ('sanction_' + Math.random().toString(36).substr(2, 9)),
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
        
        // 중복 제거
        const uniqueIds = new Set();
        sanctionsData = sanctionsData.filter(item => {
            if (uniqueIds.has(item.id)) {
                return false;
            }
            uniqueIds.add(item.id);
            return true;
        });
        
        // 로딩 진행상황 업데이트
        apiState.loadingProgress = 100;
        this._updateLoadingProgress();
        
        // 상태 업데이트
        apiState.sanctions = sanctionsData;
        apiState.lastFetched = now;
        apiState.error = null;
        
        // 캐시 저장
        this.cacheSanctionsData(sanctionsData);
        
        // 최종 업데이트 시간 표시
        if (window.Utils) {
            window.Utils.updateLastUpdateTime(now);
        } else {
            const lastUpdateElement = document.getElementById('last-update');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = now.toLocaleString('ko-KR');
            }
        }
        
        // 실패한 소스에 대한 경고 표시
        if (failedSources.length > 0 && !forceRefresh) {
            const failedSourcesStr = failedSources.join(', ');
            console.warn(`일부 데이터(${failedSourcesStr})를 로드하지 못했습니다.`);
            
            // 알림 표시
            if (window.Utils) {
                window.Utils.showAlert(`일부 데이터(${failedSourcesStr})를 로드하지 못했습니다. 제한된 결과만 표시됩니다.`, 'warning');
            }
        }
        
        return apiState.sanctions;
        
    } catch (error) {
        console.error('제재 데이터 로드 오류:', error);
        apiState.error = error.message;
        
        // 알림 표시
        if (window.Utils && !forceRefresh) {
            window.Utils.showAlert('제재 데이터를 불러오는 도중 오류가 발생했습니다.', 'error');
        }
        
        return [];
    } finally {
        apiState.isLoading = false;
        
        // 로딩 인디케이터 제거
        this._hideLoadingIndicator();
    }
};

/**
 * 로딩 인디케이터 표시
 * @param {string} message 표시할 메시지
 * @private
 */
ApiService._showLoadingIndicator = function(message) {
    const container = document.getElementById('results-container');
    if (!container) return;
    
    // 기존 로딩 인디케이터 확인
    let loadingElement = document.querySelector('.loading-indicator');
    if (loadingElement) {
        loadingElement.querySelector('p').textContent = message;
        return;
    }
    
    // 새 로딩 인디케이터 생성
    loadingElement = document.createElement('div');
    loadingElement.className = 'loading-indicator';
    loadingElement.innerHTML = `
        <div class="spinner"></div>
        <p>${message}</p>
        <div class="progress-bar">
            <div class="progress" style="width: 0%"></div>
        </div>
    `;
    container.appendChild(loadingElement);
};

/**
 * 로딩 진행상황 업데이트
 * @private
 */
ApiService._updateLoadingProgress = function() {
    const progressBar = document.querySelector('.loading-indicator .progress');
    if (progressBar) {
        progressBar.style.width = `${apiState.loadingProgress}%`;
    }
};

/**
 * 로딩 인디케이터 숨기기
 * @private
 */
ApiService._hideLoadingIndicator = function() {
    setTimeout(() => {
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
    }, 500);
};

/**
 * 제재 데이터 검색
 * @param {string} query 검색어
 * @param {string} countryFilter 국가 필터
 * @param {string} programFilter 프로그램 필터
 * @param {string} searchType 검색 유형 (text, number)
 * @param {string} numberType 번호 유형
 * @returns {Promise<Object>} 검색 결과
 */
ApiService.searchSanctions = async function(query, countryFilter = '', programFilter = '', searchType = 'text', numberType = 'all') {
    // 데이터 가져오기
    let data = apiState.sanctions;
    if (!data || data.length === 0) {
        data = await this.fetchSanctionsData();
    }
    
    if (!data || data.length === 0) {
        return { results: [], total: 0 };
    }
    
    // 옵션 객체 생성
    const options = {
        country: countryFilter,
        program: programFilter,
        searchType: searchType,
        numberType: numberType
    };
    
    // 검색어가 없으면 전체 데이터 반환 (필터링은 적용)
    if (!query || query.trim() === '') {
        const filteredData = this._applyFilters(data, options);
        return { 
            results: filteredData,
            total: filteredData.length
        };
    }
    
    // 검색 유형에 따라 다른 검색 로직 적용
    let searchResults;
    if (options.searchType === 'number') {
        searchResults = this._searchByNumber(data, query, options.numberType);
    } else {
        searchResults = this._searchByText(data, query);
    }
    
    // 결과에 필터 적용
    const filteredResults = this._applyFilters(searchResults, options);
    
    // 유사어 및 추천 검색어
    const suggestions = this.getSuggestedSearchTerms(query);
    
    return {
        results: filteredResults,
        total: filteredResults.length,
        suggestions: suggestions
    };
};

/**
 * 필터 적용
 * @param {Array} data 데이터 목록
 * @param {Object} options 필터 옵션
 * @returns {Array} 필터링된 데이터
 * @private
 */
ApiService._applyFilters = function(data, options = {}) {
    let filtered = [...data];
    
    // 국가 필터
    if (options.country && options.country !== 'all') {
        filtered = filtered.filter(item => 
            item.country && item.country.toLowerCase() === options.country.toLowerCase()
        );
    }
    
    // 프로그램 필터
    if (options.program && options.program !== 'all') {
        filtered = filtered.filter(item => 
            item.programs && 
            item.programs.some(prog => 
                prog.toLowerCase().includes(options.program.toLowerCase())
            )
        );
    }
    
    // 날짜 범위 필터
    if (options.startDate) {
        const startDate = new Date(options.startDate);
        filtered = filtered.filter(item => {
            if (!item.date_listed) return true;
            const itemDate = new Date(item.date_listed);
            return !isNaN(itemDate.getTime()) && itemDate >= startDate;
        });
    }
    
    if (options.endDate) {
        const endDate = new Date(options.endDate);
        filtered = filtered.filter(item => {
            if (!item.date_listed) return true;
            const itemDate = new Date(item.date_listed);
            return !isNaN(itemDate.getTime()) && itemDate <= endDate;
        });
    }
    
    return filtered;
};

/**
 * 텍스트 검색
 * @param {Array} data 데이터 목록
 * @param {string} query 검색어
 * @returns {Array} 검색 결과
 * @private
 */
ApiService._searchByText = function(data, query) {
    if (!query || query.trim() === '') return data;
    
    query = query.toLowerCase().trim();
    
    // 유사어 확장
    const expandedTerms = this._expandSearchTerms(query);
    console.log('확장된 검색어:', expandedTerms);
    
    return data.filter(item => {
        // 각 확장된 검색어에 대해 검색
        for (const term of expandedTerms) {
            // 이름 검색
            if (item.name && item.name.toLowerCase().includes(term)) {
                return true;
            }
            
            // 별칭 검색
            if (item.details && item.details.aliases && item.details.aliases.length > 0) {
                if (item.details.aliases.some(alias => 
                    alias.toLowerCase().includes(term)
                )) {
                    return true;
                }
            }
            
            // 국가 검색
            if (item.country && item.country.toLowerCase().includes(term)) {
                return true;
            }
            
            // 프로그램 검색
            if (item.programs && item.programs.length > 0) {
                if (item.programs.some(program => 
                    program.toLowerCase().includes(term)
                )) {
                    return true;
                }
            }
            
            // 출처 검색
            if (item.source && item.source.toLowerCase().includes(term)) {
                return true;
            }
        }
        
        return false;
    });
};

/**
 * 검색어 확장 (유사어 포함)
 * @param {string} query 원본 검색어
 * @returns {Array<string>} 확장된 검색어 배열
 * @private
 */
ApiService._expandSearchTerms = function(query) {
    const terms = [query]; // 원래 검색어는 항상 포함
    
    // 유사어 사전에서 관련 용어 찾기
    for (const [key, values] of Object.entries(apiState.similarTerms)) {
        // 키워드가 검색어에 포함되어 있으면
        if (query.includes(key.toLowerCase())) {
            // 유사어 추가
            terms.push(...values.map(v => v.toLowerCase()));
        }
        
        // 검색어가 유사어에 포함되어 있으면
        if (values.some(v => query.includes(v.toLowerCase()))) {
            // 키워드 추가
            terms.push(key.toLowerCase());
            // 다른 유사어도 추가
            terms.push(...values.map(v => v.toLowerCase()).filter(v => !query.includes(v.toLowerCase())));
        }
    }
    
    // 중복 제거 후 반환
    return [...new Set(terms)];
};

/**
 * 번호 검색
 * @param {Array} data 데이터 목록
 * @param {string} query 검색어
 * @param {string} numberType 번호 유형
 * @returns {Array} 검색 결과
 * @private
 */
ApiService._searchByNumber = function(data, query, numberType = '') {
    if (!query || query.trim() === '') return data;
    
    query = query.toLowerCase().trim();
    
    return data.filter(item => {
        if (!item.details || !item.details.identifications) {
            return false;
        }
        
        return item.details.identifications.some(id => {
            if (!id.number) return false;
            
            const idNumber = id.number.toLowerCase();
            
            // 번호 유형 필터링
            if (numberType && numberType !== 'all') {
                const idType = id.type ? id.type.toLowerCase() : '';
                
                if (numberType === 'passport' && !idType.includes('passport') && !idType.includes('여권')) {
                    return false;
                }
                
                if (numberType === 'id' && !idType.includes('id') && !idType.includes('신분')) {
                    return false;
                }
            }
            
            return idNumber.includes(query);
        });
    });
};

/**
 * 제재 대상 상세 정보 가져오기
 * @param {string} id 제재 대상 ID
 * @returns {Promise<Object>} 제재 대상 상세 정보
 */
ApiService.getSanctionDetails = async function(id) {
    // 데이터 가져오기
    let data = apiState.sanctions;
    if (!data || data.length === 0) {
        data = await this.fetchSanctionsData();
    }
    
    if (!data || data.length === 0) {
        return null;
    }
    
    // ID로 제재 대상 찾기
    return data.find(item => item.id === id) || null;
};

/**
 * 최근 제재 대상 가져오기
 * @param {number} limit 가져올 항목 수
 * @returns {Promise<Array>} 최근 제재 대상 목록
 */
ApiService.getRecentSanctions = async function(limit = 10) {
    // 데이터 가져오기
    let data = apiState.sanctions;
    if (!data || data.length === 0) {
        data = await this.fetchSanctionsData();
    }
    
    if (!data || data.length === 0) {
        return [];
    }
    
    // 날짜별로 정렬 (최신순)
    return data
        .filter(item => item.date_listed)
        .sort((a, b) => {
            const dateA = new Date(a.date_listed);
            const dateB = new Date(b.date_listed);
            
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;
            
            return dateB - dateA;
        })
        .slice(0, limit);
};

/**
 * 추천 검색어 가져오기
 * @param {string} query 검색어
 * @returns {Array<string>} 추천 검색어 목록
 */
ApiService.getSuggestedSearchTerms = function(query) {
    if (!query || query.length < 2) {
        return [];
    }
    
    const suggestions = [
        '북한', '러시아', '이란', '시리아', '베네수엘라',
        'DPRK', 'Russia', 'Iran', 'Syria', 'Venezuela',
        '김정은', '푸틴', '하마스', 'Hamas', '헤즈볼라', 'Hezbollah',
        '테러', 'Terror', '무기', 'Weapons', '핵', 'Nuclear',
        '제재', 'Sanctions'
    ];
    
    const lowercaseQuery = query.toLowerCase();
    
    return suggestions
        .filter(term => term.toLowerCase().includes(lowercaseQuery))
        .slice(0, 5);
};

/**
 * 제재 데이터를 로컬 스토리지에 캐싱
 * @param {Array} data 제재 데이터
 * @private
 */
ApiService.cacheSanctionsData = function(data) {
    try {
        const cacheData = {
            timestamp: new Date().toISOString(),
            data: data
        };
        
        localStorage.setItem('sanctionsDataCache', JSON.stringify(cacheData));
        console.log(`${data.length}개 항목의 제재 데이터가 캐시되었습니다.`);
    } catch (error) {
        console.warn('제재 데이터 캐싱 실패:', error);
    }
};

/**
 * 캐시된 제재 데이터 가져오기
 * @returns {Object|null} 캐시된 데이터
 * @private
 */
ApiService.getCachedSanctionsData = function() {
    try {
        const cacheStr = localStorage.getItem('sanctionsDataCache');
        if (!cacheStr) return null;
        
        const cacheData = JSON.parse(cacheStr);
        if (!cacheData || !cacheData.data || !Array.isArray(cacheData.data)) {
            return null;
        }
        
        return cacheData;
    } catch (error) {
        console.warn('캐시된 데이터 로드 실패:', error);
        return null;
    }
};

// 전역 객체로 내보내기
window.ApiService = ApiService; 