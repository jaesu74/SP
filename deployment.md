# 제재 대상 검색 시스템 배포 가이드

이 문서는 제재 대상 검색 시스템의 배포 방법에 대한 안내입니다.

## 로컬 개발 환경 배포

### 사전 요구사항

- Python 3.8 이상
- Node.js 14 이상 (프론트엔드 개발 시)
- MongoDB (또는 온라인 MongoDB Atlas 계정)

### 백엔드 서버 실행

1. 백엔드 디렉토리로 이동:
   ```
   cd backend
   ```

2. 필요한 패키지 설치:
   ```
   pip install -r requirements.txt
   ```

3. 환경 변수 설정 (.env 파일 확인 및 수정):
   ```
   # MongoDB 연결 설정
   MONGODB_URI=mongodb://localhost:27017/sanctions-search
   
   # JWT 설정
   JWT_SECRET=your-secret-key-here
   
   # 서버 설정
   PORT=3001
   ```

4. 개발 서버 실행:
   ```
   uvicorn main:app --host 0.0.0.0 --port 3001 --reload
   ```

5. 프로덕션 서버 실행:
   ```
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

### 프론트엔드 서버 실행

1. 프론트엔드 디렉토리로 이동:
   ```
   cd frontend
   ```

2. 필요한 패키지 설치:
   ```
   pip install -r requirements.txt
   ```

3. 환경 변수 설정 (.env 파일 확인 및 수정):
   ```
   # API 설정
   REACT_APP_API_URL=http://localhost:3001/api
   
   # 환경 설정
   REACT_APP_ENV=production
   ```

4. 개발 서버 실행:
   ```
   python server.py
   ```

5. 프로덕션 서버 실행:
   ```
   gunicorn wsgi:app
   ```

## 클라우드 배포 (Heroku)

### 사전 요구사항

- Heroku CLI
- Git
- MongoDB Atlas 계정 (원격 MongoDB 데이터베이스)

### 백엔드 배포

1. Heroku에 로그인:
   ```
   heroku login
   ```

2. 백엔드 디렉토리에서 Heroku 앱 생성:
   ```
   cd backend
   heroku create sanctions-search-api
   ```

3. 환경 변수 설정:
   ```
   heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sanctions-search
   heroku config:set JWT_SECRET=your-secure-jwt-secret
   heroku config:set ENV=production
   ```

4. 앱 배포:
   ```
   git subtree push --prefix backend heroku master
   ```

### 프론트엔드 배포

1. 프론트엔드 디렉토리에서 Heroku 앱 생성:
   ```
   cd frontend
   heroku create sanctions-search-frontend
   ```

2. 환경 변수 설정:
   ```
   heroku config:set REACT_APP_API_URL=https://sanctions-search-api.herokuapp.com/api
   heroku config:set REACT_APP_ENV=production
   ```

3. 앱 배포:
   ```
   git subtree push --prefix frontend heroku master
   ```

## Docker 배포

### 사전 요구사항

- Docker
- Docker Compose

### Docker 컴포즈 파일 설정 (docker-compose.yml)

```yaml
version: '3'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network

  backend:
    build: ./backend
    container_name: sanctions-backend
    restart: always
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/sanctions-search
      - JWT_SECRET=your-secret-key-here
      - PORT=3001
      - ENV=production
    depends_on:
      - mongodb
    networks:
      - app-network

  frontend:
    build: ./frontend
    container_name: sanctions-frontend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - REACT_APP_API_URL=http://localhost:3001/api
      - REACT_APP_ENV=production
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongodb_data:
```

### Docker 파일 설정

#### 백엔드 Dockerfile (backend/Dockerfile)

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3001

CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:3001"]
```

#### 프론트엔드 Dockerfile (frontend/Dockerfile)

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:5000"]
```

### Docker Compose로 배포

```
docker-compose up -d
```

## 모니터링 및 유지 관리

- 로그 모니터링: 각 서버의 로그 파일을 정기적으로 확인
- 데이터베이스 백업: MongoDB의 데이터를 정기적으로 백업
- 보안 업데이트: 패키지 및 시스템 보안 업데이트 적용

## 배포 후 확인 사항

1. 백엔드 API 서버 접속 확인: `http://localhost:3001/docs`
2. 프론트엔드 웹 접속 확인: `http://localhost:5000`
3. 회원가입 및 로그인 기능 테스트
4. 제재 대상 검색 기능 테스트 