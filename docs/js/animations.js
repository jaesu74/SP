/**
 * 애니메이션 효과
 * MZ 세대 트렌드에 맞춘 인터랙티브 애니메이션
 */

// 성능 설정
const PERFORMANCE_CONFIG = {
    useReducedMotion: false,
    animationQuality: 'high',
    enableParallax: true,
    enableTilt: true,
    enableFloating: true
};

document.addEventListener('DOMContentLoaded', function() {
    // URL 파라미터로 성능 모드 확인
    const urlParams = new URLSearchParams(window.location.search);
    const performanceMode = urlParams.get('performance');
    
    if (performanceMode === 'high') {
        // 고성능 모드 - 애니메이션 최소화
        PERFORMANCE_CONFIG.enableParallax = false;
        PERFORMANCE_CONFIG.enableTilt = false;
        PERFORMANCE_CONFIG.enableFloating = false;
        console.log('고성능 모드가 활성화되었습니다. 애니메이션이 최소화됩니다.');
    } else if (performanceMode === 'medium') {
        // 중간 성능 모드 - 일부 애니메이션만 활성화
        PERFORMANCE_CONFIG.enableParallax = false;
        PERFORMANCE_CONFIG.enableTilt = true;
        PERFORMANCE_CONFIG.enableFloating = false;
        console.log('중간 성능 모드가 활성화되었습니다.');
    } else if (performanceMode === 'low') {
        // 저성능 모드 - 모든 애니메이션 활성화
        PERFORMANCE_CONFIG.enableParallax = true;
        PERFORMANCE_CONFIG.enableTilt = true;
        PERFORMANCE_CONFIG.enableFloating = true;
        console.log('모든 애니메이션이 활성화되었습니다.');
    }

    // 성능 설정에 따라 애니메이션 초기화
    if (PERFORMANCE_CONFIG.enableParallax) {
        // 스크롤 애니메이션 요소 초기화
        initScrollAnimations();
        
        // 스크롤 트리거 애니메이션 적용
        initScrollTriggers();
    } else {
        // 스크롤 애니메이션이 비활성화된 경우 모든 요소 즉시 표시
        document.querySelectorAll('.animated').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.classList.add('animated-in');
        });
    }
    
    if (PERFORMANCE_CONFIG.enableTilt) {
        // 틸트 효과 초기화
        initTiltEffects();
    }
    
    // 결과 아이템 애니메이션 초기화 (항상 활성화)
    initResultsAnimations();
});

// 스크롤 애니메이션 초기화
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animated');
    
    // 초기 화면에 보이는 요소 애니메이션
    animateVisibleElements();
    
    // 스크롤 이벤트 핸들러
    window.addEventListener('scroll', throttle(animateVisibleElements, 100));
    
    // 현재 화면에 보이는 요소에 애니메이션 적용
    function animateVisibleElements() {
        animatedElements.forEach(element => {
            if (isElementInViewport(element) && !element.classList.contains('animated-in')) {
                element.classList.add('animated-in');
            }
        });
    }
}

// 틸트 효과 초기화
function initTiltEffects() {
    const tiltElements = document.querySelectorAll('.tilt-effect');
    
    tiltElements.forEach(element => {
        element.addEventListener('mousemove', handleTilt);
        element.addEventListener('mouseout', resetTilt);
    });
    
    function handleTilt(e) {
        const el = this;
        const height = el.clientHeight;
        const width = el.clientWidth;
        
        // 마우스 위치 계산
        const xVal = e.offsetX;
        const yVal = e.offsetY;
        
        // 틸트 계산 (최대 10도)
        const yRotation = 10 * ((xVal - width / 2) / width);
        const xRotation = -10 * ((yVal - height / 2) / height);
        
        // 변환 적용
        const transform = `perspective(500px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.02)`;
        
        el.style.transform = transform;
        el.style.transition = 'transform 0.2s';
    }
    
    function resetTilt() {
        this.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';
        this.style.transition = 'transform 0.5s';
    }
}

