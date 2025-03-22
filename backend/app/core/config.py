import os
from dotenv import load_dotenv
from pathlib import Path

# .env 파일 로드
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Sanctions Search API"
    
    # CORS 설정
    BACKEND_CORS_ORIGINS: list = ["http://localhost:5000", "http://localhost:3000"]
    
    # MongoDB 설정
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "sanctions_db")
    
    # JWT 설정
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sanctions-search-secret-key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    class Config:
        case_sensitive = True

settings = Settings() 