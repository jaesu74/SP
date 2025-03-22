from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SanctionBase(BaseModel):
    name: str
    type: str = Field(..., description="Individual 또는 Organization")
    reason: Optional[str] = None
    source: Optional[str] = None
    country: Optional[str] = None
    date_listed: Optional[datetime] = None

class SanctionCreate(SanctionBase):
    pass

class SanctionInDB(SanctionBase):
    id: str = Field(..., alias="_id")

class SanctionResponse(SanctionBase):
    id: str

    class Config:
        populate_by_name = True

class SanctionSearch(BaseModel):
    query: str

class SanctionSearchResponse(BaseModel):
    results: List[SanctionResponse]
    count: int 