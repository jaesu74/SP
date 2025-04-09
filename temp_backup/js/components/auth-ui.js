/**
 * auth-ui.js - 인증 관련 UI 컴포넌트
 */

import { showAlert } from '../utils/common.js';
import { login, register, logout } from '../services/auth.js';

/**
 * 인증 UI 컴포넌트 초기화
 */
export function initAuthUI() {
    setupLoginForm();
    setupRegisterForm();
    setupLogoutButton();
    setupAuthLinks();
}

/**
 * 로그인 폼 설정
 */
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
        
        // 비밀번호 표시 토글 설정
        const togglePassword = loginForm.querySelector('.toggle-password');
        const passwordInput = loginForm.querySelector('#password');
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.classList.toggle('fa-eye');
                togglePassword.classList.toggle('fa-eye-slash');
            });
        }
    }
}

/**
 * 회원가입 폼 설정
 */
function setupRegisterForm() {
    // 회원가입 폼은 처음에는 숨겨져 있기 때문에 동적으로 생성함
    const registerContainer = document.createElement('div');
    registerContainer.id = 'register-container';
    registerContainer.className = 'register-container maximalist animated';
    registerContainer.style.display = 'none';
    
    registerContainer.innerHTML = `
        <div class="register-header">
            <h2>회원가입</h2>
            <p>제재 검색 서비스 이용을 위해 가입해주세요</p>
        </div>
        <div class="register-body">
            <div class="alert-container"></div>
            <form id="register-form">
                <div class="form-group">
                    <label for="register-name">이름</label>
                    <input type="text" id="register-name" placeholder="이름을 입력하세요" required>
                </div>
                <div class="form-group">
                    <label for="register-email">이메일</label>
                    <input type="email" id="register-email" placeholder="이메일을 입력하세요" required>
                </div>
                <div class="form-group">
                    <label for="register-password">비밀번호</label>
                    <input type="password" id="register-password" placeholder="비밀번호를 입력하세요" required>
                    <i class="fas fa-eye toggle-password"></i>
                </div>
                <div class="form-group">
                    <label for="register-password-confirm">비밀번호 확인</label>
                    <input type="password" id="register-password-confirm" placeholder="비밀번호를 다시 입력하세요" required>
                </div>
                <button type="submit" class="btn-primary">가입하기</button>
                <button type="button" id="back-to-login" class="btn-secondary">로그인으로 돌아가기</button>
            </form>
        </div>
    `;
    
    // 로그인 섹션에 회원가입 컨테이너 추가
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
        loginSection.appendChild(registerContainer);
        
        // 회원가입 폼 이벤트 처리
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegisterSubmit);
            
            // 비밀번호 표시 토글 설정
            const togglePassword = registerForm.querySelector('.toggle-password');
            const passwordInput = registerForm.querySelector('#register-password');
            
            if (togglePassword && passwordInput) {
                togglePassword.addEventListener('click', () => {
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    togglePassword.classList.toggle('fa-eye');
                    togglePassword.classList.toggle('fa-eye-slash');
                });
            }
            
            // 로그인으로 돌아가기 버튼
            const backToLoginButton = document.getElementById('back-to-login');
            if (backToLoginButton) {
                backToLoginButton.addEventListener('click', () => {
                    showLoginForm();
                });
            }
        }
    }
}

/**
 * 로그아웃 버튼 설정
 */
function setupLogoutButton() {
    const logoutButton = document.getElementById('logout-btn');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const result = logout();
            
            if (result.success) {
                // 로그인 페이지로 이동
                const loginSection = document.getElementById('login-section');
                const mainSection = document.getElementById('main-section');
                
                if (loginSection) loginSection.style.display = 'block';
                if (mainSection) mainSection.style.display = 'none';
                
                adjustFooterForLoginSection();
                
                showAlert(result.message, 'success');
            } else {
                showAlert('로그아웃 중 오류가 발생했습니다.', 'error');
            }
        });
    }
}

/**
 * 인증 관련 링크 설정
 */
function setupAuthLinks() {
    // 회원가입 링크
    const registerLink = document.getElementById('register-link');
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }
    
    // 도움말 링크
    const helpLink = document.getElementById('help-link');
    if (helpLink) {
        helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            showAlert('도움말 기능은 현재 준비 중입니다.', 'info');
        });
    }
    
    // 회사소개 링크
    const aboutLink = document.getElementById('about-link');
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            showAlert('회사소개 페이지는 현재 준비 중입니다.', 'info');
        });
    }
}

