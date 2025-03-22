from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from app.models.sanctions import SanctionResponse, SanctionSearchResponse
from app.core.database import sanctions_collection
from bson import ObjectId

router = APIRouter()

@router.get("/search", response_model=SanctionSearchResponse)
async def search_sanctions(query: str = Query(..., description="검색어")):
    """
    제재 대상 검색 API
    """
    try:
        # MongoDB 텍스트 검색 수행
        cursor = sanctions_collection.find(
            {"$text": {"$search": query}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})])
        
        # 결과 포맷팅
        results = []
        for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            results.append(doc)
        
        return {
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"검색 중 오류가 발생했습니다: {str(e)}")

@router.get("/{sanction_id}", response_model=SanctionResponse)
async def get_sanction(sanction_id: str):
    """
    특정 제재 대상 정보 조회 API
    """
    try:
        sanction = sanctions_collection.find_one({"_id": ObjectId(sanction_id)})
        if not sanction:
            raise HTTPException(status_code=404, detail="제재 대상을 찾을 수 없습니다")
        
        sanction["id"] = str(sanction.pop("_id"))
        return sanction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"제재 대상 조회 중 오류가 발생했습니다: {str(e)}") 