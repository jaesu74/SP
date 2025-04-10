/**
 * scroll.js
 * 스크롤 관련 애니메이션 및 효과 처리
 */

// 스크롤 애니메이션 모듈
const ScrollAnimations = {
    // 설정
    config: {
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px',
        animationClasses: [
            'slide-left',
            'slide-right',
            'fade-up',
            'fade-down',
            'scale-up',
            'rotate-in'
        ],
        enableParallax: true
    },
    
    // 초기화
    init(options = {}) {
        // 옵션으로 설정 업데이트
        this.config = { ...this.config, ...options };
        
        // 스크롤 애니메이션 요소 초기화
        this.initScrollAnimations();
        
        // 스크롤 트리거 애니메이션 적용
        this.initScrollTriggers();
        
        // IntersectionObserver를 지원하지 않는 브라우저를 위한 대체 방법
        this.setupFallbackAnimation();
        
        console.log('스크롤 애니메이션 모듈 초기화 완료');
        
        return this;
    },
    
    // 스크롤 애니메이션 초기화
    initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.animated');
        
        if (animatedElements.length === 0) return;
        
        // 초기 화면에 보이는 요소 애니메이션
        this.animateVisibleElements();
        
        // 스크롤 이벤트 핸들러
        window.addEventListener('scroll', this.throttle(this.animateVisibleElements.bind(this), 100));
    },
    
    // 현재 화면에 보이는 요소에 애니메이션 적용
    animateVisibleElements() {
        const animatedElements = document.querySelectorAll('.animated:not(.animated-in)');
        
        animatedElements.forEach(element => {
            if (this.isElementInViewport(element)) {
                element.classList.add('animated-in');
            }
        });
    },
    
    // 스크롤 트리거 애니메이션 초기화
    initScrollTriggers() {
        // IntersectionObserver 지원 확인
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver가 지원되지 않는 브라우저입니다. 대체 애니메이션을 사용합니다.');
            return;
        }
        
        // 애니메이션 트리거 매핑
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
            }, { 
                threshold: this.config.threshold,
                rootMargin: this.config.rootMargin
            });
            
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
    },
    
    // 스크롤 이벤트 대체 방식 설정
    setupFallbackAnimation() {
        // IntersectionObserver가 없는 경우 스크롤 이벤트 기반 대체
        if (!('IntersectionObserver' in window)) {
            this.config.animationClasses.forEach(className => {
                const elements = document.querySelectorAll(`.${className}`);
                
                elements.forEach(el => {
                    el.style.opacity = '0';
                    el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
                });
            });
            
            // 스크롤 이벤트 핸들러 추가
            window.addEventListener('scroll', this.handleScrollFallback.bind(this));
            // 초기 실행
            this.handleScrollFallback();
        }
    },
    
    // 스크롤 대체 핸들러
    handleScrollFallback() {
        this.config.animationClasses.forEach(className => {
            const elements = document.querySelectorAll(`.${className}`);
            
            elements.forEach(el => {
                if (this.isElementInViewport(el)) {
                    setTimeout(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'none';
                    }, el.dataset.delay ? parseFloat(el.dataset.delay) * 1000 : 0);
                }
            });
        });
    },
    
    // 유틸리티: 요소가 뷰포트에 있는지 확인
    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) && 
            rect.bottom >= 0 &&
            rect.left <= (window.innerWidth || document.documentElement.clientWidth) && 
            rect.right >= 0
        );
    },
    
    // 유틸리티: 쓰로틀 (성능 최적화)
    throttle(func, limit) {
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
};

// 브라우저 환경에서 전역 객체에 노출
if (typeof window !== 'undefined') {
    window.ScrollAnimations = ScrollAnimations;
} 