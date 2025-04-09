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
    """수집 과정에서 발생한 오류를 처리하는 예외 클래스"""
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

    # 기본값: 모든 소스
    if sources is None:
        sources = ["UN", "EU", "US"]
    
    results = {}
    
    # 각 소스별 데이터 수집
    for source in sources:
        try:
            logger.info(f"{source} 제재 데이터 수집 시작")
            if source == "UN":
                collector = UNSanctionsCollector()
            elif source == "EU":
                collector = EUSanctionsCollector()
            elif source == "US":
                collector = USSanctionsCollector()
            else:
                logger.warning(f"알 수 없는 소스: {source}")
                results[source] = False
                continue
            
            # 데이터 수집 및 결과 저장
            success = collector.collect()
            results[source] = success
            
            logger.info(f"{source} 제재 데이터 수집 {'성공' if success else '실패'}")
        except Exception as e:
            logger.error(f"{source} 제재 데이터 수집 중 오류 발생: {str(e)}")
            logger.error(traceback.format_exc())
            results[source] = False
    
    # 통합 처리
    try:
        if any(results.values()):
            # 하나 이상의 소스가 성공한 경우 통합
            integrator = SanctionsIntegrator([s for s in results if results[s]])
            integration_success = integrator.integrate()
            
            if integration_success:
                logger.info("제재 데이터 통합 완료")
            else:
                logger.error("제재 데이터 통합 실패")
        else:
            logger.error("모든 소스의 데이터 수집 실패, 통합 취소")
    except Exception as e:
        logger.error(f"제재 데이터 통합 중 오류 발생: {str(e)}")
        logger.error(traceback.format_exc())
    
    return results

def main():
    """메인 함수: 명령줄 인자 처리 및 제재 데이터 수집 실행"""
    # 인자 파서 설정
    parser = argparse.ArgumentParser(description="통합 제재 데이터 수집기")
    parser.add_argument("--sources", nargs="+", choices=["UN", "EU", "US"],
                        help="수집할 제재 데이터 소스 (UN, EU, US)")
    
    # 인자 파싱
    args = parser.parse_args()
    
    # 수집 실행
    try:
        results = collect_data(args.sources)
        
        # 결과 요약
        success_count = sum(1 for success in results.values() if success)
        total_count = len(results)
        
        logger.info(f"수집 완료: {success_count}/{total_count} 소스 성공")
        return 0 if success_count > 0 else 1
    except Exception as e:
        logger.error(f"예상치 못한 오류 발생: {str(e)}")
        logger.error(traceback.format_exc())
        return 1

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code) 