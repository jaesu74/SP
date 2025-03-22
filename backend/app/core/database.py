from pymongo import MongoClient
from app.core.config import settings

# MongoDB 클라이언트 생성
client = MongoClient(settings.MONGODB_URI)
db = client[settings.MONGODB_DB]

# 컬렉션 정의
sanctions_collection = db["sanctions"]
users_collection = db["users"]

# 데이터베이스 초기화 함수
def init_db():
    """
    데이터베이스와 컬렉션 초기화
    필요한 인덱스 생성
    """
    # 검색을 위한 인덱스 생성
    sanctions_collection.create_index([("name", "text")])
    
    # 사용자 이메일에 대한 유일성 인덱스 생성
    users_collection.create_index([("email", 1)], unique=True)
    
    print("Database initialized successfully") 