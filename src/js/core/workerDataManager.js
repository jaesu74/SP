/**
 * workerDataManager.js
 * 웹 워커를 사용하여 대용량 데이터 처리를 최적화하는 모듈
 */

const WorkerDataManager = {
  // 데이터 상태
  state: {
    isLoading: false,
    error: null,
    currentResults: [],
    lastFetched: null,
    progressStatus: null
  },

  // 워커 참조
  worker: null,

  // 콜백 관리
  callbacks: {
    load: [],
    search: [],
    filter: [],
    details: [],
    error: []
  },

  /**
     * 데이터 관리자 초기화
     */
  init() {
    console.log('워커 데이터 관리자 초기화...');

    // 웹 워커 생성
    if (window.Worker) {
      try {
        this.worker = new Worker('js/workers/dataWorker.js');

        // 메시지 핸들러 설정
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = this.handleWorkerError.bind(this);

        console.log('데이터 워커 생성 완료');
      } catch (error) {
        console.error('데이터 워커 생성 실패:', error);
        this.state.error = '데이터 처리 엔진 초기화 실패';
      }
    } else {
      console.warn('웹 워커를 지원하지 않는 브라우저');
      this.state.error = '브라우저가 고급 데이터 처리를 지원하지 않습니다';
    }

    // 초기 상태 표시
    this.updateStatusDisplay();
  },

  /**
     * 워커 메시지 처리
     * @param {MessageEvent} e 메시지 이벤트
     */
  handleWorkerMessage(e) {
    const { type } = e.data;

    switch (type) {
      case 'load-complete':
        this.handleLoadComplete(e.data);
        break;

      case 'search-results':
        this.handleSearchResults(e.data);
        break;

      case 'filter-results':
        this.handleFilterResults(e.data);
        break;

      case 'details-result':
        this.handleDetailsResult(e.data);
        break;

      case 'error':
        this.handleError(e.data.error);
        break;

      case 'cache-cleared':
        console.log('워커 캐시 초기화 완료');
        break;

      default:
        console.warn('알 수 없는 워커 메시지 유형:', type);
    }
  },

  /**
     * 워커 오류 처리
     * @param {ErrorEvent} error 오류 이벤트
     */
  handleWorkerError(error) {
    console.error('워커 오류:', error);
    this.state.error = '데이터 처리 엔진 오류 발생';
    this.state.isLoading = false;

    // 오류 콜백 실행
    this.executeCallbacks('error', [error.message]);

    // 상태 표시 업데이트
    this.updateStatusDisplay();
  },

  /**
     * 데이터 로드 완료 처리
     * @param {Object} data 완료 데이터
     */
  handleLoadComplete(data) {
    console.log(`데이터 로드 완료: ${data.count}개 항목, 처리 시간: ${data.processTime.toFixed(2)}ms`);

    this.state.isLoading = false;
    this.state.lastFetched = new Date(data.timestamp);
    this.state.progressStatus = null;

    // 완료 콜백 실행
    this.executeCallbacks('load', [data.count]);

    // 상태 표시 업데이트
    this.updateStatusDisplay();
    this.updateLastUpdatedDisplay();
  },

  /**
     * 검색 결과 처리
     * @param {Object} data 검색 결과 데이터
     */
  handleSearchResults(data) {
    console.log(`검색 완료: "${data.query}" - ${data.count}개 결과, 처리 시간: ${data.processTime.toFixed(2)}ms`);

    this.state.isLoading = false;
    this.state.currentResults = data.results;
    this.state.progressStatus = null;

    // 결과 콜백 실행
    this.executeCallbacks('search', [data.results]);

    // 상태 표시 업데이트
    this.updateStatusDisplay();
    this.updateResultsCount(data.count);
  },

  /**
     * 필터 결과 처리
     * @param {Object} data 필터 결과 데이터
     */
  handleFilterResults(data) {
    console.log(`필터 적용 완료: ${data.count}개 결과, 처리 시간: ${data.processTime.toFixed(2)}ms`);

    this.state.isLoading = false;
    this.state.currentResults = data.results;
    this.state.progressStatus = null;

    // 결과 콜백 실행
    this.executeCallbacks('filter', [data.results]);

    // 상태 표시 업데이트
    this.updateStatusDisplay();
    this.updateResultsCount(data.count);
  },

  /**
     * 상세 정보 결과 처리
     * @param {Object} data 상세 정보 데이터
     */
  handleDetailsResult(data) {
    console.log(`상세 정보 조회 완료: ID ${data.id}`);

    // 결과 콜백 실행
    this.executeCallbacks('details', [data.item]);
  },

  /**
     * 오류 처리
     * @param {string} error 오류 메시지
     */
  handleError(error) {
    console.error('데이터 워커 오류:', error);

    this.state.error = error;
    this.state.isLoading = false;
    this.state.progressStatus = null;

    // 오류 콜백 실행
    this.executeCallbacks('error', [error]);

    // 상태 표시 업데이트
    this.updateStatusDisplay();
  },

  /**
     * 콜백 등록
     * @param {string} type 콜백 유형
     * @param {Function} callback 콜백 함수
     */
  on(type, callback) {
    if (typeof callback !== 'function') return;

    if (this.callbacks[type]) {
      this.callbacks[type].push(callback);
    }
  },

  /**
     * 콜백 제거
     * @param {string} type 콜백 유형
     * @param {Function} callback 제거할 콜백 함수
     */
  off(type, callback) {
    if (!this.callbacks[type]) return;

    const index = this.callbacks[type].indexOf(callback);
    if (index !== -1) {
      this.callbacks[type].splice(index, 1);
    }
  },

  /**
     * 콜백 실행
     * @param {string} type 콜백 유형
     * @param {Array} args 콜백 인수
     */
  executeCallbacks(type, args) {
    if (!this.callbacks[type]) return;

    this.callbacks[type].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`콜백 실행 오류 (${type}):`, error);
      }
    });
  },

  /**
     * 상태 표시 업데이트
     */
  updateStatusDisplay() {
    // 로딩 인디케이터 처리
    if (this.state.isLoading) {
      const message = this.state.progressStatus || '데이터 처리 중...';

      if (window.UIManager && typeof window.UIManager.showLoading === 'function') {
        window.UIManager.showLoading('results-container', message);
      }
    } else {
      if (window.UIManager && typeof window.UIManager.hideLoading === 'function') {
        window.UIManager.hideLoading('results-container');
      }
    }

    // 오류 메시지 처리
    if (this.state.error) {
      if (window.UIManager && typeof window.UIManager.showAlert === 'function') {
        window.UIManager.showAlert(this.state.error, 'error');
      }
      this.state.error = null;
    }
  },

  /**
     * 결과 개수 업데이트
     * @param {number} count 결과 개수
     */
  updateResultsCount(count) {
    const countElement = document.getElementById('results-count');
    if (countElement) {
      countElement.textContent = count;
    }
  },

  /**
     * 마지막 업데이트 시간 표시 업데이트
     */
  updateLastUpdatedDisplay() {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement && this.state.lastFetched) {
      const date = new Date(this.state.lastFetched);
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };

      lastUpdateElement.textContent = date.toLocaleString('ko-KR', options) + ' LT';
    }
  },

  /**
     * 진행 상태 업데이트
     * @param {string} status 상태 메시지
     */
  updateProgressStatus(status) {
    this.state.progressStatus = status;
    this.updateStatusDisplay();
  },

  /**
     * 제재 데이터 로드
     * @param {boolean} forceRefresh 강제 새로고침 여부
     * @returns {Promise} 로드 완료 프로미스
     */
  async loadSanctionsData(forceRefresh = false) {
    return new Promise(async (resolve, reject) => {
      if (!this.worker) {
        reject(new Error('데이터 워커가 초기화되지 않았습니다'));
        return;
      }

      if (this.state.isLoading) {
        reject(new Error('이미 데이터를 로드 중입니다'));
        return;
      }

      // 강제 새로고침이 아니고 데이터가 있으면 즉시 반환
      if (!forceRefresh && this.state.currentResults.length > 0) {
        resolve(this.state.currentResults);
        return;
      }

      // 로딩 상태 설정
      this.state.isLoading = true;
      this.updateStatusDisplay();

      // 완료 콜백 등록
      const loadCallback = (count) => {
        resolve(this.state.currentResults);
        this.off('load', loadCallback);
        this.off('error', errorCallback);
      };

      const errorCallback = (error) => {
        reject(new Error(error));
        this.off('load', loadCallback);
        this.off('error', errorCallback);
      };

      this.on('load', loadCallback);
      this.on('error', errorCallback);

      try {
        // Progressive Loading: 소스별로 데이터 로드
        this.updateProgressStatus('데이터 소스 로드 중...');

        // 데이터 소스
        const sources = [
          { name: 'un', url: 'data/un_sanctions.json' },
          { name: 'eu', url: 'data/eu_sanctions.json' },
          { name: 'us', url: 'data/us_sanctions.json' }
        ];

        let sanctionsData = [];
        const failedSources = [];

        // 각 소스에서 데이터 가져오기
        for (const source of sources) {
          try {
            this.updateProgressStatus(`${source.name.toUpperCase()} 제재 데이터 로드 중...`);

            const response = await fetch(source.url);
            if (response.ok) {
              const data = await response.json();
              if (data && Array.isArray(data.data)) {
                sanctionsData = [...sanctionsData, ...data.data];
                console.log(`${source.name.toUpperCase()} 제재 데이터 로드 완료: ${data.data.length}개 항목`);
              }
            } else {
              throw new Error(`응답 코드: ${response.status}`);
            }
          } catch (error) {
            console.warn(`${source.name.toUpperCase()} 제재 데이터 로드 실패:`, error);
            failedSources.push(source.name.toUpperCase());
          }
        }

        // 데이터가 없는 경우 통합 데이터로 폴백
        if (sanctionsData.length === 0) {
          this.updateProgressStatus('통합 제재 데이터 로드 중...');

          try {
            const response = await fetch('data/integrated_sanctions.json');
            if (response.ok) {
              const data = await response.json();
              if (data && Array.isArray(data.data)) {
                sanctionsData = data.data;
                console.log(`통합 제재 데이터 로드 완료: ${sanctionsData.length}개 항목`);
              }
            } else {
              throw new Error(`통합 데이터 응답 코드: ${response.status}`);
            }
          } catch (error) {
            console.error('통합 제재 데이터 로드 실패:', error);
            throw new Error('모든 데이터 소스 로드 실패');
          }
        }

        // 데이터 워커로 전송
        this.updateProgressStatus('데이터 처리 중...');
        this.worker.postMessage({
          type: 'load',
          data: sanctionsData
        });

        // 결과 표시
        if (failedSources.length > 0) {
          const message = `일부 소스(${failedSources.join(', ')})에서 데이터를 불러오지 못했습니다.`;
          if (window.UIManager && typeof window.UIManager.showAlert === 'function') {
            window.UIManager.showAlert(message, 'warning');
          }
        }

      } catch (error) {
        this.state.isLoading = false;
        this.state.error = error.message;
        this.updateStatusDisplay();

        this.off('load', loadCallback);
        this.off('error', errorCallback);

        reject(error);
      }
    });
  },

  /**
     * 제재 데이터 검색
     * @param {string} query 검색어
     * @param {Object} options 검색 옵션
     * @returns {Promise<Array>} 검색 결과 프로미스
     */
  async searchSanctions(query, options = {}) {
    return new Promise(async (resolve, reject) => {
      if (!this.worker) {
        reject(new Error('데이터 워커가 초기화되지 않았습니다'));
        return;
      }

      // 로딩 상태 설정
      this.state.isLoading = true;
      this.updateStatusDisplay();

      // 완료 콜백 등록
      const searchCallback = (results) => {
        resolve(results);
        this.off('search', searchCallback);
        this.off('error', errorCallback);
      };

      const errorCallback = (error) => {
        reject(new Error(error));
        this.off('search', searchCallback);
        this.off('error', errorCallback);
      };

      this.on('search', searchCallback);
      this.on('error', errorCallback);

      try {
        // 데이터가 없으면 먼저 로드
        if (this.state.currentResults.length === 0) {
          await this.loadSanctionsData();
        }

        // 검색 명령 전송
        this.updateProgressStatus('검색 중...');
        this.worker.postMessage({
          type: 'search',
          data: {
            query,
            options
          }
        });

      } catch (error) {
        this.state.isLoading = false;
        this.state.error = error.message;
        this.updateStatusDisplay();

        this.off('search', searchCallback);
        this.off('error', errorCallback);

        reject(error);
      }
    });
  },

  /**
     * 필터 적용
     * @param {Object} filters 필터 객체
     * @returns {Promise<Array>} 필터링된 결과 프로미스
     */
  async applyFilters(filters) {
    return new Promise(async (resolve, reject) => {
      if (!this.worker) {
        reject(new Error('데이터 워커가 초기화되지 않았습니다'));
        return;
      }

      // 로딩 상태 설정
      this.state.isLoading = true;
      this.updateStatusDisplay();

      // 완료 콜백 등록
      const filterCallback = (results) => {
        resolve(results);
        this.off('filter', filterCallback);
        this.off('error', errorCallback);
      };

      const errorCallback = (error) => {
        reject(new Error(error));
        this.off('filter', filterCallback);
        this.off('error', errorCallback);
      };

      this.on('filter', filterCallback);
      this.on('error', errorCallback);

      try {
        // 데이터가 없으면 먼저 로드
        if (this.state.currentResults.length === 0) {
          await this.loadSanctionsData();
        }

        // Set을 배열로 변환 (워커로 전송 가능하도록)
        const serializedFilters = {
          countries: filters.countries ? Array.from(filters.countries) : [],
          programs: filters.programs ? Array.from(filters.programs) : [],
          startDate: filters.startDate,
          endDate: filters.endDate
        };

        // 필터 명령 전송
        this.updateProgressStatus('필터 적용 중...');
        this.worker.postMessage({
          type: 'filter',
          data: {
            filters: serializedFilters
          }
        });

      } catch (error) {
        this.state.isLoading = false;
        this.state.error = error.message;
        this.updateStatusDisplay();

        this.off('filter', filterCallback);
        this.off('error', errorCallback);

        reject(error);
      }
    });
  },

  /**
     * 상세 정보 조회
     * @param {string} id 제재 ID
     * @returns {Promise<Object>} 상세 정보 프로미스
     */
  async getSanctionDetails(id) {
    return new Promise(async (resolve, reject) => {
      if (!this.worker) {
        reject(new Error('데이터 워커가 초기화되지 않았습니다'));
        return;
      }

      // 완료 콜백 등록
      const detailsCallback = (item) => {
        resolve(item);
        this.off('details', detailsCallback);
        this.off('error', errorCallback);
      };

      const errorCallback = (error) => {
        reject(new Error(error));
        this.off('details', detailsCallback);
        this.off('error', errorCallback);
      };

      this.on('details', detailsCallback);
      this.on('error', errorCallback);

      try {
        // 데이터가 없으면 먼저 로드
        if (this.state.currentResults.length === 0) {
          await this.loadSanctionsData();
        }

        // 상세 정보 명령 전송
        this.worker.postMessage({
          type: 'details',
          data: {
            id
          }
        });

      } catch (error) {
        this.off('details', detailsCallback);
        this.off('error', errorCallback);

        // API에서 상세 정보 조회 시도
        try {
          const response = await fetch(`https://api.wvl.co.kr/sanctions/details/${id}`);
          if (response.ok) {
            const data = await response.json();
            resolve(data.data || null);
          } else {
            reject(new Error('API에서 상세 정보를 찾을 수 없습니다'));
          }
        } catch (apiError) {
          reject(error);
        }
      }
    });
  },

  /**
     * 캐시 초기화
     */
  clearCache() {
    if (!this.worker) return;

    this.worker.postMessage({
      type: 'clear-cache'
    });

    this.state.currentResults = [];
    console.log('캐시 초기화 요청 전송');
  },

  /**
     * 현재 결과 데이터 반환
     * @returns {Array} 현재 결과 데이터
     */
  getCurrentResults() {
    return this.state.currentResults;
  }
};