// 스크롤 트리거 애니메이션 초기화
function initScrollTriggers() {
    // 애니메이션 대상 요소
    const triggers = [
        { selector: '.slide-left', animation: 'translateX(-30px)', direction: 'horizontal' },
        { selector: '.slide-right', animation: 'translateX(30px)', direction: 'horizontal' },
        { selector: '.fade-up', animation: 'translateY(30px)', direction: 'vertical' },
        { selector: '.fade-down', animation: 'translateY(-30px)', direction: 'vertical' },
        { selector: '.scale-up', animation: 'scale(0.9)', direction: 'scale' },
        { selector: '.rotate-in', animation: 'rotate(-5deg)', direction: 'rotate' }
    ];
    
    // 각 트리거에 IntersectionObserver 적용
    triggers.forEach(trigger => {
        const elements = document.querySelectorAll(trigger.selector);
        
        if (elements.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.transform = 'none';
                    entry.target.style.opacity = '1';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        elements.forEach(el => {
            // 초기 스타일 설정
            el.style.opacity = '0';
            el.style.transform = trigger.animation;
            el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
            
            // 지연 추가
            if (el.dataset.delay) {
                el.style.transitionDelay = `${el.dataset.delay}s`;
            }
            
            observer.observe(el);
        });
    });
}

// 검색 결과 애니메이션 초기화
function initResultsAnimations() {
    const resultsContainer = document.getElementById('results-container');
    
    if (!resultsContainer) return;
    
    // 결과 추가 시 애니메이션 적용 (MutationObserver 사용)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // 요소 노드인 경우
                        animateResultItem(node);
                    }
                });
            }
        });
    });
    
    // 옵저버 설정
    observer.observe(resultsContainer, { childList: true });
    
    // 결과 아이템 애니메이션 적용
    function animateResultItem(item) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1.4)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 10);
    }
}

// 유틸리티 함수: 요소가 뷰포트에 있는지 확인
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 1.15 &&
        rect.bottom >= 0
    );
}

