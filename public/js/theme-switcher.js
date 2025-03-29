/**
 * 테마 전환 기능
 * 여러 MZ 세대 디자인 트렌드 스타일 간 전환 기능 제공
 */

document.addEventListener('DOMContentLoaded', function() {
    // 테마 설정
    const themes = {
        'y2k': {
            name: 'Y2K 스타일',
            class: 'y2k-style',
            icon: 'fa-star'
        },
        'glassmorphism': {
            name: '글래스모피즘',
            class: 'glassmorphism',
            icon: 'fa-wine-glass'
        },
        'neumorphism': {
            name: '뉴모피즘',
            class: 'neumorphism',
            icon: 'fa-shapes'
        },
        'maximalist': {
            name: '맥시멀리즘',
            class: 'maximalist',
            icon: 'fa-palette'
        },
        'vibrant': {
            name: '생동감 있는 컬러',
            class: 'vibrant-colors',
            icon: 'fa-rainbow'
        }
    };

    // 테마 전환기 생성 및 추가
    function createThemeSwitcher() {
        // 이미 존재하는 경우 반환
        if (document.getElementById('theme-switcher')) {
            return;
        }

        // 테마 전환기 컨테이너 생성
        const themeContainer = document.createElement('div');
        themeContainer.id = 'theme-switcher';
        themeContainer.className = 'theme-switcher';

        // 테마 버튼 생성
        const themeButton = document.createElement('button');
        themeButton.className = 'theme-toggle-btn glass-button';
        themeButton.innerHTML = '<i class="fas fa-paint-brush"></i>';
        
        // 테마 메뉴 생성
        const themeMenu = document.createElement('div');
        themeMenu.className = 'theme-menu';
        themeMenu.style.display = 'none';

        // 각 테마에 대한 항목 생성
        Object.keys(themes).forEach(key => {
            const theme = themes[key];
            const themeItem = document.createElement('div');
            themeItem.className = 'theme-item';
            themeItem.innerHTML = `<i class="fas ${theme.icon}"></i> ${theme.name}`;
            themeItem.dataset.theme = key;
            themeMenu.appendChild(themeItem);
            
            // 테마 선택 이벤트 리스너
            themeItem.addEventListener('click', function() {
                applyTheme(key);
                themeMenu.style.display = 'none';
            });
        });

        // 테마 버튼 클릭 이벤트
        themeButton.addEventListener('click', function(e) {
            e.stopPropagation();
            themeMenu.style.display = themeMenu.style.display === 'none' ? 'block' : 'none';
        });

        // 바깥 영역 클릭 시 메뉴 닫기
        document.addEventListener('click', function() {
            themeMenu.style.display = 'none';
        });

        themeMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // 테마 전환기에 요소 추가 및 문서에 추가
        themeContainer.appendChild(themeButton);
        themeContainer.appendChild(themeMenu);
        document.body.appendChild(themeContainer);
    }

    // 테마 적용 함수
    function applyTheme(themeKey) {
        // 현재 테마 클래스 제거
        Object.values(themes).forEach(theme => {
            document.querySelectorAll(`.${theme.class}`).forEach(el => {
                el.classList.remove(theme.class);
            });
        });

        // 새 테마 클래스 추가
        const selectedTheme = themes[themeKey];
        if (selectedTheme) {
            // 주요 컨테이너에 테마 적용
            const mainContainers = [
                document.querySelector('.login-container'),
                document.querySelector('.search-section'),
                document.querySelector('.modal-content'),
                document.querySelector('.footer-container')
            ];

            mainContainers.forEach(container => {
                if (container) {
                    container.classList.add(selectedTheme.class);
                }
            });

            // 버튼에 적합한 테마 적용
            adjustButtonsForTheme(themeKey);

            // 테마 선택 저장
            localStorage.setItem('selectedTheme', themeKey);
        }
    }

    // 버튼 스타일 테마에 맞게 조정
    function adjustButtonsForTheme(themeKey) {
        const buttons = document.querySelectorAll('button:not(.theme-toggle-btn)');
        const anchors = document.querySelectorAll('a.glow');
        
        // 모든 버튼 클래스 초기화
        buttons.forEach(btn => {
            btn.classList.remove('glass-button', 'neumorphism-button');
        });
        
        anchors.forEach(a => {
            a.classList.remove('glass-button', 'neumorphism-button');
        });
        
        // 테마에 따른 버튼 스타일 적용
        if (themeKey === 'glassmorphism') {
            buttons.forEach(btn => btn.classList.add('glass-button'));
            anchors.forEach(a => a.classList.add('glass-button'));
        } else if (themeKey === 'neumorphism') {
            buttons.forEach(btn => btn.classList.add('neumorphism-button'));
            anchors.forEach(a => a.classList.add('neumorphism-button'));
        }
    }

    // 저장된 테마 불러오기
    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme && themes[savedTheme]) {
            applyTheme(savedTheme);
        }
    }

    // 테마 전환기 초기화
    createThemeSwitcher();
    loadSavedTheme();
}); 