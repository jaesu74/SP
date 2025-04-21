/**
 * 헬스 체크 API 엔드포인트
 * AWS ECS 로드 밸런서의 헬스 체크에 사용
 */
export default function handler(req, res) {
  // 서버 상태 객체
  const status = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }

  // 200 상태 코드와 함께 응답 반환
  res.status(200).json(status)
} 