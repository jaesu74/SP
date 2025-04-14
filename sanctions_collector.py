#!/usr/bin/env python3
"""
제재 데이터 수집 메인 모듈
UN, EU, US 제재 데이터를 수집하고 JSON 파일로 저장합니다.
"""

import os
import sys
import time
import logging
import json
from typing import List, Dict
from datetime import datetime

# 수집기 패키지 임포트
from collectors.un_collector import UNSanctionsCollector
from collectors.eu_collector import EUSanctionsCollector
from collectors.us_collector import USSanctionsCollector
from collectors.integrator import SanctionsIntegrator

# 설정
OUTPUT_DIR = 'docs/data'
LOG_DIR = 'logs'
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "sanctions_collector.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("sanctions_collector")

def main():
    """모든 제재 데이터를 수집하고 통합합니다."""
    start_time = time.time()
    logger.info("제재 데이터 수집 시작")
    
    # 수집기 인스턴스 생성
    collectors = [
        UNSanctionsCollector(),
        EUSanctionsCollector(),
        USSanctionsCollector()
    ]
    
    # 데이터 수집 실행
    success_count = 0
    sources = []
    
    for collector in collectors:
        source_name = collector._source_name
        logger.info(f"{source_name} 제재 데이터 수집 시작")
        
        try:
            if collector.collect():
                logger.info(f"{source_name} 제재 데이터 수집 성공")
                success_count += 1
                sources.append(source_name.lower())
            else:
                logger.error(f"{source_name} 제재 데이터 수집 실패")
        except Exception as e:
            logger.error(f"{source_name} 제재 데이터 수집 중 오류 발생: {str(e)}")
    
    # 통합 데이터 생성
    if success_count > 0:
        try:
            # 통합기 인스턴스 생성
            integrator = SanctionsIntegrator(sources)
            
            # 통합 데이터 생성
            if integrator.integrate():
                logger.info("제재 데이터 통합 성공")
            else:
                logger.error("제재 데이터 통합 실패")
        except Exception as e:
            logger.error(f"제재 데이터 통합 중 오류 발생: {str(e)}")
    
    # 결과 요약
    elapsed_time = time.time() - start_time
    logger.info(f"제재 데이터 수집 완료: {success_count}/{len(collectors)} 성공, 소요 시간: {elapsed_time:.2f}초")
    
    # 진단 정보 생성
    create_diagnostic_info(sources, elapsed_time)
    
    return success_count == len(collectors)

def create_diagnostic_info(sources: List[str], elapsed_time: float):
    """진단 정보를 생성하여 저장합니다."""
    try:
        info = {
            "last_update": datetime.now().isoformat(),
            "sources": sources,
            "elapsed_time": elapsed_time,
            "status": "success" if sources else "failure"
        }
        
        # 각 소스별 항목 수 추가
        for source in sources:
            try:
                with open(os.path.join(OUTPUT_DIR, f"{source}_sanctions.json"), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    info[f"{source}_count"] = data.get("meta", {}).get("count", 0)
            except:
                info[f"{source}_count"] = "unknown"
        
        # 통합 데이터 항목 수 추가
        try:
            with open(os.path.join(OUTPUT_DIR, "integrated_sanctions.json"), 'r', encoding='utf-8') as f:
                data = json.load(f)
                info["integrated_count"] = data.get("meta", {}).get("count", 0)
        except:
            info["integrated_count"] = "unknown"
        
        # 파일로 저장
        with open(os.path.join(OUTPUT_DIR, "diagnostic_info.json"), 'w', encoding='utf-8') as f:
            json.dump(info, f, ensure_ascii=False, indent=2)
            
        logger.info("진단 정보 저장 완료")
    except Exception as e:
        logger.error(f"진단 정보 생성 중 오류 발생: {str(e)}")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 