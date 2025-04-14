/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  // GitHub Pages 배포를 위한 설정
  // 커스텀 도메인 사용 시에는 basePath가 필요 없음
  basePath: process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAIN === 'true' ? '' : '/SP',
  images: {
    unoptimized: true,
  },
  // 환경 변수 설정
  env: {
    APP_NAME: '제재 정보 검색 시스템',
    APP_VERSION: '1.0.0',
  },
  // 에셋 경로 접두사 설정
  assetPrefix: process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAIN === 'true' ? '' : '/SP',
};

module.exports = nextConfig; 