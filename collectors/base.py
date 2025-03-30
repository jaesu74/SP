#!/usr/bin/env python3
"""
제재 데이터 수집기 기본 클래스 및 공통 유틸리티
"""

import os
import json
import logging
import requests
import time
from typing import Dict, List, Optional
from datetime import datetime
from abc import ABC, abstractmethod

# 환경 설정
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
OUTPUT_DIR = 'docs/data'
TEMP_DIR = 'temp'
LOG_DIR = 'logs'

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

def download_sanctions_data(url: str, output_file: str) -> Optional[bytes]:
    """제재 데이터를 다운로드합니다."""
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(
                url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/xml,text/xml,*/*',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout=30
            )
            response.raise_for_status()
            
            # 응답이 XML인지 확인
            content_type = response.headers.get('Content-Type', '').lower()
            if 'xml' not in content_type:
                logger.warning(f"예상치 못한 Content-Type: {content_type}")
            
            # XML 임시 파일 저장 (디버깅용)
            temp_file_path = os.path.join(TEMP_DIR, output_file)
            with open(temp_file_path, 'wb') as f:
                f.write(response.content)
            logger.info(f"제재 데이터 XML 파일 저장 완료: {output_file}")
            
            return response.content
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