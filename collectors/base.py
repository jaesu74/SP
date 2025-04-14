#!/usr/bin/env python3
"""
제재 데이터 수집기 기본 클래스 및 공통 유틸리티
"""

import os
import json
import logging
import requests
import time
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
for directory in [OUTPUT_DIR, TEMP_DIR, LOG_DIR]:
    os.makedirs(directory, exist_ok=True)

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

def get_memory_usage() -> float:
    """현재 메모리 사용률(%)을 반환합니다."""
    import psutil
    return psutil.Process(os.getpid()).memory_percent()

def download_sanctions_data(url: str, output_file: str) -> Optional[bytes]:
    """제재 데이터를 다운로드합니다."""
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(
                url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/xml,text/xml,*/*',
                },
                timeout=REQUEST_TIMEOUT,
                stream=True
            )
            response.raise_for_status()
            
            # XML 임시 파일 저장
            temp_file_path = os.path.join(TEMP_DIR, output_file)
            with open(temp_file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=1024*1024):
                    if chunk:
                        f.write(chunk)
                        
                        # 주기적으로 메모리 확인
                        if get_memory_usage() > MAX_MEMORY_PERCENT:
                            gc.collect()
                
            logger.info(f"제재 데이터 다운로드 완료: {output_file}")
            
            # 파일 내용 반환
            with open(temp_file_path, 'rb') as f:
                return f.read()
                
        except requests.exceptions.RequestException as e:
            logger.error(f"다운로드 시도 {attempt + 1}/{MAX_RETRIES} 실패: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
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
        if get_memory_usage() > MAX_MEMORY_PERCENT:
            # 청크 단위로 처리
            logger.info(f"대량 데이터({len(sanctions)}개)를 청크 단위로 저장합니다.")
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write('{\n')
                f.write(f'"meta": {json.dumps(data["meta"], ensure_ascii=False)},\n')
                f.write('"data": [\n')
            
            # 데이터를 청크 단위로 쓰기
            for i in range(0, len(sanctions), CHUNK_SIZE):
                chunk = sanctions[i:i+CHUNK_SIZE]
                with open(output_file, 'a', encoding='utf-8') as f:
                    chunk_str = json.dumps(chunk, ensure_ascii=False)[1:-1]
                    if i > 0:
                        chunk_str = ',' + chunk_str
                    if i + CHUNK_SIZE < len(sanctions):
                        chunk_str = chunk_str + ','
                    f.write(chunk_str + '\n')
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
        memory_percent = get_memory_usage()
        
        self.logger.info(
            f"성능 통계 - 수행 시간: {elapsed_time:.2f}초, "
            f"메모리 사용량: {memory_percent:.1f}%"
        ) 