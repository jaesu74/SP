/**
 * 테마 스위처 모듈
 * 다양한 테마 스타일을 적용하기 위한 기능
 */

// 사용 가능한 테마 정의
const THEMES = {
    DEFAULT: 'default',
    MAXIMALIST: 'maximalist',
    MINIMALIST: 'minimalist',
    Y2K: 'y2k',
    DARK: 'dark'
};

// 현재 활성화된 테마
let activeTheme = THEMES.MAXIMALIST;

/**
 * 테마 스위처 초기화
 */
function initThemeSwitcher() {
    // 저장된 테마 불러오기
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
        activeTheme = savedTheme;
    }
    
    // 초기 테마 적용
    applyTheme(activeTheme);
    
    // 테마 토글 버튼 이벤트 설정
    const themeToggleBtn = document.querySelector('.theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleThemeMenu);
    }
    
    // 테마 항목 이벤트 설정
    document.querySelectorAll('.theme-item').forEach(item => {
        item.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            if (theme) {
                applyTheme(theme);
                closeThemeMenu();
            }
        });
    });
    
    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.theme-switcher')) {
            closeThemeMenu();
        }
    });
}

/**
 * 테마 메뉴 토글
 */
function toggleThemeMenu() {
    const themeMenu = document.querySelector('.theme-menu');
    if (themeMenu) {
        themeMenu.classList.toggle('open');
    }
}

/**
 * 테마 메뉴 닫기
 */
function closeThemeMenu() {
    const themeMenu = document.querySelector('.theme-menu');
    if (themeMenu) {
        themeMenu.classList.remove('open');
    }
}

/**
 * 테마 적용
 * @param {string} theme 적용할 테마 이름
 */
function applyTheme(theme) {
    if (!Object.values(THEMES).includes(theme)) {
        console.error('유효하지 않은 테마:', theme);
        return;
    }
    
    // 이전 테마 클래스 제거
    Object.values(THEMES).forEach(themeName => {
        document.body.classList.remove(`theme-${themeName}`);
    });
    
    // 새 테마 클래스 추가
    document.body.classList.add(`theme-${theme}`);
    
    // 맥시멀리스트 테마인 경우 추가 처리
    if (theme === THEMES.MAXIMALIST) {
        applyMaximalistEffects();
    } else {
        removeMaximalistEffects();
    }
    
    // Y2K 테마인 경우 추가 처리
    if (theme === THEMES.Y2K) {
        applyY2KEffects();
    } else {
        removeY2KEffects();
    }
    
    // 다크 테마인 경우 추가 처리
    if (theme === THEMES.DARK) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    
    // 현재 테마 저장
    activeTheme = theme;
    localStorage.setItem('theme', theme);
    
    // 테마 메뉴 항목 활성화 표시 업데이트
    updateActiveThemeMenuItem(theme);
}

/**
 * 맥시멀리스트 테마 효과 적용
 */
function applyMaximalistEffects() {
    document.querySelectorAll('.login-container, .search-section, .result-card, .modal-content').forEach(element => {
        element.classList.add('maximalist');
    });
    
    document.querySelectorAll('body, #login-section, #main-section').forEach(element => {
        element.classList.add('textured-layer');
    });
}

/**
 * 맥시멀리스트 테마 효과 제거
 */
function removeMaximalistEffects() {
    document.querySelectorAll('.maximalist').forEach(element => {
        element.classList.remove('maximalist');
    });
    
    document.querySelectorAll('.textured-layer').forEach(element => {
        element.classList.remove('textured-layer');
    });
}

/**
 * Y2K 테마 효과 적용
 */
function applyY2KEffects() {
    document.querySelectorAll('.login-container, .search-section, .result-card, .modal-content').forEach(element => {
        element.classList.add('y2k-texture');
    });
    
    // Y2K 스타일 폰트 및 색상 적용
    document.documentElement.style.setProperty('--primary-color', '#ff00cc');
    document.documentElement.style.setProperty('--secondary-color', '#00ccff');
}

/**
 * Y2K 테마 효과 제거
 */
function removeY2KEffects() {
    document.querySelectorAll('.y2k-texture').forEach(element => {
        element.classList.remove('y2k-texture');
    });
    
    // 기본 색상으로 복원
    document.documentElement.style.removeProperty('--primary-color');
    document.documentElement.style.removeProperty('--secondary-color');
}

/**
 * 활성화된 테마 메뉴 항목 업데이트
 * @param {string} theme 현재 활성화된 테마
 */
function updateActiveThemeMenuItem(theme) {
    document.querySelectorAll('.theme-item').forEach(item => {
        const itemTheme = item.getAttribute('data-theme');
        if (itemTheme === theme) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// DOM이 로드된 후 테마 스위처 초기화
document.addEventListener('DOMContentLoaded', initThemeSwitcher);

// 모듈 내보내기
export { 
    THEMES, 
    applyTheme, 
    initThemeSwitcher 
}; 