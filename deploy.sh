#!/bin/bash

# 스크립트 제목 출력
echo "======================================================"
echo "     제재 정보 검색 시스템 배포 스크립트 v1.0"
echo "======================================================"
echo

# 작업 디렉토리 확인
WORK_DIR="$PWD"
echo "작업 디렉토리: $WORK_DIR"

# 최신 코드 체크
if [ -d ".git" ]; then
  echo "기존 저장소가 발견되었습니다. 최신 코드로 업데이트합니다..."
  git pull
  if [ $? -ne 0 ]; then
    echo "❌ 코드 업데이트 실패. 저장소 연결을 확인해주세요."
    exit 1
  fi
else
  echo "저장소를 새로 클론합니다..."
  # 현재 디렉토리가 비어있지 않으면 새 디렉토리 생성
  if [ "$(ls -A $WORK_DIR)" ]; then
    echo "현재 디렉토리가 비어있지 않습니다. 새 디렉토리에 클론합니다."
    WORK_DIR="$PWD/sanctions-system"
    mkdir -p "$WORK_DIR"
    cd "$WORK_DIR"
  fi
  
  git clone https://github.com/jaesu74/SP.git .
  if [ $? -ne 0 ]; then
    echo "❌ 코드 클론 실패. GitHub 연결을 확인해주세요."
    exit 1
  fi
fi

echo "✅ 코드 준비 완료"
echo

# 로그 디렉토리 생성
mkdir -p logs
echo "✅ 로그 디렉토리 생성 완료"

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
  echo "❌ Docker가 설치되어 있지 않습니다. Docker를 먼저 설치해주세요."
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo "❌ Docker Compose가 설치되어 있지 않습니다. Docker Compose를 먼저 설치해주세요."
  exit 1
fi

echo "✅ Docker 환경 확인 완료"
echo

# 환경 변수 설정
echo "환경 변수를 설정합니다..."

# Firebase 서비스 계정 설정
if [ -z "$FIREBASE_SERVICE_ACCOUNT" ]; then
  echo "⚠️ FIREBASE_SERVICE_ACCOUNT 환경 변수가 설정되지 않았습니다."
  echo "관리자 기능(사용자 인증)이 제한될 수 있습니다."
  
  # 서비스 계정 설정 안내
  echo
  echo "Firebase 서비스 계정을 설정하려면:"
  echo "1. Firebase 콘솔에서 프로젝트 설정 > 서비스 계정으로 이동"
  echo "2. '새 비공개 키 생성' 버튼을 클릭하여 JSON 키 파일 다운로드"
  echo "3. 다음 명령으로 환경 변수 설정:"
  echo "   export FIREBASE_SERVICE_ACCOUNT='$(cat your-service-account.json)'"
  echo
  
  read -p "계속 진행하시겠습니까? (y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    echo "배포가 취소되었습니다."
    exit 1
  fi
else
  echo "✅ Firebase 서비스 계정이 설정되었습니다."
fi

# 환경 변수 파일 생성
echo "환경 변수 파일을 생성합니다..."
if [ -n "$FIREBASE_SERVICE_ACCOUNT" ]; then
  echo "FIREBASE_SERVICE_ACCOUNT='$FIREBASE_SERVICE_ACCOUNT'" > .env
  echo "✅ 환경 변수 파일 생성 완료"
else
  touch .env
  echo "⚠️ 환경 변수 파일이 비어 있습니다."
fi

# Docker 컨테이너 빌드 및 실행
echo "Docker 컨테이너를 빌드하고 실행합니다..."
docker-compose build
if [ $? -ne 0 ]; then
  echo "❌ Docker 컨테이너 빌드 실패"
  exit 1
fi

docker-compose up -d
if [ $? -ne 0 ]; then
  echo "❌ Docker 컨테이너 실행 실패"
  exit 1
fi

echo "✅ Docker 컨테이너 실행 완료"
echo

# 접속 정보 출력
echo "======================================================"
echo "     시스템이 성공적으로 배포되었습니다!"
echo "======================================================"
echo
echo "웹 애플리케이션: http://localhost:3000"
echo "로그 확인: docker-compose logs -f"
echo
echo "서비스 관리 명령어:"
echo "  - 서비스 중지: docker-compose down"
echo "  - 서비스 재시작: docker-compose restart"
echo "  - 로그 확인: docker-compose logs -f [web|collector]"
echo
echo "감사합니다!" 