#!/bin/bash

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

domains=(sp.wvl.co.kr)
rsa_key_size=4096
data_path="./certbot"
email="admin@wvl.co.kr"
staging=0 # 테스트시 1로 설정하여 Let's Encrypt 요청 제한 회피

if [ -d "$data_path/conf/live/sp.wvl.co.kr" ]; then
  read -p "sp.wvl.co.kr에 대한 기존 인증서가 있습니다. 계속하고 기존 인증서를 교체하시겠습니까? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

# certbot 디렉토리 구조 준비
mkdir -p "$data_path/conf/live/$domains"
mkdir -p "$data_path/www/.well-known/acme-challenge"

# TLS 파라미터 다운로드 (없는 경우)
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "TLS 파라미터 다운로드 중..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

# 임시 인증서 생성
for domain in "${domains[@]}"; do
  echo "임시 인증서 생성: $domain"
  path="/etc/letsencrypt/live/$domain"
  mkdir -p "$data_path/conf/live/$domain"
  
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout "$data_path/conf/live/$domain/privkey.pem" \
    -out "$data_path/conf/live/$domain/fullchain.pem" \
    -subj "/CN=localhost"
done

echo "Docker 컨테이너 재시작 중..."
docker-compose down
docker-compose up -d

echo "실제 인증서 요청 중..."
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d ${domains[0]} \
  --email $email \
  --rsa-key-size $rsa_key_size \
  --agree-tos \
  --force-renewal

echo "Docker 컨테이너 재시작 중..."
docker-compose down
docker-compose up -d

echo "인증서 발급 완료!"

echo "🎉 작업이 완료되었습니다! ${domains[0]}에 대한 HTTPS 설정을 확인하세요."
echo "✅ 다음 단계:"
echo "1. 브라우저에서 https://${domains[0]} 접속 확인"
echo "2. 정상적으로 접속되면 설정 완료" 