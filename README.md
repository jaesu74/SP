# 경제 제재 정보 검색 시스템

전 세계 다양한 출처(UN, EU, US 등)의 제재 정보를 통합하고 검색할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- 다양한 출처의 제재 정보 통합 및 검색
- 유형, 국가, 출처별 필터링
- 상세 정보 보기 (제재 대상 정보, 제재 프로그램, 추가 정보)
- 데이터 다운로드 (PDF, CSV, JSON, 텍스트 형식)
- 사용자 인증 시스템

## 기술 스택

- **프론트엔드**: React, Next.js
- **백엔드**: Next.js API Routes
- **인증**: Firebase Authentication
- **데이터 처리**: Node.js
- **데이터 수집**: Python, Cron 자동화
- **배포**: Docker, Docker Compose

## 설치 및 실행 (개발 환경)

### 사전 요구 사항

- Node.js 18.x 이상
- npm 또는 yarn
- Firebase 프로젝트 (인증 기능용)

### 설치

1. 저장소 클론

```bash
git clone https://github.com/jaesu74/SP.git
cd SP
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정

`.env.example` 파일을 `.env.local`로 복사하고 필요한 설정값 입력:

```bash
cp .env.example .env.local
```

그 후 `.env.local` 파일을 편집하여 다음 내용을 입력합니다:

- Firebase 웹 앱 설정 (Firebase 콘솔의 프로젝트 설정에서 확인 가능)
- Firebase Admin SDK 서비스 계정 키 (관리자 기능 사용 시 필요)

Firebase Admin SDK 서비스 계정을 설정하려면:
1. Firebase 콘솔에서 프로젝트 설정 > 서비스 계정 탭으로 이동
2. "새 비공개 키 생성" 버튼을 클릭하여 JSON 키 파일 다운로드
3. JSON 파일의 내용을 환경 변수에 입력
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
   ```

4. 개발 서버 실행

```bash
npm run dev
```

5. 브라우저에서 `http://localhost:3000` 접속

## 데이터 수집 및 관리

### 자동 데이터 수집

Docker 컨테이너에서 Cron을 사용하여 주 3회(월, 수, 금) 자동으로 데이터를 수집합니다.

수집된 데이터는 다음과 같이 관리됩니다:
- 최신 버전과 직전 버전을 유지합니다
- 용량이 많은 경우 직전 버전도 삭제됩니다
- 새로운 데이터 수집 시 중복 데이터는 자동으로 제거됩니다

### 데이터 중복 관리

시스템은 다음과 같은 데이터 중복 관리 기능을 제공합니다:

1. **자동 중복 제거**: 새로운 데이터 수집 후 동일한 ID를 가진 제재 항목 중 최신 데이터만 유지합니다
2. **이전 버전 관리**: 이전 버전 데이터를 자동으로 정리하여 불필요한 저장 공간 사용을 방지합니다
3. **데이터 일관성 유지**: 각 출처별(UN, EU, US) 데이터와 통합 데이터에서 모두 중복을 제거합니다

이러한 자동화된 중복 데이터 관리를 통해 데이터베이스 없이도 효율적인 데이터 저장 및 관리가 가능합니다.

### 수동 데이터 수집

로컬에서 데이터 수집을 실행하려면:

```bash
python sanctions_collector.py
node scripts/integrate-sanctions-data.js
node scripts/remove-duplicate-data.js  # 중복 데이터 제거
```

## 배포 및 운영 (프로덕션 환경)

### 간편 배포 (권장)

배포 스크립트를 사용하여 간편하게 배포할 수 있습니다.

1. 배포 스크립트 다운로드 및 실행

```bash
# 배포 스크립트 다운로드
curl -O https://raw.githubusercontent.com/jaesu74/SP/main/deploy.sh
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

이 스크립트는 다음 작업을 자동으로 수행합니다:
- GitHub에서 최신 코드 다운로드
- Docker 및 Docker Compose 설정 확인
- 애플리케이션 컨테이너 빌드 및 시작

2. 배포 확인

배포가 완료되면 브라우저에서 `http://localhost:3000`으로 접속하여 애플리케이션이 정상적으로 동작하는지 확인합니다.

