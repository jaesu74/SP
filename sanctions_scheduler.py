#!/usr/bin/env python3
"""
제재 데이터 수집 스케줄러
"""

import os
import time
import logging
import subprocess
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("sanctions_scheduler.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("sanctions_scheduler")

# 스크립트 디렉토리
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def run_collector(script_name):
    """특정 수집기 스크립트를 실행합니다."""
    try:
        script_path = os.path.join(SCRIPT_DIR, script_name)
        result = subprocess.run(['python', script_path], capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"{script_name} 실행 완료")
            return True
        else:
            logger.error(f"{script_name} 실행 실패: {result.stderr}")
            return False
    except Exception as e:
        logger.error(f"{script_name} 실행 중 오류 발생: {str(e)}")
        return False

def collect_all_data():
    """모든 제재 데이터를 수집합니다."""
    collectors = [
        "un_sanctions_collector.py",
        "eu_sanctions_collector.py",
        "ofac_sanctions_collector.py",
        "kr_sanctions_collector.py"
    ]
    
    success = True
    for collector in collectors:
        if not run_collector(collector):
            success = False
            break
    
    if success:
        # 데이터 통합
        if not run_collector("sanctions_integrator.py"):
            success = False
    
    return success

def main():
    """메인 함수"""
    logger.info("제재 데이터 수집 스케줄러 시작")
    
    while True:
        try:
            # 현재 시간 로깅
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            logger.info(f"데이터 수집 시작: {current_time}")
            
            # 데이터 수집 실행
            if collect_all_data():
                logger.info("데이터 수집 완료")
            else:
                logger.error("데이터 수집 실패")
            
            # 24시간 대기
            logger.info("다음 수집까지 24시간 대기")
            time.sleep(24 * 60 * 60)
            
        except KeyboardInterrupt:
            logger.info("스케줄러 종료")
            break
        except Exception as e:
            logger.error(f"예상치 못한 오류 발생: {str(e)}")
            # 오류 발생 시 1시간 대기 후 재시도
            time.sleep(60 * 60)

if __name__ == "__main__":
    main() 