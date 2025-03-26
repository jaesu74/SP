#!/usr/bin/env python3
"""
유럽 EU 제재 데이터 수집기
"""

import os
import json
import logging
import requests
import time
from typing import Dict, List, Optional
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("eu_sanctions_collector.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("eu_sanctions_collector")

# EU 제재 데이터 URL
EU_SANCTIONS_URL = "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw"
# 대체 URL (opensanctions.org에서 제공하는 소스 데이터)
EU_SANCTIONS_ALT_URL = "https://data.opensanctions.org/datasets/20250313/eu_fsf/source.xml"
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
OUTPUT_DIR = 'data'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'eu_sanctions.json')

def download_eu_sanctions() -> Optional[bytes]:
    """EU 제재 데이터를 다운로드합니다."""
    for attempt in range(MAX_RETRIES):
        try:
            # 기본 URL로 시도
            url = EU_SANCTIONS_URL if attempt < 1 else EU_SANCTIONS_ALT_URL
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
            if 'xml' not in content_type and not url.endswith('.xml'):
                logger.warning(f"예상치 못한 Content-Type: {content_type}")
            
            # XML 파일 저장 (디버깅용)
            with open('eu_sanctions.xml', 'wb') as f:
                f.write(response.content)
            logger.info(f"EU 제재 데이터 XML 파일 저장 완료 (URL: {url})")
            
            return response.content
        except requests.exceptions.RequestException as e:
            logger.error(f"다운로드 시도 {attempt + 1}/{MAX_RETRIES} 실패: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            continue
    return None

def parse_eu_sanctions(xml_data: bytes) -> List[Dict]:
    """EU 제재 데이터를 파싱합니다."""
    try:
        import xml.etree.ElementTree as ET
        
        # XML 파싱
        root = ET.fromstring(xml_data)
        
        # 네임스페이스 확인 및 처리
        namespace = None
        if root.tag.startswith('{'):
            namespace = root.tag.split('}')[0][1:]
            ns = {'ns': namespace}
            logger.info(f"네임스페이스 발견: {namespace}")
        else:
            ns = {}
            logger.info("네임스페이스 없음")
        
        # 제재 데이터 추출
        sanctions = []
        
        # sanctionEntity 요소 찾기
        if namespace:
            entities = root.findall('.//ns:sanctionEntity', ns)
        else:
            entities = root.findall('.//sanctionEntity')
            
        logger.info(f"총 {len(entities)}개의 제재 항목 발견")
        
        # 각 제재 항목 처리
        for entity in entities:
            try:
                # 기본 정보
                entity_id = entity.get('logicalId')
                if not entity_id:
                    logger.warning("ID 정보 없음, 건너뜀")
                    continue
                
                # 제재 대상 유형 확인
                if namespace:
                    subject_type_element = entity.find('./ns:subjectType', ns)
                else:
                    subject_type_element = entity.find('./subjectType')
                    
                entity_type = "UNKNOWN"
                is_person = False
                
                if subject_type_element is not None:
                    classification_code = subject_type_element.get('classificationCode')
                    if classification_code:
                        is_person = classification_code == "P"  # P는 개인, E는 단체
                        entity_type = "INDIVIDUAL" if is_person else "ENTITY"
                
                # 이름 정보 추출
                name_aliases = []
                if namespace:
                    name_aliases = entity.findall('./ns:nameAlias', ns)
                else:
                    name_aliases = entity.findall('./nameAlias')
                
                if not name_aliases:
                    logger.warning(f"ID {entity_id}의 이름 정보 없음, 건너뜀")
                    continue
                
                # 전체 이름 추출
                full_name = ""
                aliases = []
                
                for name_alias in name_aliases:
                    # wholeName 속성 확인
                    whole_name = name_alias.get('wholeName')
                    if whole_name and whole_name.strip():
                        if not full_name:  # 첫 번째 발견된 wholeName을 주 이름으로 설정
                            full_name = whole_name.strip()
                        elif whole_name.strip() not in aliases:  # 나머지는 별칭으로 추가
                            aliases.append(whole_name.strip())
                        continue
                    
                    # 개별 이름 요소 조합
                    name_parts = []
                    first_name = name_alias.get('firstName')
                    middle_name = name_alias.get('middleName')
                    last_name = name_alias.get('lastName')
                    
                    if first_name and first_name.strip():
                        name_parts.append(first_name.strip())
                    if middle_name and middle_name.strip():
                        name_parts.append(middle_name.strip())
                    if last_name and last_name.strip():
                        name_parts.append(last_name.strip())
                    
                    combined_name = ' '.join(name_parts).strip()
                    if combined_name:
                        if not full_name:  # 첫 번째 발견된 이름을 주 이름으로 설정
                            full_name = combined_name
                        elif combined_name not in aliases:  # 나머지는 별칭으로 추가
                            aliases.append(combined_name)
                
                if not full_name:
                    logger.warning(f"ID {entity_id}의 이름 정보 없음, 건너뜀")
                    continue
                
                # 국적 정보
                nationalities = []
                if namespace:
                    citizenship_elements = entity.findall('./ns:citizenship', ns)
                else:
                    citizenship_elements = entity.findall('./citizenship')
                
                for citizenship in citizenship_elements:
                    country_code = ""
                    if namespace:
                        country_element = citizenship.find('./ns:countryIso2Code', ns) or citizenship.find('./ns:country/ns:code', ns)
                    else:
                        country_element = citizenship.get('countryIso2Code') or citizenship.find('./country/code')
                    
                    if country_element is not None:
                        if hasattr(country_element, 'text') and country_element.text:
                            country_code = country_element.text.strip()
                        elif hasattr(country_element, 'strip'):
                            country_code = country_element.strip()
                    
                    if country_code and country_code != "00" and country_code not in nationalities:
                        nationalities.append(country_code)
                
                # 생년월일 정보
                birth_date = ""
                if namespace:
                    birthdate_elements = entity.findall('./ns:birthdate', ns)
                else:
                    birthdate_elements = entity.findall('./birthdate')
                
                for birthdate in birthdate_elements:
                    date_str = ""
                    
                    # 전체 날짜
                    date_attr = birthdate.get('birthdate')
                    if date_attr and date_attr.strip() and date_attr != "0000-00-00":
                        date_str = date_attr.strip()
                    else:
                        # 개별 요소
                        year = birthdate.get('year')
                        month = birthdate.get('monthOfYear')
                        day = birthdate.get('dayOfMonth')
                        
                        if year and int(year) > 0:
                            date_parts = [year]
                            if month and int(month) > 0:
                                date_parts.append(month.zfill(2))
                                if day and int(day) > 0:
                                    date_parts.append(day.zfill(2))
                            
                            date_str = '-'.join(date_parts)
                    
                    if date_str and not birth_date:
                        birth_date = date_str
                        break
                
                # 주소 정보
                addresses = []
                if namespace:
                    address_elements = entity.findall('./ns:address', ns)
                else:
                    address_elements = entity.findall('./address')
                
                for address in address_elements:
                    addr_parts = []
                    
                    # 주요 주소 요소 확인
                    addr_elements = ['street', 'poBox', 'city', 'zipCode', 'region']
                    for elem_name in addr_elements:
                        if namespace:
                            elem = address.find(f'./ns:{elem_name}', ns)
                        else:
                            elem = address.find(f'./{elem_name}')
                        
                        if elem is not None and elem.text and elem.text.strip():
                            addr_parts.append(elem.text.strip())
                    
                    # 국가 정보
                    country_code = ""
                    if namespace:
                        country_elem = address.find('./ns:countryIso2Code', ns) or address.find('./ns:country/ns:code', ns)
                    else:
                        country_elem = address.get('countryIso2Code') or address.find('./country/code')
                    
                    if country_elem is not None:
                        if hasattr(country_elem, 'text') and country_elem.text and country_elem.text.strip():
                            country_code = country_elem.text.strip()
                        elif hasattr(country_elem, 'strip'):
                            country_code = country_elem.strip()
                    
                    if country_code and country_code != "00":
                        addr_parts.append(country_code)
                    
                    if addr_parts:
                        addresses.append(', '.join(addr_parts))
                
                # 통합 형식으로 변환
                sanction = {
                    "id": f"EU-{entity_id}",
                    "name": full_name,
                    "type": entity_type,
                    "country": nationalities[0] if nationalities else "",
                    "programs": ["EU_SANCTIONS"],
                    "source": "EU",
                    "matchScore": 100,
                    "details": {
                        "aliases": aliases,
                        "birthDate": birth_date,
                        "addresses": addresses,
                        "nationalities": nationalities
                    }
                }
                
                sanctions.append(sanction)
                logger.debug(f"제재 데이터 파싱 성공: {sanction['name']}")
                
            except Exception as e:
                logger.error(f"제재 항목 파싱 오류 (ID: {entity.get('logicalId', 'UNKNOWN')}): {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
                continue
        
        logger.info(f"총 {len(sanctions)}개의 제재 데이터 파싱 완료")
        return sanctions
        
    except Exception as e:
        logger.error(f"EU 제재 데이터 파싱 실패: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return []

def save_to_json(sanctions: List[Dict]) -> bool:
    """제재 데이터를 JSON 파일로 저장합니다."""
    try:
        # 데이터 디렉토리 생성
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # JSON 파일 저장
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(sanctions, f, ensure_ascii=False, indent=2)
        
        logger.info(f"EU 제재 데이터 저장 완료: {len(sanctions)}개 항목")
        return True
    except Exception as e:
        logger.error(f"EU 제재 데이터 저장 실패: {str(e)}")
        return False

def main():
    """메인 함수"""
    logger.info("EU 제재 데이터 수집 시작")
    
    # 데이터 다운로드
    xml_data = download_eu_sanctions()
    if xml_data is None:
        logger.error("EU 제재 데이터 다운로드 실패")
        return
    
    # 데이터 파싱
    sanctions = parse_eu_sanctions(xml_data)
    if not sanctions:
        logger.error("EU 제재 데이터 파싱 실패")
        return
    
    # 데이터 저장
    if save_to_json(sanctions):
        logger.info("EU 제재 데이터 수집 완료")
    else:
        logger.error("EU 제재 데이터 저장 실패")

if __name__ == "__main__":
    main() 