/**
 * 로그인 폼 표시
 */
function showLoginForm() {
    const loginContainer = document.querySelector('.login-container');
    const registerContainer = document.getElementById('register-container');
    
    if (loginContainer && registerContainer) {
        // 애니메이션 효과
        loginContainer.style.opacity = '0';
        registerContainer.style.display = 'none';
        
        setTimeout(() => {
            loginContainer.style.display = 'block';
            setTimeout(() => {
                loginContainer.style.opacity = '1';
            }, 50);
        }, 300);
    }
}

/**
 * 회원가입 폼 표시
 */
function showRegisterForm() {
    const loginContainer = document.querySelector('.login-container');
    const registerContainer = document.getElementById('register-container');
    
    if (loginContainer && registerContainer) {
        // 애니메이션 효과
        loginContainer.style.opacity = '0';
        
        setTimeout(() => {
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
            registerContainer.style.opacity = '0';
            
            setTimeout(() => {
                registerContainer.style.opacity = '1';
            }, 50);
        }, 300);
    }
}

/**
 * 로그인 제출 처리
 * @param {Event} e 이벤트 객체
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        showAlert('로그인 폼 요소를 찾을 수 없습니다.', 'error');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showAlert('이메일과 비밀번호를 입력해주세요.', 'warning');
        return;
    }
    
    try {
        // 로그인 진행 중 메시지
        showAlert('로그인 처리 중...', 'info', { isStatic: true });
        
        const result = await login(email, password);
        
        // 메시지 제거
        document.querySelector('.alert-container').innerHTML = '';
        
        if (result.success) {
            // 성공 메시지
            showAlert(result.message, 'success');
            
            // 메인 섹션 표시
            showMainSection(result.user);
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('로그인 처리 중 오류가 발생했습니다.', 'error');
        console.error('로그인 오류:', error);
    }
}

/**
 * 회원가입 제출 처리
 * @param {Event} e 이벤트 객체
 */
async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const confirmInput = document.getElementById('register-password-confirm');
    
    if (!nameInput || !emailInput || !passwordInput || !confirmInput) {
        showAlert('회원가입 폼 요소를 찾을 수 없습니다.', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    
    // 기본 검증
    if (!name || !email || !password) {
        showAlert('모든 필드를 입력해주세요.', 'warning');
        return;
    }
    
    // 이메일 형식 검증
    if (!email.includes('@') || !email.includes('.')) {
        showAlert('올바른 이메일 형식을 입력해주세요.', 'warning');
        return;
    }
    
    // 비밀번호 일치 검증
    if (password !== confirm) {
        showAlert('비밀번호가 일치하지 않습니다.', 'warning');
        return;
    }
    
    try {
        // 회원가입 진행 중 메시지
        showAlert('회원가입 처리 중...', 'info', { isStatic: true });
        
        const result = await register({
            name,
            email,
            password
        });
        
        // 메시지 제거
        document.querySelector('.alert-container').innerHTML = '';
        
        if (result.success) {
            // 성공 메시지
            showAlert(result.message, 'success');
            
            // 로그인 폼으로 이동
            showLoginForm();
            
            // 이메일 필드에 자동 입력
            const loginEmailInput = document.getElementById('email');
            if (loginEmailInput) {
                loginEmailInput.value = email;
            }
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('회원가입 처리 중 오류가 발생했습니다.', 'error');
        console.error('회원가입 오류:', error);
    }
}

/**
 * 메인 섹션 표시
 * @param {Object} user 사용자 정보
 */
export function showMainSection(user) {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    const userNameElement = document.getElementById('user-name');
    
    // 사용자 정보 표시
    if (userNameElement && user) {
        userNameElement.textContent = user.name || user.email;
    }
    
    // 섹션 전환
    if (loginSection) loginSection.style.display = 'none';
    if (mainSection) mainSection.style.display = 'block';
}

/**
 * 로그인 섹션에 맞춰 푸터 조정
 */
export function adjustFooterForLoginSection() {
    const footer = document.querySelector('footer');
    if (footer) {
        footer.classList.add('login-footer');
    }
} 