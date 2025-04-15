/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 사전 렌더링 최적화
  images: {
    domains: ['www.un.org', 'europa.eu', 'home.treasury.gov'],
  },
  // 출력 압축
  compress: true,
  
  // 프로덕션 URL 설정
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://sp.wvl.co.kr' : '',
  
  // 환경 변수
  env: {
    SITE_URL: 'https://sp.wvl.co.kr',
  },
  
  // 리다이렉션 설정 - 로컬에서 접속 시 wvl.co.kr로 리다이렉트
  async redirects() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/',
          destination: 'https://wvl.co.kr',
          permanent: true,
        },
      ];
    }
    return [];
  },
  
  // 출력 모드
  output: 'export',
  
  // 실험적 기능 제거 - 오류 방지
};

module.exports = nextConfig; 