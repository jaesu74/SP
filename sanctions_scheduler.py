#!/usr/bin/env python3
"""
제재 데이터 수집 스케줄러
UN, EU, US 등의 제재 데이터를 정해진 일정에 따라 자동으로 수집합니다.
"""

import time
import datetime
import logging
import schedule
import os

# sanctions_collector 모듈에서 수집 함수 가져오기
from sanctions_collector import collect_data

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join('logs', "scheduler.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("sanctions_scheduler")

# 환경 설정
DATA_DIR = 'docs/data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True)

# 스케줄러 설정
def schedule_jobs():
    """수집 작업 스케줄 설정"""
    
    # 매일 오전 3시에 모든 소스 데이터 수집
    schedule.every().day.at("03:00").do(run_collection_daily)
    
    # 매주 월요일 오전 2시에 UN 데이터 수집
    schedule.every().monday.at("02:00").do(run_collection_weekly_un)
    
    # 매주 화요일 오전 2시에 EU 데이터 수집
    schedule.every().tuesday.at("02:00").do(run_collection_weekly_eu)
    
    # 매주 수요일 오전 2시에 US 데이터 수집
    schedule.every().wednesday.at("02:00").do(run_collection_weekly_us)
    
    logger.info("제재 데이터 수집 스케줄 설정 완료")
    logger.info("다음 실행 일정:")
    for job in schedule.get_jobs():
        logger.info(f"  - {job}")

# 수집 작업 함수
def run_collection_daily():
    """모든 소스 제재 데이터 수집 실행 (매일)"""
    logger.info("=== 일간 수집 작업 시작 ===")
    try:
        results = collect_data()
        logger.info(f"수집 결과: {results}")
    except Exception as e:
        logger.error(f"일간 수집 작업 실패: {str(e)}")
    logger.info("=== 일간 수집 작업 완료 ===")

def run_collection_weekly_un():
    """UN 제재 데이터 수집 실행 (매주)"""
    logger.info("=== UN 수집 작업 시작 ===")
    try:
        results = collect_data(["UN"])
        logger.info(f"수집 결과: {results}")
    except Exception as e:
        logger.error(f"UN 수집 작업 실패: {str(e)}")
    logger.info("=== UN 수집 작업 완료 ===")

def run_collection_weekly_eu():
    """EU 제재 데이터 수집 실행 (매주)"""
    logger.info("=== EU 수집 작업 시작 ===")
    try:
        results = collect_data(["EU"])
        logger.info(f"수집 결과: {results}")
    except Exception as e:
        logger.error(f"EU 수집 작업 실패: {str(e)}")
    logger.info("=== EU 수집 작업 완료 ===")

def run_collection_weekly_us():
    """US 제재 데이터 수집 실행 (매주)"""
    logger.info("=== US 수집 작업 시작 ===")
    try:
        results = collect_data(["US"])
        logger.info(f"수집 결과: {results}")
    except Exception as e:
        logger.error(f"US 수집 작업 실패: {str(e)}")
    logger.info("=== US 수집 작업 완료 ===")

# 메인 스케줄러 루프
def main():
    """메인 스케줄러 루프"""
    logger.info("제재 데이터 수집 스케줄러 시작")
    
    # 수집 작업 스케줄 설정
    schedule_jobs()
    
    # 시작 시 즉시 한 번 수집 실행
    logger.info("초기 데이터 수집 시작")
    run_collection_daily()
    
    # 스케줄에 따라 작업 실행
    while True:
        try:
            schedule.run_pending()
            time.sleep(60)  # 1분마다 스케줄 확인
        except KeyboardInterrupt:
            logger.info("스케줄러 종료 요청 감지")
            break
        except Exception as e:
            logger.error(f"스케줄러 오류 발생: {str(e)}")
    
    logger.info("제재 데이터 수집 스케줄러 종료")

if __name__ == "__main__":
    main() 