#!/bin/bash

# 경제 제재 정보 검색 시스템 Google Cloud 자동 배포 스크립트
# sp.wvl.co.kr 도메인용

# 설정 변수
PROJECT_ID="sp-2504"  # Google Cloud 프로젝트 ID
REGION="asia-northeast3"     # 서울 리전
SERVICE_NAME="sanctions-app"
COLLECTOR_NAME="sanctions-collector"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"
COLLECTOR_IMAGE_NAME="gcr.io/${PROJECT_ID}/${COLLECTOR_NAME}:latest"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 필수 도구 확인
check_requirements() {
  echo -e "${YELLOW}필수 도구 확인 중...${NC}"
  
  if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}ERROR: gcloud CLI가 설치되어 있지 않습니다.${NC}"
    echo "https://cloud.google.com/sdk/docs/install에서 설치하세요."
    exit 1
  fi
  
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker가 설치되어 있지 않습니다.${NC}"
    echo "https://docs.docker.com/get-docker/에서 설치하세요."
    exit 1
  fi
  
  echo -e "${GREEN}모든 필수 도구가 설치되어 있습니다.${NC}"
}

# 환경 설정 및 로그인
setup_environment() {
  echo -e "${YELLOW}Google Cloud 환경 설정 중...${NC}"
  
  # Google Cloud 로그인 상태 확인
  if ! gcloud auth print-access-token &> /dev/null; then
    echo "Google Cloud에 로그인합니다..."
    gcloud auth login
  fi
  
  # 프로젝트 설정
  gcloud config set project ${PROJECT_ID}
  
  # 필요한 API 활성화
  gcloud services enable cloudbuild.googleapis.com
  gcloud services enable containerregistry.googleapis.com
  gcloud services enable run.googleapis.com
  gcloud services enable cloudscheduler.googleapis.com
  
  # Docker 인증 설정
  gcloud auth configure-docker
  
  echo -e "${GREEN}환경 설정이 완료되었습니다.${NC}"
}

# 환경 변수 파일 설정
setup_env_files() {
  echo -e "${YELLOW}환경 변수 파일 설정 중...${NC}"
  
  if [ ! -f .env ]; then
    echo -e "${RED}.env 파일이 없습니다. .env.example에서 복사합니다.${NC}"
    cp .env.example .env
    echo "환경 변수를 설정하려면 .env 파일을 편집하세요."
    exit 1
  fi
  
  # .env에서 환경 변수 로드
  export $(grep -v '^#' .env | xargs)
  
  # 환경 변수 확인
  if [ -z "$FIREBASE_SERVICE_ACCOUNT" ]; then
    echo -e "${RED}FIREBASE_SERVICE_ACCOUNT가 설정되지 않았습니다.${NC}"
    echo ".env 파일에서 Firebase 서비스 계정 정보를 확인하세요."
    exit 1
  fi
  
  # .env 파일에서 .env.yaml 생성
  cat > .env.yaml << EOF
NODE_ENV: "production"
FIREBASE_SERVICE_ACCOUNT: '${FIREBASE_SERVICE_ACCOUNT}'
NEXT_PUBLIC_FIREBASE_API_KEY: "${NEXT_PUBLIC_FIREBASE_API_KEY}"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"
NEXT_PUBLIC_FIREBASE_PROJECT_ID: "${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
NEXT_PUBLIC_DOMAIN: "sp.wvl.co.kr"
NEXT_PUBLIC_BASE_URL: "https://sp.wvl.co.kr"
NEXT_PUBLIC_API_URL: "https://sp.wvl.co.kr/api"
NEXT_PUBLIC_DATA_API_URL: "https://sp.wvl.co.kr/api/sanctions"
EOF
  
  echo -e "${GREEN}환경 변수 파일이 설정되었습니다.${NC}"
}

# Docker 이미지 빌드 및 푸시
build_and_push_images() {
  echo -e "${YELLOW}Docker 이미지 빌드 및 푸시 중...${NC}"
  
  # 앱 이미지 빌드
  echo "앱 이미지 빌드 중..."
  docker build -t ${IMAGE_NAME} .
  
  # 수집기 이미지 빌드
  echo "데이터 수집기 이미지 빌드 중..."
  docker build -t ${COLLECTOR_IMAGE_NAME} -f Dockerfile.collector .
  
  # Google Container Registry에 푸시
  echo "이미지를 Container Registry에 푸시 중..."
  docker push ${IMAGE_NAME}
  docker push ${COLLECTOR_IMAGE_NAME}
  
  echo -e "${GREEN}이미지 빌드 및 푸시가 완료되었습니다.${NC}"
}

