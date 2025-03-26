#!/usr/bin/env python3
"""
UN 제재 데이터 수집기
"""

import os
import json
import logging
import requests
from datetime import datetime
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import time
from typing import Dict, List, Optional

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("un_sanctions_collector.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("un_sanctions_collector")

# UN 제재 데이터 URL
UN_SANCTIONS_URL = "https://scsanctions.un.org/resources/xml/en/consolidated.xml"
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
OUTPUT_DIR = 'data'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'un_sanctions.json')

def download_un_sanctions() -> Optional[bytes]:
    """UN 제재 데이터를 다운로드합니다."""
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(
                UN_SANCTIONS_URL,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/xml,text/xml,*/*',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout=30
            )
            response.raise_for_status()
            
            # 응답이 XML인지 확인 (text/xml도 허용)
            content_type = response.headers.get('Content-Type', '').lower()
            if 'xml' not in content_type:
                logger.warning(f"예상치 못한 Content-Type: {content_type}")
            
            # XML 파일 저장 (디버깅용)
            with open('un_sanctions.xml', 'wb') as f:
                f.write(response.content)
            logger.info("UN 제재 데이터 XML 파일 저장 완료")
            
            return response.content
        except requests.exceptions.RequestException as e:
            logger.error(f"다운로드 시도 {attempt + 1}/{MAX_RETRIES} 실패: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            continue
    return None

def validate_sanction(sanction: Dict) -> bool:
    """제재 데이터의 유효성을 검사합니다."""
    required_fields = ['id', 'name', 'type', 'source']
    for field in required_fields:
        if not sanction.get(field):
            logger.warning(f"필수 필드 누락: {field}")
            return False
    return True

def parse_un_sanctions(xml_data: bytes) -> List[Dict]:
    """UN 제재 데이터를 파싱합니다."""
    try:
        # XML 파싱
        tree = ET.fromstring(xml_data)
        
        # 네임스페이스 처리
        namespaces = {'': tree.tag.split('}')[0][1:]} if '}' in tree.tag else {}
        logger.info("네임스페이스 처리 완료")
        
        # 제재 데이터 추출
        sanctions = []
        for individual in tree.findall('.//INDIVIDUAL', namespaces):
            try:
                # 기본 정보
                dataid = individual.find('DATAID', namespaces)
                dataid_value = dataid.text if dataid is not None else "UNKNOWN"
                
                # 이름 정보
                first_name = individual.find('.//FIRST_NAME', namespaces)
                second_name = individual.find('.//SECOND_NAME', namespaces)
                third_name = individual.find('.//THIRD_NAME', namespaces)
                
                # 이름 조합
                name_parts = []
                if first_name is not None and first_name.text:
                    name_parts.append(first_name.text)
                if second_name is not None and second_name.text:
                    name_parts.append(second_name.text)
                if third_name is not None and third_name.text:
                    name_parts.append(third_name.text)
                
                full_name = ' '.join(name_parts).strip()
                if not full_name:
                    logger.warning(f"ID {dataid_value}의 이름 정보 없음, 건너뜀")
                    continue
                
                # UN 리스트 타입
                un_list_type = individual.find('.//UN_LIST_TYPE', namespaces)
                un_list_type_value = un_list_type.text if un_list_type is not None else ""
                
                # 등재일
                listed_on = individual.find('.//LISTED_ON', namespaces)
                listed_on_value = listed_on.text if listed_on is not None else ""
                
                # 별칭 정보
                aliases = []
                for alias in individual.findall('.//ALIAS_NAME', namespaces):
                    if alias is not None and alias.text:
                        aliases.append(alias.text.strip())
                
                # 주소 정보
                addresses = []
                for address in individual.findall('.//ADDRESS', namespaces):
                    if address is not None:
                        addr_parts = []
                        for field in ['STREET', 'CITY', 'STATE_PROVINCE', 'COUNTRY']:
                            value = address.find(field, namespaces)
                            if value is not None and value.text:
                                addr_parts.append(value.text.strip())
                        if addr_parts:
                            addresses.append(', '.join(addr_parts))
                
                # 국적 정보
                nationality = individual.find('.//NATIONALITY', namespaces)
                nationality_value = nationality.text if nationality is not None and nationality.text else ""
                
                # 여권 정보
                documents = []
                for document in individual.findall('.//INDIVIDUAL_DOCUMENT', namespaces):
                    if document is not None:
                        doc_type = document.find('TYPE_OF_DOCUMENT', namespaces)
                        doc_number = document.find('NUMBER', namespaces)
                        if doc_type is not None and doc_type.text and doc_number is not None and doc_number.text:
                            documents.append({
                                "type": doc_type.text.strip(),
                                "number": doc_number.text.strip()
                            })
                
                # 통합 형식으로 변환
                sanction = {
                    "id": f"UN-{dataid_value}",
                    "name": full_name,
                    "type": "INDIVIDUAL",
                    "country": nationality_value,
                    "programs": [un_list_type_value] if un_list_type_value else [],
                    "source": "UN",
                    "matchScore": 100,
                    "details": {
                        "aliases": aliases,
                        "birthDate": "",
                        "sanctions": [{"program": un_list_type_value, "startDate": listed_on_value, "reason": ""}],
                        "addresses": addresses,
                        "nationalities": [nationality_value] if nationality_value else [],
                        "identifications": [{"type": doc["type"], "number": doc["number"], "country": ""} for doc in documents]
                    }
                }
                
                # 생년월일 정보
                dob = individual.find('.//DATE_OF_BIRTH', namespaces)
                if dob is not None and dob.text:
                    sanction["details"]["birthDate"] = dob.text.strip()
                
                sanctions.append(sanction)
                logger.debug(f"제재 데이터 파싱 성공: {sanction['name']}")
                
            except Exception as e:
                logger.warning(f"유효하지 않은 제재 데이터: {str(e)}")
                continue
        
        # 기업 데이터도 파싱
        for entity in tree.findall('.//ENTITY', namespaces):
            try:
                # 기본 정보
                dataid = entity.find('DATAID', namespaces)
                dataid_value = dataid.text if dataid is not None else "UNKNOWN"
                
                # 이름 정보
                first_name = entity.find('.//FIRST_NAME', namespaces)
                name_value = first_name.text if first_name is not None and first_name.text else ""
                
                if not name_value:
                    logger.warning(f"ID {dataid_value}의 이름 정보 없음, 건너뜀")
                    continue
                
                # UN 리스트 타입
                un_list_type = entity.find('.//UN_LIST_TYPE', namespaces)
                un_list_type_value = un_list_type.text if un_list_type is not None else ""
                
                # 등재일
                listed_on = entity.find('.//LISTED_ON', namespaces)
                listed_on_value = listed_on.text if listed_on is not None else ""
                
                # 별칭 정보
                aliases = []
                for alias in entity.findall('.//ALIAS_NAME', namespaces):
                    if alias is not None and alias.text:
                        aliases.append(alias.text.strip())
                
                # 주소 정보
                addresses = []
                for address in entity.findall('.//ADDRESS', namespaces):
                    if address is not None:
                        addr_parts = []
                        for field in ['STREET', 'CITY', 'STATE_PROVINCE', 'COUNTRY']:
                            value = address.find(field, namespaces)
                            if value is not None and value.text:
                                addr_parts.append(value.text.strip())
                        if addr_parts:
                            addresses.append(', '.join(addr_parts))
                
                # 국적 정보
                country = entity.find('.//COUNTRY', namespaces)
                country_value = country.text if country is not None and country.text else ""
                
                # 통합 형식으로 변환
                sanction = {
                    "id": f"UN-{dataid_value}",
                    "name": name_value,
                    "type": "ENTITY",
                    "country": country_value,
                    "programs": [un_list_type_value] if un_list_type_value else [],
                    "source": "UN",
                    "matchScore": 100,
                    "details": {
                        "aliases": aliases,
                        "birthDate": "",
                        "sanctions": [{"program": un_list_type_value, "startDate": listed_on_value, "reason": ""}],
                        "addresses": addresses,
                        "nationalities": [country_value] if country_value else [],
                        "identifications": []
                    }
                }
                
                sanctions.append(sanction)
                logger.debug(f"제재 데이터 파싱 성공: {sanction['name']}")
                
            except Exception as e:
                logger.warning(f"유효하지 않은 제재 데이터: {str(e)}")
                continue
        
        logger.info(f"총 {len(sanctions)}개의 제재 데이터 파싱 완료")
        return sanctions
        
    except ET.ParseError as e:
        logger.error(f"XML 파싱 오류: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"UN 제재 데이터 파싱 실패: {str(e)}")
        return []

def save_to_json(sanctions: List[Dict]) -> bool:
    """제재 데이터를 JSON 파일로 저장합니다."""
    try:
        # 데이터 디렉토리 생성
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # JSON 파일 저장
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(sanctions, f, ensure_ascii=False, indent=2)
        
        logger.info(f"UN 제재 데이터 저장 완료: {len(sanctions)}개 항목")
        return True
    except Exception as e:
        logger.error(f"UN 제재 데이터 저장 실패: {str(e)}")
        return False

def main():
    """메인 함수"""
    logger.info("UN 제재 데이터 수집 시작")
    
    # 데이터 다운로드
    xml_data = download_un_sanctions()
    if xml_data is None:
        logger.error("UN 제재 데이터 다운로드 실패")
        return
    
    # 데이터 파싱
    sanctions = parse_un_sanctions(xml_data)
    if not sanctions:
        logger.error("UN 제재 데이터 파싱 실패")
        return
    
    # 데이터 저장
    if save_to_json(sanctions):
        logger.info("UN 제재 데이터 수집 완료")
    else:
        logger.error("UN 제재 데이터 저장 실패")

if __name__ == "__main__":
    main() 