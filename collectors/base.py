#!/usr/bin/env python3
"""
제재 데이터 수집기 기본 클래스 및 공통 유틸리티
"""

import os
import json
import logging
import requests
import time
import psutil
import gc
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from abc import ABC, abstractmethod

# 환경 설정
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
OUTPUT_DIR = 'docs/data'
TEMP_DIR = 'temp'
LOG_DIR = 'logs'
MAX_MEMORY_PERCENT = 80  # 최대 메모리 사용량 제한 (%)
REQUEST_TIMEOUT = 60  # 요청 타임아웃 (초)
CHUNK_SIZE = 10000  # 청크 단위로 처리할 항목 수

# 디렉토리 생성
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
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

def get_memory_usage() -> Tuple[float, float]:
    """현재 메모리 사용량을 반환합니다.
    
    Returns:
        Tuple[float, float]: (사용 중인 메모리(MB), 전체 메모리 대비 사용량 %)
    """
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    memory_usage_mb = memory_info.rss / 1024 / 1024
    memory_percent = process.memory_percent()
    return memory_usage_mb, memory_percent

def check_memory_usage() -> bool:
    """메모리 사용량을 확인하고 필요한 경우 가비지 컬렉션을 실행합니다.
    
    Returns:
        bool: 메모리 사용량이 안전한 수준이면 True, 그렇지 않으면 False
    """
    _, memory_percent = get_memory_usage()
    
    if memory_percent > MAX_MEMORY_PERCENT:
        logger.warning(f"메모리 사용량이 높습니다: {memory_percent:.1f}%. 가비지 컬렉션 실행...")
        gc.collect()
        _, new_memory_percent = get_memory_usage()
        
        if new_memory_percent > MAX_MEMORY_PERCENT:
            logger.error(f"메모리 사용량이 여전히 높습니다: {new_memory_percent:.1f}%")
            return False
    
    return True

def download_sanctions_data(url: str, output_file: str) -> Optional[bytes]:
    """제재 데이터를 다운로드합니다."""
    for attempt in range(MAX_RETRIES):
        try:
            # 메모리 사용량 확인
            if not check_memory_usage():
                logger.error("메모리 부족으로 다운로드를 취소합니다.")
                return None
                
            response = requests.get(
                url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/xml,text/xml,*/*',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout=REQUEST_TIMEOUT,
                stream=True  # 대용량 응답을 위한 스트리밍 모드
            )
            response.raise_for_status()
            
            # 응답이 XML인지 확인
            content_type = response.headers.get('Content-Type', '').lower()
            if 'xml' not in content_type:
                logger.warning(f"예상치 못한 Content-Type: {content_type}")
            
            # XML 임시 파일 스트림 저장 (메모리 효율성)
            temp_file_path = os.path.join(TEMP_DIR, output_file)
            content_size = 0
            with open(temp_file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=1024*1024):  # 1MB 청크
                    if chunk:
                        f.write(chunk)
                        content_size += len(chunk)
                        
                        # 주기적으로 메모리 확인
                        if content_size % (10 * 1024 * 1024) == 0:  # 10MB마다
                            if not check_memory_usage():
                                logger.warning("메모리 사용량이 높아 스트림 처리를 최적화합니다.")
                
            logger.info(f"제재 데이터 XML 파일 저장 완료: {output_file} ({content_size/1024/1024:.1f} MB)")
            
            # 파일 내용 반환
            with open(temp_file_path, 'rb') as f:
                return f.read()
                
        except requests.exceptions.RequestException as e:
            logger.error(f"다운로드 시도 {attempt + 1}/{MAX_RETRIES} 실패: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            continue
    return None

def save_to_json(sanctions: List[Dict], source: str) -> bool:
    """제재 데이터를 JSON 파일로 저장합니다."""
    try:
        output_file = os.path.join(OUTPUT_DIR, f"{source.lower()}_sanctions.json")
        
        data = {
            "meta": {
                "source": source,
                "count": len(sanctions),
                "timestamp": datetime.now().isoformat()
            },
            "data": sanctions
        }
        
        # 메모리 사용량 확인
        if not check_memory_usage():
            # 큰 데이터셋의 경우 청크 단위로 처리
            logger.info(f"대량 데이터({len(sanctions)}개)를 청크 단위로 저장합니다.")
            
            # 메타데이터 먼저 쓰기
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write('{\n')
                f.write(f'"meta": {json.dumps(data["meta"], ensure_ascii=False)},\n')
                f.write('"data": [\n')
            
            # 데이터를 청크 단위로 쓰기
            for i in range(0, len(sanctions), CHUNK_SIZE):
                chunk = sanctions[i:i+CHUNK_SIZE]
                with open(output_file, 'a', encoding='utf-8') as f:
                    chunk_str = json.dumps(chunk, ensure_ascii=False)[1:-1]  # 대괄호 제거
                    if i > 0:
                        chunk_str = ',' + chunk_str
                    if i + CHUNK_SIZE < len(sanctions):
                        chunk_str = chunk_str + ','
                    f.write(chunk_str + '\n')
                
                # 청크 완료 후 메모리 최적화
                gc.collect()
            
            # 파일 마무리
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write(']\n}')
        else:
            # 일반적인 방식으로 저장
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"{source} 제재 데이터 저장 완료: {len(sanctions)}개 항목")
        return True
    except Exception as e:
        logger.error(f"{source} 제재 데이터 저장 실패: {str(e)}")
        return False

class SanctionsCollector(ABC):
    """제재 데이터 수집기 추상 클래스"""
    
    def __init__(self, source_name: str):
        self._source_name = source_name
        self.logger = logger
    
    @abstractmethod
    def collect(self) -> bool:
        """제재 데이터를 수집합니다."""
        pass
    
    @property
    def source_id(self) -> str:
        """소스 ID를 반환합니다."""
        return self._source_name.lower()
    
    def download_data(self, url: str) -> Optional[bytes]:
        """데이터를 다운로드합니다."""
        return download_sanctions_data(url, f"{self.source_id}_sanctions.xml")
    
    def save_data(self, sanctions: List[Dict]) -> bool:
        """데이터를 저장합니다."""
        return save_to_json(sanctions, self.source_id)
        
    def log_performance_stats(self, start_time: float) -> None:
        """성능 통계를 로깅합니다."""
        elapsed_time = time.time() - start_time
        memory_mb, memory_percent = get_memory_usage()
        
        self.logger.info(
            f"성능 통계 - 수행 시간: {elapsed_time:.2f}초, "
            f"메모리 사용량: {memory_mb:.1f}MB ({memory_percent:.1f}%)"
        ) 