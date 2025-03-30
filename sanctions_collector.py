#!/usr/bin/env python3
"""
통합 제재 데이터 수집기
UN, EU, US(OFAC) 제재 데이터를 수집하여 통합된 형식으로 저장합니다.
"""

import os
import time
import logging
import argparse
from typing import List

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("sanctions_collector.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("sanctions_collector")

# 컬렉터 모듈 임포트
from collectors.base import TEMP_DIR
from collectors.un_collector import UNSanctionsCollector
from collectors.eu_collector import EUSanctionsCollector
from collectors.us_collector import USSanctionsCollector
from collectors.integrator import SanctionsIntegrator

def collect_data(sources: List[str] = None):
    """지정된 소스의 제재 데이터를 수집합니다."""
    logger.info("제재 데이터 수집 시작")
    
    # 기본 소스 목록
    if sources is None:
        sources = ["UN", "EU", "US"]
    
    # 각 소스별 수집기 생성 및 실행
    collectors = {
        "UN": UNSanctionsCollector(),
        "EU": EUSanctionsCollector(),
        "US": USSanctionsCollector()
    }
    
    results = {}
    
    # 각 수집기 실행
    for source in sources:
        if source in collectors:
            logger.info(f"{source} 제재 데이터 수집 시작")
            collector = collectors[source]
            success = collector.collect()
            results[source] = success
            
            if success:
                logger.info(f"{source} 제재 데이터 수집 완료")
            else:
                logger.error(f"{source} 제재 데이터 수집 실패")
        else:
            logger.warning(f"지원되지 않는 수집기: {source}")
            results[source] = False
    
    # 통합 처리
    if any(results.values()):
        logger.info("제재 데이터 통합 시작")
        integrator = SanctionsIntegrator([source for source, success in results.items() if success])
        if integrator.integrate():
            logger.info("제재 데이터 통합 완료")
        else:
            logger.error("제재 데이터 통합 실패")
    else:
        logger.error("수집된 제재 데이터가 없어 통합 처리를 건너뜀")
    
    # 임시 파일 정리
    integrator = SanctionsIntegrator()
    integrator.clean_temp_files(TEMP_DIR)
    
    return results

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description="통합 제재 데이터 수집기")
    parser.add_argument('--sources', nargs='+', choices=['UN', 'EU', 'US'], help='수집할 제재 데이터 소스 (UN, EU, US)')
    args = parser.parse_args()
    
    collect_data(args.sources)

if __name__ == "__main__":
    main() 