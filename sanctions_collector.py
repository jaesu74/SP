#!/usr/bin/env python3
"""
통합 제재 데이터 수집기
UN, EU, US(OFAC) 제재 데이터를 수집하여 통합된 형식으로 저장합니다.
"""

import os
import time
import logging
import argparse
import traceback
from typing import List, Dict, Any, Optional

# 로깅 설정
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/sanctions_collector.log"),
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

class CollectionError(Exception):
    """수집 과정에서 발생한 오류를 나타내는 예외 클래스"""
    pass

def collect_data(sources: Optional[List[str]] = None) -> Dict[str, bool]:
    """지정된 소스의 제재 데이터를 수집합니다.
    
    Args:
        sources: 수집할 데이터 소스 목록. None이면 모든 소스를 수집합니다.
        
    Returns:
        Dict[str, bool]: 각 소스별 수집 성공 여부
    
    Raises:
        CollectionError: 수집 중 심각한 오류가 발생한 경우
    """
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
            try:
                success = collector.collect()
                results[source] = success
                
                if success:
                    logger.info(f"{source} 제재 데이터 수집 완료")
                else:
                    logger.error(f"{source} 제재 데이터 수집 실패")
            except Exception as e:
                logger.error(f"{source} 제재 데이터 수집 중 오류 발생: {str(e)}")
                logger.debug(traceback.format_exc())
                results[source] = False
        else:
            logger.warning(f"지원되지 않는 수집기: {source}")
            results[source] = False
    
    # 통합 처리
    if any(results.values()):
        logger.info("제재 데이터 통합 시작")
        try:
            successful_sources = [source for source, success in results.items() if success]
            integrator = SanctionsIntegrator(successful_sources)
            if integrator.integrate():
                logger.info("제재 데이터 통합 완료")
            else:
                logger.error("제재 데이터 통합 실패")
        except Exception as e:
            logger.error(f"제재 데이터 통합 중 오류 발생: {str(e)}")
            logger.debug(traceback.format_exc())
            # 통합 오류는 전체 프로세스의 실패로 간주하지 않음
    else:
        error_msg = "수집된 제재 데이터가 없어 통합 처리를 건너뜀"
        logger.error(error_msg)
    
    # 임시 파일 정리
    try:
        integrator = SanctionsIntegrator()
        integrator.clean_temp_files(TEMP_DIR)
    except Exception as e:
        logger.warning(f"임시 파일 정리 중 오류 발생: {str(e)}")
        # 임시 파일 정리 실패는 무시 가능
    
    return results

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description="통합 제재 데이터 수집기")
    parser.add_argument('--sources', nargs='+', choices=['UN', 'EU', 'US'], help='수집할 제재 데이터 소스 (UN, EU, US)')
    args = parser.parse_args()
    
    try:
        results = collect_data(args.sources)
        if not any(results.values()):
            logger.critical("모든 소스에서 데이터 수집에 실패했습니다.")
            exit(1)
    except Exception as e:
        logger.critical(f"제재 데이터 수집 중 심각한 오류 발생: {str(e)}")
        logger.debug(traceback.format_exc())
        exit(1)

if __name__ == "__main__":
    main() 