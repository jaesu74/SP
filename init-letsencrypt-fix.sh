#!/bin/bash

domains=(sp.wvl.co.kr www.sp.wvl.co.kr)
rsa_key_size=4096
data_path="./certbot"
email="admin@wvl.co.kr" # Adding a valid address is strongly recommended
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

# Docker 명령어 주변 환경 설정
DOCKER_COMPOSE=$(which docker-compose)
if [ -z "$DOCKER_COMPOSE" ]; then
  echo "Docker Compose를 찾을 수 없습니다. 설치 여부를 확인하세요."
  exit 1
fi

if [ -d "$data_path" ]; then
  read -p "Existing data found for $domains. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

# SSL 파라미터 다운로드
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

# Nginx 설정 파일 템플릿 생성
mkdir -p ./nginx
cat > ./nginx/nginx-ssl.conf << EOF
server {
    listen 80;
    server_name ${domains[0]} ${domains[1]};
    
    location / {
        return 301 https://\$host\$request_uri;
    }
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

server {
    listen 443 ssl;
    server_name ${domains[0]} ${domains[1]};
    
    ssl_certificate /etc/letsencrypt/live/${domains[0]}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domains[0]}/privkey.pem;
    
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

echo "### Creating dummy certificate for ${domains[0]} ..."
path="/etc/letsencrypt/live/${domains[0]}"
mkdir -p "$data_path/conf/live/${domains[0]}"
$DOCKER_COMPOSE -f docker-compose-le.yml run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### Starting nginx ..."
$DOCKER_COMPOSE -f docker-compose-le.yml up --force-recreate -d nginx
echo

echo "### Deleting dummy certificate for ${domains[0]} ..."
$DOCKER_COMPOSE -f docker-compose-le.yml run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/${domains[0]} && \
  rm -Rf /etc/letsencrypt/archive/${domains[0]} && \
  rm -Rf /etc/letsencrypt/renewal/${domains[0]}.conf" certbot
echo

echo "### Requesting Let's Encrypt certificate for ${domains[0]} ..."
# 도메인 인자 구성
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# 이메일 인자 설정
if [ -z "$email" ]; then
  email_arg="--register-unsafely-without-email"
else
  email_arg="--email $email"
fi

# 스테이징 모드 활성화 (필요시)
if [ "$staging" != "0" ]; then 
  staging_arg="--staging"
else
  staging_arg=""
fi

$DOCKER_COMPOSE -f docker-compose-le.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Copying SSL parameters to the correct location..."
$DOCKER_COMPOSE -f docker-compose-le.yml run --rm --entrypoint "\
  cp /etc/letsencrypt/conf/options-ssl-nginx.conf /etc/letsencrypt/ && \
  cp /etc/letsencrypt/conf/ssl-dhparams.pem /etc/letsencrypt/" certbot
echo

echo "### Reloading nginx ..."
$DOCKER_COMPOSE -f docker-compose-le.yml exec nginx nginx -s reload

echo
echo "### All done! HTTPS is now set up for ${domains[0]}."
echo "### Next steps:"
echo "1. Update the main docker-compose.yml if needed"
echo "2. Run 'docker-compose up -d' to start all services" 