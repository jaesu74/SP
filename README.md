# 제재 정보 검색 시스템

이 프로젝트는 UN, EU, US(OFAC) 등의 제재 정보를 수집, 통합하고 검색할 수 있는 시스템입니다.

## 주요 기능

- UN, EU, US(OFAC) 제재 데이터 자동 수집
- 제재 정보 통합 및 중복 제거
- 웹 기반 검색 인터페이스
- 제재 대상 상세 정보 조회

## 프로젝트 구조

```
/
├── backend/              # 백엔드 서버
│   ├── app/              # 애플리케이션 코드
│   │   ├── api/          # API 엔드포인트
│   │   ├── core/         # 핵심 기능
│   │   ├── models/       # 데이터 모델
│   │   └── utils/        # 유틸리티 함수
│   ├── main.py           # 백엔드 메인 진입점
│   └── requirements.txt  # 백엔드 의존성
│
├── frontend/             # 프론트엔드
│   ├── src/              # 소스 코드
│   │   └── app.js        # 프론트엔드 메인 코드
│   ├── index.html        # 메인 HTML 파일
│   ├── server.py         # 개발용 프론트엔드 서버
│   └── requirements.txt  # 프론트엔드 서버 의존성
│
├── docs/                 # GitHub Pages 배포 디렉토리
│   ├── css/              # 스타일시트
│   ├── js/               # 클라이언트 자바스크립트
│   ├── images/           # 이미지 리소스
│   ├── data/             # 제재 데이터 저장소
│   │   ├── un_sanctions.json
│   │   ├── eu_sanctions.json
│   │   ├── us_sanctions.json
│   │   └── sanctions.json    # 통합된 제재 데이터
│   └── index.html        # 메인 HTML 파일
│
├── collectors/           # 제재 데이터 수집기 모듈
│   ├── __init__.py
│   ├── base.py           # 기본 수집기 클래스
│   ├── un_collector.py   # UN 수집기
│   ├── eu_collector.py   # EU 수집기
│   ├── us_collector.py   # US 수집기
│   └── integrator.py     # 데이터 통합기
│
├── temp/                 # 임시 파일 저장소
│
├── sanctions_collector.py # 통합 제재 데이터 수집기
├── sanctions_scheduler.py # 데이터 수집 스케줄러
└── requirements.txt       # 글로벌 의존성
```

## 설치 방법

1. 저장소 클론
```
git clone https://github.com/username/sanctions-search.git
cd sanctions-search
```

2. 의존성 설치
```
pip install -r requirements.txt
```

3. 백엔드 의존성 설치
```
cd backend
pip install -r requirements.txt
```

4. 프론트엔드 의존성 설치
```
cd frontend
pip install -r requirements.txt
```

## 사용 방법

### 제재 데이터 수집

```
python sanctions_collector.py
```

### 스케줄러로 자동 수집 실행

```
python sanctions_scheduler.py
```

### 프론트엔드 서버 실행

```
cd frontend
python server.py
```

### 백엔드 서버 실행

```
cd backend
python main.py
```

## 개발 정보

### 통합 제재 수집기 (sanctions_collector.py)

- UN, EU, US(OFAC) 제재 데이터를 통합적으로 수집
- 중복 데이터 제거 및 정규화
- JSON 형식으로 저장

### 제재 데이터 스키마

```json
{
  "id": "소스-고유ID",
  "name": "제재 대상 이름",
  "type": "Individual 또는 Entity",
  "country": "국가",
  "programs": ["제재 프로그램 목록"],
  "source": "UN, EU, US-OFAC 등",
  "details": {
    "aliases": ["별칭 목록"],
    "birthDate": "생년월일",
    "sanctions": [{"program": "제재 프로그램", "startDate": "시작일", "reason": "이유"}],
    "addresses": ["주소 목록"],
    "nationalities": ["국적 목록"],
    "identifications": [{"type": "문서유형", "number": "문서번호", "country": "발급국가"}]
  }
}
```

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 연락처

주식회사 더블유브이엘 (WVL Inc.)  
주소: 서울특별시 강남구 테헤란로 123, 7층 (우편번호: 06123)  
전화: 02-123-4567  
이메일: info@wvl.com 