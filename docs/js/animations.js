/**
 * 애니메이션 효과
 * MZ 세대 트렌드에 맞춘 인터랙티브 애니메이션
 */

document.addEventListener('DOMContentLoaded', function() {
    // 스크롤 애니메이션 요소 초기화
    initScrollAnimations();
    
    // 틸트 효과 초기화
    initTiltEffects();
    
    // 스크롤 트리거 애니메이션 적용
    initScrollTriggers();
    
    // 결과 아이템 애니메이션 초기화
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