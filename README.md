# 제재 정보 검색 시스템

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
- **데이터 수집**: GitHub Actions 자동화

## 설치 및 실행

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

4. 개발 서버 실행

```bash
npm run dev
```

5. 브라우저에서 `http://localhost:3000` 접속

## 데이터 수집 및 관리

### 자동 데이터 수집

GitHub Actions를 사용하여 주 3회(월, 수, 금) 자동으로 데이터를 수집합니다.

수집된 데이터는 다음과 같이 관리됩니다:
- 최신 버전과 직전 버전을 유지합니다
- 이전 버전들은 자동으로 삭제됩니다
- 용량이 많은 경우 직전 버전도 삭제됩니다

### 수동 데이터 수집

로컬에서 데이터 수집을 실행하려면:

```bash
node scripts/integrate-sanctions-data.js
```

버전 정리를 실행하려면:

```bash
node scripts/cleanup-old-versions.js
```

## 배포

1. 프로젝트 빌드

```bash
npm run build
```

2. 서버에 배포

```bash
npm start
```

## 기여 방법

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경 사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성 