// 유틸리티 함수: 쓰로틀
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Y2K 효과 요소에 반짝임 효과 추가
function addSparkleEffect() {
    const y2kElements = document.querySelectorAll('.y2k-style');
    
    y2kElements.forEach(element => {
        // 이미 처리된 요소는 건너뛰기
        if (element.classList.contains('has-sparkle')) return;
        
        // 반짝임 효과 요소 생성
        const sparkleContainer = document.createElement('div');
        sparkleContainer.className = 'sparkle-container';
        
        // 여러 개의 반짝임 추가
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${Math.random() * 100}%`;
            sparkle.style.top = `${Math.random() * 100}%`;
            sparkle.style.animationDelay = `${Math.random() * 5}s`;
            sparkleContainer.appendChild(sparkle);
        }
        
        element.appendChild(sparkleContainer);
        element.classList.add('has-sparkle');
    });
}

// 모달 애니메이션
function setupModalAnimations() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const content = modal.querySelector('.modal-content');
        
        if (!content) return;
        
        // 모달이 열릴 때 애니메이션
        modal.addEventListener('modalopen', () => {
            content.style.animation = 'scaleUp 0.3s forwards';
        });
        
        // 모달이 닫힐 때 애니메이션
        modal.addEventListener('modalclose', () => {
            content.style.animation = 'scaleDown 0.3s forwards';
        });
    });
}

// 페이지 로드 완료 후 추가 애니메이션 초기화
window.addEventListener('load', () => {
    // Y2K 반짝임 효과 추가
    addSparkleEffect();
    
    // 모달 애니메이션 설정
    setupModalAnimations();
    
    // 애니메이션 클래스 추가
    document.body.classList.add('animations-ready');
});

/**
 * 세계 경제 제재 검색 서비스
 * 애니메이션 및 시각 효과 관련 스크립트
 */

// DOM이 로드된 후 애니메이션 초기화
document.addEventListener('DOMContentLoaded', initializeAnimations);

/**
 * 모든 애니메이션 초기화
 */
function initializeAnimations() {
    // 성능 설정에 따라 기능 선택적 활성화
    if (PERFORMANCE_CONFIG.enableParallax) {
        setupEntryAnimations();
        setupScrollAnimations();
    }
    
    if (PERFORMANCE_CONFIG.enableTilt) {
        setupHoverEffects();
    }
    
    if (PERFORMANCE_CONFIG.enableFloating) {
        setupFloatingElements();
    }
}

/**
 * 페이지 진입 애니메이션 설정
 */
function setupEntryAnimations() {
    // 애니메이션 요소 선택
    const animatedElements = document.querySelectorAll('.animated');
    
    // 지연 클래스 처리
    animatedElements.forEach(element => {
        const delay = element.classList.contains('delay-100') ? 100 :
                    element.classList.contains('delay-200') ? 200 :
                    element.classList.contains('delay-300') ? 300 :
                    element.classList.contains('delay-400') ? 400 : 0;
        
        // 지연 후 표시 애니메이션 적용
        setTimeout(() => {
            element.classList.add('show');
        }, delay);
    });
    
    // 특수 로고 애니메이션
    const logoElement = document.querySelector('.header-logo h1');
    if (logoElement) {
        setTimeout(() => {
            logoElement.classList.add('animated-text');
        }, 300);
    }
}

// 스크롤 이벤트 디바운싱을 위한 변수
let scrollTimeout;

/**
 * 스크롤 기반 애니메이션 설정
 */
function setupScrollAnimations() {
    // 스크롤 시 표시될 요소들
    const scrollAnimElements = document.querySelectorAll('.scroll-anim');
    
    if (scrollAnimElements.length === 0) return; // 요소가 없으면 리스너 추가하지 않음
    
    // 스크롤 이벤트 처리 - 디바운싱 적용
    function handleScroll() {
        // 이전 타임아웃 취소
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        // 16ms 후에 실행 (약 60fps)
        scrollTimeout = setTimeout(() => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            
            scrollAnimElements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top + scrollY;
                const elementVisible = 150; // 요소가 얼마나 보여야 애니메이션을 시작할지 설정
                
                if (scrollY + windowHeight > elementTop + elementVisible) {
                    element.classList.add('show');
                }
            });
        }, 16);
    }
    
    // 초기 로드 시 한 번 실행
    handleScroll();
    
    // 스크롤 이벤트 리스너 등록
    window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * 호버 효과 설정
 * 이벤트 위임을 사용하여 이벤트 리스너 수 최소화
 */
function setupHoverEffects() {
    // 결과 카드 컨테이너에 이벤트 위임
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
        resultsContainer.addEventListener('mouseenter', (e) => {
            // 결과 카드에만 적용
            if (e.target.classList.contains('result-card') || e.target.closest('.result-card')) {
                const card = e.target.classList.contains('result-card') ? 
                    e.target : e.target.closest('.result-card');
                addHoverEffect(card);
            }
        }, { passive: true });
        
        resultsContainer.addEventListener('mouseleave', (e) => {
            // 결과 카드에만 적용
            if (e.target.classList.contains('result-card') || e.target.closest('.result-card')) {
                const card = e.target.classList.contains('result-card') ? 
                    e.target : e.target.closest('.result-card');
                removeHoverEffect(card);
            }
        }, { passive: true });
    }
    
    // 버튼 컨테이너에 이벤트 위임 (모달 및 공통 컨테이너)
    const containers = [
        document.querySelector('.modal-content'),
        document.querySelector('.search-section'),
        document.querySelector('.login-container')
    ];
    
    containers.forEach(container => {
        if (!container) return;
        
        container.addEventListener('mouseenter', (e) => {
            const button = e.target.closest('.btn-primary, .btn-secondary');
            if (button) {
                addButtonHoverEffect(button, e);
            }
        }, { passive: true });
        
        container.addEventListener('mouseleave', (e) => {
            const button = e.target.closest('.btn-primary, .btn-secondary');
            if (button) {
                removeButtonHoverEffect(button);
            }
        }, { passive: true });
    });
}

/**
 * 호버 효과 추가
 * @param {HTMLElement} element 대상 요소
 */
function addHoverEffect(element) {
    // 이미 효과가 있으면 제거
    removeHoverEffect(element);
    
    // 그라데이션 효과 요소 생성
    const gradient = document.createElement('div');
    gradient.className = 'hover-gradient';
    gradient.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(0,200,255,0.1) 0%, rgba(0,0,0,0) 50%, rgba(255,0,150,0.1) 100%);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1;
    `;
    
    // 요소에 추가하고 애니메이션 적용
    element.appendChild(gradient);
    
    // 페이드 인 애니메이션
    setTimeout(() => {
        gradient.style.opacity = '1';
    }, 10);
}

/**
 * 호버 효과 제거
 * @param {HTMLElement} element 대상 요소
 */
function removeHoverEffect(element) {
    const gradient = element.querySelector('.hover-gradient');
    if (gradient) {
        gradient.style.opacity = '0';
        
        // 트랜지션 완료 후 요소 제거
        setTimeout(() => {
            if (gradient.parentNode === element) {
                element.removeChild(gradient);
            }
        }, 300);
    }
}

/**
 * 버튼 호버 효과 추가
 * @param {HTMLElement} button 버튼 요소
 * @param {Event} event 마우스 이벤트
 */
function addButtonHoverEffect(button, event) {
    // 이미 효과가 있으면 실행 안함
    if (button.querySelector('.button-bg-effect')) return;
    
    // 배경 효과 생성
    const bgEffect = document.createElement('div');
    bgEffect.className = 'button-bg-effect';
    
    // 마우스 위치 기준 효과 위치 계산
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    bgEffect.style.cssText = `
        position: absolute;
        top: ${y}px;
        left: ${x}px;
        width: 0;
        height: 0;
        background-color: rgba(255,255,255,0.2);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 0;
    `;
    
    button.appendChild(bgEffect);
    
    // 확장 애니메이션 적용
    requestAnimationFrame(() => {
        const maxSize = Math.max(rect.width, rect.height) * 2.5;
        bgEffect.style.width = `${maxSize}px`;
        bgEffect.style.height = `${maxSize}px`;
        bgEffect.style.transition = 'all 0.5s ease-out';
    });
}

/**
 * 버튼 호버 효과 제거
 * @param {HTMLElement} button 버튼 요소
 */
function removeButtonHoverEffect(button) {
    const bgEffect = button.querySelector('.button-bg-effect');
    if (bgEffect) {
        bgEffect.style.opacity = '0';
        
        // 트랜지션 완료 후 요소 제거
        setTimeout(() => {
            if (bgEffect.parentNode === button) {
                button.removeChild(bgEffect);
            }
        }, 500);
    }
}

// 마우스 움직임 이벤트 쓰로틀링을 위한 변수
let parallaxThrottleTimeout;
let lastParallaxExecTime = 0;

/**
 * 패럴랙스 효과 설정 (성능 최적화)
 */
function setupParallaxEffect() {
    const parallaxElements = document.querySelectorAll('.parallax');
    
    if (parallaxElements.length === 0) return; // 요소가 없으면 리스너 추가하지 않음
    
    // 마우스 움직임 이벤트 쓰로틀링
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        
        // 50ms마다 실행 (초당 최대 20회)
        if (now - lastParallaxExecTime >= 50) {
            lastParallaxExecTime = now;
            updateParallaxPositions(e, parallaxElements);
        } else {
            // 이전 타임아웃 취소
            if (parallaxThrottleTimeout) {
                clearTimeout(parallaxThrottleTimeout);
            }
            
            // 다음 실행 시간까지 대기
            parallaxThrottleTimeout = setTimeout(() => {
                lastParallaxExecTime = Date.now();
                updateParallaxPositions(e, parallaxElements);
            }, 50 - (now - lastParallaxExecTime));
        }
    }, { passive: true });
}

