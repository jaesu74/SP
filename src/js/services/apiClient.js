/**
 * apiClient.js
 * 통합 API 클라이언트 - 모든 API 호출을 관리하는 단일 모듈
 */

const ApiClient = {
    // API 설정
    config: {
        baseUrl: 'https://api.wvl.co.kr',
        timeout: 30000, // 30초
        retryCount: 2,
        retryDelay: 1000, // 1초
    },
    
    // 캐시 설정
    cache: {
        // 캐시 유효 시간 (밀리초)
        ttl: {
            sanctions: 30 * 60 * 1000, // 30분
            search: 10 * 60 * 1000,    // 10분
            details: 20 * 60 * 1000,   // 20분
        },
        
        // 캐시 데이터
        data: {},
        
        // 캐시 타임스탬프
        timestamps: {},
    },
    
    /**
     * API 클라이언트 초기화
     * @param {Object} options 설정 옵션
     */
    init(options = {}) {
        // 설정 병합
        this.config = { ...this.config, ...options };
        console.log('API 클라이언트 초기화 완료');
        
        // 브라우저가 닫힐 때 캐시 저장
        window.addEventListener('beforeunload', () => {
            this.saveCache();
        });
        
        // 저장된 캐시 복원
        this.restoreCache();
    },
    
    /**
     * 캐시 저장
     */
    saveCache() {
        try {
            const cacheData = {
                data: this.cache.data,
                timestamps: this.cache.timestamps,
                savedAt: new Date().toISOString(),
            };
            
            localStorage.setItem('apiCache', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('API 캐시 저장 오류:', e);
        }
    },
    
    /**
     * 캐시 복원
     */
    restoreCache() {
        try {
            const storedCache = localStorage.getItem('apiCache');
            if (!storedCache) return;
            
            const parsedCache = JSON.parse(storedCache);
            if (!parsedCache || !parsedCache.data || !parsedCache.timestamps) return;
            
            this.cache.data = parsedCache.data;
            this.cache.timestamps = parsedCache.timestamps;
            
            console.log('API 캐시 복원 완료');
        } catch (e) {
            console.warn('API 캐시 복원 오류:', e);
        }
    },
    
    /**
     * 캐시에서 데이터 가져오기
     * @param {string} key 캐시 키
     * @param {number} ttl TTL (밀리초)
     * @returns {any|null} 캐시된 데이터 또는 null
     */
    getFromCache(key, ttl) {
        // 캐시 데이터 존재 확인
        if (!this.cache.data[key]) return null;
        
        // 타임스탬프 확인
        const timestamp = this.cache.timestamps[key];
        if (!timestamp) return null;
        
        // TTL 확인
        const now = Date.now();
        if (now - timestamp > ttl) {
            // 만료된 경우 캐시 제거
            delete this.cache.data[key];
            delete this.cache.timestamps[key];
            return null;
        }
        
        return this.cache.data[key];
    },
    
    /**
     * 데이터를 캐시에 저장
     * @param {string} key 캐시 키
     * @param {any} data 캐싱할 데이터
     */
    saveToCache(key, data) {
        this.cache.data[key] = data;
        this.cache.timestamps[key] = Date.now();
    },
    
    /**
     * 특정 캐시 항목 제거
     * @param {string} key 캐시 키
     */
    clearCacheItem(key) {
        delete this.cache.data[key];
        delete this.cache.timestamps[key];
    },
    
    /**
     * 모든 캐시 제거
     */
    clearCache() {
        this.cache.data = {};
        this.cache.timestamps = {};
        localStorage.removeItem('apiCache');
    },
    
    /**
     * API 요청 실행
     * @param {string} endpoint 엔드포인트 경로
     * @param {Object} options 요청 옵션
     * @returns {Promise<any>} 응답 데이터
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseUrl}${endpoint}`;
        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
            ...(options.body && { body: JSON.stringify(options.body) }),
            signal: options.signal,
        };
        
        let retries = 0;
        let lastError;
        
        // 재시도 로직
        while (retries <= this.config.retryCount) {
            try {
                // 요청 타임아웃 설정
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
                
                if (!options.signal) {
                    requestOptions.signal = controller.signal;
                }
                
                const response = await fetch(url, requestOptions);
                clearTimeout(timeoutId);
                
                // HTTP 오류 처리
                if (!response.ok) {
                    throw new Error(`HTTP 오류: ${response.status}`);
                }
                
                // JSON 파싱
                const data = await response.json();
                return data;
                
            } catch (error) {
                lastError = error;
                
                // AbortError는 재시도하지 않음
                if (error.name === 'AbortError') {
                    throw new Error('요청 시간 초과');
                }
                
                retries++;
                
                // 마지막 시도가 아니면 지연 후 재시도
                if (retries <= this.config.retryCount) {
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * retries));
                }
            }
        }
        
        // 모든 재시도 실패
        throw lastError || new Error('API 요청 실패');
    },
    
    /**
     * 모든 제재 데이터 가져오기
     * @param {boolean} forceRefresh 강제 새로고침 여부
     * @returns {Promise<Array>} 제재 데이터
     */
    async getAllSanctions(forceRefresh = false) {
        const cacheKey = 'allSanctions';
        
        // 캐시 확인
        if (!forceRefresh) {
            const cachedData = this.getFromCache(cacheKey, this.cache.ttl.sanctions);
            if (cachedData) {
                return cachedData;
            }
        }
        
        try {
            const result = await this.request('/sanctions/all');
            
            // 응답 유효성 검증
            if (!result || !Array.isArray(result.data)) {
                throw new Error('유효하지 않은 응답 형식');
            }
            
            // 결과 캐싱
            this.saveToCache(cacheKey, result.data);
            
            return result.data;
        } catch (error) {
            console.error('제재 데이터 가져오기 오류:', error);
            throw error;
        }
    },
    
    /**
     * 제재 검색
     * @param {string} query 검색어
     * @param {Object} options 검색 옵션
     * @returns {Promise<Object>} 검색 결과
     */
    async searchSanctions(query, options = {}) {
        // 캐시 키 생성
        const optionsStr = JSON.stringify(options);
        const cacheKey = `search_${query}_${optionsStr}`;
        
        // 캐시 확인
        const cachedData = this.getFromCache(cacheKey, this.cache.ttl.search);
        if (cachedData) {
            return { results: cachedData };
        }
        
        try {
            // API URL 생성
            const apiUrl = new URL(`${this.config.baseUrl}/sanctions/search`);
            
            // 쿼리 파라미터 추가
            apiUrl.searchParams.append('q', query);
            
            // 옵션 파라미터 추가
            if (options.searchType) {
                apiUrl.searchParams.append('type', options.searchType);
            }
            
            if (options.searchType === 'number' && options.numberType) {
                apiUrl.searchParams.append('numberType', options.numberType);
            }
            
            if (options.limit) {
                apiUrl.searchParams.append('limit', options.limit);
            }
            
            if (options.offset) {
                apiUrl.searchParams.append('offset', options.offset);
            }
            
            // API 요청
            const result = await this.request(apiUrl.toString());
            
            // 응답 유효성 검증
            if (!result || !Array.isArray(result.data)) {
                throw new Error('유효하지 않은 검색 응답 형식');
            }
            
            // 결과 캐싱
            this.saveToCache(cacheKey, result.data);
            
            return { results: result.data };
        } catch (error) {
            console.error('제재 검색 오류:', error);
            
            // 오류 시 전체 데이터에서 로컬 검색 실행
            console.warn('로컬 검색으로 대체');
            
            try {
                // 전체 데이터 가져오기
                const allData = await this.getAllSanctions();
                
                if (!query) return { results: allData };
                
                // 로컬 검색 실행
                const searchResults = this.performLocalSearch(allData, query, options);
                return { results: searchResults };
            } catch (localSearchError) {
                console.error('로컬 검색 오류:', localSearchError);
                throw error; // 원래 오류 전파
            }
        }
    },
    
    /**
     * 로컬 데이터에서 검색 수행
     * @param {Array} data 검색 대상 데이터
     * @param {string} query 검색어
     * @param {Object} options 검색 옵션
     * @returns {Array} 검색 결과
     */
    performLocalSearch(data, query, options = {}) {
        const normalizedQuery = query.toLowerCase().trim();
        let filtered;
        
        if (options.searchType === 'number') {
            // 번호 검색 로직
            filtered = data.filter(item => {
                const details = item.details || {};
                const identifications = details.identifications || [];
                
                return identifications.some(id => {
                    // 번호 유형에 따라 필터링
                    if (options.numberType !== 'all' && 
                        id.type && 
                        !id.type.toLowerCase().includes(options.numberType.toLowerCase())) {
                        return false;
                    }
                    
                    // 번호 검색
                    return id.number && id.number.toLowerCase().includes(normalizedQuery);
                });
            });
        } else {
            // 텍스트 검색 로직 - 성능 최적화 버전
            filtered = data.filter(item => {
                // 이름 검색
                if (item.name && item.name.toLowerCase().includes(normalizedQuery)) {
                    return true;
                }
                
                // 별칭 검색
                const details = item.details || {};
                const aliases = details.aliases || [];
                if (aliases.some(alias => alias.toLowerCase().includes(normalizedQuery))) {
                    return true;
                }
                
                // 국가 검색
                if (item.country && item.country.toLowerCase().includes(normalizedQuery)) {
                    return true;
                }
                
                // 유형 검색
                if (item.type && item.type.toLowerCase().includes(normalizedQuery)) {
                    return true;
                }
                
                return false;
            });
        }
        
        return filtered;
    },
    
    /**
     * 상세 정보 가져오기
     * @param {string} id 제재 ID
     * @returns {Promise<Object>} 상세 정보
     */
    async getSanctionDetails(id) {
        const cacheKey = `details_${id}`;
        
        // 캐시 확인
        const cachedData = this.getFromCache(cacheKey, this.cache.ttl.details);
        if (cachedData) {
            return cachedData;
        }
        
        try {
            const result = await this.request(`/sanctions/details/${id}`);
            
            // 응답 유효성 검증
            if (!result || !result.data) {
                throw new Error('유효하지 않은 상세 정보 응답 형식');
            }
            
            // 결과 캐싱
            this.saveToCache(cacheKey, result.data);
            
            return result.data;
        } catch (error) {
            console.error('상세 정보 가져오기 오류:', error);
            
            // 오류 시 전체 데이터에서 조회
            console.warn('로컬 데이터에서 상세 정보 조회');
            
            try {
                // 전체 데이터 가져오기
                const allData = await this.getAllSanctions();
                
                // ID로 상세 정보 검색
                const details = allData.find(item => item.id === id);
                
                if (details) {
                    // 캐싱
                    this.saveToCache(cacheKey, details);
                }
                
                return details || null;
            } catch (localSearchError) {
                console.error('로컬 상세 정보 조회 오류:', localSearchError);
                return null;
            }
        }
    },
    
    /**
     * 최근 제재 데이터 가져오기
     * @param {number} limit 결과 제한
     * @returns {Promise<Array>} 최근 제재 데이터
     */
    async getRecentSanctions(limit = 10) {
        const cacheKey = `recent_${limit}`;
        
        // 캐시 확인
        const cachedData = this.getFromCache(cacheKey, this.cache.ttl.sanctions / 2); // 더 짧은 TTL
        if (cachedData) {
            return cachedData;
        }
        
        try {
            const result = await this.request(`/sanctions/recent?limit=${limit}`);
            
            // 응답 유효성 검증
            if (!result || !Array.isArray(result.data)) {
                throw new Error('유효하지 않은 최근 제재 응답 형식');
            }
            
            // 결과 캐싱
            this.saveToCache(cacheKey, result.data);
            
            return result.data;
        } catch (error) {
            console.error('최근 제재 데이터 가져오기 오류:', error);
            
            // 오류 시 전체 데이터에서 최근 항목 필터링
            console.warn('전체 데이터에서 최근 항목 필터링');
            
            try {
                // 전체 데이터 가져오기
                const allData = await this.getAllSanctions();
                
                // 날짜 기준으로 정렬 (최신순)
                const sorted = [...allData].sort((a, b) => {
                    const dateA = a.date_listed ? new Date(a.date_listed) : new Date(0);
                    const dateB = b.date_listed ? new Date(b.date_listed) : new Date(0);
                    return dateB - dateA;
                });
                
                const recent = sorted.slice(0, limit);
                
                // 캐싱
                this.saveToCache(cacheKey, recent);
                
                return recent;
            } catch (sortError) {
                console.error('최근 항목 필터링 오류:', sortError);
                return [];
            }
        }
    },
    
    /**
     * 통계 데이터 가져오기
     * @returns {Promise<Object>} 통계 데이터
     */
    async getSanctionsStats() {
        const cacheKey = 'stats';
        
        // 캐시 확인
        const cachedData = this.getFromCache(cacheKey, this.cache.ttl.sanctions);
        if (cachedData) {
            return cachedData;
        }
        
        try {
            const result = await this.request('/sanctions/stats');
            
            // 응답 유효성 검증
            if (!result || !result.data) {
                throw new Error('유효하지 않은 통계 응답 형식');
            }
            
            // 결과 캐싱
            this.saveToCache(cacheKey, result.data);
            
            return result.data;
        } catch (error) {
            console.error('통계 데이터 가져오기 오류:', error);
            
            // 전체 데이터에서 통계 계산
            try {
                const allData = await this.getAllSanctions();
                
                // 통계 계산
                const stats = this.calculateStats(allData);
                
                // 캐싱
                this.saveToCache(cacheKey, stats);
                
                return stats;
            } catch (statsError) {
                console.error('통계 계산 오류:', statsError);
                return null;
            }
        }
    },
    
    /**
     * 제재 데이터 통계 계산
     * @param {Array} data 제재 데이터
     * @returns {Object} 통계 정보
     */
    calculateStats(data) {
        // 총 개수
        const total = data.length;
        
        // 유형별 개수
        const typeCount = {};
        // 국가별 개수
        const countryCount = {};
        // 출처별 개수
        const sourceCount = {};
        // 연도별 개수
        const yearCount = {};
        
        data.forEach(item => {
            // 유형 집계
            const type = item.type || 'UNKNOWN';
            typeCount[type] = (typeCount[type] || 0) + 1;
            
            // 국가 집계
            const country = item.country || 'UNKNOWN';
            countryCount[country] = (countryCount[country] || 0) + 1;
            
            // 출처 집계
            const source = item.source || 'UNKNOWN';
            sourceCount[source] = (sourceCount[source] || 0) + 1;
            
            // 연도 집계
            if (item.date_listed) {
                const year = new Date(item.date_listed).getFullYear();
                if (!isNaN(year)) {
                    yearCount[year] = (yearCount[year] || 0) + 1;
                }
            }
        });
        
        return {
            total,
            byType: typeCount,
            byCountry: countryCount,
            bySource: sourceCount,
            byYear: yearCount,
            lastUpdated: new Date().toISOString()
        };
    }
};

// 전역 객체에 등록
window.ApiClient = ApiClient;

// 외부 모듈에서 사용할 수 있도록 export
export default ApiClient;