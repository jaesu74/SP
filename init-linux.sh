#!/bin/bash

domains=(sp.wvl.co.kr www.sp.wvl.co.kr)
rsa_key_size=4096
data_path="./certbot"
email="admin@wvl.co.kr" # 이메일 주소 변경 필요

if [ -d "$data_path" ]; then
  read -p "기존 인증서 데이터를 삭제하고 계속하시겠습니까? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### SSL 파라미터 다운로드 중..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

echo "### 더미 인증서 생성..."
mkdir -p "$data_path/conf/live/$domains"
docker-compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '/etc/letsencrypt/live/$domains[0]/privkey.pem' \
    -out '/etc/letsencrypt/live/$domains[0]/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### 도커 컴포즈 시작..."
docker-compose up --force-recreate -d nginx
echo

echo "### 인증서 발급 중..."
#추가 도메인을 위한 -d 플래그 설정
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# 인증서 발급 (--staging 옵션으로 테스트, 제거하면 실제 인증서 발급)
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $domain_args \
    --email $email \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### 서버 재시작..."
docker-compose exec nginx nginx -s reload 