/**
 * 패럴랙스 요소 위치 업데이트
 */
function updateParallaxPositions(e, elements) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    elements.forEach(element => {
        const speed = element.getAttribute('data-speed') || 0.1;
        const x = (window.innerWidth / 2 - mouseX) * speed;
        const y = (window.innerHeight / 2 - mouseY) * speed;
        
        // GPU 가속을 위해 transform 사용
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
}

/**
 * 메인 페이지 플로팅 요소 설정
 */
function setupFloatingElements() {
    const floatingElements = document.querySelectorAll('.floating');
    
    // 요소가 없으면 리턴
    if (floatingElements.length === 0) return;
    
    floatingElements.forEach((element, index) => {
        // 각 요소마다 다른 애니메이션 적용
        const duration = 3 + (index % 3); // 3~5초 랜덤 기간
        const delay = index * 0.2; // 약간의 시차
        
        element.style.animation = `float ${duration}s ease-in-out ${delay}s infinite alternate`;
    });
}

/**
 * 이벤트 리스너 정리 함수
 * 페이지 언로드 시 호출하여 메모리 누수 방지
 */
function cleanupEventListeners() {
    // 불필요한 이벤트 리스너 제거
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('mousemove', updateParallaxPositions);
    
    // 타임아웃 정리
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    
    if (parallaxThrottleTimeout) {
        clearTimeout(parallaxThrottleTimeout);
    }
}

/**
 * 로딩 인디케이터 표시
 * @param {string} containerId 로딩 인디케이터를 표시할 컨테이너 ID
 * @param {string} message 표시할 메시지
 * @returns {HTMLElement} 생성된 로딩 인디케이터 요소
 */
function showLoadingIndicator(containerId, message = '로딩 중...') {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // 기존 로딩 인디케이터가 있으면 제거
    const existing = container.querySelector('.loading-indicator');
    if (existing) {
        container.removeChild(existing);
    }
    
    // 새 로딩 인디케이터 생성
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
        <div class="spinner"></div>
        <p class="loading-text">${message}</p>
    `;
    
    container.appendChild(indicator);
    
    // 인디케이터 표시 애니메이션
    requestAnimationFrame(() => {
        indicator.classList.add('show');
    });
    
    return indicator;
}

/**
 * 로딩 인디케이터 숨기기
 * @param {HTMLElement} indicator 숨길 로딩 인디케이터 요소
 */
function hideLoadingIndicator(indicator) {
    if (!indicator) return;
    
    // 페이드 아웃 애니메이션
    indicator.classList.remove('show');
    indicator.classList.add('hide');
    
    // 애니메이션 완료 후 제거
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 300);
}

/**
 * 페이지 전환 애니메이션
 * @param {HTMLElement} fromElement 전환 전 요소
 * @param {HTMLElement} toElement 전환 후 요소
 * @param {string} direction 전환 방향 ('left', 'right', 'up', 'down')
 */
function pageTransition(fromElement, toElement, direction = 'right') {
    // 기본 속성 설정
    fromElement.style.transition = 'all 0.5s ease-in-out';
    toElement.style.transition = 'all 0.5s ease-in-out';
    toElement.style.display = 'block';
    
    // 방향에 따른 시작 위치 설정
    let fromStart, fromEnd, toStart, toEnd;
    
    switch (direction) {
        case 'left':
            fromStart = 'translateX(0)';
            fromEnd = 'translateX(100%)';
            toStart = 'translateX(-100%)';
            toEnd = 'translateX(0)';
            break;
        case 'up':
            fromStart = 'translateY(0)';
            fromEnd = 'translateY(100%)';
            toStart = 'translateY(-100%)';
            toEnd = 'translateY(0)';
            break;
        case 'down':
            fromStart = 'translateY(0)';
            fromEnd = 'translateY(-100%)';
            toStart = 'translateY(100%)';
            toEnd = 'translateY(0)';
            break;
        case 'right':
        default:
            fromStart = 'translateX(0)';
            fromEnd = 'translateX(-100%)';
            toStart = 'translateX(100%)';
            toEnd = 'translateX(0)';
    }
    
    // 초기 상태 설정
    fromElement.style.transform = fromStart;
    fromElement.style.opacity = '1';
    toElement.style.transform = toStart;
    toElement.style.opacity = '0';
    
    // 애니메이션 시작
    requestAnimationFrame(() => {
        fromElement.style.transform = fromEnd;
        fromElement.style.opacity = '0';
        toElement.style.transform = toEnd;
        toElement.style.opacity = '1';
        
        // 애니메이션 완료 후 정리
        setTimeout(() => {
            fromElement.style.display = 'none';
            fromElement.style.transform = '';
            toElement.style.transform = '';
            fromElement.style.transition = '';
            toElement.style.transition = '';
        }, 500);
    });
}

// 페이지 언로드 시 이벤트 리스너 정리
window.addEventListener('beforeunload', cleanupEventListeners);

// 모듈 내보내기
export {
    initializeAnimations,
    initScrollAnimations,
    initTiltEffects,
    initScrollTriggers,
    initResultsAnimations,
    setupModalAnimations,
    setupEntryAnimations,
    setupScrollAnimations,
    setupParallaxEffect,
    setupFloatingElements,
    showLoadingIndicator,
    hideLoadingIndicator,
    addHoverEffect,
    removeHoverEffect,
    pageTransition,
    setupHoverEffects,
    PERFORMANCE_CONFIG
}; 