// 전역 객체에 등록
window.WorkerDataManager = WorkerDataManager;

// 외부 모듈에서 사용할 수 있도록 export
export default WorkerDataManager;

/**
 * 웹 워커를 통해 작업을 처리하고 결과를 받아오는 함수
 * @param {string} action 수행할 동작 유형
 * @param {Object} data 전달할 데이터
 * @returns {Promise} 작업 완료 Promise
 */
function executeWorkerTask(action, data) {
  return new Promise((resolve, reject) => {
    try {
      const worker = getWorker();
      
      // 메시지 ID 생성
      const messageId = Date.now() + Math.random().toString(36).substr(2, 5);
      
      // 이 메시지에 대한 응답 핸들러 등록
      const responseHandler = function(e) {
        const response = e.data;
        
        // 해당 메시지에 대한 응답인지 확인
        if (response && response.messageId === messageId) {
          // 리스너 제거
          worker.removeEventListener('message', responseHandler);
          
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.result);
          }
        }
      };
      
      // 메시지 응답 리스너 등록
      worker.addEventListener('message', responseHandler);
      
      // 메시지 전송
      worker.postMessage({
        action,
        data,
        messageId
      });
      
      // 타임아웃 설정 (30초)
      setTimeout(() => {
        worker.removeEventListener('message', responseHandler);
        reject(new Error('작업 시간 초과'));
      }, 30000);
    } catch (error) {
      console.error('워커 작업 실행 오류:', error);
      reject(error);
    }
  });
}