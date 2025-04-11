/**
 * fetchWithRetry.js
 * 재시도 로직과 오류 처리가 강화된 fetch API 래퍼
 */

/**
 * 재시도 로직이 포함된 fetch 함수
 * @param {string} url 요청 URL
 * @param {Object} options fetch 옵션
 * @param {number} retries 재시도 횟수 (기본값: 3)
 * @param {number} retryDelay 재시도 지연 시간(ms) (기본값: 1000)
 * @param {number} timeout 요청 타임아웃(ms) (기본값: 10000)
 * @returns {Promise<Response>} fetch 응답 객체
 */
async function fetchWithRetry(url, options = {}, retries = 3, retryDelay = 1000, timeout = 10000) {
    // 타임아웃 컨트롤러
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // 기존 신호와 새 신호 병합
    const signal = options.signal
        ? combinedSignal(options.signal, controller.signal)
        : controller.signal;
    
    // 옵션에 신호 추가
    const fetchOptions = {
        ...options,
        signal
    };
    
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            
            // 4xx 오류는 재시도하지 않음 (클라이언트 오류)
            if (response.status >= 400 && response.status < 500) {
                if (response.status === 429) {
                    // 429 Too Many Requests - 지수 백오프로 재시도
                    const retryAfter = response.headers.get('Retry-After');
                    const delayMs = retryAfter 
                        ? parseInt(retryAfter, 10) * 1000
                        : retryDelay * Math.pow(2, attempt);
                    
                    console.warn(`Rate limit exceeded, retrying after ${delayMs}ms`);
                    await sleep(delayMs);
                    continue;
                }
                
                return response;
            }
            
            // 5xx 오류는 재시도 (서버 오류)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;
            
            // AbortError는 재시도하지 않음
            if (error.name === 'AbortError') {
                throw new Error(`요청 시간 초과 (${timeout}ms)`);
            }
            
            // 네트워크 오류는 재시도
            if (attempt < retries) {
                console.warn(`Fetch 실패 (${attempt + 1}/${retries + 1}): ${error.message}. ${retryDelay}ms 후 재시도...`);
                await sleep(retryDelay);
                
                // 지수 백오프 적용 (다음 시도는 2배 긴 대기)
                retryDelay *= 2;
            }
        }
    }
    
    // 모든 재시도 실패
    throw lastError || new Error('최대 재시도 횟수 초과');
}

/**
 * 지정된 시간만큼 대기
 * @param {number} ms 대기 시간 (밀리초)
 * @returns {Promise<void>} 대기 프로미스
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 두 AbortSignal을 결합
 * @param {AbortSignal} signal1 첫 번째 신호
 * @param {AbortSignal} signal2 두 번째 신호
 * @returns {AbortSignal} 결합된 신호
 */
function combinedSignal(signal1, signal2) {
    const controller = new AbortController();
    
    // 어느 하나라도 취소되면 결합된 컨트롤러도 취소
    if (signal1.aborted || signal2.aborted) {
        controller.abort();
    }
    
    // 이벤트 리스너
    const abortHandler = () => controller.abort();
    
    signal1.addEventListener('abort', abortHandler);
    signal2.addEventListener('abort', abortHandler);
    
    return controller.signal;
}

/**
 * JSON 응답 파싱 및 오류 처리가 포함된 fetch
 * @param {string} url 요청 URL
 * @param {Object} options fetch 옵션
 * @param {number} retries 재시도 횟수
 * @param {number} retryDelay 재시도 지연 시간(ms)
 * @param {number} timeout 요청 타임아웃(ms)
 * @returns {Promise<Object>} 파싱된 JSON 응답
 */
async function fetchJSON(url, options = {}, retries = 3, retryDelay = 1000, timeout = 10000) {
    const response = await fetchWithRetry(url, options, retries, retryDelay, timeout);
    
    try {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } else {
            // JSON이 아닌 응답
            const text = await response.text();
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, body: ${text.substring(0, 100)}`);
            }
            
            // 텍스트가 JSON인지 확인 시도
            try {
                return JSON.parse(text);
            } catch (e) {
                console.warn('응답이 JSON 형식이 아닙니다:', text.substring(0, 100));
                throw new Error('잘못된 응답 형식 (JSON이 필요함)');
            }
        }
    } catch (error) {
        // 응답 본문 파싱 오류
        console.error('응답 파싱 오류:', error);
        
        // 원래 응답 본문 추가
        error.responseStatus = response.status;
        error.responseStatusText = response.statusText;
        
        throw error;
    }
}

/**
 * 캐시 지원 및 백그라운드 새로고침이 포함된 fetch
 * @param {string} url 요청 URL
 * @param {Object} options fetch 옵션
 * @param {number} cacheTTL 캐시 TTL(ms)
 * @returns {Promise<Object>} 응답 데이터
 */
async function fetchWithCache(url, options = {}, cacheTTL = 60 * 60 * 1000) {
    const cacheKey = `fetch_cache:${url}`;
    
    try {
        // 캐시 확인
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            // 캐시가 만료되었는지 확인
            const now = Date.now();
            const timestamp = cachedData.timestamp || 0;
            
            if (now - timestamp < cacheTTL) {
                // 캐시가 유효하면 반환
                return cachedData.data;
            }
            
            // 캐시가 만료된 경우 백그라운드에서 새로고침
            refreshCacheInBackground(url, options, cacheKey);
            
            // 만료된 캐시 반환
            return cachedData.data;
        }
    } catch (e) {
        console.warn('캐시 읽기 오류:', e);
    }
    
    // 캐시가 없거나 오류 발생 시 직접 가져오기
    return fetchAndCache(url, options, cacheKey);
}

/**
 * 데이터 가져오기 및 캐싱
 * @param {string} url 요청 URL
 * @param {Object} options fetch 옵션
 * @param {string} cacheKey 캐시 키
 * @returns {Promise<Object>} 응답 데이터
 */
async function fetchAndCache(url, options, cacheKey) {
    const data = await fetchJSON(url, options);
    
    try {
        // 데이터 캐싱
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data
        }));
    } catch (e) {
        console.warn('캐시 저장 오류:', e);
    }
    
    return data;
}

/**
 * 캐시된 데이터 가져오기
 * @param {string} key 캐시 키
 * @returns {Object|null} 캐시된 데이터 또는 null
 */
function getCachedData(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        return JSON.parse(cached);
    } catch (e) {
        console.warn('캐시 파싱 오류:', e);
        return null;
    }
}

/**
 * 백그라운드에서 캐시 새로고침
 * @param {string} url 요청 URL
 * @param {Object} options fetch 옵션
 * @param {string} cacheKey 캐시 키
 */
function refreshCacheInBackground(url, options, cacheKey) {
    setTimeout(async () => {
        try {
            await fetchAndCache(url, options, cacheKey);
            console.log(`백그라운드 캐시 새로고침 완료: ${url}`);
        } catch (e) {
            console.warn(`백그라운드 캐시 새로고침 실패: ${url}`, e);
        }
    }, 0);
}

// 모듈 내보내기
export {
    fetchWithRetry,
    fetchJSON,
    fetchWithCache
};