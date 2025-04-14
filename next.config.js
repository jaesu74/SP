/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 정적 내보내기 비활성화
  // output: 'export',
  images: {
    unoptimized: true,
  },
  // Next.js 14에서는 Pages Router가 기본값이므로 설정 필요 없음
};

module.exports = nextConfig; 