# Cloud Run 서비스 배포
deploy_services() {
  echo -e "${YELLOW}Cloud Run 서비스 배포 중...${NC}"
  
  # 서비스 계정 확인 또는 생성
  local SERVICE_ACCOUNT="sanctions-app-sa@${PROJECT_ID}.iam.gserviceaccount.com"
  
  if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT} &> /dev/null; then
    echo "서비스 계정 생성 중..."
    gcloud iam service-accounts create sanctions-app-sa \
      --display-name "Sanctions App Service Account"
    
    # 권한 부여
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/storage.admin"
    
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/firebase.admin"
  fi
  
  # 메인 앱 배포
  echo "앱 서비스 배포 중..."
  gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --service-account ${SERVICE_ACCOUNT} \
    --allow-unauthenticated \
    --port 3000 \
    --memory 1Gi \
    --env-vars-file .env.yaml
  
  # 데이터 수집기 서비스 배포 (인증 필요)
  echo "데이터 수집기 서비스 배포 중..."
  gcloud run deploy ${COLLECTOR_NAME} \
    --image ${COLLECTOR_IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --service-account ${SERVICE_ACCOUNT} \
    --no-allow-unauthenticated \
    --memory 512Mi \
    --env-vars-file .env.yaml
  
  echo -e "${GREEN}서비스 배포가 완료되었습니다.${NC}"
}

# 스케줄러 설정
setup_scheduler() {
  echo -e "${YELLOW}데이터 수집 스케줄러 설정 중...${NC}"
  
  # 데이터 수집 서비스 URL 가져오기
  local COLLECTOR_URL=$(gcloud run services describe ${COLLECTOR_NAME} \
    --platform managed \
    --region ${REGION} \
    --format="value(status.url)")
  
  # ID 토큰 인증을 위한 서비스 계정 이메일
  local SERVICE_ACCOUNT="sanctions-app-sa@${PROJECT_ID}.iam.gserviceaccount.com"
  
  # 기존 작업 확인 및 삭제
  if gcloud scheduler jobs describe sanctions-data-collector &> /dev/null; then
    echo "기존 스케줄러 작업 삭제 중..."
    gcloud scheduler jobs delete sanctions-data-collector --quiet
  fi
  
  # 새 스케줄러 작업 생성 (매주 월, 수, 금 오전 3시)
  echo "새 스케줄러 작업 생성 중..."
  gcloud scheduler jobs create http sanctions-data-collector \
    --schedule="0 3 * * 1,3,5" \
    --uri="${COLLECTOR_URL}/api/collect-data" \
    --http-method=POST \
    --oidc-service-account-email=${SERVICE_ACCOUNT} \
    --oidc-token-audience=${COLLECTOR_URL} \
    --time-zone="Asia/Seoul"
  
  echo -e "${GREEN}스케줄러 설정이 완료되었습니다.${NC}"
}

# 도메인 매핑
setup_domain() {
  echo -e "${YELLOW}도메인 매핑 설정 중...${NC}"
  
  # 도메인 매핑 확인
  if gcloud run domain-mappings list \
    --platform managed \
    --region ${REGION} \
    --filter="SERVICE:${SERVICE_NAME} AND DOMAIN:sp.wvl.co.kr" \
    --format="get(DOMAIN)" | grep -q "sp.wvl.co.kr"; then
    echo "도메인 매핑이 이미 설정되어 있습니다."
  else
    echo "도메인 매핑 생성 중..."
    gcloud run domain-mappings create \
      --service ${SERVICE_NAME} \
      --platform managed \
      --region ${REGION} \
      --domain sp.wvl.co.kr
    
    echo "도메인 매핑이 생성되었습니다. DNS 설정을 확인하세요."
    gcloud run domain-mappings describe \
      --platform managed \
      --region ${REGION} \
      --domain sp.wvl.co.kr
  fi
  
  echo -e "${GREEN}도메인 매핑 설정이 완료되었습니다.${NC}"
}

# 배포 상태 확인
check_deployment() {
  echo -e "${YELLOW}배포 상태 확인 중...${NC}"
  
  # 앱 서비스 상태 확인
  echo "앱 서비스 상태:"
  gcloud run services describe ${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --format="table(status.url,status.conditions[].status,status.conditions[].message)"
  
  # 데이터 수집기 서비스 상태 확인
  echo "데이터 수집기 서비스 상태:"
  gcloud run services describe ${COLLECTOR_NAME} \
    --platform managed \
    --region ${REGION} \
    --format="table(status.url,status.conditions[].status,status.conditions[].message)"
  
  # 스케줄러 상태 확인
  echo "스케줄러 상태:"
  gcloud scheduler jobs describe sanctions-data-collector
  
  echo -e "${GREEN}모든 서비스가 정상적으로 배포되었습니다.${NC}"
  echo -e "${GREEN}애플리케이션은 https://sp.wvl.co.kr 에서 접속할 수 있습니다.${NC}"
}

# 메인 함수
main() {
  echo -e "${GREEN}===== 경제 제재 정보 검색 시스템 Google Cloud 배포 시작 =====${NC}"
  
  check_requirements
  setup_environment
  setup_env_files
  build_and_push_images
  deploy_services
  setup_scheduler
  setup_domain
  check_deployment
  
  echo -e "${GREEN}===== 배포가 완료되었습니다 =====${NC}"
}

# 스크립트 실행
main 