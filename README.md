# 제재 대상 검색 시스템 (Sanctions Target Search System)

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/your-username/sanctions-search/Deploy%20Sanctions%20Search%20System)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 소개 (Introduction)

제재 대상 검색 시스템은 국제 제재 목록에 있는 개인, 단체, 선박 등의 정보를 빠르고 정확하게 검색할 수 있는 웹 애플리케이션입니다. OFAC, UN, EU 등 다양한 출처의 제재 목록 데이터를 통합하여 제공합니다.

The Sanctions Target Search System is a web application that allows for quick and accurate searches of individuals, organizations, vessels, and other entities listed in international sanctions lists. It integrates sanction list data from various sources including OFAC, UN, and EU.

## 기능 (Features)

- 다양한 조건(이름, 유형, 국가, 제재 프로그램 등)으로 제재 대상 검색
- 유사도 기반 검색 결과 제공 (퍼지 매칭)
- 제재 대상의 상세 정보 조회 (별명, 생년월일, 식별번호, 제재 내용 등)
- 사용자 계정 관리 (로그인, 회원가입)
- 반응형 디자인 (모바일 지원)
- 다크 모드 지원

## 배포 (Deployment)

이 시스템은 GitHub Pages에서 호스팅되며 다음 URL에서 접근할 수 있습니다:
[https://wvl.co.kr](https://wvl.co.kr)

## 로컬 개발 환경 설정 (Local Development Setup)

### 요구사항 (Requirements)

- Python 3.8 이상
- Git

### 설치 (Installation)

```bash
# 저장소 복제
git clone https://github.com/your-username/sanctions-search.git
cd sanctions-search

# Python 의존성 설치
pip install -r requirements.txt

# 제재 데이터 업데이트
python update_sanctions_data.py
```

### 개발 서버 실행 (Running Development Server)

```bash
# 정적 파일 서비스를 위한 간단한 서버 실행
cd docs
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속하여 애플리케이션을 확인할 수 있습니다.

## 데이터 업데이트 (Data Updates)

제재 데이터는 GitHub Actions를 통해 매일 자동으로 업데이트됩니다. 수동으로 업데이트하려면 다음 명령을 실행하세요:

```bash
python update_sanctions_data.py
```

## 구조 (Structure)

```
sanctions-search/
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions 배포 워크플로우
├── docs/                     # 정적 웹사이트 (GitHub Pages)
│   ├── css/
│   │   └── styles.css        # 커스텀 스타일
│   ├── data/
│   │   └── sanctions.json    # 제재 데이터
│   ├── js/
│   │   ├── app.js           # 메인 애플리케이션 로직
│   │   └── config.js        # 환경 설정
│   └── index.html           # 메인 HTML 페이지
├── update_sanctions_data.py  # 제재 데이터 업데이트 스크립트
├── README.md                 # 프로젝트 설명서
├── requirements.txt          # Python 의존성
└── CNAME                     # GitHub Pages 커스텀 도메인 설정
```

## 기여 (Contributing)

프로젝트에 기여하고 싶으시다면 이슈를 등록하거나 풀 리퀘스트를 보내주세요. 모든 기여를 환영합니다!

## 라이선스 (License)

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 연락처 (Contact)

질문이나 제안이 있으시면 이슈를 등록하거나 이메일로 연락주세요: your-email@example.com 