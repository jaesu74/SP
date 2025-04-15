#!/bin/bash

# 도메인 설정
DOMAIN="sp.wvl.co.kr"

# 필요한 디렉토리 생성
mkdir -p /etc/letsencrypt

# 기존 컨테이너 종료
docker-compose -f docker-compose.prod.yml down

# Let's Encrypt 인증서 발급
docker run --rm -it \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -p 80:80 -p 443:443 \
  certbot/certbot certonly --standalone \
  --agree-tos --no-eff-email \
  --email admin@wvl.co.kr \
  -d $DOMAIN

# 인증서 발급 확인
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "SSL 인증서가 성공적으로 발급되었습니다."
  
  # 권한 설정
  chmod -R 755 /etc/letsencrypt
  
  # Docker Compose 재시작
  docker-compose -f docker-compose.prod.yml up -d
  
  echo "Docker 컨테이너가 재시작되었습니다."
  echo "https://$DOMAIN 에서 사이트를 확인하세요."
else
  echo "SSL 인증서 발급에 실패했습니다."
  exit 1
fi

# 인증서 갱신 크론 작업 설정
(crontab -l 2>/dev/null; echo "0 3 * * 1 docker run --rm -it -v /etc/letsencrypt:/etc/letsencrypt -v /var/lib/letsencrypt:/var/lib/letsencrypt certbot/certbot renew --quiet && docker-compose -f /path/to/docker-compose.prod.yml restart nginx") | crontab -

echo "SSL 인증서 자동 갱신 크론 작업이 설정되었습니다." 