/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // GitHub Pages 배포를 위한 설정
  basePath: process.env.NODE_ENV === 'production' ? '/SP' : '',
  images: {
    unoptimized: true,
  },
  // 환경 변수 설정
  env: {
    APP_NAME: '제재 정보 검색 시스템',
    APP_VERSION: '1.0.0',
  },
  // API 경로
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 