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
  // 실험적 기능 제거 - 오류 방지
};

module.exports = nextConfig; 