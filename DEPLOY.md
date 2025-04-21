# sp.wvl.co.kr 도메인 Google Cloud 배포 가이드

이 가이드는 Google Cloud Platform을 활용하여 서버리스 아키텍처로 `sp.wvl.co.kr` 도메인에 애플리케이션을 배포하는 단계를 설명합니다.

## 목차
1. [사전 요구 사항](#1-사전-요구-사항)
2. [Google Cloud 설정](#2-google-cloud-설정)
3. [Firebase 인증 설정](#3-firebase-인증-설정)
4. [Docker 이미지 빌드 및 배포](#4-docker-이미지-빌드-및-배포)
5. [SSL 인증서 설정](#5-ssl-인증서-설정)
6. [도메인 연결](#6-도메인-연결)
7. [모니터링 및 유지 보수](#7-모니터링-및-유지-보수)
8. [문제 해결](#8-문제-해결)

## 1. 사전 요구 사항

- Google Cloud 계정
- Firebase 프로젝트 설정
- GitHub 저장소 접근 권한 (https://github.com/jaesu74/SP-1.git)
- Docker 및 Docker Compose 설치
- gcloud CLI 설치

## 2. Google Cloud 설정

### 프로젝트 설정

Google Cloud Console에서 프로젝트가 이미 설정되어 있다고 가정합니다. 아직 설정되지 않은 경우 다음 단계를 따릅니다:

```bash
# Google Cloud CLI 로그인
gcloud auth login

# 프로젝트 선택
gcloud config set project [YOUR_PROJECT_ID]

# 필요한 API 활성화
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable run.googleapis.com
```

### Google Cloud Run 설정

서버리스 배포를 위해 Cloud Run을 사용합니다:

```bash
# 서비스 계정 권한 설정
gcloud iam service-accounts create sanctions-app-sa \
  --display-name "Sanctions App Service Account"

# 필요한 권한 부여
gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
  --member="serviceAccount:sanctions-app-sa@[YOUR_PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
  --member="serviceAccount:sanctions-app-sa@[YOUR_PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/firebase.admin"
```

## 3. Firebase 인증 설정

> 주의: Firebase는 사용자 로그인 및 회원가입 기능에만 사용합니다.

### Firebase 프로젝트 설정

Firebase Console에서 프로젝트가 이미 설정되어 있다고 가정합니다. 필요한 항목을 확인합니다:

1. Firebase 인증 방식 설정 (이메일/비밀번호)
2. 웹 앱 설정 및 API 키 확인
3. Firebase Admin SDK 서비스 계정 준비

### 환경 변수 설정

Firebase 인증에 필요한 환경 변수를 설정합니다:

```bash
# .env 파일 생성
cp .env.example .env

# 환경 변수 편집
nano .env
```

`.env` 파일에 다음 항목이 포함되어 있는지 확인하세요:

```
# Firebase 인증 설정 (클라이언트 측)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Firebase Admin SDK (서버 사이드) 설정
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}

# 도메인 설정
NEXT_PUBLIC_DOMAIN=sp.wvl.co.kr
NEXT_PUBLIC_BASE_URL=https://sp.wvl.co.kr
NEXT_PUBLIC_API_URL=https://sp.wvl.co.kr/api
NEXT_PUBLIC_DATA_API_URL=https://sp.wvl.co.kr/api/sanctions
```

## 4. Docker 이미지 빌드 및 배포

### 이미지 빌드

로컬에서 도커 이미지를 빌드하고 Google Container Registry에 푸시합니다:

```bash
# 저장소 클론
git clone https://github.com/jaesu74/SP-1.git
cd SP-1

# 환경 변수 파일 설정
cp .env.example .env
nano .env  # 환경 변수 편집

# Docker 이미지 빌드
docker build -t gcr.io/[YOUR_PROJECT_ID]/sanctions-app:latest .

# Google Container Registry에 푸시
gcloud auth configure-docker
docker push gcr.io/[YOUR_PROJECT_ID]/sanctions-app:latest
```

### Cloud Run에 배포

빌드된 이미지를 Cloud Run에 배포합니다:

```bash
gcloud run deploy sanctions-app \
  --image gcr.io/[YOUR_PROJECT_ID]/sanctions-app:latest \
  --platform managed \
  --region asia-northeast3 \
  --service-account sanctions-app-sa@[YOUR_PROJECT_ID].iam.gserviceaccount.com \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --env-vars-file .env.yaml
```

## 5. SSL 인증서 설정

Google Cloud에서는 Cloud Run과 연결된 도메인에 자동으로 SSL 인증서를 발급합니다.

1. Google Cloud Console에서 Cloud Run 서비스 선택
2. "도메인 매핑" 탭 선택
3. "도메인 매핑 추가" 클릭
4. sp.wvl.co.kr 도메인 입력 및 설정 완료

## 6. 도메인 연결

DNS 설정이 이미 완료되어 있다고 가정합니다. Cloud Run 서비스에 도메인을 연결하려면:

1. DNS 공급자 설정에서 sp.wvl.co.kr을 Cloud Run 서비스 URL로 CNAME 레코드 설정
   
   ```
   sp.wvl.co.kr. CNAME ghs.googlehosted.com.
   ```

2. Google Search Console에서 도메인 소유권 확인
3. 도메인 확인 후 SSL 인증서 자동 발급 및 적용

## 7. 모니터링 및 유지 보수

### 모니터링 설정

Google Cloud Console에서 모니터링 및 로그 설정:

1. Cloud Monitoring 대시보드 설정
2. Cloud Logging을 통한 로그 수집
3. 알림 정책 설정 (오류 발생 시 알림)

### 데이터 수집 자동화

Cloud Scheduler를 사용하여 데이터 수집 작업 자동화:

```bash
# Cloud Scheduler 작업 생성 (매주 월, 수, 금 오전 3시)
gcloud scheduler jobs create http sanctions-data-collector \
  --schedule="0 3 * * 1,3,5" \
  --uri="https://sp.wvl.co.kr/api/collect-data" \
  --http-method=POST \
  --headers="Authorization=Bearer [YOUR_SECRET_TOKEN]" \
  --time-zone="Asia/Seoul"
```

## 8. 문제 해결

### SSL 인증서 문제

이전에 인증서 문제가 발생했다면, Google Cloud의 자동 SSL 관리를 활용하여 해결할 수 있습니다:

1. 기존의 Let's Encrypt 인증서 관련 설정 제거
2. Google Cloud의 관리형 인증서 사용
3. 도메인 확인 및 DNS 설정 확인

### 인증 문제

Firebase 인증 관련 문제 해결:

1. Firebase 콘솔에서 인증 방식이 올바르게 활성화되어 있는지 확인
2. 환경 변수가 올바르게 설정되어 있는지 확인
3. CORS 설정 확인 (API 호출 시)

### 서비스 연속성 유지

서비스 중단 방지를 위한 설정:

1. Cloud Run의 최소 인스턴스 수 설정
2. 자동 스케일링 설정
3. 정기적인 백업 설정 