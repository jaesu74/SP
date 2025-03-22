# GitHub를 통한 제재 대상 검색 시스템 배포 가이드

## 1. GitHub 저장소 설정

1. GitHub 계정에 새 저장소 생성:
   - 저장소 이름: sanctions-search (또는 원하는 이름)
   - 공개/비공개 선택 (GitHub Pages를 무료로 사용하려면 공개 저장소)
   - README.md 파일 자동 생성 선택

2. 로컬 프로젝트를 GitHub 저장소에 연결:
   ```
   cd C:\SP
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/[사용자명]/sanctions-search.git
   git push -u origin main
   ```

## 2. 도메인 연결 (wvl.co.kr)

1. 도메인 DNS 설정:
   - GitHub Pages IP 주소로 A 레코드 설정:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - CNAME 레코드를 '[사용자명].github.io'로 설정

2. GitHub 저장소에 CNAME 파일 생성:
   - 파일 이름: CNAME
   - 파일 내용: wvl.co.kr

## 3. GitHub Pages 설정

1. 저장소 > Settings > Pages로 이동
2. Source 섹션에서 브랜치 선택 (예: main)
3. 폴더 선택 (일반적으로 root 또는 /docs)
4. Save 버튼 클릭
5. Custom domain 섹션에 'wvl.co.kr' 입력, Save 클릭
6. HTTPS 강제 사용 옵션 활성화

## 4. 프로젝트 구조 최적화

### 프론트엔드 (정적 웹 사이트로 변환)

1. Flask 서버 의존성 제거:
   - `index.html`, 자바스크립트, CSS 파일 등 필요한 정적 파일만 /docs 폴더로 이동
   - 환경 변수를 하드코딩하거나 설정 파일로 대체

2. 외부 API 연결 설정:
   ```javascript
   // config.js
   const config = {
     production: {
       apiBaseUrl: 'https://your-backend-api.com/api'
     },
     development: {
       apiBaseUrl: 'http://localhost:3001/api'
     }
   };
   
   // 현재 환경에 따라 설정 선택
   const currentEnv = location.hostname === 'localhost' ? 'development' : 'production';
   const API_URL = config[currentEnv].apiBaseUrl;
   
   export default API_URL;
   ```

### 백엔드 (서버리스 함수 또는 외부 호스팅)

1. 외부 MongoDB 서비스 사용:
   - MongoDB Atlas 무료 티어
   - 연결 문자열: `mongodb+srv://username:password@clustername.mongodb.net/sanctions-search`

2. 서버리스 함수 구성 (GitHub Actions과 Netlify Functions 또는 AWS Lambda 활용)

## 5. GitHub Actions 자동 배포 파이프라인

1. `.github/workflows/deploy.yml` 파일 생성:
   ```yaml
   name: Deploy website

   on:
     push:
       branches: [ main ]
     schedule:
       - cron: '0 0 * * *'  # 매일 자정에 실행 (UTC)

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v3
           
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             
         - name: Install dependencies
           run: |
             cd frontend
             npm install
             
         - name: Build static site
           run: |
             cd frontend
             npm run build
             
         - name: Deploy to GitHub Pages
           uses: JamesIves/github-pages-deploy-action@v4
           with:
             branch: gh-pages
             folder: frontend/build
             clean: true
             
         - name: Update sanctions data
           run: |
             python update_sanctions_data.py
   ```

## 6. 제재 데이터 자동 업데이트

1. `update_sanctions_data.py` 스크립트 생성:
   ```python
   import requests
   import json
   import os
   from datetime import datetime

   # 다양한 제재 목록 API에서 데이터 가져오기
   def fetch_sanctions_data():
       # 예: OFAC, UN, EU 등의 API에서 데이터 가져오기
       sources = [
           {"url": "https://api.example.com/sanctions/un", "name": "UN"},
           {"url": "https://api.example.com/sanctions/eu", "name": "EU"},
           {"url": "https://api.example.com/sanctions/ofac", "name": "OFAC"}
       ]
       
       all_data = []
       
       for source in sources:
           try:
               response = requests.get(source["url"])
               if response.status_code == 200:
                   data = response.json()
                   # 데이터 형식 표준화
                   processed_data = process_data(data, source["name"])
                   all_data.extend(processed_data)
           except Exception as e:
               print(f"Error fetching data from {source['name']}: {e}")
       
       return all_data

   # 데이터 형식 표준화
   def process_data(data, source_name):
       # 각 API마다 다른 형식의 데이터를 표준 형식으로 변환
       # 실제 구현은 API 응답 형식에 따라 다름
       return data

   # JSON 파일로 저장
   def save_to_json(data):
       with open('docs/data/sanctions.json', 'w') as f:
           json.dump({
               "updated_at": datetime.now().isoformat(),
               "count": len(data),
               "results": data
           }, f)

   # 메인 실행
   if __name__ == "__main__":
       # 디렉토리 확인 및 생성
       os.makedirs('docs/data', exist_ok=True)
       
       # 데이터 가져오기
       sanctions_data = fetch_sanctions_data()
       
       # JSON 파일로 저장
       save_to_json(sanctions_data)
       
       print(f"Sanctions data updated with {len(sanctions_data)} entries")
   ```

## 7. 성능 최적화 및 비용 절감 방안

1. 정적 자산 최적화:
   - GitHub Pages의 CDN 활용
   - 이미지 압축 및 최적화
   - JavaScript 및 CSS 파일 미니파이

2. 검색 최적화:
   - 클라이언트 측 검색 (작은 데이터셋일 경우)
   - Algolia 무료 티어 활용 (큰 데이터셋)

3. 데이터 관리:
   - 제재 데이터를 JSON 파일로 저장하여 GitHub Pages에서 제공
   - MongoDB는 사용자 인증 및 고급 기능에만 사용

4. GitHub Actions 월별 무료 사용량 관리:
   - 월 2,000분 무료 사용량 내에서 관리
   - 중요 업데이트만 자동화하고 비필수 작업은 수동 트리거로 실행

## 8. 실제 사용자 피드백 수집 및 개선

1. Google Analytics 설정:
   - 사용자 행동 분석
   - 검색 패턴 모니터링

2. GitHub Issues를 통한 피드백 수집:
   - 문제 보고 및 기능 요청 템플릿 설정
   - 사용자가 직접 이슈 등록하도록 안내

3. 자동 개선 프로세스:
   - 자주 검색되는 항목 분석하여 데이터 우선순위 결정
   - 사용 패턴에 따라 UI/UX 개선

## 9. 실행 계획

1. 첫 단계 (1주일):
   - GitHub 저장소 설정
   - 기본 정적 웹사이트 배포
   - 도메인 연결

2. 두 번째 단계 (2주차):
   - 제재 데이터 수집 자동화
   - 검색 기능 최적화
   - 사용자 인증 시스템 구현

3. 세 번째 단계 (3-4주차):
   - 사용자 피드백 수집 시스템 구축
   - 성능 최적화
   - 정기 업데이트 시스템 자동화 