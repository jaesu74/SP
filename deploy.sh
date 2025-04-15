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