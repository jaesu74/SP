/**
 * auth.js
 * 사용자 인증 및 세션 관리 모듈
 */

const AuthManager = {
    // 현재 사용자 상태
    currentUser: null,
    
    // 사용자 목록 (로컬 개발용)
    users: [],
    
    /**
     * 인증 모듈 초기화
     */
    init() {
        console.log('인증 모듈 초기화...');
        this.loadUsers();
        this.checkSession();
    },
    
    /**
     * 로컬 스토리지에서 사용자 정보 로드
     */
    loadUsers() {
        try {
            this.users = JSON.parse(localStorage.getItem('users')) || [];
        } catch (e) {
            console.error('로컬 스토리지 데이터 파싱 오류:', e);
            this.users = [];
        }
    },
    
    /**
     * 세션 확인 및 UI 업데이트
     */
    checkSession() {
        const savedUser = this.getUserFromStorage();
        if (savedUser) {
            this.currentUser = savedUser;
            return true;
        }
        return false;
    },
    
    /**
     * 로컬 스토리지에서 사용자 정보 조회
     * @returns {Object|null} 저장된 사용자 정보 또는 null
     */
    getUserFromStorage() {
        try {
            const userJSON = localStorage.getItem('currentUser');
            return userJSON ? JSON.parse(userJSON) : null;
        } catch (e) {
            console.error('사용자 정보 파싱 오류:', e);
            return null;
        }
    },
    
    /**
     * 로그인 처리
     * @param {string} email 이메일
     * @param {string} password 비밀번호
     * @returns {Promise<Object>} 로그인 결과
     */
    async login(email, password) {
        // 실제 서비스에서는 API 호출로 대체
        try {
            // 개발 모드에서는 로컬 사용자 목록 확인
            if (this.users.length > 0) {
                const user = this.users.find(u => 
                    u.email.toLowerCase() === email.toLowerCase() && 
                    u.password === password
                );
                
                if (user) {
                    // 인증 성공
                    this.currentUser = {
                        email: user.email,
                        name: user.name,
                        timestamp: new Date().toISOString()
                    };
                    
                    // 로컬 스토리지에 저장
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    
                    return {
                        success: true,
                        user: this.currentUser
                    };
                }
            }
            
            // 테스트 계정 확인
            if (email.toLowerCase() === 'jaesu@kakao.com' && password === '1234') {
                this.currentUser = {
                    email: 'jaesu@kakao.com',
                    name: '재수',
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                return {
                    success: true,
                    user: this.currentUser
                };
            }
            
            return {
                success: false,
                error: '이메일 또는 비밀번호가 올바르지 않습니다.'
            };
        } catch (e) {
            console.error('로그인 처리 오류:', e);
            return {
                success: false,
                error: '로그인 처리 중 오류가 발생했습니다.'
            };
        }
    },
    
    /**
     * 회원가입 처리
     * @param {Object} userData 사용자 데이터
     * @returns {Promise<Object>} 가입 결과
     */
    async register(userData) {
        try {
            // 이메일 중복 확인
            const existingUser = this.users.find(u => 
                u.email.toLowerCase() === userData.email.toLowerCase()
            );
            
            if (existingUser) {
                return {
                    success: false,
                    error: '이미 등록된 이메일입니다.'
                };
            }
            
            // 새 사용자 추가
            const newUser = {
                ...userData,
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                created: new Date().toISOString()
            };
            
            this.users.push(newUser);
            
            // 로컬 스토리지에 저장
            localStorage.setItem('users', JSON.stringify(this.users));
            
            return {
                success: true,
                user: {
                    email: newUser.email,
                    name: newUser.name
                }
            };
        } catch (e) {
            console.error('회원가입 처리 오류:', e);
            return {
                success: false,
                error: '회원가입 처리 중 오류가 발생했습니다.'
            };
        }
    },
    
    /**
     * 로그아웃 처리
     * @returns {boolean} 성공 여부
     */
    logout() {
        try {
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            return true;
        } catch (e) {
            console.error('로그아웃 처리 오류:', e);
            return false;
        }
    },
    
    /**
     * 현재 인증 상태 확인
     * @returns {boolean} 인증 여부
     */
    isAuthenticated() {
        return !!this.currentUser;
    },
    
    /**
     * 현재 사용자 정보 반환
     * @returns {Object|null} 현재 사용자 정보
     */
    getCurrentUser() {
        return this.currentUser;
    }
};

// 전역 객체에 등록
window.AuthManager = AuthManager;

// 외부 모듈에서 사용할 수 있도록 export
export default AuthManager;