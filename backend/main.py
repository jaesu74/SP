from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import pymongo
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경 변수 설정
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/sanctions-search")
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    import secrets
    JWT_SECRET = secrets.token_hex(32)
    print("경고: JWT_SECRET 환경변수가 설정되지 않았습니다. 임시 키가 생성되었습니다.")
    
PORT = int(os.getenv("PORT", "3001"))

# 상수 정의
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DEFAULT_TOKEN_EXPIRE_MINUTES = 15
DB_NAME = "sanctions-search"
USERS_COLLECTION = "users"
SANCTIONS_COLLECTION = "sanctions"

# FastAPI 앱 인스턴스 생성
app = FastAPI(title="제재 대상 검색 API", 
              description="UN, EU, 미국 OFAC 등의 제재 목록을 검색하는 API",
              version="1.0.0")

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB 연결
try:
    client = pymongo.MongoClient(MONGODB_URI)
    db = client.get_database()
    # 컬렉션 설정
    users_collection = db[USERS_COLLECTION]
    sanctions_collection = db[SANCTIONS_COLLECTION]
    
    # 이메일 필드에 인덱스 생성 (중복 방지)
    users_collection.create_index([("email", pymongo.ASCENDING)], unique=True)
    
    # 인덱스 생성
    sanctions_collection.create_index([("name", pymongo.TEXT), ("reason", pymongo.TEXT)])
    
    print(f"MongoDB 연결 성공: {MONGODB_URI}")
except Exception as e:
    print(f"MongoDB 연결 오류: {e}")
    raise

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 설정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

# 모델 정의
class SanctionBase(BaseModel):
    name: str
    type: Optional[str] = None
    country: Optional[str] = None
    reason: Optional[str] = None
    date_listed: Optional[datetime] = None
    source: Optional[str] = None
    program: Optional[str] = None

class Sanction(SanctionBase):
    id: str

class SanctionInDB(SanctionBase):
    id: str

class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 20
    total: int = 0
    pages: int = 0

class SanctionSearchResults(BaseModel):
    count: int
    results: List[Sanction]
    pagination: PaginationParams

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str

class UserInDB(UserBase):
    id: str
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# 유틸리티 함수
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(email: str):
    user_data = users_collection.find_one({"email": email})
    if user_data:
        return UserInDB(**user_data)
    return None

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=DEFAULT_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user(email)
    if user is None:
        raise credentials_exception
    return user

# 샘플 데이터 삽입 함수
def insert_sample_data():
    # 컬렉션이 비어있는지 확인
    if sanctions_collection.count_documents({}) == 0:
        sample_data = [
            {
                "id": "UN-DPRK-1",
                "name": "Kim Jong Un",
                "type": "Individual",
                "country": "North Korea",
                "reason": "UN 안전보장이사회 결의안 위반",
                "date_listed": datetime(2016, 4, 15),
                "source": "UN",
                "program": "DPRK"
            },
            {
                "id": "OFAC-RUS-1",
                "name": "Acme Corporation",
                "type": "Entity",
                "country": "Russia",
                "reason": "국제 무역 규제 위반",
                "date_listed": datetime(2022, 6, 10),
                "source": "OFAC",
                "program": "RUSSIA"
            },
            {
                "id": "EU-SYR-1",
                "name": "Mohammad Al-Assad",
                "type": "Individual",
                "country": "Syria",
                "reason": "인권 침해",
                "date_listed": datetime(2021, 10, 20),
                "source": "EU",
                "program": "SYRIA"
            },
            {
                "id": "UN-IRAN-1",
                "name": "Tehran Trading Ltd",
                "type": "Entity",
                "country": "Iran",
                "reason": "핵 개발 프로그램 자금 지원",
                "date_listed": datetime(2019, 3, 5),
                "source": "UN",
                "program": "IRAN"
            },
            {
                "id": "UK-BLR-1",
                "name": "Alexander Lukashenko",
                "type": "Individual",
                "country": "Belarus",
                "reason": "인권 침해 및 선거 조작",
                "date_listed": datetime(2020, 12, 10),
                "source": "UK",
                "program": "BELARUS"
            }
        ]
        sanctions_collection.insert_many(sample_data)
        print("샘플 데이터가 삽입되었습니다.")

