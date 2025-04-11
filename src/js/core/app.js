/**
 * app.js
 * 핵심 앱 모듈 - 애플리케이션 초기화 및 코어 모듈 통합
 */

// 코어 모듈 가져오기
import AuthManager from './auth.js';
import UIManager from './ui.js';
import DataManager from './dataManager.js';
import FilterManager from './filter.js';
import EventManager from './eventHandlers.js';

/**
 * 애플리케이션 코어 객체
 */
const App = {
    // 앱 상태
    state: {
        initialized: false,
        version: '1.2.0',
        environment: process.env.NODE_ENV || 'development',
    },
    
    // 모듈 참조
    modules: {
        auth: AuthManager,
        ui: UIManager,
        data: DataManager,
        filter: FilterManager,
        event: EventManager
    },
    
    /**
     * 앱 초기화
     */
    init() {
        if (this.state.initialized) return;
        
        console.log(`세계 경제 제재 검색 서비스 v${this.state.version} 초기화...`);
        
        // 모듈 초기화
        this.initializeModules();
        
        // 세션 확인 및 UI 업데이트
        this.checkSession();
        
        this.state.initialized = true;
        console.log('앱 초기화 완료');
        
        // 접근성 개선: 앱 로드 완료 알림
        document.dispatchEvent(new CustomEvent('app:ready'));
    },
    
    /**
     * 모듈 초기화
     */
    initializeModules() {
        // 초기화 순서 중요: UI -> Auth -> Data -> Filter -> Event
        
        // UI 모듈 초기화
        if (this.modules.ui) {
            this.modules.ui.init();
        }
        
        // 인증 모듈 초기화
        if (this.modules.auth) {
            this.modules.auth.init();
        }
        
        // 데이터 모듈 초기화
        if (this.modules.data) {
            this.modules.data.init();
        }
        
        // 필터 모듈 초기화
        if (this.modules.filter) {
            this.modules.filter.init();
        }
        
        // 이벤트 모듈 초기화
        if (this.modules.event) {
            this.modules.event.init();
        }
    },
    
    /**
     * 세션 확인
     */
    checkSession() {
        // 인증 모듈이 없으면 항상 로그인 화면 표시
        if (!this.modules.auth) {
            if (this.modules.ui) {
                this.modules.ui.showLoginSection();
            }
            return;
        }
        
        // 세션 확인
        const isAuthenticated = this.modules.auth.checkSession();
        
        if (isAuthenticated) {
            // 인증된 경우 메인 화면 표시
            const user = this.modules.auth.getCurrentUser();
            if (this.modules.ui) {
                this.modules.ui.showMainSection(user.email);
            }
            
            // 초기 데이터 로드
            this.loadInitialData();
        } else {
            // 인증되지 않은 경우 로그인 화면 표시
            if (this.modules.ui) {
                this.modules.ui.showLoginSection();
            }
        }
    },
    
    /**
     * 초기 데이터 로드
     */
    async loadInitialData() {
        try {
            if (this.modules.data) {
                // 데이터 로드
                const data = await this.modules.data.fetchSanctionsData();
                
                // 결과 표시 (이벤트 모듈 사용)
                if (this.modules.event) {
                    this.modules.event.displayResults(data);
                }
            }
        } catch (error) {
            console.error('초기 데이터 로드 오류:', error);
            if (this.modules.ui) {
                this.modules.ui.showAlert('데이터 로드 중 오류가 발생했습니다.', 'error');
            }
        }
    }
};

// 전역 객체에 등록
window.app = App;

// DOM이 로드된 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 외부 모듈에서 사용할 수 있도록 export
export default App;