# sp.wvl.co.kr 도메인 설정 및 Docker 배포 가이드

이 가이드는 `sp.wvl.co.kr` 도메인에 Docker를 사용하여 애플리케이션을 배포하는 단계를 설명합니다.

## 목차
1. [DNS 설정](#1-dns-설정)
2. [서버 준비](#2-서버-준비)
3. [코드 클론](#3-코드-클론)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [SSL 인증서 발급](#5-ssl-인증서-발급)
6. [Docker 컨테이너 실행](#6-docker-컨테이너-실행)
7. [문제 해결](#7-문제-해결)

## 1. DNS 설정

도메인 등록 대행사(가비아, 후이즈 등)의 DNS 관리 패널에서 다음 레코드를 추가하세요:

- **A 레코드**:
  - 호스트/이름: sp
  - 유형: A
  - 값/대상: [서버 IP 주소]  # Docker가 실행될 서버 IP
  - TTL: 3600 (또는 기본값)

```
sp.wvl.co.kr. 3600 IN A [서버 IP 주소]
```

## 2. 서버 준비

서버에 필요한 소프트웨어를 설치합니다:

```bash
# Docker 설치
sudo apt update
sudo apt install -y docker.io docker-compose

# Docker 서비스 시작 및 부팅 시 자동 시작 설정
sudo systemctl start docker
sudo systemctl enable docker

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 변경 사항 적용
newgrp docker
```

## 3. 코드 클론

서버에 코드를 클론합니다:

```bash
# 저장소 클론
git clone https://github.com/jaesu74/SP.git
cd SP
```

## 4. 환경 변수 설정

환경 변수 파일을 설정합니다:

```bash
# .env 파일 생성
cp .env.example .env

# 필요한 환경 변수 편집
nano .env
```

`.env` 파일에 다음 내용이 포함되어 있는지 확인하세요:

```
FIREBASE_SERVICE_ACCOUNT='{...}'  # 실제 Firebase 서비스 계정 정보로 대체
NEXT_PUBLIC_DOMAIN=sp.wvl.co.kr
NEXT_PUBLIC_BASE_URL=https://sp.wvl.co.kr
NEXT_PUBLIC_API_URL=https://sp.wvl.co.kr/api
NEXT_PUBLIC_DATA_API_URL=https://sp.wvl.co.kr/api/sanctions
```

## 5. SSL 인증서 발급

Let's Encrypt에서 SSL 인증서를 발급받습니다:

```bash
# 스크립트 실행 권한 부여
chmod +x config/setup-ssl.sh

# SSL 인증서 발급
sudo ./config/setup-ssl.sh
```

## 6. Docker 컨테이너 실행

Docker 컨테이너를 실행합니다:

```bash
# 프로덕션 환경용 Docker 컨테이너 실행
docker-compose -f docker-compose.prod.yml up -d
```

서비스가 성공적으로 시작되면 `https://sp.wvl.co.kr`에서 사이트에 접속할 수 있습니다.

## 7. 문제 해결

### SSL 인증서 발급 문제

SSL 인증서 발급에 문제가 있다면 다음을 확인하세요:

1. 포트 80과 443이 방화벽에서 열려 있는지 확인:
   ```bash
   sudo ufw status
   ```

2. DNS 레코드가 올바르게 전파되었는지 확인:
   ```bash
   nslookup sp.wvl.co.kr
   ```

### Docker 컨테이너 로그 확인

```bash
# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f
```

## 유지 관리

### 코드 업데이트

```bash
# 최신 코드 가져오기
git pull

# 컨테이너 재빌드 및 재시작
docker-compose -f docker-compose.prod.yml up -d --build
```

### SSL 인증서 수동 갱신

```bash
docker run --rm -it \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot renew

docker-compose -f docker-compose.prod.yml restart nginx
``` 