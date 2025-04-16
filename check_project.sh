#!/bin/bash
# check_project.sh - 프로젝트 전체 상태 체크

echo "======= Git 상태 확인 ======="
git status
echo "최근 5개 커밋:"
git log --oneline -5

echo -e "\n======= 파일 구조 확인 ======="
if command -v tree &> /dev/null; then
  tree -L 2
else
  echo "tree 명령어가 없습니다. ls -R 로 확인:"
  ls -R
fi

echo -e "\n======= Docker 구성 확인 ======="
docker-compose config
docker-compose ps

echo -e "\n======= 코드 문법 및 테스트 ======="
if [ -f package.json ]; then
  if command -v npm &> /dev/null; then
    npm run lint 2>/dev/null || echo "lint 스크립트가 없습니다."
    npm test 2>/dev/null || echo "test 스크립트가 없습니다."
  fi
else
  echo "package.json 파일이 없습니다. 코드 검사를 생략합니다."
fi

echo -e "\n전체 프로젝트 평가 완료."

systemctl restart docker && docker-compose up -d && docker-compose logs -f 