### Docker 명령어 직접 실행

Docker와 Docker Compose를 직접 사용하여 배포할 수도 있습니다.

1. Docker 및 Docker Compose 설치 (사전 요구사항)

2. 저장소 클론 및 배포 실행

```bash
git clone https://github.com/jaesu74/SP.git
cd SP
docker-compose up -d
```

3. 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs -f

# 웹 서버 로그만
docker-compose logs -f web

# 데이터 수집기 로그만
docker-compose logs -f collector
```

4. 배포 중지

```bash
docker-compose down
```

### 서버 시스템 요구사항

- 최소 요구사항:
  - CPU: 2코어
  - RAM: 4GB
  - 디스크: 10GB
- 권장 요구사항:
  - CPU: 4코어
  - RAM: 8GB
  - 디스크: 20GB

## 여러 PC 환경에서의 관리

### 시스템 백업

시스템을 다른 PC로 이동하거나 백업하려면 Docker 볼륨 데이터를 백업해야 합니다:

```bash
# Docker 볼륨 목록 확인
docker volume ls

# Docker 볼륨 백업 (sanctions-data 볼륨)
docker run --rm -v sanctions-data:/data -v $(pwd):/backup alpine tar -czvf /backup/sanctions-data-backup.tar.gz /data

# Docker 볼륨 백업 (sanctions-logs 볼륨)
docker run --rm -v sanctions-logs:/data -v $(pwd):/backup alpine tar -czvf /backup/sanctions-logs-backup.tar.gz /data
```

### 다른 PC에서 복원

백업 파일을 새 PC로 이동한 후:

```bash
# Docker 볼륨 생성
docker volume create sanctions-data
docker volume create sanctions-logs

# 백업에서 복원 (sanctions-data 볼륨)
docker run --rm -v sanctions-data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar -xzvf /backup/sanctions-data-backup.tar.gz --strip 1"

# 백업에서 복원 (sanctions-logs 볼륨)
docker run --rm -v sanctions-logs:/data -v $(pwd):/backup alpine sh -c "cd /data && tar -xzvf /backup/sanctions-logs-backup.tar.gz --strip 1"
```

그 후 배포 스크립트를 실행하여 시스템을 시작합니다.

## 기여 방법

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경 사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성 

## 라이선스

이 프로젝트는 MIT 라이선스에 따라 배포됩니다.

## HTTPS 설정 방법

### 사전 준비사항
- 도메인 설정이 완료되어야 합니다 (sp.wvl.co.kr)
- Docker와 Docker Compose가 설치되어 있어야 합니다

### 설정 단계

1. 필요한 디렉토리 생성
```bash
mkdir -p nginx certbot/conf certbot/www
```

2. 환경 변수 설정
`.env` 파일을 생성하고 필요한 환경 변수를 설정합니다:
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

3. 초기화 스크립트 실행 (리눅스 환경)
```bash
# 실행 권한 부여
chmod +x init-letsencrypt.sh
# 스크립트 실행
./init-letsencrypt.sh
```

윈도우 환경에서는 다음 명령어로 실행:
```powershell 
# 먼저 필요한 디렉토리 생성
mkdir nginx
mkdir -p certbot/conf certbot/www

# Docker Compose 실행 
docker-compose up -d
```

4. 인증서 갱신 테스트
```bash
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot --force-renewal -d sp.wvl.co.kr -d www.sp.wvl.co.kr
```

### 서비스 실행
```bash
docker-compose up -d
```

### 인증서 자동 갱신
Let's Encrypt 인증서는 90일마다 갱신이 필요합니다. certbot 서비스가 자동으로 인증서를 갱신합니다.

### 문제 해결
- 인증서 발급 실패 시, `--staging` 옵션을 사용해 테스트할 수 있습니다.
- 방화벽 설정으로 80, 443 포트가 열려있는지 확인하세요.
- DNS 설정이 올바른지 확인하세요.