# API 라우트 정의
@app.get("/")
def read_root():
    return {"message": "제재 대상 검색 API에 오신 것을 환영합니다"}

@app.post("/api/users/register", response_model=User)
async def register_user(user: UserCreate):
    db_user = users_collection.find_one({"email": user.email})
    if db_user:
        raise HTTPException(status_code=400, detail="이미 등록된 사용자입니다")
    
    hashed_password = get_password_hash(user.password)
    user_id = str(pymongo.ObjectId())
    
    user_data = user.dict()
    user_data.pop("password")
    user_data.update({
        "id": user_id,
        "hashed_password": hashed_password
    })
    
    users_collection.insert_one(user_data)
    
    return User(id=user_id, email=user.email, name=user.name)

@app.post("/api/users/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return User(id=current_user.id, email=current_user.email, name=current_user.name)

@app.get("/api/sanctions/search", response_model=SanctionSearchResults)
async def search_sanctions(
    query: Optional[str] = None,
    type: Optional[str] = None,
    country: Optional[str] = None,
    program: Optional[str] = None,
    source: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    제재 정보를 검색합니다. 페이지네이션을 지원합니다.
    
    Args:
        query: 텍스트 검색어
        type: 타입으로 필터링 (Individual/Entity)
        country: 국가로 필터링
        program: 프로그램으로 필터링
        source: 출처로 필터링 (UN, EU, US 등)
        page: 페이지 번호 (1부터 시작)
        limit: 페이지당 결과 수
    """
    # 페이지네이션 값 검증
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 20
    
    # 데이터베이스 쿼리 최적화
    filter_query = {}
    
    # 검색어가 있으면 텍스트 검색 필터 추가
    if query:
        filter_query["$text"] = {"$search": query}
    
    # 추가 필터 설정
    if type:
        filter_query["type"] = type
    if country:
        filter_query["country"] = country
    if program:
        filter_query["program"] = program
    if source:
        filter_query["source"] = source
    
    # 총 결과 수 계산 (DB 쿼리 최적화 - 카운트만 가져옴)
    total_count = sanctions_collection.count_documents(filter_query)
    
    # 페이지네이션 계산
    skip = (page - 1) * limit
    total_pages = (total_count + limit - 1) // limit  # 올림 나눗셈
    
    # 최적화된 쿼리 실행 (필요한 문서만 가져옴)
    cursor = sanctions_collection.find(filter_query).skip(skip).limit(limit)
    
    # DB에서 가져온 문서를 Pydantic 모델로 변환
    sanctions = []
    for doc in cursor:
        # 날짜를 ISO 형식 문자열로 변환
        if isinstance(doc.get('date_listed'), datetime):
            doc['date_listed'] = doc['date_listed'].isoformat()
        sanctions.append(Sanction(**doc))
    
    # 페이지네이션 정보 생성
    pagination = PaginationParams(
        page=page,
        limit=limit,
        total=total_count,
        pages=total_pages
    )
    
    return SanctionSearchResults(
        count=total_count, 
        results=sanctions,
        pagination=pagination
    )

@app.get("/api/sanctions/{sanction_id}", response_model=Sanction)
async def get_sanction(
    sanction_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    result = sanctions_collection.find_one({"id": sanction_id})
    if not result:
        raise HTTPException(status_code=404, detail="제재 대상을 찾을 수 없습니다")
    
    # 날짜를 ISO 형식 문자열로 변환
    if isinstance(result.get('date_listed'), datetime):
        result['date_listed'] = result['date_listed'].isoformat()
    
    return Sanction(**result)

# 경로 설정 섹션
# 상위 requirements.txt 참조로 수정
requirements_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'requirements.txt')

# 서버 실행
if __name__ == "__main__":
    # 샘플 데이터 삽입
    insert_sample_data()
    
    # Uvicorn으로 서버 실행
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT) 