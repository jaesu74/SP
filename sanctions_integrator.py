#!/usr/bin/env python3
"""
제재 데이터 통합기
"""

import os
import json
import logging
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("sanctions_integrator.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("sanctions_integrator")

# 데이터 디렉토리
DATA_DIR = "docs/data"

def load_sanctions_data(source):
    """특정 소스의 제재 데이터를 로드합니다."""
    try:
        file_path = os.path.join(DATA_DIR, f"{source.lower()}_sanctions.json")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get("data", [])
    except Exception as e:
        logger.error(f"{source} 제재 데이터 로드 실패: {str(e)}")
        return []

def integrate_sanctions_data():
    """모든 소스의 제재 데이터를 통합합니다."""
    logger.info("제재 데이터 통합 시작")
    
    # 각 소스의 데이터 로드
    sources = ["UN", "EU", "OFAC", "KR"]
    all_sanctions = []
    
    for source in sources:
        sanctions = load_sanctions_data(source)
        all_sanctions.extend(sanctions)
        logger.info(f"{source} 제재 데이터 로드 완료: {len(sanctions)}개 항목")
    
    # 중복 제거 (ID 기준)
    unique_sanctions = {}
    for sanction in all_sanctions:
        sanction_id = sanction["id"]
        if sanction_id in unique_sanctions:
            # 기존 항목과 병합
            existing = unique_sanctions[sanction_id]
            existing["source"] = f"{existing['source']},{sanction['source']}"
            existing["programs"].extend(sanction["programs"])
            existing["details"]["aliases"].extend(sanction["details"]["aliases"])
            existing["details"]["sanctions"].extend(sanction["details"]["sanctions"])
        else:
            unique_sanctions[sanction_id] = sanction
    
    # 중복 제거된 데이터를 리스트로 변환
    integrated_sanctions = list(unique_sanctions.values())
    
    # 통합된 데이터 저장
    output_file = os.path.join(DATA_DIR, "sanctions.json")
    try:
        data = {
            "meta": {
                "lastUpdated": datetime.now().isoformat(),
                "sources": sources,
                "totalEntries": len(integrated_sanctions)
            },
            "data": integrated_sanctions
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"통합 제재 데이터 저장 완료: {len(integrated_sanctions)}개 항목")
        
        # 소스별 통계
        source_counts = {}
        for sanction in integrated_sanctions:
            for source in sanction["source"].split(","):
                source = source.strip()
                source_counts[source] = source_counts.get(source, 0) + 1
        
        for source, count in source_counts.items():
            logger.info(f"{source} 소스 항목 수: {count}")
        
        # 유형별 통계
        type_counts = {}
        for sanction in integrated_sanctions:
            entity_type = sanction["type"]
            type_counts[entity_type] = type_counts.get(entity_type, 0) + 1
        
        for entity_type, count in type_counts.items():
            logger.info(f"{entity_type} 유형 항목 수: {count}")
        
        return True
    except Exception as e:
        logger.error(f"통합 제재 데이터 저장 실패: {str(e)}")
        return False

def main():
    """메인 함수"""
    if not integrate_sanctions_data():
        logger.error("제재 데이터 통합 실패")
        return
    
    logger.info("제재 데이터 통합 완료")

if __name__ == "__main__":
    main() 