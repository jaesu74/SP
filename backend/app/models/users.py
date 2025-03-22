from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(..., alias="_id")
    hashed_password: str

class UserResponse(UserBase):
    id: str

    class Config:
        populate_by_name = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenData(BaseModel):
    user_id: str
    email: Optional[EmailStr] = None

class Token(BaseModel):
    access_token: str
    token_type: str 